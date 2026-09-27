import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ElevenLabsAudioProvider } from '../../src/providers/audio/elevenlabs-audio.provider.js';
import {
  ProviderAuthenticationError,
  ProviderBadRequestError,
  ProviderRateLimitError,
  ProviderUnavailableError,
} from '../../src/providers/core/provider.errors.js';

describe('ElevenLabsAudioProvider Unit Tests', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should throw ProviderAuthenticationError when API key is missing', async () => {
    const provider = new ElevenLabsAudioProvider({ apiKey: '' });
    await assert.rejects(
      async () => {
        await provider.generateSpeech({ text: 'Welcome to the future of fitness' });
      },
      (err) => {
        assert.ok(err instanceof ProviderAuthenticationError);
        assert.match(err.message, /ElevenLabs API key is missing/);
        return true;
      }
    );
  });

  it('should throw ProviderBadRequestError when text is empty or invalid', async () => {
    const provider = new ElevenLabsAudioProvider({ apiKey: 'valid-test-key' });
    await assert.rejects(
      async () => {
        await provider.generateSpeech({ text: '   ' });
      },
      (err) => {
        assert.ok(err instanceof ProviderBadRequestError);
        assert.match(err.message, /Narration text must be a non-empty string/);
        return true;
      }
    );
  });

  it('should generate speech and return audio buffer and metadata', async () => {
    const mockAudioBytes = Buffer.from('fake-mp3-audio-bytes-for-testing');
    let capturedUrl = null;
    let capturedHeaders = null;
    let capturedBody = null;

    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedHeaders = options.headers;
      capturedBody = JSON.parse(options.body);

      return {
        ok: true,
        status: 200,
        headers: {
          get: (name) => (name.toLowerCase() === 'content-type' ? 'audio/mpeg' : null),
        },
        arrayBuffer: async () => mockAudioBytes.buffer,
      };
    };

    const provider = new ElevenLabsAudioProvider({
      apiKey: 'secret-eleven-key',
      defaultVoiceId: 'voice-adam-123',
      defaultModel: 'eleven_turbo_v2_5',
    });

    const result = await provider.generateSpeech({
      text: 'Experience the next generation of sound engineering.',
      voiceId: 'voice-sarah-456',
    });

    assert.equal(result.provider, 'elevenlabs');
    assert.ok(result.asset.buffer);
    assert.equal(result.asset.mimeType, 'audio/mpeg');
    assert.ok(result.durationMs > 0);
    assert.equal(result.metadata.voiceId, 'voice-sarah-456');

    assert.ok(capturedUrl.includes('/text-to-speech/voice-sarah-456'));
    assert.equal(capturedHeaders['xi-api-key'], 'secret-eleven-key');
    assert.equal(capturedBody.text, 'Experience the next generation of sound engineering.');
  });

  it('should throw ProviderRateLimitError on HTTP 429 and not leak secret key', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => JSON.stringify({ detail: { message: 'Quota exceeded for user' } }),
    });

    const secretKey = 'super-secret-production-key-999';
    const provider = new ElevenLabsAudioProvider({ apiKey: secretKey });

    await assert.rejects(
      async () => {
        await provider.generateSpeech({ text: 'Test narration text' });
      },
      (err) => {
        assert.ok(err instanceof ProviderRateLimitError);
        assert.equal(err.statusCode, 429);
        assert.equal(err.message.includes(secretKey), false);
        return true;
      }
    );
  });

  it('should throw ProviderUnavailableError on HTTP 500 error', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Speech synthesis cluster unavailable',
    });

    const provider = new ElevenLabsAudioProvider({ apiKey: 'test-key' });

    await assert.rejects(
      async () => {
        await provider.generateSpeech({ text: 'Test narration text' });
      },
      (err) => {
        assert.ok(err instanceof ProviderUnavailableError);
        assert.equal(err.statusCode, 503);
        return true;
      }
    );
  });
});
