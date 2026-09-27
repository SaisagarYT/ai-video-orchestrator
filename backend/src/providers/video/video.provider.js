import { ProviderError, ProviderTimeoutError } from '../core/provider.errors.js';
import { VIDEO_JOB_STATUS } from '../core/provider.types.js';

/**
 * Base Abstract Video Provider
 */
export class VideoProvider {
  /**
   * @param {string} name
   * @param {Object} [options={}]
   */
  constructor(name, options = {}) {
    if (!name) throw new Error('Provider name is required');
    this.name = name;
    this.options = options;
  }

  /**
   * Initiate asynchronous video generation
   * @param {import('../core/provider.types.js').VideoRequest} request
   * @returns {Promise<import('../core/provider.types.js').VideoJobCreationResponse>}
   */
  async createVideo(request) {
    throw new ProviderError(`Method createVideo() not implemented on ${this.name} VideoProvider`);
  }

  /**
   * Check status of a video generation job
   * @param {string} jobId
   * @returns {Promise<import('../core/provider.types.js').VideoJobStatusResponse>}
   */
  async getVideoJob(jobId) {
    throw new ProviderError(`Method getVideoJob() not implemented on ${this.name} VideoProvider`);
  }

  /**
   * Cancel an active video generation job
   * @param {string} jobId
   * @returns {Promise<{ provider: string, providerJobId: string, status: string }>}
   */
  async cancelVideoJob(jobId) {
    throw new ProviderError(`Method cancelVideoJob() not implemented on ${this.name} VideoProvider`);
  }

  /**
   * Bounded polling loop to await video generation completion
   * @param {string} jobId
   * @param {Object} [options]
   * @param {number} [options.pollIntervalMs=1500]
   * @param {number} [options.maxPollTimeMs=120000]
   * @returns {Promise<import('../core/provider.types.js').VideoJobStatusResponse>}
   */
  async pollVideoJob(jobId, { pollIntervalMs = 1500, maxPollTimeMs = 120000 } = {}) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxPollTimeMs) {
      const statusRes = await this.getVideoJob(jobId);

      if (statusRes.status === VIDEO_JOB_STATUS.COMPLETED) {
        return statusRes;
      }

      if (statusRes.status === VIDEO_JOB_STATUS.FAILED || statusRes.status === VIDEO_JOB_STATUS.CANCELLED) {
        throw new ProviderError(
          `Video generation ${statusRes.status.toLowerCase()}: ${statusRes.error || 'Unknown provider failure'}`,
          500,
          'PROVIDER_ERROR',
          { provider: this.name, jobId, status: statusRes.status }
        );
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new ProviderTimeoutError(
      `Video generation timed out after ${maxPollTimeMs}ms (jobId: ${jobId})`,
      { provider: this.name, jobId, maxPollTimeMs }
    );
  }

  /**
   * Convenience wrapper: submit and poll
   * @param {import('../core/provider.types.js').VideoRequest} request
   * @param {Object} [pollOptions]
   */
  async generateVideo(request, pollOptions = {}) {
    const created = await this.createVideo(request);
    return this.pollVideoJob(created.providerJobId, pollOptions);
  }
}

export default VideoProvider;
