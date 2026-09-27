import { ProviderError } from '../core/provider.errors.js';

export class LLMProvider {
  constructor(name, options = {}) {
    if (!name) throw new Error('Provider name is required');
    this.name = name;
    this.options = options;
  }

  async complete(request) {
    throw new ProviderError(`Method complete() not implemented on ${this.name} LLMProvider`);
  }

  async generateStructured(request, schema) {
    throw new ProviderError(`Method generateStructured() not implemented on ${this.name} LLMProvider`);
  }
}

export default LLMProvider;
