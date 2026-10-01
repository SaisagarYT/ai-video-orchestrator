import { platformProfileSchema } from '../schemas.js';
import { AdaptationValidationError } from '../errors.js';
import { tiktokProfile } from './tiktok.profile.js';
import { instagramReelsProfile } from './instagramReels.profile.js';
import { youtubeShortsProfile } from './youtubeShorts.profile.js';
import { youtubeLandscapeProfile } from './youtubeLandscape.profile.js';
import { metaFeedProfile } from './metaFeed.profile.js';

export class PlatformProfileRegistry {
  constructor() {
    this.profiles = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    this.registerProfile(tiktokProfile);
    this.registerProfile(instagramReelsProfile);
    this.registerProfile(youtubeShortsProfile);
    this.registerProfile(youtubeLandscapeProfile);
    this.registerProfile(metaFeedProfile);
  }

  /**
   * Register a platform profile.
   * @param {import('../types.js').PlatformProfile} profile
   */
  registerProfile(profile) {
    const validated = platformProfileSchema.parse(profile);
    const key = `${validated.platform.toUpperCase()}:${validated.version.toLowerCase()}`;
    this.profiles.set(key, validated);
  }

  /**
   * Get a platform profile by platform enum and optional version.
   * @param {string} platform
   * @param {string} [version='v1']
   * @returns {import('../types.js').PlatformProfile}
   */
  getPlatformProfile(platform, version = 'v1') {
    if (!platform) {
      throw new AdaptationValidationError('Platform parameter is required');
    }
    const key = `${platform.toUpperCase()}:${version.toLowerCase()}`;
    const profile = this.profiles.get(key);
    if (!profile) {
      throw new AdaptationValidationError(`Unsupported platform or profile version: ${platform} (${version})`);
    }
    return profile;
  }

  /**
   * Check if a profile exists.
   * @param {string} platform
   * @param {string} [version='v1']
   * @returns {boolean}
   */
  hasProfile(platform, version = 'v1') {
    if (!platform) return false;
    const key = `${platform.toUpperCase()}:${version.toLowerCase()}`;
    return this.profiles.has(key);
  }

  /**
   * Get all registered platform profiles.
   * @returns {Array<import('../types.js').PlatformProfile>}
   */
  getAllPlatformProfiles() {
    return Array.from(this.profiles.values());
  }

  /**
   * Reset registry to defaults.
   */
  reset() {
    this.profiles.clear();
    this.registerDefaults();
  }
}

export const platformProfileRegistry = new PlatformProfileRegistry();
