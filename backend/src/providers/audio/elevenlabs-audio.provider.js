import { AudioProvider } from './audio.provider.js';
import {
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  ProviderBadRequestError,
  ProviderUnavailableError,
  ProviderError,
} from '../core/provider.errors.js';
import { logger } from '../../core/logger/logger.js';

export class ElevenLabsAudioProvider extends AudioProvider {
  /**
   * @param {Object} [options]
   * @param {string} [options.apiKey]
   * @param {string} [options.defaultVoiceId]
   * @param {string} [options.defaultModel]
   * @param {string} [options.baseUrl]
   * @param {number} [options.timeoutMs]
   */
  constructor(options = {}) {
    super('elevenlabs', options);
    this.apiKey = options.apiKey || process.env.ELEVENLABS_API_KEY;
    this.defaultVoiceId = options.defaultVoiceId || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    this.defaultModel = options.defaultModel || process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
    this.baseUrl = (options.baseUrl || 'https://api.elevenlabs.io/v1').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs || parseInt(process.env.AI_AUDIO_TIMEOUT_MS || '60000', 10);
  }

  async generateSpeech(request) {
    if (!this.apiKey) {
      throw new ProviderAuthenticationError('ElevenLabs API key is missing. Set ELEVENLABS_API_KEY environment variable.');
    }

    if (!request.text || typeof request.text !== 'string' || !request.text.trim()) {
      throw new ProviderBadRequestError('Narration text must be a non-empty string');
    }

    const startTime = Date.now();
    const voiceId = request.voiceId || this.defaultVoiceId;
    const model = request.model || this.defaultModel;
    const url = `${this.baseUrl}/text-to-speech/${voiceId}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const payload = {
      text: request.text.trim(),
      model_id: model,
      voice_settings: request.voiceSettings || {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    };

    logger.debug(`[ElevenLabsAudio] Generating speech for voice: ${voiceId}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let errJson = null;
        try {
          errJson = JSON.parse(errText);
        } catch (_) {}

        const message = errJson?.detail?.message || errJson?.message || errText || `HTTP ${response.status}`;

        if (response.status === 401 || response.status === 403) {
          throw new ProviderAuthenticationError(`ElevenLabs authentication error: ${message}`, {
            provider: 'elevenlabs',
            statusCode: response.status,
          });
        }
        if (response.status === 429) {
          throw new ProviderRateLimitError(`ElevenLabs rate limit exceeded: ${message}`, {
            provider: 'elevenlabs',
            statusCode: 429,
          });
        }
        if (response.status === 400) {
          throw new ProviderBadRequestError(`ElevenLabs bad request: ${message}`, {
            provider: 'elevenlabs',
            statusCode: 400,
          });
        }
        if (response.status >= 500) {
          throw new ProviderUnavailableError(`ElevenLabs service unavailable: ${message}`, {
            provider: 'elevenlabs',
            statusCode: response.status,
          });
        }

        throw new ProviderError(`ElevenLabs speech generation failed: ${message}`, response.status, 'PROVIDER_ERROR', {
          provider: 'elevenlabs',
          statusCode: response.status,
        });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Estimate duration based on word count / average speech rate (150 words/min = 2.5 words/sec)
      const wordCount = request.text.trim().split(/\s+/).length;
      const durationSeconds = Math.max(1, Math.round((wordCount / 2.5) * 10) / 10);
      const durationMs = Math.round(durationSeconds * 1000);

      return {
        provider: 'elevenlabs',
        asset: {
          buffer,
          mimeType: 'audio/mpeg',
          sizeBytes: buffer.length,
        },
        durationMs,
        durationSeconds,
        metadata: {
          voiceId,
          model,
          latencyMs: Date.now() - startTime,
          ...(request.metadata || {}),
        },
      };
    } catch (err) {
      clearTimeout(timer);

      if (err.name === 'AbortError' || err.code === 'ABORT_ERR') {
        throw new ProviderTimeoutError(`ElevenLabs speech generation timed out after ${this.timeoutMs}ms`, {
          provider: 'elevenlabs',
          timeoutMs: this.timeoutMs,
        });
      }

      if (err instanceof ProviderError) throw err;

      throw new ProviderError(`ElevenLabs error: ${err.message}`, 500, 'PROVIDER_ERROR', {
        provider: 'elevenlabs',
        cause: err.message,
      });
    }
  }
}

export default ElevenLabsAudioProvider;
