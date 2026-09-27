import { ProviderError } from '../core/provider.errors.js';

export class AudioProvider {
  constructor(name, options = {}) {
    if (!name) throw new Error('Provider name is required');
    this.name = name;
    this.options = options;
  }

  /**
   * Synthesize text speech into audio
   * @param {import('../core/provider.types.js').AudioRequest} request
   * @returns {Promise<import('../core/provider.types.js').AudioResponse>}
   */
  async generateSpeech(request) {
    throw new ProviderError(`Method generateSpeech() not implemented on ${this.name} AudioProvider`);
  }
}

export default AudioProvider;
