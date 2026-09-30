/**
 * Timeline Domain Types & Constants
 * Provider-independent Intermediate Representation for Advertisement Videos
 */

export const TIMELINE_VERSION = '1.0';

export const TRACK_TYPES = {
  VIDEO: 'video',
  AUDIO: 'audio',
};

export const TRANSITION_TYPES = {
  CUT: 'cut',
  FADE: 'fade',
  DISSOLVE: 'dissolve',
};

export const SUPPORTED_ASPECT_RATIOS = {
  PORTRAIT: '9:16',
  LANDSCAPE: '16:9',
  SQUARE: '1:1',
};

export const ASPECT_RATIO_DIMENSIONS = {
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
};

export const DEFAULT_OUTPUT_CONFIG = {
  aspectRatio: '9:16',
  width: 1080,
  height: 1920,
  fps: 30,
  format: 'mp4',
  videoCodec: 'h264',
  audioCodec: 'aac',
};

export const TIMELINE_STATUS = {
  DRAFT: 'DRAFT',
  READY: 'READY',
  RENDERING: 'RENDERING',
  RENDERED: 'RENDERED',
  FAILED: 'FAILED',
};
