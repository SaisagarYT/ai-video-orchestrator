import { ADAPTATION_PLATFORMS, CROP_STRATEGIES } from '../constants.js';

export const youtubeLandscapeProfile = {
  platform: ADAPTATION_PLATFORMS.YOUTUBE_LANDSCAPE,
  placement: 'in_stream',
  version: 'v1',
  aspectRatio: '16:9',
  width: 1920,
  height: 1080,
  minDurationSeconds: 5,
  maxDurationSeconds: 300,
  recommendedDurationSeconds: 60,
  safeZone: {
    visual: { x: 0.05, y: 0.05, width: 0.90, height: 0.85 },
    text: { x: 0.08, y: 0.08, width: 0.84, height: 0.78 },
    subtitle: { x: 0.15, y: 0.75, width: 0.70, height: 0.12 },
    cta: { x: 0.65, y: 0.70, width: 0.28, height: 0.14 },
  },
  hookConstraints: {
    maxOpeningDurationSeconds: 5,
    visualHookTimingSeconds: 3.0,
    requireDynamicOpening: false,
  },
  cropStrategy: CROP_STRATEGIES.CENTER_CROP,
  audioRequirements: {
    required: true,
    format: 'aac',
    maxLoudnessLUFS: -14,
  },
  metadata: {
    description: 'YouTube Landscape 16:9 standard cinematic commercial format with standard lower-third subtitle safety',
    lastUpdated: '2026-10-01',
    tags: ['landscape', 'cinematic', 'youtube_in_stream'],
  },
};
