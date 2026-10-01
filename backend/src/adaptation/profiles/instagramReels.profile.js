import { ADAPTATION_PLATFORMS, CROP_STRATEGIES } from '../constants.js';

export const instagramReelsProfile = {
  platform: ADAPTATION_PLATFORMS.INSTAGRAM_REELS,
  placement: 'reels',
  version: 'v1',
  aspectRatio: '9:16',
  width: 1080,
  height: 1920,
  minDurationSeconds: 3,
  maxDurationSeconds: 90,
  recommendedDurationSeconds: 20,
  safeZone: {
    visual: { x: 0.05, y: 0.12, width: 0.80, height: 0.66 },
    text: { x: 0.10, y: 0.15, width: 0.75, height: 0.58 },
    subtitle: { x: 0.10, y: 0.52, width: 0.80, height: 0.20 },
    cta: { x: 0.15, y: 0.68, width: 0.70, height: 0.10 },
  },
  hookConstraints: {
    maxOpeningDurationSeconds: 3,
    visualHookTimingSeconds: 2.0,
    requireDynamicOpening: true,
  },
  cropStrategy: CROP_STRATEGIES.SUBJECT_AWARE_CROP,
  audioRequirements: {
    required: true,
    format: 'aac',
    maxLoudnessLUFS: -14,
  },
  metadata: {
    description: 'Instagram Reels vertical 9:16 format with margins for bottom audio pill and right icon strip',
    lastUpdated: '2026-10-01',
    tags: ['vertical', 'reels', 'aesthetic'],
  },
};
