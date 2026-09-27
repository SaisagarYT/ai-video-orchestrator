import { ProviderError } from '../core/provider.errors.js';

export class StorageProvider {
  constructor(name, options = {}) {
    if (!name) throw new Error('Provider name is required');
    this.name = name;
    this.options = options;
  }

  /**
   * Upload media asset to storage CDN
   * @param {import('../core/provider.types.js').StorageUploadRequest} request
   * @returns {Promise<import('../core/provider.types.js').StorageUploadResponse>}
   */
  async uploadAsset(request) {
    throw new ProviderError(`Method uploadAsset() not implemented on ${this.name} StorageProvider`);
  }

  /**
   * Retrieve asset metadata by ID
   * @param {string} assetId
   */
  async getAsset(assetId) {
    throw new ProviderError(`Method getAsset() not implemented on ${this.name} StorageProvider`);
  }

  /**
   * Delete asset from storage
   * @param {string} assetId
   */
  async deleteAsset(assetId) {
    throw new ProviderError(`Method deleteAsset() not implemented on ${this.name} StorageProvider`);
  }
}

export default StorageProvider;
