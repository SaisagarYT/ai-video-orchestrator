/**
 * Audio Mastering Types & Specifications
 *
 * @typedef {object} AudioMasteringConfig
 * @property {number} targetLufs - Target integrated loudness in LUFS (e.g. -16.0)
 * @property {number} truePeak - Maximum true peak in dBTP (e.g. -1.5)
 * @property {number} sampleRate - Audio sample rate in Hz (e.g. 48000)
 * @property {number} channels - Number of audio channels (e.g. 2 for stereo)
 * @property {string} codec - Target audio codec (e.g. 'aac')
 * @property {string} bitrate - Target audio bitrate (e.g. '192k')
 *
 * @typedef {object} AudioMasteringResult
 * @property {'COMPLETED' | 'SKIPPED' | 'FAILED'} status
 * @property {number} targetLufs
 * @property {number} truePeak
 * @property {number} sampleRate
 * @property {number} channels
 * @property {string} codec
 * @property {string} bitrate
 * @property {string} filterString - Constructed FFmpeg audio filter
 * @property {object} metadata
 */

export const DEFAULT_AUDIO_CONFIG = {
  targetLufs: -16.0,
  truePeak: -1.5,
  sampleRate: 48000,
  channels: 2,
  codec: 'aac',
  bitrate: '192k',
};
