import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { FalVideoProvider } from '../../src/providers/video/fal-video.provider.js';
import {
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderBadRequestError,
} from '../../src/providers/core/provider.errors.js';
import { VIDEO_JOB_STATUS } from '../../src/providers/core/provider.types.js';

describe('FalVideoProvider Unit Tests', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should throw ProviderAuthenticationError when API key is missing', async () => {
    const provider = new FalVideoProvider({ apiKey: '' });
    await assert.rejects(
      async () => {
        await provider.createVideo({ prompt: 'A futuristic city street' });
      },
      (err) => {
        assert.ok(err instanceof ProviderAuthenticationError);
        assert.match(err.message, /Fal.ai API key is missing/);
        return true;
      }
    );
  });

  it('should submit video creation request and return QUEUED status', async () => {
    const mockResponse = {
      request_id: 'fal-req-12345',
      status: 'IN_QUEUE',
      status_url: 'https://queue.fal.run/status/12345',
      response_url: 'https://queue.fal.run/res/12345',
    };

    let capturedUrl = null;
    let capturedOptions = null;

    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        json: async () => mockResponse,
      };
    };

    const provider = new FalVideoProvider({
      apiKey: 'test-fal-key-abc',
      model: 'fal-ai/fast-svd',
    });

    const result = await provider.createVideo({
      prompt: 'A sleek electric sports car racing at night',
      negativePrompt: 'blurry, distorted',
      durationSeconds: 5,
      aspectRatio: '9:16',
      seed: 42,
    });

    assert.equal(result.provider, 'fal');
    assert.equal(result.providerJobId, 'fal-req-12345');
    assert.equal(result.status, VIDEO_JOB_STATUS.QUEUED);
    assert.ok(capturedUrl.includes('fal-ai/fast-svd'));
    assert.equal(capturedOptions.headers.Authorization, 'Key test-fal-key-abc');

    const body = JSON.parse(capturedOptions.body);
    assert.equal(body.prompt, 'A sleek electric sports car racing at night');
    assert.equal(body.negative_prompt, 'blurry, distorted');
    assert.equal(body.duration, 5);
    assert.equal(body.aspect_ratio, '9:16');
    assert.equal(body.seed, 42);
  });

  it('should poll job status and return COMPLETED with assetUrl', async () => {
    global.fetch = async (url) => {
      if (url.includes('/status')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'COMPLETED',
            progress: 100,
            video: { url: 'https://fal.media/files/rendered-video.mp4' },
          }),
        };
      }
      return { ok: false, status: 404 };
    };

    const provider = new FalVideoProvider({ apiKey: 'test-fal-key' });
    const status = await provider.getVideoJob('fal-req-12345');

    assert.equal(status.provider, 'fal');
    assert.equal(status.providerJobId, 'fal-req-12345');
    assert.equal(status.status, VIDEO_JOB_STATUS.COMPLETED);
    assert.equal(status.progress, 100);
    assert.equal(status.assetUrl, 'https://fal.media/files/rendered-video.mp4');
  });

  it('should throw ProviderRateLimitError on HTTP 429 response', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => JSON.stringify({ message: 'Rate limit exceeded' }),
    });

    const provider = new FalVideoProvider({ apiKey: 'test-fal-key' });

    await assert.rejects(
      async () => {
        await provider.createVideo({ prompt: 'test prompt' });
      },
      (err) => {
        assert.ok(err instanceof ProviderRateLimitError);
        assert.equal(err.statusCode, 429);
        return true;
      }
    );
  });

  it('should throw ProviderUnavailableError on HTTP 500+ response', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      text: async () => 'Fal worker node crashed',
    });

    const provider = new FalVideoProvider({ apiKey: 'test-fal-key' });

    await assert.rejects(
      async () => {
        await provider.createVideo({ prompt: 'test prompt' });
      },
      (err) => {
        assert.ok(err instanceof ProviderUnavailableError);
        assert.equal(err.statusCode, 503);
        return true;
      }
    );
  });

  it('should cancel a video job', async () => {
    const provider = new FalVideoProvider({ apiKey: 'test-fal-key' });
    const cancelRes = await provider.cancelVideoJob('fal-req-999');
    assert.equal(cancelRes.provider, 'fal');
    assert.equal(cancelRes.providerJobId, 'fal-req-999');
    assert.equal(cancelRes.status, VIDEO_JOB_STATUS.CANCELLED);
  });
});
