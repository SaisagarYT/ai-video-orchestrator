import crypto from 'node:crypto';
import { SafeZoneService } from './safeZones.js';
import { HookAdaptationService } from './hookAdaptation.service.js';
import { DurationAdaptationService } from './durationAdaptation.service.js';
import { adaptationPlanSchema } from './schemas.js';
import { CROP_STRATEGIES } from './constants.js';
import { AppError } from '../core/errors/AppError.js';

export class AdaptationPlannerService {
  /**
   * Plan deterministic adaptation from canonical timeline to target platform.
   *
   * @param {object} params
   * @param {object} params.canonicalTimeline - Canonical Timeline IR
   * @param {object} params.campaign - Campaign record
   * @param {object} [params.creativeBible] - Creative Bible
   * @param {object} [params.memorySnapshot] - Frozen brand memory snapshot
   * @param {import('./types.js').PlatformProfile} params.platformProfile - Target platform profile
   * @param {object} [params.visionEvidence] - Multimodal vision inspection findings
   * @returns {import('./types.js').AdaptationPlan}
   */
  static planAdaptation({
    canonicalTimeline,
    campaign,
    creativeBible = {},
    memorySnapshot = null,
    platformProfile,
    visionEvidence = null,
  }) {
    if (!canonicalTimeline || !canonicalTimeline.tracks) {
      throw AppError.badRequest('Valid canonical Timeline IR is required to plan adaptation');
    }
    if (!platformProfile) {
      throw AppError.badRequest('Target platform profile is required to plan adaptation');
    }
    if (!campaign || !campaign.id) {
      throw AppError.badRequest('Campaign record is required to plan adaptation');
    }

    const sourceOutput = canonicalTimeline.output || {};
    const sourceAspectRatio = sourceOutput.aspectRatio || '9:16';
    const targetAspectRatio = platformProfile.aspectRatio;

    // 1. Extract scenes from canonical video track
    const videoTrack = (canonicalTimeline.tracks || []).find((t) => t.type === 'video');
    const videoItems = videoTrack?.items || [];
    if (videoItems.length === 0) {
      throw AppError.badRequest('Canonical timeline contains no video track items');
    }

    const canonicalScenes = videoItems.map((item, idx) => ({
      id: item.sceneId,
      sequence_number: item.sequenceNumber || idx + 1,
      duration_seconds: item.durationMs / 1000,
      startMs: item.startMs,
      durationMs: item.durationMs,
    }));

    // 2. Duration Adaptation Planning
    const { sceneModifications, totalDurationSeconds } =
      DurationAdaptationService.planDurationAdaptation({
        scenes: canonicalScenes,
        profile: platformProfile,
      });

    // 3. Hook Adaptation Planning
    const firstScene = canonicalScenes[0];
    const hookPlan = HookAdaptationService.planHookAdaptation({
      firstScene,
      profile: platformProfile,
      creativeMemory: memorySnapshot?.relevantCreativePatterns?.[0] || null,
    });

    // 4. Transform Each Scene
    const sceneTransformations = [];

    for (let idx = 0; idx < canonicalScenes.length; idx++) {
      const scene = canonicalScenes[idx];
      const durationMod = sceneModifications[idx] || {
        originalDurationMs: scene.durationMs,
        adaptedDurationMs: scene.durationMs,
        strategy: 'PRESERVE_DURATION',
        trimStartMs: 0,
        trimEndMs: 0,
        reason: 'Preserved duration',
      };

      // Determine focal point (from vision evidence or center)
      let focalPoint = { x: 0.5, y: 0.5 };
      let subjectRegion = null;
      let subjectConfidence = 1.0;

      if (visionEvidence && Array.isArray(visionEvidence.scenes)) {
        const sceneVision = visionEvidence.scenes.find(
          (s) => String(s.sceneId) === String(scene.id) || s.sceneIndex === scene.sequence_number
        );
        if (sceneVision?.dimensions?.productFidelity?.metadata?.boundingBox) {
          subjectRegion = sceneVision.dimensions.productFidelity.metadata.boundingBox;
          focalPoint = {
            x: subjectRegion.x + subjectRegion.width / 2,
            y: subjectRegion.y + subjectRegion.height / 2,
          };
          subjectConfidence = sceneVision.dimensions.productFidelity.confidence || 0.9;
        }
      }

      // Select crop strategy
      let strategy = platformProfile.cropStrategy || CROP_STRATEGIES.CENTER_CROP;
      if (sourceAspectRatio === targetAspectRatio) {
        strategy = CROP_STRATEGIES.CENTER_CROP;
      } else if (subjectRegion) {
        strategy = CROP_STRATEGIES.SUBJECT_AWARE_CROP;
      }

      // Calculate crop box
      const cropBox = SafeZoneService.calculateAspectCropBox({
        sourceAspectRatio,
        targetAspectRatio,
        focalPoint,
        strategy,
      });

      // CTA Transformation
      const isEndcard = idx === canonicalScenes.length - 1;
      const ctaText = campaign.call_to_action || creativeBible?.call_to_action || 'Learn More';
      const ctaTransform = isEndcard
        ? {
            originalCTA: ctaText,
            adaptedCTA: ctaText,
            placement: 'CENTER_LOWER',
            safeZone: platformProfile.safeZone.cta,
            reason: `Positioned within ${platformProfile.platform} CTA safe zone`,
          }
        : {};

      // Subtitle Transformation
      const subSafeZone = platformProfile.safeZone.subtitle;
      const subTransform = {
        repositionedSubtitles: true,
        verticalOffsetPct: Math.round(subSafeZone.y * 100),
        safeZone: subSafeZone,
      };

      // Hook adaptation integration for first scene
      if (idx === 0 && hookPlan.strategy === 'TRIM_HOOK_SCENE') {
        const trimmedMs = Math.round(hookPlan.adjustedDurationSeconds * 1000);
        durationMod.adaptedDurationMs = Math.min(durationMod.adaptedDurationMs, trimmedMs);
        durationMod.strategy = 'TRIM_SCENE';
        durationMod.reason = hookPlan.reason;
      }

      sceneTransformations.push({
        sceneId: String(scene.id),
        sequenceNumber: scene.sequence_number,
        cropInstructions: {
          strategy,
          cropBox,
          scale: 1.0,
          offset: { x: 0, y: 0 },
          reason: `Adapted from ${sourceAspectRatio} to ${targetAspectRatio} using ${strategy}`,
        },
        subjectPreservation: {
          detectedSubjectRegion: subjectRegion,
          focalPoint,
          confidence: subjectConfidence,
        },
        durationModification: durationMod,
        textTransformations: {
          repositionedText: [],
          safeZoneAdjustment: `Clamped within text safe zone (y: ${platformProfile.safeZone.text.y})`,
        },
        subtitleTransformations: subTransform,
        ctaTransformations: ctaTransform,
      });
    }

    const planId = crypto.randomUUID();
    const rawPlan = {
      id: planId,
      sourceTimelineId: canonicalTimeline.id || crypto.randomUUID(),
      sourceTimelineVersion: canonicalTimeline.version || '1.0',
      platform: platformProfile.platform,
      platformProfileVersion: platformProfile.version,
      targetAspectRatio: platformProfile.aspectRatio,
      targetResolution: {
        width: platformProfile.width,
        height: platformProfile.height,
      },
      targetDurationSeconds: totalDurationSeconds,
      sceneTransformations,
      audioTransformations: {
        volumeAdjustment: 1.0,
        ducking: false,
        trackPreservation: true,
      },
      validationStatus: 'PENDING',
      provenance: {
        generatedAt: new Date().toISOString(),
        plannerVersion: 'v1',
        sourceCampaignId: campaign.id,
        sourceExecutionId: canonicalTimeline.workflowExecutionId || null,
      },
    };

    return adaptationPlanSchema.parse(rawPlan);
  }
}
