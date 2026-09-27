import { AudioProvider } from './audio.provider.js';

export class MockAudioProvider extends AudioProvider {
  constructor(options = {}) {
    super('mock-audio', options);
  }

  async generateSpeech(request) {
    const startTime = Date.now();
    const wordCount = (request.text || '').split(/\s+/).filter(Boolean).length;
    const durationSeconds = Math.max(1, Math.round((wordCount / 2.5) * 10) / 10);
    const durationMs = Math.round(durationSeconds * 1000);

    return {
      provider: 'mock-audio',
      asset: {
        url: `https://audio.mock-cdn.local/speech/narration-${Date.now()}.mp3`,
        buffer: Buffer.from('mock-audio-mp3-binary-data'),
        mimeType: 'audio/mpeg',
      },
      durationMs,
      durationSeconds,
      metadata: {
        voiceId: request.voiceId || 'mock-narrator-1',
        model: request.model || 'mock-tts-v1',
        latencyMs: Math.max(1, Date.now() - startTime),
        ...(request.metadata || {}),
      },
    };
  }
}

export default MockAudioProvider;
