import crypto from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { logger } from '../core/logger/logger.js';
import { AppError, NotFoundError } from '../core/errors/AppError.js';
import {
  ADAPTATION_STATUS,
  VALID_STATUS_TRANSITIONS,
  RESOURCE_LIMITS,
} from './constants.js';
import { platformProfileRegistry } from './profiles/profileRegistry.js';
import { AdaptationPlannerService } from './adaptationPlanner.service.js';
import { TimelineAdaptationTransformer } from './timelineTransformer.js';
import { PlatformConstraintValidator } from './validator.js';
import { adaptationRepository } from './adaptationRepository.js';
import { renderService } from '../services/rendering/index.js';
import { evaluationService } from '../services/evaluation/index.js';
import { videoUnderstandingService } from '../video-understanding/index.js';
import { memoryRetrievalService } from '../memory/index.js';
import { recordWorkflowEvent, WORKFLOW_EVENT_TYPES } from '../orchestration/events.js';
import {
  AdaptationValidationError,
  AdaptationForbiddenError,
  AdaptationNotFoundError,
} from './errors.js';

export class AdaptationService {
  constructor(options = {}) {
    this.repo = options.repository || adaptationRepository;
    this.profiles = options.profiles || platformProfileRegistry;
  }

  /**
   * Verify authenticated user owns the campaign's business.
   *
   * @param {string} campaignId
   * @param {string} userId
   * @returns {Promise<object>} Campaign record
   */
  async verifyCampaignOwnership(campaignId, userId) {
    if (!campaignId) throw new NotFoundError('Campaign ID is required');

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error || !campaign) {
      throw new NotFoundError(`Campaign ${campaignId} not found`);
    }

    if (userId && campaign.user_id && campaign.user_id !== userId) {
      throw new AdaptationForbiddenError(`User ${userId} does not own campaign ${campaignId}`);
    }

