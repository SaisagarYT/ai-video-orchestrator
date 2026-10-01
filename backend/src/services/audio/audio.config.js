import { z } from 'zod';
import { DEFAULT_AUDIO_CONFIG } from './audio.types.js';
import { ValidationError } from '../../core/errors/AppError.js';

export const audioMasteringConfigSchema = z.object({
  targetLufs: z
    .number()
    .min(-30.0, 'targetLufs too low')
    .max(-6.0, 'targetLufs too high')
    .default(DEFAULT_AUDIO_CONFIG.targetLufs),
  truePeak: z
    .number()
    .min(-6.0, 'truePeak too low')
    .max(0.0, 'truePeak cannot exceed 0 dBTP to avoid clipping')
    .default(DEFAULT_AUDIO_CONFIG.truePeak),
  sampleRate: z
    .number()
    .refine((v) => [44100, 48000, 96000].includes(v), {
      message: 'sampleRate must be standard: 44100, 48000, or 96000 Hz',
    })
    .default(DEFAULT_AUDIO_CONFIG.sampleRate),
  channels: z
    .number()
    .refine((v) => [1, 2].includes(v), {
      message: 'channels must be 1 (mono) or 2 (stereo)',
    })
    .default(DEFAULT_AUDIO_CONFIG.channels),
  codec: z.string().default(DEFAULT_AUDIO_CONFIG.codec),
  bitrate: z.string().default(DEFAULT_AUDIO_CONFIG.bitrate),
});

/**
 * Validates audio mastering configuration against canonical schema.
 *
 * @param {object} config
 * @returns {import('./audio.types.js').AudioMasteringConfig}
 */
export function validateAudioMasteringConfig(config = {}) {
  const result = audioMasteringConfigSchema.safeParse(config);
  if (!result.success) {
    const errorDetails = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(`Audio mastering configuration validation failed: ${errorDetails}`, {
      errors: result.error.errors,
    });
  }
  return result.data;
}
