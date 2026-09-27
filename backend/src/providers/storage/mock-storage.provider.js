import { StorageProvider } from './storage.provider.js';
import crypto from 'node:crypto';

export class MockStorageProvider extends StorageProvider {
  constructor(options = {}) {
    super('mock-storage', options);
    this.assets = new Map();
  }

  async uploadAsset(request) {
    const assetId = request.publicId || `mock-asset-${crypto.randomUUID()}`;
    const resourceType = request.resourceType || 'video';
    const folder = request.folder || 'ai-video-orchestrator';
    const ext = resourceType === 'audio' ? 'mp3' : resourceType === 'image' ? 'png' : 'mp4';
    const mockUrl = `https://res.cloudinary.com/mock-cloud/${resourceType}/upload/v1234567890/${folder}/${assetId}.${ext}`;

    const record = {
      provider: 'mock-storage',
      assetId,
      url: mockUrl,
      secureUrl: mockUrl,
      resourceType,
      format: ext,
      bytes: 1048576,
      width: resourceType === 'video' || resourceType === 'image' ? 1080 : undefined,
      height: resourceType === 'video' || resourceType === 'image' ? 1920 : undefined,
      duration: resourceType === 'video' || resourceType === 'audio' ? 5 : undefined,
      metadata: request.metadata || {},
    };

    this.assets.set(assetId, record);
    return record;
  }

  async getAsset(assetId) {
    const asset = this.assets.get(assetId);
    if (!asset) {
      return {
        provider: 'mock-storage',
        assetId,
        url: `https://res.cloudinary.com/mock-cloud/video/upload/v1234567890/ai-video-orchestrator/${assetId}.mp4`,
        secureUrl: `https://res.cloudinary.com/mock-cloud/video/upload/v1234567890/ai-video-orchestrator/${assetId}.mp4`,
        resourceType: 'video',
        format: 'mp4',
        bytes: 1048576,
      };
    }
    return asset;
  }

  async deleteAsset(assetId) {
    this.assets.delete(assetId);
    return { provider: 'mock-storage', assetId, deleted: true };
  }
}

export default MockStorageProvider;
