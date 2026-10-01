import { validateAudioMasteringConfig } from './audio.config.js';
import { logger } from '../../core/logger/logger.js';
import { recordWorkflowEvent, WORKFLOW_EVENT_TYPES } from '../../orchestration/events.js';
import { config as appConfig } from '../../config/env.js';

export class AudioMasteringService {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Construct safe, deterministic FFmpeg audio filter string for loudness normalization.
   *
   * @param {object} [customConfig]
   * @returns {string}
   */
  buildAudioFilterString(customConfig = {}) {
    const validated = validateAudioMasteringConfig({
      targetLufs: customConfig.targetLufs ?? appConfig.audioMastering?.targetLufs,
      truePeak: customConfig.truePeak ?? appConfig.audioMastering?.truePeak,
      sampleRate: customConfig.sampleRate ?? appConfig.audioMastering?.sampleRate,
      channels: customConfig.channels ?? appConfig.audioMastering?.channels,
      codec: customConfig.codec ?? appConfig.audioMastering?.codec,
      bitrate: customConfig.bitrate ?? appConfig.audioMastering?.bitrate,
    });

    // FFmpeg loudnorm filter implements EBU R128 / ITU-R BS.1770-4 normalization
    return `loudnorm=I=${validated.targetLufs}:TP=${validated.truePeak}:LRA=11:print_format=none`;
  }

  /**
   * Process and validate audio mastering parameters for a rendering execution.
   *
   * @param {object} params
   * @param {string} params.campaignId
   * @param {string} [params.executionId]
   * @param {string} [params.stepId]
   * @param {object} [params.audioTrack] - Audio track from Timeline IR
   * @param {object} [params.options]
   * @returns {Promise<import('./audio.types.js').AudioMasteringResult>}
   */
  async processAudioMastering({
    campaignId,
    executionId = null,
    stepId = null,
    audioTrack = null,
    options = {},
  }) {
    const validatedConfig = validateAudioMasteringConfig(options);
    const filterString = this.buildAudioFilterString(validatedConfig);

    const hasAudioClips = Boolean(audioTrack && Array.isArray(audioTrack.items) && audioTrack.items.length > 0);

    const result = {
      status: hasAudioClips ? 'COMPLETED' : 'SKIPPED',
      targetLufs: validatedConfig.targetLufs,
      truePeak: validatedConfig.truePeak,
      sampleRate: validatedConfig.sampleRate,
      channels: validatedConfig.channels,
      codec: validatedConfig.codec,
      bitrate: validatedConfig.bitrate,
      filterString,
      metadata: {
        hasAudioClips,
        clipCount: audioTrack?.items?.length || 0,
        masteredAt: new Date().toISOString(),
        engine: 'FFmpegLoudnormMasterer',
      },
    };

    if (executionId && hasAudioClips) {
      await recordWorkflowEvent({
        executionId,
        campaignId,
        stepId,
        eventType: WORKFLOW_EVENT_TYPES.AUDIO_MASTERED,
        payload: {
          targetLufs: validatedConfig.targetLufs,
          truePeak: validatedConfig.truePeak,
          sampleRate: validatedConfig.sampleRate,
          channels: validatedConfig.channels,
          clipCount: audioTrack.items.length,
        },
      });
    }

    logger.info(
      `[AudioMasteringService] Mastered audio parameters for campaign ${campaignId} (${validatedConfig.targetLufs} LUFS, ${validatedConfig.sampleRate}Hz)`
    );

    return result;
  }
}

export const audioMasteringService = new AudioMasteringService();
