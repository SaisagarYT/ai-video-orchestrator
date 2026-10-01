import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { TimelineAdaptationTransformer } from '../../src/adaptation/timelineTransformer.js';
import { AdaptationPlannerService } from '../../src/adaptation/adaptationPlanner.service.js';
import { platformProfileRegistry } from '../../src/adaptation/profiles/profileRegistry.js';
import { ADAPTATION_PLATFORMS } from '../../src/adaptation/constants.js';

test('TimelineAdaptationTransformer Unit Tests', async (t) => {
  const campaignId = crypto.randomUUID();
  const mockCampaign = {
    id: campaignId,
    name: 'Transform Campaign',
    call_to_action: 'Buy Now',
  };

  const canonicalTimeline = {
    id: crypto.randomUUID(),
    version: '1.0',
    campaignId,
    workflowExecutionId: crypto.randomUUID(),
    output: {
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      fps: 30,
      format: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
    },
    durationMs: 10000,
    tracks: [
      {
        type: 'video',
        items: [
          {
            id: crypto.randomUUID(),
            sceneId: 'scene-1',
            assetId: 'asset-1',
            sourceUrl: 'https://res.cloudinary.com/demo/video/upload/scene1.mp4',
            startMs: 0,
            durationMs: 5000,
            sequenceNumber: 1,
            metadata: { originalMeta: true },
          },
          {
            id: crypto.randomUUID(),
            sceneId: 'scene-2',
            assetId: 'asset-2',
            sourceUrl: 'https://res.cloudinary.com/demo/video/upload/scene2.mp4',
            startMs: 5000,
            durationMs: 5000,
            sequenceNumber: 2,
            metadata: { originalMeta: true },
          },
        ],
      },
      {
        type: 'audio',
        items: [
          {
            id: crypto.randomUUID(),
            sceneId: 'scene-1',
            assetId: 'audio-asset-1',
            sourceUrl: 'https://res.cloudinary.com/demo/video/upload/audio1.mp3',
            startMs: 0,
            durationMs: 5000,
            volume: 1.0,
            sequenceNumber: 1,
          },
          {
            id: crypto.randomUUID(),
            sceneId: 'scene-2',
            assetId: 'audio-asset-2',
            sourceUrl: 'https://res.cloudinary.com/demo/video/upload/audio2.mp3',
            startMs: 5000,
            durationMs: 5000,
            volume: 1.0,
            sequenceNumber: 2,
          },
        ],
      },
    ],
  };

  const deepCloneCanonical = JSON.parse(JSON.stringify(canonicalTimeline));

  const ytProfile = platformProfileRegistry.getPlatformProfile(ADAPTATION_PLATFORMS.YOUTUBE_LANDSCAPE);
  const adaptationPlan = AdaptationPlannerService.planAdaptation({
    canonicalTimeline,
    campaign: mockCampaign,
    platformProfile: ytProfile,
  });

  await t.test('should transform timeline into new valid platform variant without mutating canonical', () => {
    const transformed = TimelineAdaptationTransformer.transformTimeline({
      canonicalTimeline,
      adaptationPlan,
    });

    // 1. Immutability assertion
    assert.deepEqual(canonicalTimeline, deepCloneCanonical, 'Canonical timeline must NOT be mutated');

    // 2. Transformed Timeline assertions
    assert.notEqual(transformed.id, canonicalTimeline.id);
    assert.equal(transformed.version, '1.0-youtube_landscape-v1');
    assert.equal(transformed.campaignId, campaignId);
    assert.equal(transformed.output.aspectRatio, '16:9');
    assert.equal(transformed.output.width, 1920);
    assert.equal(transformed.output.height, 1080);

    // 3. Track structure assertions
    assert.equal(transformed.tracks.length, 2);
    const videoTrack = transformed.tracks.find((t) => t.type === 'video');
    const audioTrack = transformed.tracks.find((t) => t.type === 'audio');

    assert.equal(videoTrack.items.length, 2);
    assert.equal(audioTrack.items.length, 2);

    // Verify contiguous sequential timing
    assert.equal(videoTrack.items[0].startMs, 0);
    assert.equal(videoTrack.items[1].startMs, videoTrack.items[0].durationMs);

    // Verify adaptation metadata is embedded
    assert.equal(videoTrack.items[0].metadata.adaptation.platform, ADAPTATION_PLATFORMS.YOUTUBE_LANDSCAPE);
    assert.ok(videoTrack.items[0].metadata.adaptation.cropInstructions);
    assert.equal(videoTrack.items[0].metadata.originalMeta, true);

    // Verify provenance in metadata
    assert.equal(transformed.metadata.adaptedFromTimelineId, canonicalTimeline.id);
    assert.equal(transformed.metadata.adaptedFromVersion, canonicalTimeline.version);
    assert.equal(transformed.metadata.adaptationPlatform, ADAPTATION_PLATFORMS.YOUTUBE_LANDSCAPE);
  });

  await t.test('should reject missing or invalid parameters', () => {
    assert.throws(
      () => TimelineAdaptationTransformer.transformTimeline({ canonicalTimeline: null, adaptationPlan }),
      /Canonical Timeline IR is required/
    );
    assert.throws(
      () => TimelineAdaptationTransformer.transformTimeline({ canonicalTimeline, adaptationPlan: null }),
      /Valid AdaptationPlan is required/
    );
  });
});
