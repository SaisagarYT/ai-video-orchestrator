import { PROVIDER_TYPES } from './provider.types.js';
import { ProviderError } from './provider.errors.js';
import { logger } from '../../core/logger/logger.js';

export class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.defaults = new Map();

    for (const type of Object.values(PROVIDER_TYPES)) {
      this.providers.set(type, new Map());
    }
  }

  register(type, name, providerInstance, { isDefault = false } = {}) {
    const validTypes = Object.values(PROVIDER_TYPES);
    if (!validTypes.includes(type)) {
      throw new ProviderError(`Invalid provider type '${type}'. Must be one of: ${validTypes.join(', ')}`);
    }

    if (!name || typeof name !== 'string') {
      throw new ProviderError('Provider name must be a non-empty string');
    }

    if (!providerInstance) {
      throw new ProviderError(`Cannot register null or undefined provider for ${type}:${name}`);
    }

    const typeMap = this.providers.get(type);
    typeMap.set(name.toLowerCase(), providerInstance);

    if (isDefault || !this.defaults.has(type)) {
      this.defaults.set(type, name.toLowerCase());
    }

    logger.debug(`[ProviderRegistry] Registered ${type} provider: '${name.toLowerCase()}' (default: ${this.defaults.get(type) === name.toLowerCase()})`);
    return this;
  }

  setDefault(type, name) {
    const typeMap = this.providers.get(type);
    if (!typeMap || !typeMap.has(name.toLowerCase())) {
      throw new ProviderError(`Cannot set default for ${type}: provider '${name}' is not registered`);
    }
    this.defaults.set(type, name.toLowerCase());
    return this;
  }

  get(type, name) {
    const typeMap = this.providers.get(type);
    if (!typeMap) {
      throw new ProviderError(`Unknown provider type '${type}'`);
    }

    const targetName = (name || this.defaults.get(type) || '').toLowerCase();
    if (!targetName) {
      throw new ProviderError(`No default provider configured for type '${type}'`);
    }

    const provider = typeMap.get(targetName);
    if (!provider) {
      throw new ProviderError(
        `Provider '${targetName}' not found for type '${type}'. Registered: [${Array.from(typeMap.keys()).join(', ')}]`
      );
    }

    return provider;
  }

  getLLM(name) {
    return this.get(PROVIDER_TYPES.LLM, name);
  }

  getImage(name) {
    return this.get(PROVIDER_TYPES.IMAGE, name);
  }

  getVideo(name) {
    return this.get(PROVIDER_TYPES.VIDEO, name);
  }

  getAudio(name) {
    return this.get(PROVIDER_TYPES.AUDIO, name);
  }

  getStorage(name) {
    return this.get(PROVIDER_TYPES.STORAGE, name);
  }

  getVision(name) {
    return this.get(PROVIDER_TYPES.VISION, name);
  }

  has(type, name) {
    const typeMap = this.providers.get(type);
    return Boolean(typeMap && typeMap.has(name.toLowerCase()));
  }

  list(type) {
    if (type) {
      const typeMap = this.providers.get(type);
      return typeMap ? Array.from(typeMap.keys()) : [];
    }
    const result = {};
    for (const [t, map] of this.providers.entries()) {
      result[t] = {
        default: this.defaults.get(t) || null,
        providers: Array.from(map.keys()),
      };
    }
    return result;
  }

  reset() {
    for (const map of this.providers.values()) {
      map.clear();
    }
    this.defaults.clear();
  }
}

export const providerRegistry = new ProviderRegistry();
export default providerRegistry;
