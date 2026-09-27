import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';
import { logger } from '../core/logger/logger.js';

/**
 * Base Abstract Queue Adapter Interface
 */
export class QueueAdapter extends EventEmitter {
  async enqueue(job) {
    throw new Error('Method enqueue() must be implemented');
  }

  process(handler) {
    throw new Error('Method process() must be implemented');
  }

  getJob(jobId) {
    throw new Error('Method getJob() must be implemented');
  }

  getStats() {
    throw new Error('Method getStats() must be implemented');
  }
}

/**
 * MemoryQueueAdapter
 *
 * In-memory job queue for local development and deterministic automated tests.
 * Supports configurable concurrency (default: 2), automatic job dispatching,
 * failure recording, and full lifecycle event emission.
 */
export class MemoryQueueAdapter extends QueueAdapter {
  constructor({ concurrency = 2 } = {}) {
    super();
    this.concurrency = concurrency;
    this.pendingQueue = [];
    this.activeJobs = new Map();
    this.completedJobs = new Map();
    this.failedJobs = new Map();
    this.handler = null;
    this.isPaused = false;
  }

  process(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Queue handler must be a callable function');
    }
    this.handler = handler;
    this._processNext();
  }

  async enqueue(payload) {
    const jobId = payload.jobId || crypto.randomUUID();
    const job = {
      id: jobId,
      data: payload,
      status: 'waiting',
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
    };

    this.pendingQueue.push(job);
    logger.debug(`[Queue] Enqueued job ${jobId}`, { active: this.activeJobs.size, waiting: this.pendingQueue.length });
    this.emit('job:enqueued', job);

    queueMicrotask(() => this._processNext());
    return jobId;
  }

  async _processNext() {
    if (this.isPaused || !this.handler) {
      return;
    }

    while (this.activeJobs.size < this.concurrency && this.pendingQueue.length > 0) {
      const job = this.pendingQueue.shift();
      job.status = 'active';
      job.startedAt = new Date().toISOString();
      job.attempts += 1;
      this.activeJobs.set(job.id, job);

      this.emit('job:started', job);
      logger.debug(`[Queue] Started processing job ${job.id}`);

      (async () => {
        try {
          const result = await this.handler(job);
          job.status = 'completed';
          job.completedAt = new Date().toISOString();
          job.result = result;
          this.completedJobs.set(job.id, job);
          this.activeJobs.delete(job.id);
          this.emit('job:completed', job);
          logger.debug(`[Queue] Completed job ${job.id}`);
        } catch (err) {
          job.status = 'failed';
          job.failedAt = new Date().toISOString();
          job.error = err.message;
          this.failedJobs.set(job.id, job);
          this.activeJobs.delete(job.id);
          this.emit('job:failed', { job, error: err });
          logger.error(`[Queue] Job ${job.id} failed: ${err.message}`);
        } finally {
          this._processNext();
        }
      })();
    }
  }

  getJob(jobId) {
    return (
      this.activeJobs.get(jobId) ||
      this.pendingQueue.find((j) => j.id === jobId) ||
      this.completedJobs.get(jobId) ||
      this.failedJobs.get(jobId) ||
      null
    );
  }

  getStats() {
    return {
      concurrency: this.concurrency,
      waiting: this.pendingQueue.length,
      active: this.activeJobs.size,
      completed: this.completedJobs.size,
      failed: this.failedJobs.size,
    };
  }

  clear() {
    this.pendingQueue = [];
    this.activeJobs.clear();
    this.completedJobs.clear();
    this.failedJobs.clear();
  }
}

export const workflowQueue = new MemoryQueueAdapter({ concurrency: 2 });
export default workflowQueue;
