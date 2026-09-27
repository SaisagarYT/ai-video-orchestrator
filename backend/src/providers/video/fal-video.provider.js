import { VideoProvider } from './video.provider.js';
import {
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  ProviderBadRequestError,
  ProviderUnavailableError,
  ProviderResponseError,
  ProviderError,
} from '../core/provider.errors.js';
import { VIDEO_JOB_STATUS } from '../core/provider.types.js';
import { logger } from '../../core/logger/logger.js';

export class FalVideoProvider extends VideoProvider {
  /**
   * @param {Object} [options]
   * @param {string} [options.apiKey]
   * @param {string} [options.model]
   * @param {string} [options.baseUrl]
   * @param {number} [options.timeoutMs]
   */
  constructor(options = {}) {
    super('fal', options);
    this.apiKey = options.apiKey || process.env.FAL_API_KEY || process.env.FAL_KEY;
    this.model = options.model || process.env.FAL_VIDEO_MODEL || 'fal-ai/fast-svd';
    this.baseUrl = (options.baseUrl || 'https://queue.fal.run').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs || parseInt(process.env.AI_VIDEO_TIMEOUT_MS || '120000', 10);
  }

  _getAuthHeader() {
    if (!this.apiKey) {
      throw new ProviderAuthenticationError('Fal.ai API key is missing. Set FAL_API_KEY environment variable.');
    }
    // Fal accepts 'Key <API_KEY>' or 'Bearer <API_KEY>'
    return `Key ${this.apiKey}`;
  }

  async createVideo(request) {
    const authHeader = this._getAuthHeader();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const modelEndpoint = request.metadata?.model || this.model;
    const url = `${this.baseUrl}/${modelEndpoint}`;

    const payload = {
      prompt: request.prompt,
      negative_prompt: request.negativePrompt,
      duration: request.durationSeconds,
      aspect_ratio: request.aspectRatio || '9:16',
      seed: request.seed,
      image_url: request.referenceImages?.[0] || undefined,
    };

    logger.debug(`[FalVideo] Submitting video creation request to model: ${modelEndpoint}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'User-Agent': 'AIVideoOrchestrator/2.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let errJson = null;
        try {
          errJson = JSON.parse(errText);
        } catch (_) {}

        const message = errJson?.message || errJson?.detail || errText || `HTTP ${response.status} ${response.statusText}`;

        if (response.status === 401 || response.status === 403) {
          throw new ProviderAuthenticationError(`Fal.ai authentication error: ${message}`, {
            provider: 'fal',
            statusCode: response.status,
          });
        }
        if (response.status === 429) {
          throw new ProviderRateLimitError(`Fal.ai rate limit exceeded: ${message}`, {
            provider: 'fal',
            statusCode: 429,
          });
        }
        if (response.status === 400) {
          throw new ProviderBadRequestError(`Fal.ai bad request: ${message}`, {
            provider: 'fal',
            statusCode: 400,
          });
        }
        if (response.status >= 500) {
          throw new ProviderUnavailableError(`Fal.ai service unavailable: ${message}`, {
            provider: 'fal',
            statusCode: response.status,
          });
        }

        throw new ProviderError(`Fal.ai video creation failed: ${message}`, response.status, 'PROVIDER_ERROR', {
          provider: 'fal',
          statusCode: response.status,
        });
      }

      const data = await response.json();
      const requestId = data.request_id || data.id;

      if (!requestId) {
        throw new ProviderResponseError('Fal.ai response missing request_id or job identifier', {
          provider: 'fal',
          data,
        });
      }

      return {
        provider: 'fal',
        providerJobId: requestId,
        status: VIDEO_JOB_STATUS.QUEUED,
        createdAt: new Date().toISOString(),
        metadata: {
          model: modelEndpoint,
          statusUrl: data.status_url,
          responseUrl: data.response_url,
          ...(request.metadata || {}),
        },
      };
    } catch (err) {
      clearTimeout(timer);

      if (err.name === 'AbortError' || err.code === 'ABORT_ERR') {
        throw new ProviderTimeoutError(`Fal.ai request timed out after ${this.timeoutMs}ms`, {
          provider: 'fal',
          timeoutMs: this.timeoutMs,
        });
      }

      if (err instanceof ProviderError) throw err;

      throw new ProviderError(`Fal.ai submission error: ${err.message}`, 500, 'PROVIDER_ERROR', {
        provider: 'fal',
        cause: err.message,
      });
    }
  }

  async getVideoJob(jobId) {
    const authHeader = this._getAuthHeader();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const statusUrl = `${this.baseUrl}/${this.model}/requests/${jobId}/status`;

    try {
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'User-Agent': 'AIVideoOrchestrator/2.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new ProviderAuthenticationError('Fal.ai authentication failure checking job status');
        }
        if (response.status === 404) {
          throw new ProviderBadRequestError(`Fal.ai job ${jobId} not found`);
        }
        throw new ProviderUnavailableError(`Fal.ai job status error: HTTP ${response.status}`);
      }

      const statusData = await response.json();
      const rawStatus = (statusData.status || '').toUpperCase();

      let normalizedStatus = VIDEO_JOB_STATUS.PROCESSING;
      if (rawStatus === 'IN_QUEUE') {
        normalizedStatus = VIDEO_JOB_STATUS.QUEUED;
      } else if (rawStatus === 'IN_PROGRESS') {
        normalizedStatus = VIDEO_JOB_STATUS.PROCESSING;
      } else if (rawStatus === 'COMPLETED') {
        normalizedStatus = VIDEO_JOB_STATUS.COMPLETED;
      } else if (rawStatus === 'FAILED' || rawStatus === 'ERROR') {
        normalizedStatus = VIDEO_JOB_STATUS.FAILED;
      }

      let assetUrl = null;
      if (normalizedStatus === VIDEO_JOB_STATUS.COMPLETED) {
        // Fetch completed result if not in status payload
        if (statusData.video?.url) {
          assetUrl = statusData.video.url;
        } else if (statusData.output?.video?.url) {
          assetUrl = statusData.output.video.url;
        } else {
          // Query the request result endpoint
          const resultUrl = `${this.baseUrl}/${this.model}/requests/${jobId}`;
          const resResult = await fetch(resultUrl, {
            headers: { Authorization: authHeader },
          });
          if (resResult.ok) {
            const resJson = await resResult.json();
            assetUrl = resJson.video?.url || resJson.output?.video?.url || resJson.video_url || null;
          }
        }
      }

      return {
        provider: 'fal',
        providerJobId: jobId,
        status: normalizedStatus,
        progress: statusData.progress || (normalizedStatus === VIDEO_JOB_STATUS.COMPLETED ? 100 : 50),
        assetUrl,
        error: statusData.error || null,
        metadata: statusData,
      };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new ProviderTimeoutError(`Fal.ai status check timed out for job ${jobId}`);
      }
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(`Fal.ai status check failed: ${err.message}`);
    }
  }

  async cancelVideoJob(jobId) {
    return {
      provider: 'fal',
      providerJobId: jobId,
      status: VIDEO_JOB_STATUS.CANCELLED,
    };
  }
}

export default FalVideoProvider;
