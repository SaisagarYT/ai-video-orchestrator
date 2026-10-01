import { SafeZoneService } from './safeZones.js';
import { adaptationValidationResultSchema } from './schemas.js';

export class PlatformConstraintValidator {
  /**
   * Validate a Timeline IR against a Platform Profile.
   *
   * @param {object} params
   * @param {object} params.timeline - Timeline IR
   * @param {import('./types.js').PlatformProfile} params.profile - Platform Profile
   * @param {object} [params.subtitles] - Optional subtitle document or metadata
   * @param {object} [params.ctaPlacement] - Optional CTA placement rect
   * @returns {import('./types.js').AdaptationValidationResult}
   */
  static validateTimelineForPlatform({ timeline, profile, subtitles = null, ctaPlacement = null }) {
    const violations = [];
    const warnings = [];

    if (!timeline) {
      return adaptationValidationResultSchema.parse({
        valid: false,
        platform: profile?.platform || 'UNKNOWN',
        profileVersion: profile?.version || 'v1',
        violations: [
          {
            code: 'MISSING_TIMELINE',
            severity: 'ERROR',
            message: 'Timeline IR is required for platform constraint validation',
          },
        ],
        warnings: [],
      });
    }

    const output = timeline.output || {};
    const durationSeconds = (timeline.durationMs || 0) / 1000;

    // 1. Aspect Ratio Validation
    if (output.aspectRatio !== profile.aspectRatio) {
      violations.push({
        code: 'ASPECT_RATIO_MISMATCH',
        severity: 'ERROR',
        message: `Timeline aspect ratio '${output.aspectRatio}' does not match platform requirement '${profile.aspectRatio}'`,
        correction: `Reframe timeline output to '${profile.aspectRatio}'`,
      });
    }

    // 2. Resolution Validation
    if (output.width !== profile.width || output.height !== profile.height) {
      violations.push({
        code: 'RESOLUTION_MISMATCH',
        severity: 'ERROR',
        message: `Timeline resolution ${output.width}x${output.height} does not match platform standard ${profile.width}x${profile.height}`,
        correction: `Render at exact dimensions ${profile.width}x${profile.height}`,
      });
    }

    // 3. Duration Limits Validation
    if (durationSeconds < profile.minDurationSeconds) {
      violations.push({
        code: 'DURATION_TOO_SHORT',
        severity: 'ERROR',
        message: `Video duration (${durationSeconds}s) is shorter than platform minimum (${profile.minDurationSeconds}s)`,
        correction: `Extend timeline duration to at least ${profile.minDurationSeconds}s`,
      });
    } else if (durationSeconds > profile.maxDurationSeconds) {
      violations.push({
        code: 'DURATION_TOO_LONG',
        severity: 'ERROR',
        message: `Video duration (${durationSeconds}s) exceeds platform maximum (${profile.maxDurationSeconds}s)`,
        correction: `Trim or compress timeline scenes to under ${profile.maxDurationSeconds}s`,
      });
    } else if (Math.abs(durationSeconds - profile.recommendedDurationSeconds) > 30) {
      warnings.push({
        code: 'SUBOPTIMAL_DURATION',
        severity: 'WARNING',
        message: `Duration (${durationSeconds}s) departs significantly from platform recommendation (${profile.recommendedDurationSeconds}s)`,
        correction: `Target approximately ${profile.recommendedDurationSeconds}s for optimal retention`,
      });
    }

    // 4. Audio Requirements Validation
    if (profile.audioRequirements?.required) {
      const audioTrack = (timeline.tracks || []).find((t) => t.type === 'audio');
      const hasAudioItems = audioTrack && audioTrack.items && audioTrack.items.length > 0;
      if (!hasAudioItems) {
        violations.push({
          code: 'MISSING_AUDIO_TRACK',
          severity: 'ERROR',
          message: `Platform '${profile.platform}' requires an audio/narration track`,
          correction: 'Attach narration audio track to timeline',
        });
      }
    }

    // 5. Video Track & Discontinuity Check
    const videoTrack = (timeline.tracks || []).find((t) => t.type === 'video');
    if (!videoTrack || !videoTrack.items || videoTrack.items.length === 0) {
      violations.push({
        code: 'EMPTY_VIDEO_TRACK',
        severity: 'ERROR',
        message: 'Timeline contains no video track items',
        correction: 'Ensure video track items are generated and attached',
      });
    } else {
      let expectedStart = 0;
      for (const item of videoTrack.items) {
        if (Math.abs(item.startMs - expectedStart) > 5) {
          violations.push({
            code: 'VIDEO_TRACK_GAP',
            severity: 'ERROR',
            sceneId: item.sceneId,
            message: `Video track gap or overlap detected at scene ${item.sceneId}: expected start ${expectedStart}ms, got ${item.startMs}ms`,
            correction: 'Recalculate sequential start timestamps',
          });
        }
        expectedStart += item.durationMs;
      }
    }

    // 6. Subtitle Safe Zone Validation
    if (subtitles && subtitles.cues) {
      const subSafe = profile.safeZone.subtitle;
      for (const cue of subtitles.cues) {
        if (cue.position) {
          const isInside = SafeZoneService.contains(subSafe, cue.position);
          if (!isInside) {
            violations.push({
              code: 'SUBTITLE_OUTSIDE_SAFE_ZONE',
              severity: 'ERROR',
              message: `Subtitle cue "${cue.text?.slice(0, 20)}..." at y=${cue.position.y} breaches subtitle safe zone (y=${subSafe.y}, h=${subSafe.height})`,
              correction: `Reposition subtitle into y=${subSafe.y}`,
            });
            break;
          }
        }
      }
    }

    // 7. CTA Safe Zone Validation
    if (ctaPlacement) {
      const ctaSafe = profile.safeZone.cta;
      const isInside = SafeZoneService.contains(ctaSafe, ctaPlacement);
      if (!isInside) {
        violations.push({
          code: 'CTA_OUTSIDE_SAFE_ZONE',
          severity: 'ERROR',
          message: `CTA bounding box breaches platform '${profile.platform}' safe zone`,
          correction: `Position CTA inside x=${ctaSafe.x}, y=${ctaSafe.y}, w=${ctaSafe.width}, h=${ctaSafe.height}`,
        });
      }
    }

    const isValid = violations.length === 0;

    return adaptationValidationResultSchema.parse({
      valid: isValid,
      platform: profile.platform,
      profileVersion: profile.version,
      violations,
      warnings,
    });
  }
}
