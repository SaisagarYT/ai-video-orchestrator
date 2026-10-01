import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { AdaptationPlannerService } from '../../src/adaptation/adaptationPlanner.service.js';
import { platformProfileRegistry } from '../../src/adaptation/profiles/profileRegistry.js';
import { ADAPTATION_PLATFORMS, CROP_STRATEGIES } from '../../src/adaptation/constants.js';

test('AdaptationPlannerService Unit Tests', async (t) => {
  const campaignId = crypto.randomUUID();
  const mockCampaign = {
    id: campaignId,
    name: 'EcoBoost Launch',
    call_to_action: 'Order Now',
  };

  const mockCanonicalTimeline = {
    id: crypto.randomUUID(),
    version: '1.0',
    campaignId,
    output: {
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
    },
    durationMs: 15000,
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
          },
          {
            id: crypto.randomUUID(),
            sceneId: 'scene-2',
            assetId: 'asset-2',
            sourceUrl: 'https://res.cloudinary.com/demo/video/upload/scene2.mp4',
            startMs: 5000,
            durationMs: 5000,
            sequenceNumber: 2,
          },
          {
            id: crypto.randomUUID(),
            sceneId: 'scene-3',
            assetId: 'asset-3',
            sourceUrl: 'https://res.cloudinary.com/demo/video/upload/scene3.mp4',
            startMs: 10000,
            durationMs: 5000,
            sequenceNumber: 3,
          },
        ],
      },
    ],
  };

  await t.test('should throw error when missing required parameters', () => {
    const profile = platformProfileRegistry.getPlatformProfile(ADAPTATION_PLATFORMS.TIKTOK);
    assert.throws(
      () => AdaptationPlannerService.planAdaptation({ canonicalTimeline: null, campaign: mockCampaign, platformProfile: profile }),
      /Valid canonical Timeline IR is required/
    );
    assert.throws(
      () => AdaptationPlannerService.planAdaptation({ canonicalTimeline: mockCanonicalTimeline, campaign: null, platformProfile: profile }),
      /Campaign record is required/
    );
    assert.throws(
      () => AdaptationPlannerService.planAdaptation({ canonicalTimeline: mockCanonicalTimeline, campaign: mockCampaign, platformProfile: null }),
      /Target platform profile is required/
    );
  });

  await t.test('should plan adaptation for TikTok (9:16 vertical same aspect ratio)', () => {
    const profile = platformProfileRegistry.getPlatformProfile(ADAPTATION_PLATFORMS.TIKTOK);
    const plan = AdaptationPlannerService.planAdaptation({
      canonicalTimeline: mockCanonicalTimeline,
      campaign: mockCampaign,
      platformProfile: profile,
    });

    assert.ok(plan.id);
    assert.equal(plan.platform, ADAPTATION_PLATFORMS.TIKTOK);
    assert.equal(plan.targetAspectRatio, '9:16');
    assert.equal(plan.targetResolution.width, 1080);
    assert.equal(plan.targetResolution.height, 1920);
    assert.equal(plan.sceneTransformations.length, 3);
    assert.equal(plan.sceneTransformations[0].cropInstructions.strategy, CROP_STRATEGIES.CENTER_CROP);
    // Endcard CTA placement
    assert.equal(plan.sceneTransformations[2].ctaTransformations.originalCTA, 'Order Now');
    assert.equal(plan.sceneTransformations[2].ctaTransformations.placement, 'CENTER_LOWER');
  });

  await t.test('should plan adaptation for YouTube Landscape (16:9) with focal points from vision evidence', () => {
    const profile = platformProfileRegistry.getPlatformProfile(ADAPTATION_PLATFORMS.YOUTUBE_LANDSCAPE);
    const visionEvidence = {
      scenes: [
        {
          sceneId: 'scene-1',
          dimensions: {
            productFidelity: {
              confidence: 0.95,
              metadata: {
                boundingBox: { x: 0.2, y: 0.3, width: 0.4, height: 0.4 },
              },
            },
          },
        },
      ],
    };

    const plan = AdaptationPlannerService.planAdaptation({
      canonicalTimeline: mockCanonicalTimeline,
      campaign: mockCampaign,
      platformProfile: profile,
      visionEvidence,
    });

    assert.equal(plan.platform, ADAPTATION_PLATFORMS.YOUTUBE_LANDSCAPE);
    assert.equal(plan.targetAspectRatio, '16:9');
    assert.equal(plan.targetResolution.width, 1920);
    assert.equal(plan.targetResolution.height, 1080);

    // Scene 1 should use SUBJECT_AWARE_CROP with focal point
    const s1 = plan.sceneTransformations[0];
    assert.equal(s1.cropInstructions.strategy, CROP_STRATEGIES.SUBJECT_AWARE_CROP);
    assert.equal(s1.subjectPreservation.focalPoint.x, 0.4); // 0.2 + 0.4/2
    assert.equal(s1.subjectPreservation.focalPoint.y, 0.5); // 0.3 + 0.4/2
  });
});
