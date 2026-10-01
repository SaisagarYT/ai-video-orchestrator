import { DURATION_STRATEGIES } from './constants.js';

export class DurationAdaptationService {
  /**
   * Plan deterministic duration adaptation for timeline scenes.
   *
   * @param {object} params
   * @param {Array<object>} params.scenes - Scene specifications
   * @param {import('./types.js').PlatformProfile} params.profile - Target platform profile
   * @returns {{ sceneModifications: Array<object>, totalDurationMs: number, totalDurationSeconds: number }}
   */
  static planDurationAdaptation({ scenes = [], profile }) {
    if (!Array.isArray(scenes) || scenes.length === 0) {
      return {
        sceneModifications: [],
        totalDurationMs: 0,
        totalDurationSeconds: 0,
      };
    }

    const maxDurationSec = profile.maxDurationSeconds || 60;
    const minDurationSec = profile.minDurationSeconds || 3;

    // Calculate current total duration
    const sceneDurations = scenes.map((s, idx) => {
      const durSec = Number(s.duration_seconds || s.duration || 5);
      return {
        sceneId: String(s.id || `scene-${idx + 1}`),
        sequenceNumber: s.sequence_number ?? (idx + 1),
        originalDurationMs: Math.max(1000, Math.round(durSec * 1000)),
      };
    });

    const totalOriginalMs = sceneDurations.reduce((acc, s) => acc + s.originalDurationMs, 0);
    const totalOriginalSec = totalOriginalMs / 1000;

    let sceneModifications = [];

    if (totalOriginalSec <= maxDurationSec && totalOriginalSec >= minDurationSec) {
      // Duration is within platform constraints; preserve exact timing
      sceneModifications = sceneDurations.map((s) => ({
        sceneId: s.sceneId,
        sequenceNumber: s.sequenceNumber,
        originalDurationMs: s.originalDurationMs,
        adaptedDurationMs: s.originalDurationMs,
        strategy: DURATION_STRATEGIES.PRESERVE_DURATION,
        trimStartMs: 0,
        trimEndMs: 0,
        reason: `Duration within platform limits (${totalOriginalSec}s <= ${maxDurationSec}s)`,
      }));
    } else if (totalOriginalSec > maxDurationSec) {
      // Exceeds platform maximum; compress proportionally
      const scaleFactor = (maxDurationSec * 1000) / totalOriginalMs;
      let accumulatedMs = 0;

      sceneModifications = sceneDurations.map((s, idx) => {
        let adaptedMs;
        if (idx === sceneDurations.length - 1) {
          adaptedMs = Math.round(maxDurationSec * 1000) - accumulatedMs;
        } else {
          adaptedMs = Math.max(1500, Math.round(s.originalDurationMs * scaleFactor));
          accumulatedMs += adaptedMs;
        }

        const trimDiffMs = s.originalDurationMs - adaptedMs;

        return {
          sceneId: s.sceneId,
          sequenceNumber: s.sequenceNumber,
          originalDurationMs: s.originalDurationMs,
          adaptedDurationMs: adaptedMs,
          strategy: DURATION_STRATEGIES.COMPRESS_SCENE,
          trimStartMs: 0,
          trimEndMs: Math.max(0, trimDiffMs),
          reason: `Compressed to fit platform max duration of ${maxDurationSec}s (scale: ${Math.round(scaleFactor * 100)}%)`,
        };
      });
    } else {
      // Below platform minimum; expand scenes proportionally
      const targetTotalMs = Math.round(minDurationSec * 1000);
      const scaleFactor = targetTotalMs / totalOriginalMs;
      let accumulatedMs = 0;

      sceneModifications = sceneDurations.map((s, idx) => {
        let adaptedMs;
        if (idx === sceneDurations.length - 1) {
          adaptedMs = targetTotalMs - accumulatedMs;
        } else {
          adaptedMs = Math.round(s.originalDurationMs * scaleFactor);
          accumulatedMs += adaptedMs;
        }

        return {
          sceneId: s.sceneId,
          sequenceNumber: s.sequenceNumber,
          originalDurationMs: s.originalDurationMs,
          adaptedDurationMs: adaptedMs,
          strategy: DURATION_STRATEGIES.PRESERVE_DURATION,
          trimStartMs: 0,
          trimEndMs: 0,
          reason: `Padded duration to satisfy platform minimum of ${minDurationSec}s`,
        };
      });
    }

    const finalTotalMs = sceneModifications.reduce((acc, s) => acc + s.adaptedDurationMs, 0);

    return {
      sceneModifications,
      totalDurationMs: finalTotalMs,
      totalDurationSeconds: Math.round((finalTotalMs / 1000) * 100) / 100,
    };
  }
}
