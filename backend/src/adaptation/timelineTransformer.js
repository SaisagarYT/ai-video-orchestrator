import crypto from 'node:crypto';
import { TimelineIRSchema } from '../services/timeline/timeline.schema.js';
import { AppError } from '../core/errors/AppError.js';

export class TimelineAdaptationTransformer {
  /**
   * Deterministically transform canonical Timeline IR into a platform-specific Timeline IR variant.
   * Canonical Timeline IR is NEVER mutated.
   *
   * @param {object} params
   * @param {object} params.canonicalTimeline - Canonical Timeline IR (source)
   * @param {import('./types.js').AdaptationPlan} params.adaptationPlan - Adaptation plan
   * @returns {object} New, independent Timeline IR conforming to TimelineIRSchema
   */
  static transformTimeline({ canonicalTimeline, adaptationPlan }) {
    if (!canonicalTimeline || !canonicalTimeline.tracks) {
      throw AppError.badRequest('Canonical Timeline IR is required for transformation');
    }
    if (!adaptationPlan || !adaptationPlan.sceneTransformations) {
      throw AppError.badRequest('Valid AdaptationPlan is required for transformation');
    }

    const videoTrack = (canonicalTimeline.tracks || []).find((t) => t.type === 'video');
    const audioTrack = (canonicalTimeline.tracks || []).find((t) => t.type === 'audio');

    if (!videoTrack || !videoTrack.items || videoTrack.items.length === 0) {
      throw AppError.badRequest('Canonical timeline contains no video track items');
    }

    const transformedVideoItems = [];
    const transformedAudioItems = [];
    let currentStartMs = 0;

    for (let idx = 0; idx < videoTrack.items.length; idx++) {
      const canonicalItem = videoTrack.items[idx];
      const sceneTransform =
        adaptationPlan.sceneTransformations.find(
          (st) => st.sceneId === canonicalItem.sceneId || st.sequenceNumber === canonicalItem.sequenceNumber
        ) || adaptationPlan.sceneTransformations[idx];

      const durationMs = sceneTransform?.durationModification?.adaptedDurationMs || canonicalItem.durationMs;
      const trimStartMs = sceneTransform?.durationModification?.trimStartMs || 0;
      const trimEndMs = sceneTransform?.durationModification?.trimEndMs || 0;

      const adaptedVideoItem = {
        ...canonicalItem,
        id: crypto.randomUUID(),
        startMs: currentStartMs,
        durationMs,
        trimStartMs,
        trimEndMs,
        metadata: {
          ...(canonicalItem.metadata || {}),
          adaptation: {
            platform: adaptationPlan.platform,
            cropInstructions: sceneTransform?.cropInstructions || {},
            subjectPreservation: sceneTransform?.subjectPreservation || {},
            subtitleTransformations: sceneTransform?.subtitleTransformations || {},
            ctaTransformations: sceneTransform?.ctaTransformations || {},
          },
        },
      };

      transformedVideoItems.push(adaptedVideoItem);

      // Match corresponding audio track item if present
      if (audioTrack && audioTrack.items) {
        const canonicalAudio = audioTrack.items.find(
          (a) => a.sceneId === canonicalItem.sceneId || a.sequenceNumber === canonicalItem.sequenceNumber
        );

        if (canonicalAudio) {
          transformedAudioItems.push({
            ...canonicalAudio,
            id: crypto.randomUUID(),
            startMs: currentStartMs,
            durationMs,
            volume: canonicalAudio.volume ?? 1.0,
            metadata: {
              ...(canonicalAudio.metadata || {}),
              adaptation: {
                platform: adaptationPlan.platform,
                audioTransformations: adaptationPlan.audioTransformations || {},
              },
            },
          });
        }
      }

      currentStartMs += durationMs;
    }

    const newVersion = `${canonicalTimeline.version || '1.0'}-${adaptationPlan.platform.toLowerCase()}-v1`;

    const rawTransformedTimeline = {
      id: crypto.randomUUID(),
      version: newVersion,
      campaignId: canonicalTimeline.campaignId,
      workflowExecutionId: canonicalTimeline.workflowExecutionId || null,
      output: {
        width: adaptationPlan.targetResolution.width,
        height: adaptationPlan.targetResolution.height,
        aspectRatio: adaptationPlan.targetAspectRatio,
        fps: canonicalTimeline.output?.fps || 30,
        format: canonicalTimeline.output?.format || 'mp4',
        videoCodec: canonicalTimeline.output?.videoCodec || 'h264',
        audioCodec: canonicalTimeline.output?.audioCodec || 'aac',
        bitrateKbps: canonicalTimeline.output?.bitrateKbps,
      },
      durationMs: currentStartMs,
      tracks: [
        {
          type: 'video',
          items: transformedVideoItems,
        },
        ...(transformedAudioItems.length > 0
          ? [
              {
                type: 'audio',
                items: transformedAudioItems,
              },
            ]
          : []),
      ],
      metadata: {
        ...(canonicalTimeline.metadata || {}),
        adaptedFromTimelineId: canonicalTimeline.id,
        adaptedFromVersion: canonicalTimeline.version,
        adaptationPlatform: adaptationPlan.platform,
        adaptationPlanId: adaptationPlan.id,
        transformedAt: new Date().toISOString(),
      },
    };

    return TimelineIRSchema.parse(rawTransformedTimeline);
  }
}
