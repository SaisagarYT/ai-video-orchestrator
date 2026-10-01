import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FrameSampler } from '../../src/video-understanding/frameSampler.js';

describe('FrameSampler Unit Tests', () => {
  it('should compute 5 equidistant timestamps for a 10s scene', () => {
    const timestamps = FrameSampler.sampleSceneTimestamps({
      durationSeconds: 10,
      sampleCount: 5,
    });

    assert.deepEqual(timestamps, [0, 2.5, 5, 7.5, 10]);
  });

  it('should return midpoint when sampleCount is 1', () => {
    const timestamps = FrameSampler.sampleSceneTimestamps({
      durationSeconds: 8,
      sampleCount: 1,
    });

    assert.deepEqual(timestamps, [4]);
  });

  it('should return [0] for zero or negative duration', () => {
    const zeroTs = FrameSampler.sampleSceneTimestamps({ durationSeconds: 0 });
    assert.deepEqual(zeroTs, [0]);

    const negTs = FrameSampler.sampleSceneTimestamps({ durationSeconds: -5 });
    assert.deepEqual(negTs, [0]);
  });

  it('should cap sample count at MAX_FRAMES_PER_SCENE (10)', () => {
    const timestamps = FrameSampler.sampleSceneTimestamps({
      durationSeconds: 9,
      sampleCount: 25,
    });

    assert.equal(timestamps.length, 10);
    assert.equal(timestamps[0], 0);
    assert.equal(timestamps[timestamps.length - 1], 9);
  });

  it('should compute sequential timeline offsets for multi-scene sampling plan', () => {
    const scenes = [
      { id: 'sc-1', sequence_number: 1, duration_seconds: 4 },
      { id: 'sc-2', sequence_number: 2, duration_seconds: 6 },
    ];

    const plan = FrameSampler.sampleTimelineScenes({
      scenes,
      samplesPerScene: 3,
    });

    assert.equal(plan.length, 2);

    // Scene 1: offset 0s, local [0, 2, 4], timeline [0, 2, 4]
    assert.equal(plan[0].sceneId, 'sc-1');
    assert.equal(plan[0].timelineOffsetSeconds, 0);
    assert.deepEqual(plan[0].localTimestamps, [0, 2, 4]);
    assert.deepEqual(plan[0].timelineTimestamps, [0, 2, 4]);

    // Scene 2: offset 4s, local [0, 3, 6], timeline [4, 7, 10]
    assert.equal(plan[1].sceneId, 'sc-2');
    assert.equal(plan[1].timelineOffsetSeconds, 4);
    assert.deepEqual(plan[1].localTimestamps, [0, 3, 6]);
    assert.deepEqual(plan[1].timelineTimestamps, [4, 7, 10]);
  });

  it('should return empty plan when scenes array is empty', () => {
    const plan = FrameSampler.sampleTimelineScenes({ scenes: [] });
    assert.deepEqual(plan, []);
  });
});
