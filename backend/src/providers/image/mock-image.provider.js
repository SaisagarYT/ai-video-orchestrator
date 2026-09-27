import { ImageProvider } from './image.provider.js';

export class MockImageProvider extends ImageProvider {
  constructor(options = {}) {
    super('mock-image', options);
  }

  async generateImage(request) {
    const startTime = Date.now();
    const aspectRatio = request.aspectRatio || '9:16';
    const seed = request.seed || Math.floor(Math.random() * 100000);

    return {
      url: `https://images.mock-cdn.local/generated/img-${seed}-${aspectRatio.replace(':', 'x')}.png`,
      provider: 'mock-image',
      mimeType: 'image/png',
      aspectRatio,
      seed,
      latencyMs: Math.max(1, Date.now() - startTime),
    };
  }
}

export default MockImageProvider;
