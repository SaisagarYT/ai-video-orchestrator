import { DEFAULT_FRAMES_PER_SCENE, MAX_FRAMES_PER_SCENE } from './types.js';

export class FrameSampler {
  /**
   * Compute deterministic, equidistant timestamps for a single scene duration.
   * @param {Object} params
   * @param {number} params.durationSeconds
   * @param {number} [params.sampleCount=5]
   * @returns {number[]} Array of timestamps in seconds
   */
  static sampleSceneTimestamps({ durationSeconds = 5, sampleCount = DEFAULT_FRAMES_PER_SCENE } = {}) {
    const duration = Math.max(0, Number(durationSeconds) || 0);
    const count = Math.min(MAX_FRAMES_PER_SCENE, Math.max(1, parseInt(sampleCount, 10) || DEFAULT_FRAMES_PER_SCENE));

    if (duration === 0) {
      return [0];
    }

    if (count === 1) {
      return [Math.round((duration / 2) * 100) / 100];
    }

    const interval = duration / (count - 1);
    const rawTimestamps = [];

    for (let i = 0; i < count; i++) {
      const ts = Math.min(duration, Math.max(0, i * interval));
      rawTimestamps.push(Math.round(ts * 100) / 100);
    }

    // Deduplicate and ensure sort
    return Array.from(new Set(rawTimestamps)).sort((a, b) => a - b);
  }

  /**
   * Plan frame sampling for multiple sequential scenes across a composite timeline.
   * @param {Object} params
   * @param {Array<Object>} params.scenes - Scene specifications ({ id, sequence_number, duration_seconds })
   * @param {number} [params.samplesPerScene=5]
   * @returns {Array<Object>} Array of scene sample plans with local and absolute timeline timestamps
   */
  static sampleTimelineScenes({ scenes = [], samplesPerScene = DEFAULT_FRAMES_PER_SCENE } = {}) {
    if (!Array.isArray(scenes) || scenes.length === 0) {
      return [];
    }

    // Sort deterministically by sequence_number or sceneIndex
    const sortedScenes = [...scenes].sort((a, b) => {
      const seqA = a.sequence_number ?? a.sceneIndex ?? 0;
      const seqB = b.sequence_number ?? b.sceneIndex ?? 0;
      return seqA - seqB;
    });

    let currentTimelineOffset = 0;
    const samplingPlan = [];

    for (let idx = 0; idx < sortedScenes.length; idx++) {
      const scene = sortedScenes[idx];
      const sceneId = scene.id || scene.sceneId || `scene-${idx + 1}`;
      const sceneIndex = scene.sequence_number ?? scene.sceneIndex ?? (idx + 1);
      const sceneDuration = Math.max(0.5, Number(scene.duration_seconds || scene.duration || 5));

      const localTimestamps = this.sampleSceneTimestamps({
        durationSeconds: sceneDuration,
        sampleCount: samplesPerScene,
      });

      const timelineTimestamps = localTimestamps.map((localTs) => {
        return Math.round((currentTimelineOffset + localTs) * 100) / 100;
      });

      samplingPlan.push({
        sceneId: String(sceneId),
        sceneIndex,
        sceneDuration,
        timelineOffsetSeconds: Math.round(currentTimelineOffset * 100) / 100,
        localTimestamps,
        timelineTimestamps,
      });

      currentTimelineOffset += sceneDuration;
    }

    return samplingPlan;
  }
}

export default FrameSampler;
