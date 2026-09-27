import { VisionProvider } from './vision.provider.js';

export class MockVisionProvider extends VisionProvider {
  constructor(options = {}) {
    super('mock-vision', options);
  }

  async analyzeImage(request) {
    const startTime = Date.now();
    return {
      description: 'High-contrast commercial product shot with crisp details, clean background bokeh, and cinematic studio lighting.',
      provider: 'mock-vision',
      latencyMs: Math.max(1, Date.now() - startTime),
    };
  }
}

export default MockVisionProvider;
