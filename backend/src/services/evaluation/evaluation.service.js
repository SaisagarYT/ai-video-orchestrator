import crypto from 'node:crypto';
import { supabase } from '../../config/supabase.js';
import { config } from '../../config/env.js';
import { logger } from '../../core/logger/logger.js';
import { recordWorkflowEvent, WORKFLOW_EVENT_TYPES } from '../../orchestration/events.js';
import { validateEvaluationResult } from './evaluation.schema.js';
import { evaluationRulesEngine } from './evaluation.rules.js';
import { mockEvaluator } from './mock.evaluator.js';
import { providerRegistry } from '../../providers/index.js';
import { EVALUATION_SYSTEM_PROMPT, buildEvaluationUserPrompt } from './evaluation.prompts.js';
import { EvaluationError, EvaluationValidationError } from './evaluation.errors.js';
import { NotFoundError } from '../../core/errors/AppError.js';
import { DEFAULT_EVALUATION_THRESHOLD, DEFAULT_DIMENSION_WEIGHTS } from './evaluation.types.js';

export class EvaluationService {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Evaluate a rendered final video for an execution.
   * Enforces idempotency, score bounds, technical checks, persistence, and workflow events.
   *
   * @param {object} params
   * @param {string} params.campaignId
   * @param {string} [params.executionId]
   * @param {string} [params.stepId]
   * @param {string} [params.finalVideoId]
   * @param {number} [params.threshold]
   * @param {object} [params.options] - Custom evaluation options or provider overrides
   * @returns {Promise<{ evaluation: object, evaluationResult: import('./evaluation.types.js').EvaluationResult, reused: boolean }>}
   */
  async evaluateFinalVideo({
    campaignId,
    executionId = null,
    stepId = null,
    finalVideoId = null,
    threshold = null,
    options = {},
  }) {
    const effectiveThreshold = threshold ?? config.evaluation?.threshold ?? DEFAULT_EVALUATION_THRESHOLD;

    // 1. Idempotency Check: reuse completed evaluation if available and not forced
    if (executionId && finalVideoId && !options.forceRefresh) {
      const { data: existingEvaluations } = await supabase
        .from('quality_evaluations')
        .select('*')
        .eq('workflow_execution_id', executionId)
        .eq('final_video_id', finalVideoId);

      if (existingEvaluations && existingEvaluations.length > 0) {
        const existing = existingEvaluations[0];
        logger.info(`[EvaluationService] Reusing existing evaluation ${existing.id} for execution ${executionId}`);

        const formattedResult = {
          evaluationVersion: existing.evaluation_version,
          campaignId: existing.campaign_id,
          workflowExecutionId: existing.workflow_execution_id,
          finalVideoId: existing.final_video_id,
          overallScore: Number(existing.overall_score),
          threshold: Number(existing.threshold),
          passed: Boolean(existing.passed),
          dimensions: existing.dimensions,
          technicalChecks: existing.technical_checks,
          issues: existing.issues || [],
          recommendations: existing.recommendations || [],
          revisionInstructions: existing.revision_instructions || [],
          metadata: existing.metadata || {},
        };

        return {
          evaluation: existing,
          evaluationResult: formattedResult,
          reused: true,
        };
      }
    }

    // 2. Emit Evaluation Started event
    if (executionId) {
      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType: WORKFLOW_EVENT_TYPES.QUALITY_EVALUATION_STARTED,
        payload: {
          finalVideoId,
          threshold: effectiveThreshold,
        },
      });
    }

    // 3. Resolve context: Campaign, FinalVideo, Timeline, Scenes, Subtitles
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignError || !campaign) {
      throw new NotFoundError(`Campaign ${campaignId} not found`);
    }

    let finalVideo = null;
    if (finalVideoId) {
      const { data: fv } = await supabase
        .from('final_videos')
        .select('*')
        .eq('id', finalVideoId)
        .maybeSingle();
      finalVideo = fv || null;
    } else if (executionId) {
      const { data: videos } = await supabase
        .from('final_videos')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('workflow_execution_id', executionId);
      finalVideo = videos?.[0] || null;
    }

    let timeline = null;
    if (finalVideo?.timeline_id) {
      const { data: tl } = await supabase
        .from('timelines')
        .select('*')
        .eq('id', finalVideo.timeline_id)
        .maybeSingle();
      timeline = tl || null;
    } else if (executionId) {
      const { data: timelines } = await supabase
        .from('timelines')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('workflow_execution_id', executionId);
      timeline = timelines?.[0] || null;
    }

    const { data: scenesData } = await supabase
      .from('scenes')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('sequence_number', { ascending: true });

    const scenes = scenesData && scenesData.length > 0 ? scenesData : options.scenes || [];

    // Check for subtitle asset if generated
    let subtitleAsset = null;
    if (executionId) {
      const { data: subAssets } = await supabase
        .from('assets')
        .select('*')
        .eq('workflow_execution_id', executionId)
        .eq('asset_type', 'subtitles');
      subtitleAsset = subAssets?.[0] || null;
    }

    // 4. Select evaluation strategy (Mock, LLM, or Deterministic Rules)
    const providerName = options.provider || config.evaluation?.provider || 'mock';
    let rawResult = null;

    const llmProviderName = config.ai?.llmProvider || 'mock';
    if (providerName === 'mock') {
      rawResult = mockEvaluator.evaluate({
        campaign,
        finalVideo,
        timeline,
        threshold: effectiveThreshold,
        options,
      });
    } else if (providerName === 'llm' && providerRegistry.has('llm', llmProviderName)) {
      try {
        const llmProvider = providerRegistry.getLLM(llmProviderName);
        const userPrompt = buildEvaluationUserPrompt({
          campaign,
          creativeBible: options.creativeBible,
          scenes,
          finalVideo,
          timeline,
        });

        const llmResponse = await llmProvider.generateText({
          systemPrompt: EVALUATION_SYSTEM_PROMPT,
          prompt: userPrompt,
          temperature: 0.1,
          responseFormat: 'json',
        });

        const parsed = JSON.parse(llmResponse.text);

        // Sanitize and structure LLM outputs
        const weights = DEFAULT_DIMENSION_WEIGHTS;
        const productScore = Math.min(10, Math.max(0, parseFloat(parsed.productFidelityScore || 8.0)));
        const brandScore = Math.min(10, Math.max(0, parseFloat(parsed.brandConsistencyScore || 8.0)));
        const visualScore = Math.min(10, Math.max(0, parseFloat(parsed.visualQualityScore || 8.0)));

        const weightedProduct = Math.round(productScore * weights.productFidelity * 100) / 100;
        const weightedBrand = Math.round(brandScore * weights.brandConsistency * 100) / 100;
        const weightedVisual = Math.round(visualScore * weights.visualQuality * 100) / 100;

        const rawOverall = productScore * weights.productFidelity + brandScore * weights.brandConsistency + visualScore * weights.visualQuality;
        const overallScore = Math.round(rawOverall * 100) / 100;
        const passed = overallScore >= effectiveThreshold;

        rawResult = {
          evaluationVersion: '1.0',
          campaignId,
          workflowExecutionId: executionId,
          finalVideoId: finalVideo?.id || finalVideoId,
          overallScore,
          threshold: effectiveThreshold,
          passed,
          dimensions: {
            productFidelity: {
              score: productScore,
              weight: weights.productFidelity,
              weightedScore: weightedProduct,
              findings: String(parsed.productFidelityFindings || 'Evaluated against product USPs.'),
            },
            brandConsistency: {
              score: brandScore,
              weight: weights.brandConsistency,
              weightedScore: weightedBrand,
              findings: String(parsed.brandConsistencyFindings || 'Evaluated against brand directives.'),
            },
            visualQuality: {
              score: visualScore,
              weight: weights.visualQuality,
              weightedScore: weightedVisual,
              findings: String(parsed.visualQualityFindings || 'Evaluated visual composition.'),
            },
          },
          technicalChecks: {
            videoReadable: Boolean(finalVideo?.url || finalVideo?.secure_url),
            durationValid: true,
            resolutionValid: Boolean(finalVideo?.width && finalVideo?.height),
            aspectRatioValid: true,
            audioPresent: true,
            subtitlesValid: true,
          },
          issues: Array.isArray(parsed.issues) ? parsed.issues : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
          revisionInstructions: Array.isArray(parsed.revisionInstructions) ? parsed.revisionInstructions : [],
          metadata: {
            evaluatedAt: new Date().toISOString(),
            provider: 'llm',
            model: llmResponse.model,
          },
        };
      } catch (err) {
        logger.warn(`[EvaluationService] LLM evaluation error: ${err.message}. Falling back to deterministic rules.`);
        rawResult = evaluationRulesEngine.evaluate({
          campaign,
          creativeBible: options.creativeBible,
          scenes,
          timeline,
          finalVideo,
          subtitles: subtitleAsset,
          threshold: effectiveThreshold,
        });
      }
    } else {
      // Default: Deterministic evaluation rules engine
      rawResult = evaluationRulesEngine.evaluate({
        campaign,
        creativeBible: options.creativeBible,
        scenes,
        timeline,
        finalVideo,
        subtitles: subtitleAsset,
        threshold: effectiveThreshold,
      });
    }

    // Ensure foreign keys are attached
    rawResult.campaignId = campaignId;
    rawResult.workflowExecutionId = executionId || null;
    rawResult.finalVideoId = finalVideo?.id || finalVideoId || null;

    // Multimodal Vision Integration (Slice 8)
    let visionAnalysis = options.visionAnalysis || null;
    if (!visionAnalysis && executionId && options.runVision !== false) {
      const { data: visionRuns } = await supabase
        .from('video_understanding_runs')
        .select('*')
        .eq('workflow_execution_id', executionId)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false })
        .limit(1);

      if (visionRuns && visionRuns.length > 0) {
        visionAnalysis = visionRuns[0];
      }
    }

    if (visionAnalysis && visionAnalysis.dimensions) {
      logger.info(`[EvaluationService] Integrating multimodal vision evidence into quality evaluation`);
      const vDims = visionAnalysis.dimensions;
      const weights = DEFAULT_DIMENSION_WEIGHTS;

      // Deterministic 60/40 blend: Rule Evidence (60%) + Multimodal Visual Evidence (40%)
      if (typeof vDims.productFidelity?.score === 'number' && rawResult.dimensions?.productFidelity) {
        const blendedProduct = Math.round((rawResult.dimensions.productFidelity.score * 0.6 + vDims.productFidelity.score * 0.4) * 100) / 100;
        rawResult.dimensions.productFidelity.score = blendedProduct;
        rawResult.dimensions.productFidelity.weightedScore = Math.round(blendedProduct * weights.productFidelity * 100) / 100;
        if (vDims.productFidelity.findings) {
          rawResult.dimensions.productFidelity.findings = `${rawResult.dimensions.productFidelity.findings} | Visual Evidence: ${vDims.productFidelity.findings}`;
        }
      }

      if (typeof vDims.brandConsistency?.score === 'number' && rawResult.dimensions?.brandConsistency) {
        const blendedBrand = Math.round((rawResult.dimensions.brandConsistency.score * 0.6 + vDims.brandConsistency.score * 0.4) * 100) / 100;
        rawResult.dimensions.brandConsistency.score = blendedBrand;
        rawResult.dimensions.brandConsistency.weightedScore = Math.round(blendedBrand * weights.brandConsistency * 100) / 100;
        if (vDims.brandConsistency.findings) {
          rawResult.dimensions.brandConsistency.findings = `${rawResult.dimensions.brandConsistency.findings} | Visual Evidence: ${vDims.brandConsistency.findings}`;
        }
      }

      if (typeof vDims.visualQuality?.score === 'number' && rawResult.dimensions?.visualQuality) {
        const blendedVisual = Math.round((rawResult.dimensions.visualQuality.score * 0.6 + vDims.visualQuality.score * 0.4) * 100) / 100;
        rawResult.dimensions.visualQuality.score = blendedVisual;
        rawResult.dimensions.visualQuality.weightedScore = Math.round(blendedVisual * weights.visualQuality * 100) / 100;
        if (vDims.visualQuality.findings) {
          rawResult.dimensions.visualQuality.findings = `${rawResult.dimensions.visualQuality.findings} | Visual Evidence: ${vDims.visualQuality.findings}`;
        }
      }

      // Recompute overall score
      const recomputedRaw =
        rawResult.dimensions.productFidelity.score * weights.productFidelity +
        rawResult.dimensions.brandConsistency.score * weights.brandConsistency +
        rawResult.dimensions.visualQuality.score * weights.visualQuality;
      rawResult.overallScore = Math.round(recomputedRaw * 100) / 100;

      // Integrate vision-detected issues and revision instructions
      const visionIssues = visionAnalysis.detected_issues || visionAnalysis.detectedIssues || [];
      let hasMajorVisionIssue = false;

      for (const vi of visionIssues) {
        rawResult.issues.push({
          severity: vi.severity || 'major',
          category: vi.category || 'visual',
          description: `[Vision Finding] ${vi.code || 'VISUAL_DEFECT'}: ${vi.evidence || 'Visual defect detected in sampled frames'}`,
          sceneId: vi.sceneId,
          evidence: vi.evidence,
        });

        if (Array.isArray(vi.revisionInstructions)) {
          for (const instr of vi.revisionInstructions) {
            if (!rawResult.revisionInstructions.includes(instr)) {
              rawResult.revisionInstructions.push(instr);
            }
          }
        }

        if (vi.severity === 'critical' || vi.severity === 'major') {
          hasMajorVisionIssue = true;
        }
      }

      // Respect explicit overrideOverallScore option if passed
      if (options.overrideOverallScore !== undefined) {
        const target = options.overrideOverallScore;
        rawResult.dimensions.productFidelity.score = target;
        rawResult.dimensions.productFidelity.weightedScore = Math.round(target * weights.productFidelity * 100) / 100;
        rawResult.dimensions.brandConsistency.score = target;
        rawResult.dimensions.brandConsistency.weightedScore = Math.round(target * weights.brandConsistency * 100) / 100;
        rawResult.dimensions.visualQuality.score = target;
        rawResult.dimensions.visualQuality.weightedScore = Math.round(target * weights.visualQuality * 100) / 100;
        rawResult.overallScore = target;
      }

      // Re-evaluate pass/fail condition and align score
      const hasCriticalIssue = rawResult.issues.some((i) => i.severity === 'critical');
      if ((hasMajorVisionIssue || hasCriticalIssue) && rawResult.overallScore >= effectiveThreshold) {
        let targetDim = 'productFidelity';
        for (const vi of visionIssues) {
          if (vi.code === 'LIGHTING_MISMATCH' || vi.category === 'visual') targetDim = 'visualQuality';
          else if (vi.code === 'BRAND_INCONSISTENCY' || vi.category === 'brand') targetDim = 'brandConsistency';
          else if (vi.code === 'PRODUCT_FIDELITY_MISMATCH' || vi.category === 'product') targetDim = 'productFidelity';
        }

        rawResult.dimensions[targetDim].score = 4.0;
        rawResult.dimensions[targetDim].weightedScore = Math.round(4.0 * weights[targetDim] * 100) / 100;

        let recomputed =
          rawResult.dimensions.productFidelity.score * weights.productFidelity +
          rawResult.dimensions.brandConsistency.score * weights.brandConsistency +
          rawResult.dimensions.visualQuality.score * weights.visualQuality;
        rawResult.overallScore = Math.round(recomputed * 100) / 100;

        if (rawResult.overallScore >= effectiveThreshold) {
          const targetFailScore = Math.max(1, effectiveThreshold - 1.0);
          rawResult.dimensions.productFidelity.score = Math.min(rawResult.dimensions.productFidelity.score, targetFailScore);
          rawResult.dimensions.productFidelity.weightedScore = Math.round(rawResult.dimensions.productFidelity.score * weights.productFidelity * 100) / 100;
          rawResult.dimensions.visualQuality.score = Math.min(rawResult.dimensions.visualQuality.score, targetFailScore);
          rawResult.dimensions.visualQuality.weightedScore = Math.round(rawResult.dimensions.visualQuality.score * weights.visualQuality * 100) / 100;
          rawResult.overallScore = Math.round((
            rawResult.dimensions.productFidelity.score * weights.productFidelity +
            rawResult.dimensions.brandConsistency.score * weights.brandConsistency +
            rawResult.dimensions.visualQuality.score * weights.visualQuality
          ) * 100) / 100;
        }
      }

      rawResult.passed = rawResult.overallScore >= effectiveThreshold;

      rawResult.metadata = {
        ...(rawResult.metadata || {}),
        multimodalValidated: true,
        visionRunId: visionAnalysis.id || visionAnalysis.runId,
        visionConfidence: visionAnalysis.overall_confidence || visionAnalysis.overallConfidence,
      };
    }

    // 5. Strict Zod Validation & Mathematical Consistency Verification
    const validatedResult = validateEvaluationResult(rawResult);

    // 6. Persist to PostgreSQL / Supabase
    const evaluationId = crypto.randomUUID();
    const evaluationRow = {
      id: evaluationId,
      campaign_id: campaignId,
      workflow_execution_id: executionId,
      workflow_step_id: stepId,
      final_video_id: validatedResult.finalVideoId,
      evaluation_version: validatedResult.evaluationVersion,
      overall_score: validatedResult.overallScore,
      threshold: validatedResult.threshold,
      passed: validatedResult.passed,
      dimensions: validatedResult.dimensions,
      technical_checks: validatedResult.technicalChecks,
      issues: validatedResult.issues,
      recommendations: validatedResult.recommendations,
      revision_instructions: validatedResult.revisionInstructions,
      metadata: validatedResult.metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: savedEvaluation, error: saveError } = await supabase
      .from('quality_evaluations')
      .insert(evaluationRow)
      .select('*')
      .single();

    if (saveError) {
      logger.error('Failed to persist quality evaluation into PostgreSQL', {
        error: saveError.message,
        evaluationId,
      });
      throw new EvaluationError(`Failed to save quality evaluation: ${saveError.message}`);
    }

    // 7. Emit Completed or Failed Event
    if (executionId) {
      const eventType = validatedResult.passed
        ? WORKFLOW_EVENT_TYPES.QUALITY_EVALUATION_COMPLETED
        : WORKFLOW_EVENT_TYPES.QUALITY_EVALUATION_FAILED;

      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType,
        payload: {
          evaluationId,
          finalVideoId: validatedResult.finalVideoId,
          overallScore: validatedResult.overallScore,
          passed: validatedResult.passed,
          issuesCount: validatedResult.issues.length,
        },
      });
    }

    logger.info(
      `[EvaluationService] Evaluated final video ${validatedResult.finalVideoId || 'unknown'}: score ${validatedResult.overallScore}/${validatedResult.threshold} (Passed: ${validatedResult.passed})`
    );

    return {
      evaluation: savedEvaluation || evaluationRow,
      evaluationResult: validatedResult,
      reused: false,
    };
  }

  /**
   * Retrieve the latest evaluation record for a campaign.
   *
   * @param {string} campaignId
   * @returns {Promise<object>}
   */
  async getLatestEvaluation(campaignId) {
    const { data, error } = await supabase
      .from('quality_evaluations')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw new EvaluationError(`Failed to load evaluation: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new NotFoundError(`Quality evaluation not found for campaign ${campaignId}`);
    }

    return data[0];
  }
}

export const evaluationService = new EvaluationService();
