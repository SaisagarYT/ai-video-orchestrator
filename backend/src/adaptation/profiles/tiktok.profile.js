import { ADAPTATION_PLATFORMS, CROP_STRATEGIES } from '../constants.js';

export const tiktokProfile = {
  platform: ADAPTATION_PLATFORMS.TIKTOK,
  placement: 'feed',
  version: 'v1',
  aspectRatio: '9:16',
  width: 1080,
  height: 1920,
  minDurationSeconds: 3,
  maxDurationSeconds: 60,
  recommendedDurationSeconds: 15,
  safeZone: {
    visual: { x: 0.05, y: 0.10, width: 0.80, height: 0.70 },
    text: { x: 0.10, y: 0.15, width: 0.75, height: 0.60 },
    subtitle: { x: 0.10, y: 0.55, width: 0.80, height: 0.20 },
    cta: { x: 0.15, y: 0.70, width: 0.70, height: 0.10 },
  },
  hookConstraints: {
    maxOpeningDurationSeconds: 3,
    visualHookTimingSeconds: 1.5,
    requireDynamicOpening: true,
  },
  cropStrategy: CROP_STRATEGIES.SUBJECT_AWARE_CROP,
  audioRequirements: {
    required: true,
    format: 'aac',
    maxLoudnessLUFS: -14,
  },
  metadata: {
    description: 'TikTok standard vertical 9:16 full-screen video with safety margin for interaction buttons and description',
    lastUpdated: '2026-10-01',
    tags: ['vertical', 'short_form', 'high_pacing'],
  },
};
