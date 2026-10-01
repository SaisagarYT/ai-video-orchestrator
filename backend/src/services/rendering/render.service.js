import crypto from 'node:crypto';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../core/logger/logger.js';
import { AppError } from '../../core/errors/AppError.js';
import { timelineBuilder } from '../timeline/timeline.builder.js';
import { rendererRegistry } from './renderer.registry.js';
import { providerRegistry } from '../../providers/index.js';
import { recordWorkflowEvent, WORKFLOW_EVENT_TYPES } from '../../orchestration/events.js';
import { config } from '../../config/env.js';

export class RenderService {
  constructor(options = {}) {
    this.supabase = options.supabase || supabase;
    this.timelineBuilder = options.timelineBuilder || timelineBuilder;
    this.rendererRegistry = options.rendererRegistry || rendererRegistry;
    this.providerRegistry = options.providerRegistry || providerRegistry;
    this.defaultRendererName =
      options.defaultRendererName || config.rendering?.defaultRenderer || 'mock';
  }

  /**
   * Build and persist the canonical Timeline IR for a workflow execution.
   * Idempotent: reuses existing timeline if already constructed for this execution.
   *
   * @param {object} params
   * @param {string} params.campaignId
   * @param {string} [params.executionId]
   * @param {string} [params.stepId]
   * @param {object} [params.outputConfig]
   * @returns {Promise<{ timeline: object, timelineIR: object }>}
   */
  async buildAndPersistTimeline({
    campaignId,
    executionId = null,
    stepId = null,
    scenes: passedScenes = null,
    assets: passedAssets = null,
    version = null,
    forceNew = false,
    outputConfig = {},
  }) {
    if (!campaignId) {
      throw AppError.badRequest('campaignId is required to build timeline');
    }

    // 1. Crash recovery / Idempotency check: see if timeline already created
    if (executionId && !forceNew) {
      let query = this.supabase
        .from('timelines')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('workflow_execution_id', executionId);

      if (version) {
        query = query.eq('version', version);
      }

      const { data: existingTimelines } = await query;

      if (existingTimelines && existingTimelines.length > 0) {
        const existing = existingTimelines[0];
        logger.info(
          `[RenderService] Reusing existing timeline ${existing.id} (version: ${existing.version}) for execution ${executionId}`
        );
        return {
          timeline: existing,
          timelineIR: existing.timeline_data,
          reused: true,
        };
      }
    }

    // 2. Fetch campaign
    const { data: campaign, error: campaignError } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw AppError.notFound(`Campaign ${campaignId} not found`, { campaignId });
    }

    // 3. Fetch scenes (from parameters if provided, else database)
    let scenes = passedScenes;
    if (!scenes || scenes.length === 0) {
      const { data: dbScenes } = await this.supabase
        .from('scenes')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sequence_number', { ascending: true });
      scenes = dbScenes;
    }

    if (!scenes || scenes.length === 0) {
      throw AppError.badRequest(`No scenes found for campaign ${campaignId}`);
    }

    // 4. Fetch persisted assets
    let assets = passedAssets;
    if (!assets || assets.length === 0) {
      let assetQuery = this.supabase.from('assets').select('*').eq('campaign_id', campaignId);
      if (executionId) {
        assetQuery = assetQuery.eq('workflow_execution_id', executionId);
      }
      let { data: dbAssets } = await assetQuery;
      assets = dbAssets;

      // Fallback: if executionId filter yielded no assets, load all assets for this campaign
      if (!assets || assets.length === 0) {
        const { data: allCampaignAssets } = await this.supabase
          .from('assets')
          .select('*')
          .eq('campaign_id', campaignId);
        assets = allCampaignAssets || [];
      }
    }

    // 5. Construct canonical Timeline IR
    const timelineIR = this.timelineBuilder.buildTimeline({
      campaign,
      executionId,
      scenes,
      assets,
      outputConfig,
    });

    const targetVersion = version || timelineIR.version || '1.0';

