import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  MockVisionProvider,
  VISION_SCENARIOS,
} from '../../src/providers/vision/mock-vision.provider.js';
import {
  ProviderTimeoutError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
} from '../../src/providers/core/provider.errors.js';
import { SceneVisionResultSchema } from '../../src/video-understanding/schemas.js';

describe('MockVisionProvider Unit Tests', () => {
  let provider;

  beforeEach(() => {
    provider = new MockVisionProvider();
  });

  const sampleFrames = [
    { frameId: 'f-1', path: '/tmp/f1.jpg', timestampSeconds: 0, sceneId: 'sc-1', sceneIndex: 1 },
    { frameId: 'f-2', path: '/tmp/f2.jpg', timestampSeconds: 2.5, sceneId: 'sc-1', sceneIndex: 1 },
  ];

  const sampleScene = {
    id: 'sc-1',
    sequence_number: 1,
    shot_type: 'Close-up hero shot',
    visual_prompt: 'Apex Surge energy drink on neon table',
    duration_seconds: 5,
  };

  it('should return high scores (>9.0) and empty detected issues on PERFECT scenario', async () => {
    const result = await provider.analyzeFrames({
      frames: sampleFrames,
      expectedScene: sampleScene,
    });

    SceneVisionResultSchema.parse(result);
    assert.equal(result.sceneId, 'sc-1');
    assert.equal(result.frameCount, 2);
    assert.ok(result.dimensions.productFidelity.score >= 9.0);
    assert.ok(result.dimensions.brandConsistency.score >= 9.0);
    assert.ok(result.dimensions.visualQuality.score >= 9.0);
    assert.ok(result.dimensions.sceneConsistency.score >= 9.0);
    assert.equal(result.detectedIssues.length, 0);
  });

  it('should detect product orientation defect in PRODUCT_FIDELITY_FAILURE scenario', async () => {
    provider.setScenario(VISION_SCENARIOS.PRODUCT_FIDELITY_FAILURE);

    const result = await provider.analyzeFrames({
      frames: sampleFrames,
      expectedScene: sampleScene,
    });

    SceneVisionResultSchema.parse(result);
    assert.ok(result.dimensions.productFidelity.score < 5.0);
    assert.equal(result.detectedIssues.length, 1);
    assert.equal(result.detectedIssues[0].code, 'PRODUCT_FIDELITY_MISMATCH');
    assert.equal(result.detectedIssues[0].category, 'product');
    assert.ok(result.detectedIssues[0].revisionInstructions.length > 0);
  });

  it('should detect dark/dim lighting in LIGHTING_MISMATCH scenario', async () => {
    provider.setScenario(VISION_SCENARIOS.LIGHTING_MISMATCH);

    const result = await provider.analyzeFrames({
      frames: sampleFrames,
      expectedScene: sampleScene,
    });

    SceneVisionResultSchema.parse(result);
    assert.ok(result.dimensions.visualQuality.score < 5.0);
    assert.equal(result.detectedIssues.length, 1);
    assert.equal(result.detectedIssues[0].code, 'LIGHTING_MISMATCH');
    assert.equal(result.detectedIssues[0].category, 'visual');
  });

  it('should detect off-brand styling in BRAND_INCONSISTENCY scenario', async () => {
    provider.setScenario(VISION_SCENARIOS.BRAND_INCONSISTENCY);

    const result = await provider.analyzeFrames({
      frames: sampleFrames,
      expectedScene: sampleScene,
    });

    SceneVisionResultSchema.parse(result);
    assert.ok(result.dimensions.brandConsistency.score < 6.0);
    assert.equal(result.detectedIssues.length, 1);
    assert.equal(result.detectedIssues[0].code, 'BRAND_INCONSISTENCY');
    assert.equal(result.detectedIssues[0].category, 'brand');
  });

  it('should detect temporal morphing in SCENE_INCONSISTENCY scenario', async () => {
    provider.setScenario(VISION_SCENARIOS.SCENE_INCONSISTENCY);

    const result = await provider.analyzeFrames({
      frames: sampleFrames,
      expectedScene: sampleScene,
    });

    SceneVisionResultSchema.parse(result);
    assert.ok(result.dimensions.sceneConsistency.score < 5.0);
    assert.equal(result.detectedIssues.length, 1);
    assert.equal(result.detectedIssues[0].code, 'SCENE_INCONSISTENCY');
  });

  it('should throw ProviderTimeoutError when scenario is TIMEOUT', async () => {
    provider.setScenario(VISION_SCENARIOS.TIMEOUT);

    await assert.rejects(
      async () => {
        await provider.analyzeFrames({ frames: sampleFrames, expectedScene: sampleScene });
      },
      (err) => err instanceof ProviderTimeoutError && err.statusCode === 504
    );
  });

  it('should throw ProviderAuthenticationError when scenario is AUTH_ERROR', async () => {
    provider.setScenario(VISION_SCENARIOS.AUTH_ERROR);

    await assert.rejects(
      async () => {
        await provider.analyzeFrames({ frames: sampleFrames, expectedScene: sampleScene });
      },
      (err) => err instanceof ProviderAuthenticationError && err.statusCode === 401
    );
  });

  it('should throw ProviderRateLimitError when scenario is RATE_LIMIT', async () => {
    provider.setScenario(VISION_SCENARIOS.RATE_LIMIT);

    await assert.rejects(
      async () => {
        await provider.analyzeFrames({ frames: sampleFrames, expectedScene: sampleScene });
      },
      (err) => err instanceof ProviderRateLimitError && err.statusCode === 429
    );
  });

  it('should support per-scene scenario overrides', async () => {
    provider.setScenario(VISION_SCENARIOS.PERFECT);
    provider.setSceneScenario('sc-2', VISION_SCENARIOS.PRODUCT_FIDELITY_FAILURE);

    const resultScene1 = await provider.analyzeFrames({
      frames: sampleFrames,
      expectedScene: { id: 'sc-1', sequence_number: 1 },
    });
    assert.equal(resultScene1.detectedIssues.length, 0);

    const resultScene2 = await provider.analyzeFrames({
      frames: [{ frameId: 'f-3', path: '/tmp/f3.jpg', timestampSeconds: 4, sceneId: 'sc-2', sceneIndex: 2 }],
      expectedScene: { id: 'sc-2', sequence_number: 2 },
    });
    assert.equal(resultScene2.detectedIssues.length, 1);
    assert.equal(resultScene2.detectedIssues[0].code, 'PRODUCT_FIDELITY_MISMATCH');
  });
});
