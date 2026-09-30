import crypto from 'node:crypto';
import { AppError } from '../../core/errors/AppError.js';
import { logger } from '../../core/logger/logger.js';
import {
  TIMELINE_VERSION,
  TRACK_TYPES,
  TRANSITION_TYPES,
  ASPECT_RATIO_DIMENSIONS,
  DEFAULT_OUTPUT_CONFIG,
} from './timeline.types.js';
import { validateTimelineIR } from './timeline.validator.js';

export class TimelineBuilder {
  /**
   * Deterministically construct a canonical Timeline IR from scenes, assets, and campaign config.
   *
   * @param {object} params
   * @param {object} params.campaign
   * @param {string} [params.executionId]
   * @param {Array<object>} params.scenes
   * @param {Array<object>} params.assets
   * @param {object} [params.outputConfig]
   * @returns {object} Validated Timeline IR
   */
  buildTimeline({ campaign, executionId, scenes = [], assets = [], outputConfig = {} }) {
    if (!campaign || !campaign.id) {
      throw AppError.badRequest('Campaign is required to build a timeline');
    }

    if (!Array.isArray(scenes) || scenes.length === 0) {
      throw AppError.badRequest('At least one scene is required to build a timeline');
    }

    // 1. Sort scenes deterministically by sequence_number or sceneIndex
    const sortedScenes = [...scenes].sort((a, b) => {
      const seqA = a.sequence_number ?? a.sceneIndex ?? 0;
      const seqB = b.sequence_number ?? b.sceneIndex ?? 0;
      return seqA - seqB;
    });

    // 2. Resolve output configuration
    const aspectRatio = campaign.aspect_ratio || outputConfig.aspectRatio || DEFAULT_OUTPUT_CONFIG.aspectRatio;
    const baseDimensions = ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS['9:16'];

    const resolvedOutput = {
      ...DEFAULT_OUTPUT_CONFIG,
      ...baseDimensions,
      aspectRatio,
      ...outputConfig,
    };

    const videoItems = [];
    const audioItems = [];
    let currentStartMs = 0;

    // 3. Match assets and build track items
    const videoAssets = assets.filter((a) => a.asset_type === 'video');
    const audioAssets = assets.filter((a) => a.asset_type === 'audio');

    for (let i = 0; i < sortedScenes.length; i++) {
      const scene = sortedScenes[i];
      const sequenceNum = scene.sequence_number ?? scene.sceneIndex ?? (i + 1);
      const sceneIdentifier = scene.id || `scene-${sequenceNum}`;

      // Find corresponding video asset
      const videoAsset =
        videoAssets.find(
          (a) =>
            a.scene_id === sceneIdentifier ||
            (scene.id && a.scene_id === scene.id) ||
            a.scene_id === `scene-${sequenceNum}` ||
            a.scene_id === `sc-${sequenceNum}` ||
            a.scene_id === String(sequenceNum) ||
            (scene.sceneIndex && a.scene_id === String(scene.sceneIndex))
        ) || videoAssets[i];

      if (!videoAsset) {
        throw AppError.badRequest(
          `Missing video asset for scene ${sceneIdentifier} (sequence: ${sequenceNum})`,
          { sceneId: sceneIdentifier, sequenceNumber: sequenceNum }
        );
      }

      // Calculate video item duration (ms)
      let durationMs = videoAsset.duration_ms;
      if (!durationMs || durationMs <= 0) {
        const durSec = scene.duration_seconds ?? scene.duration ?? 5;
        durationMs = Math.round(Number(durSec) * 1000);
      }
      durationMs = Math.max(1000, durationMs); // Minimum 1 second

      const videoItem = {
        id: crypto.randomUUID(),
        sceneId: String(sceneIdentifier),
        assetId: String(videoAsset.id),
        sourceUrl: videoAsset.secure_url || videoAsset.url,
        startMs: currentStartMs,
        durationMs,
        trimStartMs: 0,
        trimEndMs: 0,
        sequenceNumber: sequenceNum,
        transitionIn: { type: TRANSITION_TYPES.CUT, durationMs: 0 },
        transitionOut: { type: TRANSITION_TYPES.CUT, durationMs: 0 },
        metadata: {
          shotType: scene.shot_type || scene.name || null,
          cameraMovement: scene.camera_movement || null,
          provider: videoAsset.provider || 'unknown',
          storageProvider: videoAsset.storage_provider || 'cloudinary',
        },
      };

      videoItems.push(videoItem);

      // Find corresponding audio asset (narration)
      const audioAsset =
        audioAssets.find(
          (a) =>
            a.scene_id === sceneIdentifier ||
            (scene.id && a.scene_id === scene.id) ||
            a.scene_id === `scene-${sequenceNum}` ||
            a.scene_id === `sc-${sequenceNum}` ||
            a.scene_id === String(sequenceNum) ||
            (scene.sceneIndex && a.scene_id === String(scene.sceneIndex))
        ) || audioAssets[i];

      if (audioAsset) {
        let audioDurationMs = audioAsset.duration_ms || durationMs;
        // Cap audio duration if it exceeds video duration by more than a reasonable threshold
        if (audioDurationMs > durationMs) {
          audioDurationMs = durationMs;
        }

        const audioItem = {
          id: crypto.randomUUID(),
          sceneId: String(sceneIdentifier),
          assetId: String(audioAsset.id),
          sourceUrl: audioAsset.secure_url || audioAsset.url,
          startMs: currentStartMs,
          durationMs: audioDurationMs,
          volume: 1.0,
          sequenceNumber: sequenceNum,
          metadata: {
            narrationText: scene.audio_narration || null,
            provider: audioAsset.provider || 'unknown',
          },
        };

        audioItems.push(audioItem);
      }

      currentStartMs += durationMs;
    }

    const totalDurationMs = currentStartMs;

    const tracks = [
      {
        type: TRACK_TYPES.VIDEO,
        items: videoItems,
      },
    ];

    if (audioItems.length > 0) {
      tracks.push({
        type: TRACK_TYPES.AUDIO,
        items: audioItems,
      });
    }

    const rawTimeline = {
      version: TIMELINE_VERSION,
      campaignId: campaign.id,
      workflowExecutionId: executionId || null,
      output: resolvedOutput,
      durationMs: totalDurationMs,
      tracks,
      metadata: {
        totalScenes: sortedScenes.length,
        hasAudio: audioItems.length > 0,
        builtAt: new Date().toISOString(),
      },
    };

    // 4. Validate before returning
    return validateTimelineIR(rawTimeline);
  }
}

export const timelineBuilder = new TimelineBuilder();