    // 6. Persist timeline record
    const timelineRecord = {
      id: crypto.randomUUID(),
      campaign_id: campaignId,
      workflow_execution_id: executionId,
      version: targetVersion,
      duration_ms: timelineIR.durationMs,
      output_config: timelineIR.output,
      timeline_data: { ...timelineIR, version: targetVersion },
      status: 'READY',
      metadata: {
        ...(timelineIR.metadata || {}),
        version: targetVersion,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await this.supabase
      .from('timelines')
      .insert(timelineRecord);

    if (insertError) {
      logger.error('Failed to persist timeline in database', { error: insertError.message });
      throw AppError.internal('Failed to persist timeline record', { error: insertError.message });
    }

    const savedTimeline = Array.isArray(inserted) ? inserted[0] : inserted || timelineRecord;

    // 7. Emit TIMELINE_CREATED event
    await recordWorkflowEvent({
      executionId,
      campaignId,
      stepId,
      eventType: WORKFLOW_EVENT_TYPES.TIMELINE_CREATED,
      payload: {
        timelineId: savedTimeline.id,
        durationMs: savedTimeline.duration_ms,
        aspectRatio: timelineIR.output.aspectRatio,
        totalScenes: scenes.length,
      },
    });

    logger.info(
      `[RenderService] Successfully built and persisted timeline ${savedTimeline.id} (${savedTimeline.duration_ms}ms)`
    );

    return {
      timeline: savedTimeline,
      timelineIR,
      reused: false,
    };
  }

  /**
   * Execute video rendering for a persisted timeline.
   *
   * @param {object} params
   * @param {string} params.campaignId
   * @param {string} [params.executionId]
   * @param {string} [params.stepId]
   * @param {string} params.timelineId
   * @param {string} [params.rendererName]
   * @param {string} [params.idempotencyKey]
   * @param {object} [params.options]
   * @returns {Promise<{ job: object, renderResult: object, storageAsset: object, reused: boolean }>}
   */
  async renderTimeline({
    campaignId,
    executionId = null,
    stepId = null,
    timelineId,
    rendererName = null,
    idempotencyKey = null,
    options = {},
  }) {
    if (!campaignId || !timelineId) {
      throw AppError.badRequest('campaignId and timelineId are required for rendering');
    }

    const targetRenderer = (rendererName || this.defaultRendererName).toLowerCase();
    const idempKey = idempotencyKey || `${campaignId}:${executionId || 'direct'}:render:v1`;

    // 1. Idempotency Check: look for an existing render job with this key
    const { data: existingJobs } = await this.supabase
      .from('render_jobs')
      .select('*')
      .eq('idempotency_key', idempKey);

    const existingJob = existingJobs && existingJobs.length > 0 ? existingJobs[0] : null;

    if (existingJob) {
      if (existingJob.status === 'COMPLETED') {
        logger.info(`[RenderService] Idempotency match: Reusing completed render job ${existingJob.id}`);
        const { data: finalVideos } = await this.supabase
          .from('final_videos')
          .select('*')
          .eq('render_job_id', existingJob.id);

        const finalVideo = finalVideos && finalVideos.length > 0 ? finalVideos[0] : null;

        return {
          job: existingJob,
          renderResult: existingJob.metadata?.renderResult || null,
          storageAsset: {
            url: finalVideo?.url || existingJob.metadata?.storageUrl,
            secureUrl: finalVideo?.secure_url || existingJob.metadata?.storageUrl,
          },
          finalVideo,
          reused: true,
        };
      }

      if (existingJob.status === 'PROCESSING') {
        logger.info(`[RenderService] Render job ${existingJob.id} is currently processing`);
        return {
          job: existingJob,
          reused: true,
        };
      }
    }

    // 2. Fetch Timeline record
    const { data: timelineRecord, error: tlError } = await this.supabase
      .from('timelines')
      .select('*')
      .eq('id', timelineId)
      .single();

    if (tlError || !timelineRecord) {
      throw AppError.notFound(`Timeline ${timelineId} not found`);
    }

    const timelineIR = timelineRecord.timeline_data;

    // 3. Create or resume render job
    const jobId = existingJob?.id || crypto.randomUUID();
    const renderJob = {
      id: jobId,
      campaign_id: campaignId,
      workflow_execution_id: executionId,
      workflow_step_id: stepId,
      timeline_id: timelineId,
      renderer: targetRenderer,
      status: 'PROCESSING',
      idempotency_key: idempKey,
      attempt: (existingJob?.attempt || 0) + 1,
      metadata: { ...options },
      created_at: existingJob?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingJob) {
      await this.supabase.from('render_jobs').update(renderJob).eq('id', jobId);
    } else {
      await this.supabase.from('render_jobs').insert(renderJob);
    }

    // 4. Emit RENDER_JOB_CREATED and RENDER_PROCESSING
    await recordWorkflowEvent({
      executionId,
      campaignId,
      stepId,
      eventType: WORKFLOW_EVENT_TYPES.RENDER_JOB_CREATED,
      payload: { jobId, timelineId, renderer: targetRenderer, attempt: renderJob.attempt },
    });

    await recordWorkflowEvent({
      executionId,
      campaignId,
      stepId,
      eventType: WORKFLOW_EVENT_TYPES.RENDER_PROCESSING,
      payload: { jobId, timelineId, renderer: targetRenderer },
    });

    // 5. Execute renderer
    const renderer = this.rendererRegistry.get(targetRenderer);

    try {
      const renderResult = await renderer.render(timelineIR, options);

      // 6. Persist render output to StorageProvider (Cloudinary / Mock)
      const storageProvider = this.providerRegistry.get('storage');
      const storageAsset = await storageProvider.uploadAsset({
        file: renderResult.outputPath,
        resourceType: 'video',
        folder: `orchestrator/${campaignId}/final`,
        metadata: {
          campaignId,
          executionId,
          timelineId,
          renderer: targetRenderer,
        },
      });

      // 7. Update render job as COMPLETED
      const completedJob = {
        ...renderJob,
        status: 'COMPLETED',
        output_asset_id: storageAsset.assetId || storageAsset.id || null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...renderJob.metadata,
          renderResult: {
            durationMs: renderResult.durationMs,
            width: renderResult.width,
            height: renderResult.height,
            format: renderResult.format,
          },
          storageUrl: storageAsset.secureUrl || storageAsset.url,
          storageAssetId: storageAsset.assetId || storageAsset.id,
        },
      };

      await this.supabase.from('render_jobs').update(completedJob).eq('id', jobId);

      // 8. Emit RENDER_COMPLETED event
      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType: WORKFLOW_EVENT_TYPES.RENDER_COMPLETED,
        payload: {
          jobId,
          timelineId,
          renderer: targetRenderer,
          durationMs: renderResult.durationMs,
          url: storageAsset.secureUrl || storageAsset.url,
        },
      });

