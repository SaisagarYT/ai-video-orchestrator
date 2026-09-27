import crypto from 'node:crypto';
import { supabase } from '../../config/supabase.js';
import { providerRegistry } from '../../providers/index.js';
import { assetService } from './asset.service.js';
import { recordWorkflowEvent } from '../../orchestration/events.js';
import { logger } from '../../core/logger/logger.js';

export class NarrationGenerationService {
  constructor(options = {}) {
    this.defaultVoiceId = options.defaultVoiceId || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  }

  /**
   * Generates speech narration for a single scene with durable job tracking and storage mirroring.
   * @param {Object} params
   * @returns {Promise<{ job: Object, asset: Object }>}
   */
  async generateSceneNarration({
    campaignId,
    executionId,
    stepId = null,
    sceneId,
    text,
    voiceId,
    model,
    providerName,
    storageProviderName,
    idempotencyKey,
  }) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Narration text is required for audio generation');
    }

    const narrationText = text.trim();
    const effectiveVoiceId = voiceId || this.defaultVoiceId;
    const effectiveSceneId = sceneId ? String(sceneId) : 'narration-main';
    const idempKey =
      idempotencyKey ||
      `audio:${executionId || campaignId}:${effectiveSceneId}`;

    // 1. Idempotency Check
    const { data: existingJobs } = await supabase
      .from('provider_jobs')
      .select('*')
      .eq('idempotency_key', idempKey);

    const existingJob = existingJobs?.[0];
    if (existingJob && existingJob.status === 'COMPLETED') {
      logger.info(`[NarrationGeneration] Reusing existing completed audio job for key: ${idempKey}`);
      const assets = await assetService.getAssetsByScene(effectiveSceneId);
      const audioAsset = assets.find((a) => a.asset_type === 'audio') || assets[0];
      if (audioAsset) {
        return { job: existingJob, asset: audioAsset };
      }
    }

    const audioProvider = providerRegistry.getAudio(providerName);
    const storageProvider = providerRegistry.getStorage(storageProviderName);

    // 2. Insert provider job record (QUEUED)
    const jobId = existingJob?.id || crypto.randomUUID();
    const jobPayload = {
      id: jobId,
      workflow_execution_id: executionId,
      workflow_step_id: stepId,
      campaign_id: campaignId,
      scene_id: effectiveSceneId,
      provider: audioProvider.name,
      media_type: 'audio',
      status: 'QUEUED',
      idempotency_key: idempKey,
      metadata: {
        text: narrationText,
        voiceId: effectiveVoiceId,
        model,
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
        sceneId: effectiveSceneId,
        mediaType: 'audio',
        provider: audioProvider.name,
        status: 'QUEUED',
      },
    });

    try {
      // 3. Generate Speech via Audio Provider
      await supabase
        .from('provider_jobs')
        .update({ status: 'PROCESSING', updated_at: new Date().toISOString() })
        .eq('id', jobId);

      const audioResponse = await audioProvider.generateSpeech({
        text: narrationText,
        voiceId: effectiveVoiceId,
        model,
        metadata: {
          campaignId,
          executionId,
          sceneId: effectiveSceneId,
        },
      });

      const audioSource = audioResponse.asset.buffer || audioResponse.asset.url;
      if (!audioSource) {
        throw new Error('Audio provider did not return valid audio buffer or URL');
      }

      // 4. Mirror to Storage Provider (Cloudinary / Supabase Storage)
      const storageUpload = await storageProvider.uploadAsset({
        source: audioSource,
        resourceType: 'audio',
        folder: `campaigns/${campaignId}/audio`,
        publicId: `scene_${effectiveSceneId}_audio`,
        metadata: {
          campaignId,
          executionId,
          sceneId: effectiveSceneId,
          provider: audioProvider.name,
        },
      });

      // 5. Persist Asset record
      const asset = await assetService.createAsset({
        campaign_id: campaignId,
        workflow_execution_id: executionId,
        workflow_step_id: stepId,
        scene_id: effectiveSceneId,
        asset_type: 'audio',
        provider: audioProvider.name,
        storage_provider: storageProvider.name,
        storage_asset_id: storageUpload.assetId,
        url: storageUpload.url,
        secure_url: storageUpload.secureUrl || storageUpload.url,
        mime_type: audioResponse.asset.mimeType || 'audio/mpeg',
        format: storageUpload.format || 'mp3',
        duration_ms: audioResponse.durationMs || (storageUpload.duration ? storageUpload.duration * 1000 : 5000),
        metadata: {
          text: narrationText,
          voiceId: effectiveVoiceId,
          model,
          providerMetadata: audioResponse.metadata || {},
        },
      });

      // 6. Update provider_jobs to COMPLETED
      const completedJob = {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...jobPayload.metadata,
          assetId: asset.id,
          storageUrl: asset.url,
        },
      };

      await supabase.from('provider_jobs').update(completedJob).eq('id', jobId);

      // 7. Update scenes table with audio URL if scene exists
      try {
        await supabase
          .from('scenes')
          .update({
            audio_url: asset.url,
            audio_narration: narrationText,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sceneId);
      } catch (_) {}

      // 8. Emit Completion Events
      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType: 'MEDIA_JOB_COMPLETED',
        payload: {
          jobId,
          sceneId: effectiveSceneId,
          mediaType: 'audio',
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
          assetType: 'audio',
          sceneId: effectiveSceneId,
          url: asset.url,
        },
      });

      return {
        job: { ...jobPayload, ...completedJob },
        asset,
      };
    } catch (err) {
      logger.error(`[NarrationGeneration] Failed to generate narration: ${err.message}`, {
        sceneId: effectiveSceneId,
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
          sceneId: effectiveSceneId,
          mediaType: 'audio',
          error: err.message,
        },
      });

      throw err;
    }
  }

  /**
   * Generates speech narration for all scenes in a workflow.
   * @param {Object} params
   * @returns {Promise<Array<{ scene: Object, job: Object, asset: Object }>>}
   */
  async generateNarrationForWorkflow({
    campaignId,
    executionId,
    stepId = null,
    scenes = [],
    voiceId,
    model,
    providerName,
    storageProviderName,
  }) {
    const results = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const narrationText =
        scene.audio_narration ||
        scene.narration ||
        scene.description ||
        `Scene ${i + 1}`;

      logger.info(`[NarrationGeneration] Generating narration audio for scene ${i + 1}/${scenes.length}`);

      const { job, asset } = await this.generateSceneNarration({
        campaignId,
        executionId,
        stepId,
        sceneId: scene.id || `scene-${i + 1}`,
        text: narrationText,
        voiceId,
        model,
        providerName,
        storageProviderName,
      });

      results.push({ scene, job, asset });
    }

    return results;
  }
}

export const narrationGenerationService = new NarrationGenerationService();
