import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VisionAnalyzer } from '../../src/video-understanding/visionAnalyzer.js';
import { MockVisionProvider, VISION_SCENARIOS } from '../../src/providers/vision/mock-vision.provider.js';
import { SceneAnalyzer } from '../../src/video-understanding/sceneAnalyzer.js';

describe('VisionAnalyzer Unit Tests', () => {
  it('should group extracted frames by sceneId', () => {
    const analyzer = new VisionAnalyzer();
    const frames = [
      { frameId: 'f-1', sceneId: 'sc-1', timestampSeconds: 0 },
      { frameId: 'f-2', sceneId: 'sc-1', timestampSeconds: 2 },
      { frameId: 'f-3', sceneId: 'sc-2', timestampSeconds: 5 },
    ];

    const map = analyzer.groupFramesByScene(frames);
    assert.equal(map.size, 2);
    assert.equal(map.get('sc-1').length, 2);
    assert.equal(map.get('sc-2').length, 1);
  });

  it('should aggregate dimensions and synthesize overall confidence across all scenes', async () => {
    const mockProvider = new MockVisionProvider();
    const sceneAnalyzer = new SceneAnalyzer();
    const visionAnalyzer = new VisionAnalyzer({ sceneAnalyzer });

    const scenes = [
      { id: 'sc-1', sequence_number: 1, duration_seconds: 5 },
      { id: 'sc-2', sequence_number: 2, duration_seconds: 5 },
    ];

    const frames = [
      { frameId: 'f-1', sceneId: 'sc-1', path: '/tmp/f1.jpg', timestampSeconds: 0 },
      { frameId: 'f-2', sceneId: 'sc-2', path: '/tmp/f2.jpg', timestampSeconds: 5 },
    ];

    const result = await visionAnalyzer.analyzeVideo({
      scenes,
      frames,
      options: { provider: mockProvider },
    });

    assert.equal(result.sceneCount, 2);
    assert.equal(result.frameCount, 2);
    assert.ok(result.dimensions.productFidelity.score >= 9.0);
    assert.ok(result.dimensions.visualQuality.score >= 9.0);
    assert.equal(result.detectedIssues.length, 0);
    assert.ok(result.summary.includes('All scenes conform'));
  });

  it('should aggregate detected issues when one scene has visual defects', async () => {
    const mockProvider = new MockVisionProvider();
    mockProvider.setSceneScenario('sc-2', VISION_SCENARIOS.PRODUCT_FIDELITY_FAILURE);

    const sceneAnalyzer = new SceneAnalyzer();
    const visionAnalyzer = new VisionAnalyzer({ sceneAnalyzer });

    const scenes = [
      { id: 'sc-1', sequence_number: 1, duration_seconds: 5 },
      { id: 'sc-2', sequence_number: 2, duration_seconds: 5 },
    ];

    const frames = [
      { frameId: 'f-1', sceneId: 'sc-1', path: '/tmp/f1.jpg', timestampSeconds: 0 },
      { frameId: 'f-2', sceneId: 'sc-2', path: '/tmp/f2.jpg', timestampSeconds: 5 },
    ];

    const result = await visionAnalyzer.analyzeVideo({
      scenes,
      frames,
      options: { provider: mockProvider },
    });

    assert.equal(result.sceneCount, 2);
    assert.equal(result.detectedIssues.length, 1);
    assert.equal(result.detectedIssues[0].code, 'PRODUCT_FIDELITY_MISMATCH');
    assert.equal(result.detectedIssues[0].sceneId, 'sc-2');
    assert.ok(result.summary.includes('Identified 1 major/critical visual issue'));
  });
});
