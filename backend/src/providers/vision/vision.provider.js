import { ProviderError } from '../core/provider.errors.js';

export class VisionProvider {
  constructor(name, options = {}) {
    if (!name) throw new Error('Provider name is required');
    this.name = name;
    this.options = options;
  }

  async analyzeImage(request) {
    throw new ProviderError(`Method analyzeImage() not implemented on ${this.name} VisionProvider`);
  }
}

export default VisionProvider;
