import test from 'node:test';
import assert from 'node:assert/strict';
import { HookAdaptationService } from '../../src/adaptation/hookAdaptation.service.js';
import { DurationAdaptationService } from '../../src/adaptation/durationAdaptation.service.js';
import { platformProfileRegistry } from '../../src/adaptation/profiles/profileRegistry.js';
import { ADAPTATION_PLATFORMS, DURATION_STRATEGIES } from '../../src/adaptation/constants.js';

test('HookAdaptationService Unit Tests', async (t) => {
  const tiktokProfile = platformProfileRegistry.getPlatformProfile(ADAPTATION_PLATFORMS.TIKTOK);

  await t.test('should return default fallback when firstScene is missing', () => {
    const result = HookAdaptationService.planHookAdaptation({
      firstScene: null,
      profile: tiktokProfile,
    });

    assert.equal(result.strategy, 'PRESERVE_HOOK');
    assert.equal(result.openingDurationSeconds, 3);
    assert.equal(result.regenerationRequired, false);
  });

  await t.test('should preserve hook if scene duration is within platform opening limit', () => {
    const firstScene = { id: 'scene-1', duration_seconds: 2.5, sequence_number: 1 };
    const result = HookAdaptationService.planHookAdaptation({
      firstScene,
      profile: tiktokProfile,
    });

    assert.equal(result.sceneId, 'scene-1');
    assert.equal(result.strategy, 'PRESERVE_HOOK');
    assert.equal(result.originalDurationSeconds, 2.5);
    assert.equal(result.adjustedDurationSeconds, 2.5);
    assert.equal(result.regenerationRequired, false);
  });

  await t.test('should trim hook scene if scene duration exceeds platform maxOpeningDurationSeconds', () => {
    const firstScene = { id: 'scene-1', duration_seconds: 6, sequence_number: 1 };
    const result = HookAdaptationService.planHookAdaptation({
      firstScene,
      profile: tiktokProfile, // maxOpening is 3.0s
    });

    assert.equal(result.strategy, 'TRIM_HOOK_SCENE');
    assert.equal(result.originalDurationSeconds, 6);
    assert.equal(result.adjustedDurationSeconds, 3.0);
    assert.match(result.reason, /adhere to TIKTOK/);
  });
});

test('DurationAdaptationService Unit Tests', async (t) => {
  const tiktokProfile = platformProfileRegistry.getPlatformProfile(ADAPTATION_PLATFORMS.TIKTOK);

  await t.test('should handle empty scenes array safely', () => {
    const result = DurationAdaptationService.planDurationAdaptation({
      scenes: [],
      profile: tiktokProfile,
    });

    assert.equal(result.totalDurationMs, 0);
    assert.deepEqual(result.sceneModifications, []);
  });

  await t.test('should preserve scene durations when within platform bounds', () => {
    const scenes = [
      { id: 's1', duration_seconds: 5, sequence_number: 1 },
      { id: 's2', duration_seconds: 10, sequence_number: 2 },
    ];
    const result = DurationAdaptationService.planDurationAdaptation({
      scenes,
      profile: tiktokProfile, // min 3s, max 60s
    });

    assert.equal(result.totalDurationMs, 15000);
    assert.equal(result.sceneModifications.length, 2);
    assert.equal(result.sceneModifications[0].strategy, DURATION_STRATEGIES.PRESERVE_DURATION);
    assert.equal(result.sceneModifications[0].adaptedDurationMs, 5000);
    assert.equal(result.sceneModifications[1].adaptedDurationMs, 10000);
  });

  await t.test('should compress scene durations proportionally when exceeding platform max', () => {
    // Construct scenes totaling 80s for TikTok (max 60s)
    const scenes = [
      { id: 's1', duration_seconds: 20, sequence_number: 1 },
      { id: 's2', duration_seconds: 30, sequence_number: 2 },
      { id: 's3', duration_seconds: 30, sequence_number: 3 },
    ];
    const result = DurationAdaptationService.planDurationAdaptation({
      scenes,
      profile: tiktokProfile,
    });

    assert.equal(result.totalDurationMs, 60000);
    assert.equal(result.totalDurationSeconds, 60);
    assert.equal(result.sceneModifications[0].strategy, DURATION_STRATEGIES.COMPRESS_SCENE);
    assert.ok(result.sceneModifications[0].adaptedDurationMs < 20000);
    assert.ok(result.sceneModifications[0].trimEndMs > 0);
  });

  await t.test('should scale up scene durations if below platform minimum', () => {
    const shortProfile = {
      ...tiktokProfile,
      minDurationSeconds: 10,
    };
    const scenes = [
      { id: 's1', duration_seconds: 2, sequence_number: 1 },
      { id: 's2', duration_seconds: 2, sequence_number: 2 },
    ];
    const result = DurationAdaptationService.planDurationAdaptation({
      scenes,
      profile: shortProfile,
    });

    assert.equal(result.totalDurationMs, 10000);
    assert.equal(result.totalDurationSeconds, 10);
    assert.ok(result.sceneModifications[0].adaptedDurationMs >= 2000);
  });
});
