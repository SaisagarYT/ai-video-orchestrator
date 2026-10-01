import { ADAPTATION_PLATFORMS, CROP_STRATEGIES } from '../constants.js';

export const metaFeedProfile = {
  platform: ADAPTATION_PLATFORMS.META_FEED,
  placement: 'feed',
  version: 'v1',
  aspectRatio: '1:1',
  width: 1080,
  height: 1080,
  minDurationSeconds: 3,
  maxDurationSeconds: 120,
  recommendedDurationSeconds: 30,
  safeZone: {
    visual: { x: 0.05, y: 0.08, width: 0.90, height: 0.80 },
    text: { x: 0.08, y: 0.10, width: 0.84, height: 0.75 },
    subtitle: { x: 0.10, y: 0.70, width: 0.80, height: 0.15 },
    cta: { x: 0.15, y: 0.78, width: 0.70, height: 0.10 },
  },
  hookConstraints: {
    maxOpeningDurationSeconds: 3,
    visualHookTimingSeconds: 2.0,
    requireDynamicOpening: true,
  },
  cropStrategy: CROP_STRATEGIES.CENTER_CROP,
  audioRequirements: {
    required: true,
    format: 'aac',
    maxLoudnessLUFS: -14,
  },
  metadata: {
    description: 'Meta Instagram and Facebook Feed square 1:1 format optimized for scroll-stopping feed autoplay',
    lastUpdated: '2026-10-01',
    tags: ['square', 'feed', 'meta', 'instagram', 'facebook'],
  },
};
