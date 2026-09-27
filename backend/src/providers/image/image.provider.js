import { ProviderError } from '../core/provider.errors.js';

export class ImageProvider {
  constructor(name, options = {}) {
    if (!name) throw new Error('Provider name is required');
    this.name = name;
    this.options = options;
  }

  async generateImage(request) {
    throw new ProviderError(`Method generateImage() not implemented on ${this.name} ImageProvider`);
  }
}

export default ImageProvider;
