import { VideoProvider } from './video.provider.js';
import { VIDEO_JOB_STATUS } from '../core/provider.types.js';

export class MockVideoProvider extends VideoProvider {
  constructor(options = {}) {
    super('mock-video', options);
    this.jobs = new Map();
  }

  async createVideo(request) {
    const seed = request.seed || 42;
    const jobId = `mock-vid-job-${seed}-${Date.now()}`;
    const aspectRatio = request.aspectRatio || '9:16';
    const durationSeconds = request.durationSeconds || 5;

    const job = {
      provider: 'mock-video',
      providerJobId: jobId,
      status: VIDEO_JOB_STATUS.QUEUED,
      progress: 0,
      createdAt: new Date().toISOString(),
      assetUrl: `https://videos.mock-cdn.local/rendered/vid-${seed}-${aspectRatio.replace(':', 'x')}.mp4`,
      durationSeconds,
      aspectRatio,
      seed,
      metadata: request.metadata || {},
    };

    this.jobs.set(jobId, job);

    return {
      provider: 'mock-video',
      providerJobId: jobId,
      status: VIDEO_JOB_STATUS.QUEUED,
      createdAt: job.createdAt,
      metadata: job.metadata,
    };
  }

  async getVideoJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      // Deterministic auto-generation for unknown job queries
      return {
        provider: 'mock-video',
        providerJobId: jobId,
        status: VIDEO_JOB_STATUS.COMPLETED,
        progress: 100,
        assetUrl: `https://videos.mock-cdn.local/rendered/${jobId}.mp4`,
        durationSeconds: 5,
        metadata: {},
      };
    }

    // Advance to completed
    job.status = VIDEO_JOB_STATUS.COMPLETED;
    job.progress = 100;

    return {
      provider: 'mock-video',
      providerJobId: jobId,
      status: job.status,
      progress: job.progress,
      assetUrl: job.assetUrl,
      durationSeconds: job.durationSeconds,
      metadata: job.metadata,
    };
  }

  async cancelVideoJob(jobId) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = VIDEO_JOB_STATUS.CANCELLED;
    }
    return {
      provider: 'mock-video',
      providerJobId: jobId,
      status: VIDEO_JOB_STATUS.CANCELLED,
    };
  }

  async generateVideo(request) {
    const startTime = Date.now();
    const durationSeconds = request.durationSeconds || 5;
    const aspectRatio = request.aspectRatio || '9:16';
    const seed = request.seed || 42;

    return {
      url: `https://videos.mock-cdn.local/rendered/vid-${seed}-${aspectRatio.replace(':', 'x')}.mp4`,
      provider: 'mock-video',
      durationSeconds,
      aspectRatio,
      seed,
      latencyMs: Math.max(1, Date.now() - startTime),
    };
  }
}

export default MockVideoProvider;
