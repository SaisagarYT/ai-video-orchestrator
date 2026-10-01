import crypto from 'node:crypto';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../core/logger/logger.js';
import { recordWorkflowEvent, WORKFLOW_EVENT_TYPES } from '../../orchestration/events.js';
import { revisionPlanner } from './revision.planner.js';
import { promptRepairEngine } from './prompt.repair.js';
import { revisionPolicy } from './revision.policy.js';
import { sceneGenerationService } from '../media/scene-generation.service.js';
import { renderService } from '../rendering/index.js';
import { evaluationService } from '../evaluation/index.js';
import { videoUnderstandingService } from '../../video-understanding/index.js';
import { MAX_REVISION_ATTEMPTS, REVISION_STATUS } from './revision.types.js';
import { RevisionError } from './revision.errors.js';

export class RevisionService {
  constructor(options = {}) {
    this.options = options;
    this.planner = options.planner || revisionPlanner;
    this.promptRepair = options.promptRepair || promptRepairEngine;
    this.policy = options.policy || revisionPolicy;
    this.sceneGen = options.sceneGen || sceneGenerationService;
    this.render = options.render || renderService;
    this.evaluator = options.evaluator || evaluationService;
    this.videoUnderstanding = options.videoUnderstanding || videoUnderstandingService;
    this.maxAttempts = options.maxAttempts || MAX_REVISION_ATTEMPTS;
  }