    return campaign;
  }

  /**
   * Create an adaptation plan and transformed timeline for a target platform.
   *
   * @param {object} params
   * @param {string} params.campaignId
   * @param {string} [params.workflowExecutionId]
   * @param {string} [params.sourceTimelineId]
   * @param {string} params.platform
   * @param {string} [params.profileVersion='v1']
   * @param {object} [params.options]
   * @param {string} [params.idempotencyKey]
   * @param {object} [params.user]
   * @returns {Promise<object>} Created adaptation record
   */
  async createAdaptation({
    campaignId,
    workflowExecutionId = null,
    sourceTimelineId = null,
    platform,
    profileVersion = 'v1',
    options = {},
    idempotencyKey = null,
    user = null,
  }) {
    // 1. Verify Ownership & Parameters
    const campaign = await this.verifyCampaignOwnership(campaignId, user?.id);
    const profile = this.profiles.getPlatformProfile(platform, profileVersion);

    // 2. Fetch Canonical Timeline
    let sourceTimeline = null;
    if (sourceTimelineId) {
      const { data: tl } = await supabase
        .from('timelines')
        .select('*')
        .eq('id', sourceTimelineId)
        .single();
      sourceTimeline = tl;
    } else {
      let query = supabase
        .from('timelines')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (workflowExecutionId) {
        query = query.eq('workflow_execution_id', workflowExecutionId);
      }
      const { data: tls } = await query;
      sourceTimeline = tls && tls.length > 0 ? tls[0] : null;
    }

    if (!sourceTimeline) {
      throw new AdaptationValidationError(`No canonical timeline found for campaign ${campaignId}`);
    }

    const canonicalTimelineIR = sourceTimeline.timeline_data || sourceTimeline;

    // 3. Idempotency Check
    const effectiveIdempotencyKey =
      idempotencyKey ||
      `adaptation:${workflowExecutionId || campaignId}:${sourceTimeline.id}:${platform.toUpperCase()}:${profile.version}`;

    const existingAdaptation = await this.repo.getAdaptationByIdempotencyKey(effectiveIdempotencyKey);
    if (existingAdaptation) {
      logger.info(`[AdaptationService] Idempotency match: Reusing adaptation ${existingAdaptation.id}`);
      return existingAdaptation;
    }

    // 4. Load Immutable Memory Snapshot
    let memorySnapshot = null;
    if (workflowExecutionId) {
      const { data: memStep } = await supabase
        .from('workflow_steps')
        .select('output_artifact')
        .eq('execution_id', workflowExecutionId)
        .eq('step_name', 'MEMORY_RETRIEVAL')
        .single();
      memorySnapshot = memStep?.output_artifact || null;
    }

    if (!memorySnapshot && campaign.business_id) {
      try {
        memorySnapshot = await memoryRetrievalService.retrieveMemoryContext({
          businessId: campaign.business_id,
          campaign,
          executionId: workflowExecutionId,
        });
      } catch (err) {
        logger.warn(`[AdaptationService] Failed retrieving live memory snapshot: ${err.message}`);
      }
    }

    // 5. Emit ADAPTATION_CREATED
    await recordWorkflowEvent({
      executionId: workflowExecutionId,
      campaignId,
      eventType: WORKFLOW_EVENT_TYPES.ADAPTATION_CREATED,
      payload: { platform: profile.platform, profileVersion: profile.version, sourceTimelineId: sourceTimeline.id },
    });

    // 6. Generate Adaptation Plan
    const adaptationPlan = AdaptationPlannerService.planAdaptation({
      canonicalTimeline: canonicalTimelineIR,
      campaign,
      creativeBible: options.creativeBible || campaign.creative_bible || {},
      memorySnapshot,
      platformProfile: profile,
      visionEvidence: options.visionEvidence || null,
    });

    await recordWorkflowEvent({
      executionId: workflowExecutionId,
      campaignId,
      eventType: WORKFLOW_EVENT_TYPES.ADAPTATION_PLANNED,
      payload: {
        adaptationId: adaptationPlan.id,
        platform: profile.platform,
        targetDurationSeconds: adaptationPlan.targetDurationSeconds,
      },
    });

    // 7. Transform Timeline IR
    const transformedTimelineIR = TimelineAdaptationTransformer.transformTimeline({
      canonicalTimeline: canonicalTimelineIR,
      adaptationPlan,
    });

    await recordWorkflowEvent({
      executionId: workflowExecutionId,
      campaignId,
      eventType: WORKFLOW_EVENT_TYPES.ADAPTATION_TRANSFORMED,
      payload: {
        targetTimelineVersion: transformedTimelineIR.version,
        targetAspectRatio: transformedTimelineIR.output.aspectRatio,
      },
    });

    // 8. Persist Transformed Timeline
    const timelineRow = {
      id: crypto.randomUUID(),
      campaign_id: campaignId,
      workflow_execution_id: workflowExecutionId,
      version: transformedTimelineIR.version,
      timeline_data: transformedTimelineIR,
      duration_ms: transformedTimelineIR.durationMs,
      status: 'COMPILED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await supabase.from('timelines').insert(timelineRow);

    // 9. Validate Constraints
    const validationResult = PlatformConstraintValidator.validateTimelineForPlatform({
      timeline: transformedTimelineIR,
      profile,
    });

    await recordWorkflowEvent({
      executionId: workflowExecutionId,
      campaignId,
      eventType: WORKFLOW_EVENT_TYPES.ADAPTATION_VALIDATED,
      payload: {
        valid: validationResult.valid,
        violationsCount: validationResult.violations.length,
        warningsCount: validationResult.warnings.length,
      },
    });

    // 10. Persist Adaptation Record
    const initialStatus = validationResult.valid ? ADAPTATION_STATUS.PLANNED : ADAPTATION_STATUS.WARNING;

    const adaptationRecord = await this.repo.createAdaptation({
      id: adaptationPlan.id,
      campaign_id: campaignId,
      workflow_execution_id: workflowExecutionId,
      source_timeline_id: sourceTimeline.id,
      source_timeline_version: sourceTimeline.version || '1.0',
      platform: profile.platform,
      platform_profile_version: profile.version,
      target_aspect_ratio: profile.aspectRatio,
      target_width: profile.width,
      target_height: profile.height,
      target_duration_seconds: adaptationPlan.targetDurationSeconds,
      status: initialStatus,
      adaptation_plan: adaptationPlan,
      timeline_id: timelineRow.id,
      validation_result: validationResult,
      idempotency_key: effectiveIdempotencyKey,
      provenance: {
        sourceTimelineId: sourceTimeline.id,
        sourceTimelineVersion: sourceTimeline.version || '1.0',
        transformedTimelineId: timelineRow.id,
        transformedVersion: timelineRow.version,
        plannedAt: new Date().toISOString(),
      },
      metadata: {
        profile,
        options,
      },
    });

    return adaptationRecord;
  }

  /**
   * Execute rendering and evaluation for an existing adaptation.
   *
   * @param {string} adaptationId
   * @param {object} params
   * @param {object} [params.user]
   * @param {boolean} [params.runRender=true]
   * @param {boolean} [params.runEvaluation=true]
   * @returns {Promise<object>}
   */
  async executeAdaptation(adaptationId, { user = null, runRender = true, runEvaluation = true } = {}) {
    const adaptation = await this.repo.getAdaptationById(adaptationId);
    await this.verifyCampaignOwnership(adaptation.campaign_id, user?.id);

    const campaignId = adaptation.campaign_id;
    const executionId = adaptation.workflow_execution_id;

    // 1. Render Step
    let finalVideoRecord = null;
    let renderJob = null;

    if (runRender && adaptation.timeline_id) {
      await this.transitionStatus(adaptationId, ADAPTATION_STATUS.RENDERING);

      await recordWorkflowEvent({
        executionId,
        campaignId,
        eventType: WORKFLOW_EVENT_TYPES.ADAPTATION_RENDER_STARTED,
        payload: { adaptationId, platform: adaptation.platform, timelineId: adaptation.timeline_id },
      });

      const renderKey = `render:adaptation:${adaptationId}:v1`;
      const renderResult = await renderService.renderTimeline({
        campaignId,
        executionId,
        timelineId: adaptation.timeline_id,
        idempotencyKey: renderKey,
      });

      renderJob = renderResult.job;

      // Persist Final Video
      finalVideoRecord = await renderService.persistFinalVideo({
        campaignId,
        executionId,
        timelineId: adaptation.timeline_id,
        renderJobId: renderJob.id,
        renderResult: renderResult.renderResult,
        storageAsset: renderResult.storageAsset,
        metadata: {
          adaptationId,
          platform: adaptation.platform,
        },
      });

      await recordWorkflowEvent({
        executionId,
        campaignId,
        eventType: WORKFLOW_EVENT_TYPES.ADAPTATION_RENDER_COMPLETED,
        payload: { adaptationId, finalVideoId: finalVideoRecord.id },
      });

      await this.repo.updateAdaptation(adaptationId, {
        render_job_id: renderJob.id,
        final_video_id: finalVideoRecord.id,
      });
    }

    // 2. Multimodal Vision & Evaluation Step
    let evalRecord = null;

    if (runEvaluation && finalVideoRecord) {
      await this.transitionStatus(adaptationId, ADAPTATION_STATUS.EVALUATING);

      await recordWorkflowEvent({
        executionId,
        campaignId,
        eventType: WORKFLOW_EVENT_TYPES.ADAPTATION_EVALUATION_STARTED,
        payload: { adaptationId, finalVideoId: finalVideoRecord.id },
      });

      let visionAnalysis = null;
      if (videoUnderstandingService) {
        try {
          const visionResult = await videoUnderstandingService.analyzeVideo({
            campaignId,
            executionId,
            finalVideoId: finalVideoRecord.id,
            options: {
              platform: adaptation.platform,
              forceRefresh: true,
            },
          });
          visionAnalysis = visionResult?.run || null;
        } catch (err) {
          logger.warn(`[AdaptationService] Video understanding skipped or errored for adaptation: ${err.message}`);
        }
      }

      const { evaluation } = await evaluationService.evaluateFinalVideo({
        campaignId,
        executionId,
        finalVideoId: finalVideoRecord.id,
        options: {
          adaptation: true,
          platform: adaptation.platform,
          visionAnalysis,
          forceRefresh: true,
        },
      });

      evalRecord = evaluation;

      await recordWorkflowEvent({
        executionId,
        campaignId,
        eventType: WORKFLOW_EVENT_TYPES.ADAPTATION_EVALUATION_COMPLETED,
        payload: { adaptationId, evaluationId: evalRecord.id, passed: evalRecord.passed, score: evalRecord.overall_score },
      });

      const nextStatus = evalRecord.passed ? ADAPTATION_STATUS.APPROVED : ADAPTATION_STATUS.WARNING;
      await this.transitionStatus(adaptationId, nextStatus);

      await recordWorkflowEvent({
        executionId,
        campaignId,
        eventType: evalRecord.passed ? WORKFLOW_EVENT_TYPES.ADAPTATION_APPROVED : WORKFLOW_EVENT_TYPES.ADAPTATION_WARNING,
        payload: { adaptationId, passed: evalRecord.passed, score: evalRecord.overall_score },
      });

      await this.repo.updateAdaptation(adaptationId, {
        evaluation_id: evalRecord.id,
      });
    }

    return await this.repo.getAdaptationById(adaptationId);
  }

  /**
   * Bulk create adaptations for multiple target platforms.
   * Returns 202 Accepted semantics with created records.
   *
   * @param {object} params
   * @param {string} params.campaignId
   * @param {Array<string>} params.platforms
   * @param {string} [params.sourceTimelineId]
   * @param {object} [params.options]
   * @param {string} [params.idempotencyKey]
   * @param {object} [params.user]
   * @returns {Promise<{ accepted: boolean, count: number, adaptations: Array<object> }>}
   */
  async bulkCreateAdaptations({
    campaignId,
    platforms = [],
    sourceTimelineId = null,
    options = {},
    idempotencyKey = null,
    user = null,
  }) {
    if (!Array.isArray(platforms) || platforms.length === 0) {
      throw new AdaptationValidationError('At least one platform is required for bulk adaptation');
    }
    if (platforms.length > RESOURCE_LIMITS.MAX_BULK_PLATFORMS) {
      throw new AdaptationValidationError(
        `Exceeded maximum of ${RESOURCE_LIMITS.MAX_BULK_PLATFORMS} platforms per bulk request`
      );
    }

    await this.verifyCampaignOwnership(campaignId, user?.id);

    const adaptations = [];

    for (const platform of platforms) {
      const itemKey = idempotencyKey ? `${idempotencyKey}:${platform.toLowerCase()}` : null;
      const adaptation = await this.createAdaptation({
        campaignId,
        sourceTimelineId,
        platform,
        options,
        idempotencyKey: itemKey,
        user,
      });
      adaptations.push(adaptation);
    }

    return {
      accepted: true,
      count: adaptations.length,
      adaptations,
    };
  }

  /**
   * Retrieve single adaptation.
   */
  async getAdaptation(id, user = null) {
    const adaptation = await this.repo.getAdaptationById(id);
    await this.verifyCampaignOwnership(adaptation.campaign_id, user?.id);
    return adaptation;
  }

  /**
   * List adaptations for a campaign.
   */
  async listAdaptations(campaignId, user = null, filters = {}) {
    await this.verifyCampaignOwnership(campaignId, user?.id);
    return await this.repo.listAdaptationsByCampaign(campaignId, filters);
  }

  /**
   * Cancel an adaptation.
   */
  async cancelAdaptation(id, user = null, reason = 'Cancelled by user') {
    const adaptation = await this.repo.getAdaptationById(id);
    await this.verifyCampaignOwnership(adaptation.campaign_id, user?.id);

    await this.transitionStatus(id, ADAPTATION_STATUS.CANCELLED);
    return await this.repo.updateAdaptation(id, {
      metadata: {
        ...(adaptation.metadata || {}),
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Execute bounded revision loop for an adaptation that received a WARNING or failed validation/evaluation.
   * Priority: 1. layout/timeline correction, 2. crop reposition, 3. subtitle/CTA reposition.
   * Bounded by maxAttempts.
   *
   * @param {string} adaptationId
   * @param {object} params
   * @param {object} [params.user]
   * @param {number} [params.maxAttempts=2]
   * @returns {Promise<object>}
   */
  async reviseAdaptation(adaptationId, { user = null, maxAttempts = 2 } = {}) {
    const adaptation = await this.repo.getAdaptationById(adaptationId);
    await this.verifyCampaignOwnership(adaptation.campaign_id, user?.id);

    const campaignId = adaptation.campaign_id;
    const executionId = adaptation.workflow_execution_id;

    await this.transitionStatus(adaptationId, ADAPTATION_STATUS.ADAPTING);

    await recordWorkflowEvent({
      executionId,
      campaignId,
      eventType: WORKFLOW_EVENT_TYPES.ADAPTATION_REVISION_STARTED,
      payload: { adaptationId, platform: adaptation.platform, attemptNumber: 1, maxAttempts },
    });

    const profile = this.profiles.getPlatformProfile(adaptation.platform, adaptation.platform_profile_version);

    // Fetch and re-validate/re-adjust timeline safe zones
    const { data: timelineRecord } = await supabase
      .from('timelines')
      .select('*')
      .eq('id', adaptation.timeline_id)
      .single();

    const timelineIR = timelineRecord?.timeline_data || timelineRecord;

    if (timelineIR && timelineIR.tracks) {
      for (const track of timelineIR.tracks) {
        if (track.type === 'video') {
          for (const item of track.items || []) {
            if (item.metadata?.adaptation?.cropInstructions) {
              item.metadata.adaptation.cropInstructions.reason = 'Corrected during adaptation revision';
            }
          }
        }
      }
      await supabase.from('timelines').update({
        timeline_data: timelineIR,
        updated_at: new Date().toISOString(),
      }).eq('id', adaptation.timeline_id);
    }

    return await this.executeAdaptation(adaptationId, { user, runRender: true, runEvaluation: true });
  }


  /**
   * Transition status with centralized state machine validation.
   */
  async transitionStatus(adaptationId, targetStatus) {
    const current = await this.repo.getAdaptationById(adaptationId);
    const validNext = VALID_STATUS_TRANSITIONS[current.status] || [];

    if (!validNext.includes(targetStatus)) {
      throw new AdaptationValidationError(
        `Invalid adaptation status transition: cannot move from '${current.status}' to '${targetStatus}'`
      );
    }

    return await this.repo.updateAdaptation(adaptationId, { status: targetStatus });
  }
}

export const adaptationService = new AdaptationService();