      logger.info(
        `[RenderService] Render job ${jobId} completed successfully using renderer '${targetRenderer}'`
      );

      return {
        job: completedJob,
        renderResult,
        storageAsset,
        reused: false,
      };
    } catch (err) {
      logger.error(`[RenderService] Render job ${jobId} failed: ${err.message}`, {
        error: err.message,
        jobId,
        timelineId,
      });

      // Update render job as FAILED
      await this.supabase
        .from('render_jobs')
        .update({
          status: 'FAILED',
          error_message: err.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      // Emit RENDER_FAILED event
      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType: WORKFLOW_EVENT_TYPES.RENDER_FAILED,
        payload: {
          jobId,
          timelineId,
          renderer: targetRenderer,
          error: err.message,
        },
      });

      throw err;
    }
  }

  /**
   * Persist final deliverable video with full provenance, updating campaign status.
   *
   * @param {object} params
   * @param {string} params.campaignId
   * @param {string} [params.executionId]
   * @param {string} [params.stepId]
   * @param {string} params.timelineId
   * @param {string} params.renderJobId
   * @param {object} params.renderResult
   * @param {object} params.storageAsset
   * @returns {Promise<object>} Persisted Final Video Record
   */
  async persistFinalVideo({
    campaignId,
    executionId = null,
    stepId = null,
    timelineId,
    renderJobId,
    renderResult,
    storageAsset,
  }) {
    if (!campaignId) {
      throw AppError.badRequest('campaignId is required to persist final video');
    }

    // 1. Check if final video already persisted for this timeline & execution
    if (executionId) {
      let query = this.supabase
        .from('final_videos')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('workflow_execution_id', executionId);

      if (timelineId) {
        query = query.eq('timeline_id', timelineId);
      }

      const { data: existingVideos } = await query;

      if (existingVideos && existingVideos.length > 0) {
        logger.info(`[RenderService] Reusing existing final video record ${existingVideos[0].id}`);
        return existingVideos[0];
      }
    }

    // 2. Insert Final Video record with complete provenance
    const finalVideoRecord = {
      id: crypto.randomUUID(),
      campaign_id: campaignId,
      workflow_execution_id: executionId,
      timeline_id: timelineId,
      render_job_id: renderJobId,
      renderer: renderResult?.renderer || this.defaultRendererName,
      storage_provider: storageAsset?.provider || 'cloudinary',
      storage_asset_id: storageAsset?.assetId || storageAsset?.id || null,
      url: storageAsset?.url || storageAsset?.secureUrl || renderResult?.outputPath,
      secure_url: storageAsset?.secureUrl || storageAsset?.url || null,
      mime_type: renderResult?.mimeType || 'video/mp4',
      format: renderResult?.format || 'mp4',
      width: renderResult?.width || 1080,
      height: renderResult?.height || 1920,
      duration_ms: renderResult?.durationMs || 0,
      status: 'COMPLETED',
      metadata: {
        renderResultMetadata: renderResult?.metadata || {},
        storageMetadata: storageAsset?.metadata || {},
        createdAt: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await this.supabase
      .from('final_videos')
      .insert(finalVideoRecord);

    if (insertError) {
      logger.error('Failed to persist final video record', { error: insertError.message });
      throw AppError.internal('Failed to persist final video record', { error: insertError.message });
    }

    const savedVideo = Array.isArray(inserted) ? inserted[0] : inserted || finalVideoRecord;

    // 3. Update campaign status to COMPLETED
    await this.supabase
      .from('campaigns')
      .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
      .eq('id', campaignId);

    // 4. Emit FINAL_VIDEO_CREATED event
    await recordWorkflowEvent({
      executionId,
      campaignId,
      stepId,
      eventType: WORKFLOW_EVENT_TYPES.FINAL_VIDEO_CREATED,
      payload: {
        finalVideoId: savedVideo.id,
        timelineId,
        renderJobId,
        url: savedVideo.secure_url || savedVideo.url,
        durationMs: savedVideo.duration_ms,
        width: savedVideo.width,
        height: savedVideo.height,
      },
    });

    logger.info(`[RenderService] Successfully persisted final video ${savedVideo.id} with full provenance`);

    return savedVideo;
  }
}

export const renderService = new RenderService();
