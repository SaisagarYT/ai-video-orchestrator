/**
 * Subtitle Types & Domain Specifications
 *
 * @typedef {object} SubtitleCue
 * @property {number} startMs - Cue start timestamp in milliseconds
 * @property {number} endMs - Cue end timestamp in milliseconds
 * @property {string} text - Subtitle cue text content
 *
 * @typedef {object} SubtitleDocument
 * @property {'1.0'} version - Subtitle schema version
 * @property {string} language - ISO 639-1 language code (e.g. 'en')
 * @property {Array<SubtitleCue>} cues - Chronologically ordered subtitle cues
 */

export const SUBTITLE_VERSION = '1.0';

export const SUBTITLE_MODES = {
  NONE: 'none',
  SIDECAR: 'sidecar',
  BURNED: 'burned',
};

export const SUBTITLE_FORMATS = {
  SRT: 'srt',
  VTT: 'vtt',
};
