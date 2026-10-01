import { ADAPTATION_PLATFORMS, CROP_STRATEGIES } from '../constants.js';

export const youtubeShortsProfile = {
  platform: ADAPTATION_PLATFORMS.YOUTUBE_SHORTS,
  placement: 'shorts',
  version: 'v1',
  aspectRatio: '9:16',
  width: 1080,
  height: 1920,
  minDurationSeconds: 3,
  maxDurationSeconds: 60,
  recommendedDurationSeconds: 30,
  safeZone: {
    visual: { x: 0.05, y: 0.10, width: 0.80, height: 0.72 },
    text: { x: 0.10, y: 0.15, width: 0.75, height: 0.62 },
    subtitle: { x: 0.10, y: 0.54, width: 0.80, height: 0.20 },
    cta: { x: 0.15, y: 0.72, width: 0.70, height: 0.10 },
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
    description: 'YouTube Shorts vertical 9:16 format with safety zones for bottom channel badge and right thumbs up/share',
    lastUpdated: '2026-10-01',
    tags: ['vertical', 'shorts', 'youtube'],
  },
};
