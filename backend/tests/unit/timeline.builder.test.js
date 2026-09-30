import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TimelineBuilder } from '../../src/services/timeline/timeline.builder.js';

describe('TimelineBuilder Unit Tests', () => {
  const campaign = {
    id: '88888888-8888-4888-8888-888888888888',
    aspect_ratio: '9:16',
    duration_seconds: 15,
  };

  const builder = new TimelineBuilder();

  it('should deterministically sort scenes by sequence_number and build valid Timeline IR', () => {
    // Pass scenes out of order
    const scenes = [
      { id: 'sc-3', sequence_number: 3, duration_seconds: 5, shot_type: 'Close-Up' },
      { id: 'sc-1', sequence_number: 1, duration_seconds: 5, shot_type: 'Wide Reveal' },
      { id: 'sc-2', sequence_number: 2, duration_seconds: 5, shot_type: 'Product Macro' },
    ];

    const assets = [
      { id: 'ast-v-1', scene_id: 'sc-1', asset_type: 'video', url: 'https://cdn.example.com/v1.mp4', duration_ms: 5000 },
      { id: 'ast-v-2', scene_id: 'sc-2', asset_type: 'video', url: 'https://cdn.example.com/v2.mp4', duration_ms: 5000 },
      { id: 'ast-v-3', scene_id: 'sc-3', asset_type: 'video', url: 'https://cdn.example.com/v3.mp4', duration_ms: 5000 },
      { id: 'ast-a-1', scene_id: 'sc-1', asset_type: 'audio', url: 'https://cdn.example.com/a1.mp3', duration_ms: 4500 },
    ];

    const timeline = builder.buildTimeline({
      campaign,
      executionId: '99999999-9999-4999-8999-999999999999',
      scenes,
      assets,
    });

    assert.equal(timeline.version, '1.0');
    assert.equal(timeline.durationMs, 15000);
    assert.equal(timeline.output.width, 1080);
    assert.equal(timeline.output.height, 1920);

    const videoTrack = timeline.tracks.find((t) => t.type === 'video');
    assert.equal(videoTrack.items.length, 3);

    // Verify deterministic sorting: scene 1, 2, 3
    assert.equal(videoTrack.items[0].sceneId, 'sc-1');
    assert.equal(videoTrack.items[0].startMs, 0);
    assert.equal(videoTrack.items[0].durationMs, 5000);

    assert.equal(videoTrack.items[1].sceneId, 'sc-2');
    assert.equal(videoTrack.items[1].startMs, 5000);
    assert.equal(videoTrack.items[1].durationMs, 5000);

    assert.equal(videoTrack.items[2].sceneId, 'sc-3');
    assert.equal(videoTrack.items[2].startMs, 10000);
    assert.equal(videoTrack.items[2].durationMs, 5000);

    // Verify audio narration alignment
    const audioTrack = timeline.tracks.find((t) => t.type === 'audio');
    assert.ok(audioTrack);
    assert.equal(audioTrack.items.length, 1);
    assert.equal(audioTrack.items[0].sceneId, 'sc-1');
    assert.equal(audioTrack.items[0].startMs, 0);
    assert.equal(audioTrack.items[0].durationMs, 4500);
  });

  it('should support single-scene timeline build', () => {
    const scenes = [{ id: 'sc-solo', sequence_number: 1, duration_seconds: 6 }];
    const assets = [
      { id: 'ast-solo-v', scene_id: 'sc-solo', asset_type: 'video', url: 'https://cdn.example.com/solo.mp4', duration_ms: 6000 },
    ];

    const timeline = builder.buildTimeline({
      campaign,
      scenes,
      assets,
    });

    assert.equal(timeline.durationMs, 6000);
    assert.equal(timeline.tracks[0].items.length, 1);
    assert.equal(timeline.tracks[0].items[0].startMs, 0);
  });

  it('should apply aspect ratio dimensions for 16:9 landscape', () => {
    const landscapeCampaign = { ...campaign, aspect_ratio: '16:9' };
    const scenes = [{ id: 'sc-land', sequence_number: 1, duration_seconds: 5 }];
    const assets = [
      { id: 'ast-land-v', scene_id: 'sc-land', asset_type: 'video', url: 'https://cdn.example.com/land.mp4', duration_ms: 5000 },
    ];

    const timeline = builder.buildTimeline({
      campaign: landscapeCampaign,
      scenes,
      assets,
    });

    assert.equal(timeline.output.aspectRatio, '16:9');
    assert.equal(timeline.output.width, 1920);
    assert.equal(timeline.output.height, 1080);
  });

  it('should throw an error if a scene is missing its video asset', () => {
    const scenes = [
      { id: 'sc-1', sequence_number: 1, duration_seconds: 5 },
      { id: 'sc-2', sequence_number: 2, duration_seconds: 5 },
    ];

    // Only scene 1 has an asset
    const assets = [
      { id: 'ast-1', scene_id: 'sc-1', asset_type: 'video', url: 'https://cdn.example.com/1.mp4', duration_ms: 5000 },
    ];

    assert.throws(
      () => builder.buildTimeline({ campaign, scenes, assets }),
      (err) => err.message.includes('Missing video asset for scene sc-2')
    );
  });
});