  /**
   * Execute a single structured revision attempt with selective regeneration and provenance tracking.
   *
   * @param {object} params
   * @param {string} params.campaignId
   * @param {string} params.executionId
   * @param {string} params.evaluationId
   * @param {number} params.attemptNumber
   * @param {object} params.context - Workflow execution context
   * @returns {Promise<object>}
   */
  async executeRevisionAttempt({
    campaignId,
    executionId,
    evaluationId,
    attemptNumber,
    context = {},
  }) {
    logger.info(
      `[RevisionService] Starting revision attempt ${attemptNumber} for execution ${executionId}`
    );

    // 1. Crash Recovery / Idempotency Check for this revision attempt
    const { data: existingAttempts } = await supabase
      .from('revision_attempts')
      .select('*')
      .eq('workflow_execution_id', executionId)
      .eq('attempt_number', attemptNumber);

    let attemptRecord = existingAttempts?.[0] || null;

    if (attemptRecord && attemptRecord.status === REVISION_STATUS.COMPLETED) {
      logger.info(
        `[RevisionService] Reusing completed revision attempt ${attemptRecord.id} for execution ${executionId}`
      );
      // Retrieve evaluation result for this completed attempt
      const evalData = await this.evaluator.getLatestEvaluation(campaignId);
      return {
        attempt: attemptRecord,
        evaluationResult: evalData,
        reused: true,
      };
    }

    if (!attemptRecord) {
      const attemptId = crypto.randomUUID();
      const newAttempt = {
        id: attemptId,
        campaign_id: campaignId,
        workflow_execution_id: executionId,
        attempt_number: attemptNumber,
        evaluation_id: evaluationId,
        status: REVISION_STATUS.IN_PROGRESS,
        diagnostics: {},
        affected_scene_ids: [],
        timeline_id: null,
        final_video_id: null,
        subsequent_evaluation_id: null,
        passed: false,
        metadata: {
          startedAt: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabase.from('revision_attempts').insert(newAttempt);
      attemptRecord = newAttempt;
    }

    // 2. Emit REVISION_ATTEMPT_STARTED Event
    await recordWorkflowEvent({
      executionId,
      campaignId,
      eventType: WORKFLOW_EVENT_TYPES.REVISION_ATTEMPT_STARTED,
      payload: {
        attemptNumber,
        evaluationId,
        attemptId: attemptRecord.id,
      },
    });

    // 3. Resolve context: Campaign, Evaluation, Scenes, Creative Bible
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    let evaluationResult = context.qualityEvaluation || null;
    if (
      !evaluationResult ||
      !evaluationResult.issues ||
      evaluationResult.evaluationId !== evaluationId
    ) {
      const { data: evalRows } = await supabase
        .from('quality_evaluations')
        .select('*')
        .eq('id', evaluationId);
      if (evalRows && evalRows.length > 0) {
        const row = evalRows[0];
        evaluationResult = {
          evaluationId: row.id,
          campaignId: row.campaign_id,
          workflowExecutionId: row.workflow_execution_id,
          overallScore: Number(row.overall_score),
          threshold: Number(row.threshold),
          passed: Boolean(row.passed),
          dimensions: row.dimensions,
          technicalChecks: row.technical_checks,
          issues: row.issues || [],
          recommendations: row.recommendations || [],
          revisionInstructions: row.revision_instructions || [],
        };
      }
    }

    let scenes = context.screenwriter?.scenes;
    if (!scenes || scenes.length === 0) {
      const { data: dbScenes } = await supabase
        .from('scenes')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sequence_number', { ascending: true });
      scenes = dbScenes || [];
    }

    const creativeBible = context.screenwriter?.creativeBible || {};

    // 4. Revision Planning: Selectively Identify Affected Scenes
    const plan = this.planner.planRevision({
      campaign,
      evaluationResult,
      scenes,
      creativeBible,
      attemptNumber,
    });

    await supabase
      .from('revision_attempts')
      .update({
        diagnostics: plan.diagnostics,
        affected_scene_ids: plan.targets.map((t) => t.sceneId),
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptRecord.id);

    // 5. Selective Scene Healing & Regeneration
    const regeneratedAssetsByScene = new Map();

    for (const target of plan.targets) {
      const scene =
        scenes.find(
          (s) =>
            s.id === target.sceneId ||
            s.sequence_number === target.sceneIndex ||
            s.sceneIndex === target.sceneIndex
        ) || {
          id: target.sceneId,
          sequence_number: target.sceneIndex,
          visual_prompt: target.originalPrompt,
        };

      // Check if target was already generated in this attempt (crash recovery)
      const { data: existingTargets } = await supabase
        .from('revision_targets')
        .select('*')
        .eq('revision_attempt_id', attemptRecord.id)
        .eq('scene_id', String(target.sceneId));

      let targetRecord = existingTargets?.[0] || null;

      if (targetRecord && targetRecord.status === 'GENERATED' && targetRecord.new_asset_id) {
        logger.info(
          `[RevisionService] Reusing regenerated asset ${targetRecord.new_asset_id} for scene ${target.sceneId}`
        );
        const { data: cachedAsset } = await supabase
          .from('assets')
          .select('*')
          .eq('id', targetRecord.new_asset_id)
          .single();
        if (cachedAsset) {
          regeneratedAssetsByScene.set(String(target.sceneId), cachedAsset);
          continue;
        }
      }

      // Prompt Self-Healing: Modify prompt while strictly preserving Creative Bible & camera invariants
      const compiledPromptSpec = context.promptCompiler?.prompts?.find(
        (p) => p.sceneIndex === target.sceneIndex
      )?.specification;

      const { healedPrompt, updatedSpec, explanation, appliedOperations } =
        this.promptRepair.repairPrompt({
          target,
          scene,
          campaign,
          creativeBible,
          promptSpec: compiledPromptSpec,
        });

      await recordWorkflowEvent({
        executionId,
        campaignId,
        eventType: WORKFLOW_EVENT_TYPES.PROMPT_HEALED,
        payload: {
          sceneId: target.sceneId,
          sceneIndex: target.sceneIndex,
          explanation,
          appliedOperations,
          attemptNumber,
        },
      });

      // Find previous asset ID for this scene
      const { data: previousAssets } = await supabase
        .from('assets')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('scene_id', String(target.sceneId))
        .eq('asset_type', 'video')
        .order('created_at', { ascending: false });

      const previousAssetId = previousAssets?.[0]?.id || null;

      // Selective Scene Video Generation (Only for this affected scene!)
      const sceneIdempKey = this.policy.generateSceneIdempotencyKey(
        executionId,
        target.sceneId,
        attemptNumber
      );

      const genResult = await this.sceneGen.generateSceneVideo({
        campaignId,
        executionId,
        scene,
        promptSpec: updatedSpec,
        providerName: campaign.provider || undefined,
        storageProviderName: campaign.storage_provider || undefined,
        idempotencyKey: sceneIdempKey,
      });

      const newAsset = genResult.asset;
      regeneratedAssetsByScene.set(String(target.sceneId), newAsset);

      // Persist revision target with provenance
      const targetPayload = {
        id: targetRecord?.id || crypto.randomUUID(),
        revision_attempt_id: attemptRecord.id,
        campaign_id: campaignId,
        scene_id: String(target.sceneId),
        scene_index: target.sceneIndex,
        original_prompt: target.originalPrompt,
        healed_prompt: healedPrompt,
        applied_operations: appliedOperations,
        explanation,
        previous_asset_id: previousAssetId,
        new_asset_id: newAsset.id,
        status: 'GENERATED',
        updated_at: new Date().toISOString(),
      };

      if (targetRecord) {
        await supabase.from('revision_targets').update(targetPayload).eq('id', targetRecord.id);
      } else {
        targetPayload.created_at = new Date().toISOString();
        await supabase.from('revision_targets').insert(targetPayload);
      }

      await recordWorkflowEvent({
        executionId,
        campaignId,
        eventType: WORKFLOW_EVENT_TYPES.SCENE_REGENERATED,
        payload: {
          sceneId: target.sceneId,
          sceneIndex: target.sceneIndex,
          previousAssetId,
          newAssetId: newAsset.id,
          attemptNumber,
        },
      });
    }

    // 6. Assemble Timeline Assets: Reuse Unaffected Assets + Inject Newly Regenerated Assets
    const { data: allCampaignAssets } = await supabase
      .from('assets')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true });

    const assembledAssets = [];

    // Ensure one video asset per scene in sequence
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const seq = scene.sequence_number ?? scene.sceneIndex ?? i + 1;
      const sId = String(scene.id || `scene-${seq}`);

      if (regeneratedAssetsByScene.has(sId)) {
        assembledAssets.push(regeneratedAssetsByScene.get(sId));
      } else {
        // Find existing video asset for this preserved scene
        const existingVideo = (allCampaignAssets || []).find(
          (a) =>
            a.asset_type === 'video' &&
            (a.scene_id === sId ||
              a.scene_id === `scene-${seq}` ||
              a.scene_id === `sc-${seq}` ||
              a.scene_id === String(seq))
        );
        if (existingVideo) {
          assembledAssets.push(existingVideo);
        }
      }
    }

    // Include audio narration assets
    const audioAssets = (allCampaignAssets || []).filter((a) => a.asset_type === 'audio');
    assembledAssets.push(...audioAssets);

    // 7. Timeline Rebuild: Construct New Version IR (e.g. "2.0")
    const newVersion = `${attemptNumber + 1}.0`;
    const { timeline: revisedTimeline } = await this.render.buildAndPersistTimeline({
      campaignId,
      executionId,
      scenes,
      assets: assembledAssets,
      version: newVersion,
      forceNew: false,
      outputConfig: {
        aspectRatio: campaign.aspect_ratio || '9:16',
      },
    });

    // 8. Re-render Revised Timeline with Idempotency
    const renderKey = this.policy.generateRenderIdempotencyKey(
      campaignId,
      executionId,
      attemptNumber
    );

    const renderOutput = await this.render.renderTimeline({
      campaignId,
      executionId,
      timelineId: revisedTimeline.id,
      rendererName: campaign.renderer || null,
      idempotencyKey: renderKey,
    });

    // 9. Persist Revised Final Video
    const finalVideo = await this.render.persistFinalVideo({
      campaignId,
      executionId,
      timelineId: revisedTimeline.id,
      renderJobId: renderOutput.job.id,
      renderResult: renderOutput.renderResult,
      storageAsset: renderOutput.storageAsset,
    });

    // 9b. Multimodal Video Understanding on Revised Video (Slice 8)
    let visionAnalysis = null;
    if (this.videoUnderstanding) {
      try {
        const visionResult = await this.videoUnderstanding.analyzeVideo({
          campaignId,
          executionId,
          finalVideoId: finalVideo.id,
          options: {
            creativeBible,
            scenes,
            brandContext: context.contextIngestion || context.campaign,
            forceRefresh: true,
          },
        });
        visionAnalysis = visionResult?.run || null;
      } catch (err) {
        logger.warn(`[RevisionService] Multimodal video understanding error during revision: ${err.message}`);
      }
    }

    // 10. Re-evaluation
    const { evaluation: newEvalRecord, evaluationResult: newEvalResult } =
      await this.evaluator.evaluateFinalVideo({
        campaignId,
        executionId,
        finalVideoId: finalVideo.id,
        threshold: campaign.evaluation_threshold || null,
        options: {
          forceRefresh: true,
          creativeBible,
          scenes,
          visionAnalysis,
        },
      });

    // 11. Update Attempt Record
    const attemptPassed = Boolean(newEvalResult.passed);
    const finalStatus = attemptPassed ? REVISION_STATUS.COMPLETED : REVISION_STATUS.FAILED;

    await supabase
      .from('revision_attempts')
      .update({
        status: finalStatus,
        timeline_id: revisedTimeline.id,
        final_video_id: finalVideo.id,
        subsequent_evaluation_id: newEvalRecord.id,
        passed: attemptPassed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptRecord.id);

    // 12. Emit REVISION_ATTEMPT_COMPLETED Event
    await recordWorkflowEvent({
      executionId,
      campaignId,
      eventType: WORKFLOW_EVENT_TYPES.REVISION_ATTEMPT_COMPLETED,
      payload: {
        attemptNumber,
        passed: attemptPassed,
        overallScore: newEvalResult.overallScore,
        threshold: newEvalResult.threshold,
        timelineId: revisedTimeline.id,
        finalVideoId: finalVideo.id,
      },
    });

    logger.info(
      `[RevisionService] Completed revision attempt ${attemptNumber}: passed=${attemptPassed}, score=${newEvalResult.overallScore}/${newEvalResult.threshold}`
    );

    return {
      attempt: {
        ...attemptRecord,
        status: finalStatus,
        passed: attemptPassed,
        timeline_id: revisedTimeline.id,
        final_video_id: finalVideo.id,
        subsequent_evaluation_id: newEvalRecord.id,
      },
      plan,
      timeline: revisedTimeline,
      finalVideo,
      evaluation: newEvalRecord,
      evaluationResult: newEvalResult,
      passed: attemptPassed,
    };
  }

  /**
   * Orchestrate the bounded autonomous revision loop.
   * Runs up to MAX_REVISION_ATTEMPTS. Stops immediately upon pass or bounds exhaustion.
   *
   * @param {object} params
   * @param {string} params.campaignId
   * @param {string} params.executionId
   * @param {object} params.initialEvaluation - The failing evaluation result
   * @param {object} [params.context]
   * @param {number} [params.maxAttempts]
   * @returns {Promise<object>}
   */
  async executeAutonomousRevisionLoop({
    campaignId,
    executionId,
    initialEvaluation,
    context = {},
    maxAttempts = null,
  }) {
    const effectiveMax = maxAttempts || this.maxAttempts;

    if (!initialEvaluation) {
      throw new RevisionError('Cannot start revision loop: initialEvaluation is missing');
    }

    // If initial evaluation passed, no revision needed
    if (initialEvaluation.passed === true) {
      logger.info(`[RevisionService] Evaluation already passed for execution ${executionId}. Skipping revision.`);
      return {
        status: REVISION_STATUS.COMPLETED,
        passed: true,
        evaluationResult: initialEvaluation,
        attempts: [],
      };
    }

    logger.info(
      `[RevisionService] Triggering autonomous revision loop for execution ${executionId} (max attempts: ${effectiveMax})`
    );

    await recordWorkflowEvent({
      executionId,
      campaignId,
      eventType: WORKFLOW_EVENT_TYPES.REVISION_LOOP_STARTED,
      payload: {
        initialScore: initialEvaluation.overallScore,
        threshold: initialEvaluation.threshold,
        maxAttempts: effectiveMax,
      },
    });

    // Check existing attempts for crash recovery
    const { data: recordedAttempts } = await supabase
      .from('revision_attempts')
      .select('*')
      .eq('workflow_execution_id', executionId)
      .order('attempt_number', { ascending: true });

    const attempts = [];
    let currentEvaluation = initialEvaluation;
    let loopPassed = false;

    let startAttemptNumber = 1;
    if (recordedAttempts && recordedAttempts.length > 0) {
      const lastCompleted = recordedAttempts.filter((a) => a.status === REVISION_STATUS.COMPLETED);
      if (lastCompleted.length > 0 && lastCompleted[lastCompleted.length - 1].passed) {
        return {
          status: REVISION_STATUS.COMPLETED,
          passed: true,
          attempts: recordedAttempts,
        };
      }
      startAttemptNumber = recordedAttempts.length + 1;
    }

    for (let attemptNum = startAttemptNumber; attemptNum <= effectiveMax; attemptNum++) {
      const policyCheck = this.policy.canRevise({
        attemptCount: attempts.length + (startAttemptNumber - 1),
        evaluationResult: currentEvaluation,
        maxAttempts: effectiveMax,
      });

      if (!policyCheck.allowed) {
        logger.info(`[RevisionService] Policy stopped revision loop: ${policyCheck.reason}`);
        break;
      }

      const attemptResult = await this.executeRevisionAttempt({
        campaignId,
        executionId,
        evaluationId: currentEvaluation.evaluationId || currentEvaluation.id,
        attemptNumber: attemptNum,
        context,
      });

      attempts.push(attemptResult);
      currentEvaluation = attemptResult.evaluationResult;

      if (attemptResult.passed) {
        loopPassed = true;
        break;
      }
    }

    // Determine final loop status
    if (loopPassed) {
      logger.info(`[RevisionService] Revision loop succeeded for execution ${executionId}`);
      return {
        status: REVISION_STATUS.COMPLETED,
        passed: true,
        finalEvaluation: currentEvaluation,
        attempts,
      };
    }

    // Attempts exhausted without achieving pass threshold
    const acceptWithWarning = this.policy.canAcceptWithWarning(currentEvaluation);
    const finalStatus = acceptWithWarning
      ? REVISION_STATUS.WARNING_ACCEPTED
      : REVISION_STATUS.EXHAUSTED;

    await recordWorkflowEvent({
      executionId,
      campaignId,
      eventType: WORKFLOW_EVENT_TYPES.REVISION_EXHAUSTED,
      payload: {
        finalScore: currentEvaluation.overallScore,
        threshold: currentEvaluation.threshold,
        attemptsCount: attempts.length,
        status: finalStatus,
      },
    });

    logger.warn(
      `[RevisionService] Revision attempts exhausted for execution ${executionId}. Final status: ${finalStatus}`
    );

    return {
      status: finalStatus,
      passed: false,
      finalEvaluation: currentEvaluation,
      attempts,
    };
  }

  /**
   * Retrieve full revision provenance history for a campaign.
   *
   * @param {string} campaignId
   * @returns {Promise<Array<object>>}
   */
  async getRevisionHistory(campaignId) {
    const { data: attempts, error } = await supabase
      .from('revision_attempts')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('attempt_number', { ascending: true });

    if (error) {
      throw new RevisionError(`Failed to load revision history: ${error.message}`);
    }

    if (!attempts || attempts.length === 0) {
      return [];
    }

    const fullHistory = [];
    for (const attempt of attempts) {
      const { data: targets } = await supabase
        .from('revision_targets')
        .select('*')
        .eq('revision_attempt_id', attempt.id)
        .order('scene_index', { ascending: true });

      fullHistory.push({
        ...attempt,
        targets: targets || [],
      });
    }

    return fullHistory;
  }
}

export const revisionService = new RevisionService();
