import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  platformProfileRegistry,
  tiktokProfile,
  instagramReelsProfile,
  youtubeShortsProfile,
  youtubeLandscapeProfile,
  metaFeedProfile,
} from '../../src/adaptation/profiles/index.js';
import { platformProfileSchema } from '../../src/adaptation/schemas.js';
import { ADAPTATION_PLATFORMS } from '../../src/adaptation/constants.js';

describe('Platform Profiles & Registry Unit Tests', () => {
  it('should validate all standard profiles against platformProfileSchema', () => {
    const profiles = [
      tiktokProfile,
      instagramReelsProfile,
      youtubeShortsProfile,
      youtubeLandscapeProfile,
      metaFeedProfile,
    ];

    for (const p of profiles) {
      const parsed = platformProfileSchema.parse(p);
      assert.ok(parsed.platform);
      assert.ok(parsed.aspectRatio);
      assert.ok(parsed.safeZone.visual);
      assert.ok(parsed.safeZone.text);
      assert.ok(parsed.safeZone.subtitle);
      assert.ok(parsed.safeZone.cta);
      assert.ok(parsed.hookConstraints);
    }
  });

  it('should retrieve all 5 platform profiles from platformProfileRegistry', () => {
    const all = platformProfileRegistry.getAllPlatformProfiles();
    assert.equal(all.length, 5);

    const tiktok = platformProfileRegistry.getPlatformProfile(ADAPTATION_PLATFORMS.TIKTOK, 'v1');
    assert.equal(tiktok.platform, 'TIKTOK');
    assert.equal(tiktok.aspectRatio, '9:16');
    assert.equal(tiktok.width, 1080);
    assert.equal(tiktok.height, 1920);

    const ytLandscape = platformProfileRegistry.getPlatformProfile(ADAPTATION_PLATFORMS.YOUTUBE_LANDSCAPE);
    assert.equal(ytLandscape.platform, 'YOUTUBE_LANDSCAPE');
    assert.equal(ytLandscape.aspectRatio, '16:9');
    assert.equal(ytLandscape.width, 1920);
    assert.equal(ytLandscape.height, 1080);

    const metaFeed = platformProfileRegistry.getPlatformProfile(ADAPTATION_PLATFORMS.META_FEED);
    assert.equal(metaFeed.platform, 'META_FEED');
    assert.equal(metaFeed.aspectRatio, '1:1');
    assert.equal(metaFeed.width, 1080);
    assert.equal(metaFeed.height, 1080);
  });

  it('should reject unknown platform with AdaptationValidationError', () => {
    assert.throws(() => {
      platformProfileRegistry.getPlatformProfile('UNKNOWN_PLATFORM_XYZ');
    }, (err) => err.name === 'AdaptationValidationError');
  });

  it('should support checking profile existence via hasProfile', () => {
    assert.equal(platformProfileRegistry.hasProfile(ADAPTATION_PLATFORMS.TIKTOK), true);
    assert.equal(platformProfileRegistry.hasProfile(ADAPTATION_PLATFORMS.YOUTUBE_LANDSCAPE), true);
    assert.equal(platformProfileRegistry.hasProfile('NOT_A_PLATFORM'), false);
  });
});
