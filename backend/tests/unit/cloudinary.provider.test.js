import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { CloudinaryStorageProvider } from '../../src/providers/storage/cloudinary.provider.js';
import {
  ProviderAuthenticationError,
  ProviderBadRequestError,
  ProviderUnavailableError,
} from '../../src/providers/core/provider.errors.js';

describe('CloudinaryStorageProvider Unit Tests', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should throw ProviderAuthenticationError when credentials are incomplete', async () => {
    const provider = new CloudinaryStorageProvider({
      cloudName: '',
      apiKey: 'key',
      apiSecret: 'secret',
    });

    await assert.rejects(
      async () => {
        await provider.uploadAsset({ source: 'https://example.com/video.mp4' });
      },
      (err) => {
        assert.ok(err instanceof ProviderAuthenticationError);
        assert.match(err.message, /Cloudinary credentials incomplete/);
        return true;
      }
    );
  });

  it('should prevent SSRF by blocking internal and private IP targets', async () => {
    const provider = new CloudinaryStorageProvider({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
    });

    const maliciousUrls = [
      'http://localhost:8080/internal-data',
      'http://127.0.0.1:5432/db',
      'http://169.254.169.254/latest/meta-data',
      'http://10.0.0.1/admin',
      'http://192.168.1.1/router',
      'ftp://files.internal/secret.mp4',
    ];

    for (const url of maliciousUrls) {
      await assert.rejects(
        async () => {
          await provider.uploadAsset({ source: url });
        },
        (err) => {
          assert.ok(err instanceof ProviderBadRequestError);
          return true;
        }
      );
    }
  });

  it('should upload buffer and return normalized storage response', async () => {
    const buffer = Buffer.from('fake-video-content-bytes');
    let capturedUrl = null;
    let capturedBody = null;

    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedBody = new URLSearchParams(options.body);

      return {
        ok: true,
        status: 200,
        json: async () => ({
          public_id: 'campaigns/camp-1/scene_1',
          url: 'http://res.cloudinary.com/test-cloud/video/upload/v1/campaigns/camp-1/scene_1.mp4',
          secure_url: 'https://res.cloudinary.com/test-cloud/video/upload/v1/campaigns/camp-1/scene_1.mp4',
          resource_type: 'video',
          format: 'mp4',
          bytes: 20480,
          width: 1080,
          height: 1920,
          duration: 5.0,
        }),
      };
    };

    const provider = new CloudinaryStorageProvider({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
    });

    const result = await provider.uploadAsset({
      source: buffer,
      resourceType: 'video',
      folder: 'campaigns/camp-1',
      publicId: 'scene_1',
    });

    assert.equal(result.provider, 'cloudinary');
    assert.equal(result.assetId, 'campaigns/camp-1/scene_1');
    assert.equal(result.format, 'mp4');
    assert.equal(result.width, 1080);
    assert.equal(result.height, 1920);
    assert.equal(result.duration, 5.0);
    assert.ok(result.secureUrl.startsWith('https://res.cloudinary.com/test-cloud'));

    assert.ok(capturedUrl.includes('/v1_1/test-cloud/video/upload'));
    assert.ok(capturedBody.get('signature'));
    assert.equal(capturedBody.get('api_key'), 'test-key');
  });

  it('should upload remote URL to Cloudinary successfully', async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        public_id: 'campaigns/camp-1/audio_1',
        url: 'http://res.cloudinary.com/test-cloud/raw/upload/v1/audio_1.mp3',
        secure_url: 'https://res.cloudinary.com/test-cloud/raw/upload/v1/audio_1.mp3',
        resource_type: 'raw',
        format: 'mp3',
        bytes: 12000,
      }),
    });

    const provider = new CloudinaryStorageProvider({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
    });

    const result = await provider.uploadAsset({
      source: 'https://cdn.example.com/generated-narration.mp3',
      resourceType: 'raw',
      folder: 'campaigns/camp-1',
    });

    assert.equal(result.provider, 'cloudinary');
    assert.equal(result.assetId, 'campaigns/camp-1/audio_1');
    assert.equal(result.secureUrl, 'https://res.cloudinary.com/test-cloud/raw/upload/v1/audio_1.mp3');
  });

  it('should throw ProviderUnavailableError on HTTP 500 error from Cloudinary', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Cloudinary upload service degraded',
    });

    const provider = new CloudinaryStorageProvider({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
    });

    await assert.rejects(
      async () => {
        await provider.uploadAsset({
          source: 'https://cdn.example.com/test-video.mp4',
        });
      },
      (err) => {
        assert.ok(err instanceof ProviderUnavailableError);
        assert.equal(err.statusCode, 503);
        return true;
      }
    );
  });
});
