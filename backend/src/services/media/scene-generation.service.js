import crypto from 'node:crypto';
import { supabase } from '../../config/supabase.js';
import { providerRegistry } from '../../providers/index.js';
import { assetService } from './asset.service.js';
import { recordWorkflowEvent } from '../../orchestration/events.js';
import { logger } from '../../core/logger/logger.js';
import { VIDEO_JOB_STATUS } from '../../providers/core/provider.types.js';

export class SceneGenerationService {
  /**
   * @param {Object} [options]
   * @param {number} [options.pollIntervalMs]
   * @param {number} [options.maxPollAttempts]
   */
  constructor(options = {}) {
    this.pollIntervalMs = options.pollIntervalMs || parseInt(process.env.AI_VIDEO_POLL_INTERVAL_MS || '1500', 10);
    this.maxPollAttempts = options.maxPollAttempts || parseInt(process.env.AI_VIDEO_MAX_POLL_ATTEMPTS || '60', 10);
  }

  /**
   * Generates a video clip for a single scene with durable job tracking and storage mirroring.
   * @param {Object} params
   * @returns {Promise<{ job: Object, asset: Object }>}
   */
  async generateSceneVideo({
    campaignId,
    executionId,
    stepId = null,
    scene,
    promptSpec = {},
    providerName,
    storageProviderName,
    idempotencyKey,
  }) {
    const sceneId = scene.id || `scene-${scene.sequence_number || 1}`;
    const idempKey =
      idempotencyKey ||
      `video:${executionId || campaignId}:${sceneId}:${scene.sequence_number || 1}`;

    // 1. Idempotency Check: look for completed job
    const { data: existingJobs } = await supabase
      .from('provider_jobs')
      .select('*')
      .eq('idempotency_key', idempKey);

    const existingJob = existingJobs?.[0];
    if (existingJob && existingJob.status === 'COMPLETED') {
      logger.info(`[SceneGeneration] Reusing existing completed job for idempotency key: ${idempKey}`);
      const assets = await assetService.getAssetsByScene(sceneId);
      const videoAsset = assets.find((a) => a.asset_type === 'video') || assets[0];
      if (videoAsset) {
        return { job: existingJob, asset: videoAsset };
      }
    }

    const videoProvider = providerRegistry.getVideo(providerName);
    const storageProvider = providerRegistry.getStorage(storageProviderName);

    // 2. Insert provider job record (QUEUED)
    const jobId = existingJob?.id || crypto.randomUUID();
    const jobPayload = {
      id: jobId,
      workflow_execution_id: executionId,
      workflow_step_id: stepId,
      campaign_id: campaignId,
      scene_id: String(sceneId),
      provider: videoProvider.name,
      media_type: 'video',
      status: 'QUEUED',
      idempotency_key: idempKey,
      metadata: {
        prompt: promptSpec.compiled_positive_prompt || scene.visual_prompt || scene.description,
        aspectRatio: promptSpec.aspect_ratio || scene.aspect_ratio || '9:16',
        durationSeconds: scene.duration_seconds || scene.duration || 5,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!existingJob) {
      await supabase.from('provider_jobs').insert(jobPayload);
    } else {
      await supabase.from('provider_jobs').update(jobPayload).eq('id', jobId);
    }

    await recordWorkflowEvent({
      executionId,
      campaignId,
      stepId,
      eventType: 'MEDIA_JOB_CREATED',
      payload: {
        jobId,
        sceneId,
        mediaType: 'video',
        provider: videoProvider.name,
        status: 'QUEUED',
      },
    });

    try {
      // 3. Initiate Video Generation
      const prompt =
        promptSpec.compiled_positive_prompt ||
        scene.visual_prompt ||
        scene.description ||
        'Cinematic commercial shot';
      const negativePrompt = promptSpec.negative_prompt;
      const durationSeconds = scene.duration_seconds || scene.duration || 5;
      const aspectRatio = promptSpec.aspect_ratio || scene.aspect_ratio || '9:16';

      const createResponse = await videoProvider.createVideo({
        prompt,
        negativePrompt,
        durationSeconds,
        aspectRatio,
        seed: promptSpec.seed || scene.seed || Math.floor(Math.random() * 100000),
        metadata: {
          sceneId,
          campaignId,
          executionId,
        },
      });

      const providerJobId = createResponse.providerJobId;

      await supabase
        .from('provider_jobs')
        .update({
          provider_job_id: providerJobId,
          status: 'PROCESSING',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      // 4. Bounded Polling for Video Completion
      let rawVideoUrl = createResponse.assetUrl || null;

      if (!rawVideoUrl || createResponse.status !== VIDEO_JOB_STATUS.COMPLETED) {
        let attempts = 0;
        let jobFinished = false;

        while (attempts < this.maxPollAttempts && !jobFinished) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));

          const statusRes = await videoProvider.getVideoJob(providerJobId);

          if (statusRes.status === VIDEO_JOB_STATUS.COMPLETED) {
            rawVideoUrl = statusRes.assetUrl;
            jobFinished = true;
          } else if (statusRes.status === VIDEO_JOB_STATUS.FAILED) {
            throw new Error(`Video provider failed for job ${providerJobId}: ${statusRes.error || 'Unknown error'}`);
          }
        }

        if (!jobFinished || !rawVideoUrl) {
          throw new Error(
            `Video generation timed out after ${attempts * this.pollIntervalMs}ms for job ${providerJobId}`
          );
        }
      }

      // 5. Mirror to Storage Provider (Cloudinary / Supabase Storage)
      const storageUpload = await storageProvider.uploadAsset({
        source: rawVideoUrl,
        resourceType: 'video',
        folder: `campaigns/${campaignId}/scenes`,
        publicId: `scene_${sceneId}_video`,
        metadata: {
          campaignId,
          executionId,
          sceneId,
          provider: videoProvider.name,
        },
      });

      // 6. Persist Asset record
      const asset = await assetService.createAsset({
        campaign_id: campaignId,
        workflow_execution_id: executionId,
        workflow_step_id: stepId,
        scene_id: String(sceneId),
        asset_type: 'video',
        provider: videoProvider.name,
        provider_asset_id: providerJobId,
        storage_provider: storageProvider.name,
        storage_asset_id: storageUpload.assetId,
        url: storageUpload.url,
        secure_url: storageUpload.secureUrl || storageUpload.url,
        mime_type: 'video/mp4',
        format: storageUpload.format || 'mp4',
        duration_ms: (storageUpload.duration || durationSeconds) * 1000,
        width: storageUpload.width || 1080,
        height: storageUpload.height || 1920,
        metadata: {
          prompt,
          negativePrompt,
          aspectRatio,
          providerJobId,
          rawVideoUrl,
        },
      });

      // 7. Update provider_jobs to COMPLETED
      const completedJob = {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...jobPayload.metadata,
          assetId: asset.id,
          storageUrl: asset.url,
          providerJobId,
        },
      };

      await supabase.from('provider_jobs').update(completedJob).eq('id', jobId);

      // 8. Update scenes table with video URL if scene exists
      try {
        await supabase
          .from('scenes')
          .update({
            video_url: asset.url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', scene.id);
      } catch (_) {}

      // 9. Emit Completion Events
      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType: 'MEDIA_JOB_COMPLETED',
        payload: {
          jobId,
          sceneId,
          mediaType: 'video',
          assetId: asset.id,
          assetUrl: asset.url,
        },
      });

      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType: 'ASSET_CREATED',
        payload: {
          assetId: asset.id,
          assetType: 'video',
          sceneId,
          url: asset.url,
        },
      });

      return {
        job: { ...jobPayload, ...completedJob },
        asset,
      };
    } catch (err) {
      logger.error(`[SceneGeneration] Failed to generate scene video: ${err.message}`, {
        sceneId,
        campaignId,
        error: err.message,
      });

      await supabase
        .from('provider_jobs')
        .update({
          status: 'FAILED',
          error_message: err.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType: 'MEDIA_JOB_FAILED',
        payload: {
          jobId,
          sceneId,
          mediaType: 'video',
          error: err.message,
        },
      });

      throw err;
    }
  }

  /**
   * Generates video clips for all scenes in a workflow.
   * @param {Object} params
   * @returns {Promise<Array<{ scene: Object, job: Object, asset: Object }>>}
   */
  async generateScenesForWorkflow({
    campaignId,
    executionId,
    stepId = null,
    scenes = [],
    compiledPrompts = [],
    providerName,
    storageProviderName,
  }) {
    const results = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const promptSpec =
        compiledPrompts.find((p) => p.sceneIndex === i + 1)?.specification ||
        compiledPrompts[i] ||
        {};

      logger.info(`[SceneGeneration] Generating scene video ${i + 1}/${scenes.length}`);

      const { job, asset } = await this.generateSceneVideo({
        campaignId,
        executionId,
        stepId,
        scene,
        promptSpec,
        providerName,
        storageProviderName,
      });

      results.push({ scene, job, asset });
    }

    return results;
  }
}

export const sceneGenerationService = new SceneGenerationService();
