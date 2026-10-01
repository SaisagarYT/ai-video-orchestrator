import crypto from 'node:crypto';
import { supabase } from '../../config/supabase.js';
import { config } from '../../config/env.js';
import { logger } from '../../core/logger/logger.js';
import { assetService } from '../media/asset.service.js';
import { providerRegistry } from '../../providers/index.js';
import { validateSubtitleDocument } from './subtitle.schema.js';
import { formatToSRT, formatToWebVTT } from './subtitle.formatter.js';
import { recordWorkflowEvent, WORKFLOW_EVENT_TYPES } from '../../orchestration/events.js';
import { SUBTITLE_VERSION } from './subtitle.types.js';

export class SubtitleService {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Generate, validate, format, and persist subtitles from workflow scene narration.
   *
   * @param {object} params
   * @param {string} params.campaignId
   * @param {string} [params.executionId]
   * @param {string} [params.stepId]
   * @param {Array<object>} params.scenes - Scenes containing audio_narration and duration_seconds
   * @param {number} [params.maxDurationMs] - Total timeline duration limit
   * @param {string} [params.language='en']
   * @param {object} [params.options]
   * @returns {Promise<{ subtitleDoc: object, srtContent: string, vttContent: string, asset: object, reused: boolean }>}
   */
  async generateSubtitlesFromScenes({
    campaignId,
    executionId = null,
    stepId = null,
    scenes = [],
    maxDurationMs = null,
    language = 'en',
    options = {},
  }) {
    // 1. Idempotency Check
    if (executionId && !options.forceRefresh) {
      const { data: existingAssets } = await supabase
        .from('assets')
        .select('*')
        .eq('workflow_execution_id', executionId)
        .eq('asset_type', 'subtitles');

      if (existingAssets && existingAssets.length > 0) {
        const existing = existingAssets[0];
        logger.info(`[SubtitleService] Reusing existing subtitle asset ${existing.id} for execution ${executionId}`);

        return {
          subtitleDoc: existing.metadata?.subtitleDoc || null,
          srtContent: existing.metadata?.srtContent || '',
          vttContent: existing.metadata?.vttContent || '',
          asset: existing,
          reused: true,
        };
      }
    }

    // 2. Build Subtitle Cues from Scene Narration and Duration
    const sortedScenes = [...scenes].sort(
      (a, b) => (a.sequence_number || a.sceneIndex || 0) - (b.sequence_number || b.sceneIndex || 0)
    );

    const cues = [];
    let currentCursorMs = 0;

    for (let i = 0; i < sortedScenes.length; i++) {
      const scene = sortedScenes[i];
      const durationSeconds = Number(scene.duration_seconds || scene.duration || 5);
      const sceneDurationMs = Math.round(durationSeconds * 1000);

      const text = (
        scene.audio_narration ||
        scene.narration ||
        scene.text ||
        scene.description ||
        `Scene ${i + 1}`
      ).trim();

      const cueStart = currentCursorMs;
      // Leave 200ms breathing room at the end of the scene before next cue
      const cueEnd = currentCursorMs + Math.max(1000, sceneDurationMs - 200);

      cues.push({
        startMs: cueStart,
        endMs: cueEnd,
        text,
      });

      currentCursorMs += sceneDurationMs;
    }

    // Fallback if no scenes or cues were generated
    if (cues.length === 0) {
      cues.push({
        startMs: 0,
        endMs: Math.max(3000, (maxDurationMs || 5000) - 200),
        text: 'Commercial Advertisement',
      });
    }

    const rawDoc = {
      version: SUBTITLE_VERSION,
      language: language || config.subtitles?.language || 'en',
      cues,
    };

    // 3. Schema & Timing Validation
    const validatedDoc = validateSubtitleDocument(rawDoc, maxDurationMs);

    // 4. Format to SRT and WebVTT
    const srtContent = formatToSRT(validatedDoc);
    const vttContent = formatToWebVTT(validatedDoc);

    // 5. Persist Subtitle Asset via Storage Provider
    const storageProviderName = config.ai?.storageProvider || 'mock';
    let storageProvider = { name: 'mock' };
    if (providerRegistry.has('storage', storageProviderName)) {
      storageProvider = providerRegistry.get('storage', storageProviderName);
    }

    const assetId = crypto.randomUUID();
    let fileUrl = `https://res.cloudinary.com/mock-cloud/raw/upload/campaigns/${campaignId}/subtitles_${assetId}.srt`;
    let secureUrl = fileUrl;

    if (storageProviderName !== 'mock' && typeof storageProvider.uploadBuffer === 'function') {
      try {
        const uploadResult = await storageProvider.uploadBuffer(Buffer.from(srtContent, 'utf8'), {
          folder: `campaigns/${campaignId}/subtitles`,
          resourceType: 'raw',
          publicId: `subtitles_${assetId}`,
        });
        fileUrl = uploadResult.url || uploadResult.secureUrl || fileUrl;
        secureUrl = uploadResult.secureUrl || uploadResult.url || secureUrl;
      } catch (uploadErr) {
        logger.warn(`[SubtitleService] Remote storage upload failed: ${uploadErr.message}. Falling back to virtual asset URL.`);
      }
    }

    // 6. Create durable asset entry in PostgreSQL / Supabase
    const subtitleAsset = await assetService.createAsset({
      id: assetId,
      campaignId,
      executionId,
      stepId,
      assetType: 'subtitles',
      provider: storageProvider.name,
      storageProvider: storageProvider.name,
      url: fileUrl,
      secureUrl,
      mimeType: 'text/plain',
      format: 'srt',
      durationMs: currentCursorMs,
      metadata: {
        cueCount: validatedDoc.cues.length,
        language: validatedDoc.language,
        mode: config.subtitles?.mode || 'sidecar',
        subtitleDoc: validatedDoc,
        srtContent,
        vttContent,
        generatedAt: new Date().toISOString(),
      },
    });

    // 7. Emit durable workflow event
    if (executionId) {
      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType: WORKFLOW_EVENT_TYPES.SUBTITLE_GENERATED,
        payload: {
          assetId: subtitleAsset.id,
          cueCount: validatedDoc.cues.length,
          language: validatedDoc.language,
          url: subtitleAsset.secure_url || subtitleAsset.url,
        },
      });
    }

    logger.info(
      `[SubtitleService] Generated and persisted ${validatedDoc.cues.length} subtitle cues for campaign ${campaignId} (Asset: ${subtitleAsset.id})`
    );

    return {
      subtitleDoc: validatedDoc,
      srtContent,
      vttContent,
      asset: subtitleAsset,
      reused: false,
    };
  }
}

export const subtitleService = new SubtitleService();
