import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryQueueAdapter } from '../../src/orchestration/queue.js';

describe('MemoryQueueAdapter Unit Tests', () => {
  let queue;

  beforeEach(() => {
    queue = new MemoryQueueAdapter({ concurrency: 2 });
  });

  it('should initialize with configurable concurrency', () => {
    assert.equal(queue.concurrency, 2);
    const stats = queue.getStats();
    assert.equal(stats.concurrency, 2);
    assert.equal(stats.waiting, 0);
    assert.equal(stats.active, 0);
  });

  it('should strictly enforce concurrency limit of 2', async () => {
    let maxConcurrent = 0;
    let currentlyRunning = 0;
    const completed = [];

    queue.process(async (job) => {
      currentlyRunning += 1;
      if (currentlyRunning > maxConcurrent) {
        maxConcurrent = currentlyRunning;
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
      currentlyRunning -= 1;
      completed.push(job.id);
      return { success: true };
    });

    const jobIds = await Promise.all([
      queue.enqueue({ name: 'job-1' }),
      queue.enqueue({ name: 'job-2' }),
      queue.enqueue({ name: 'job-3' }),
      queue.enqueue({ name: 'job-4' }),
      queue.enqueue({ name: 'job-5' }),
    ]);

    assert.equal(jobIds.length, 5);

    await new Promise((resolve) => {
      queue.on('job:completed', () => {
        if (completed.length === 5) {
          resolve();
        }
      });
    });

    assert.equal(completed.length, 5);
    assert.equal(maxConcurrent, 2);
  });

  it('should emit lifecycle events (enqueued, started, completed)', async () => {
    const events = [];

    queue.on('job:enqueued', (job) => events.push(`enqueued:${job.data.num}`));
    queue.on('job:started', (job) => events.push(`started:${job.data.num}`));
    queue.on('job:completed', (job) => events.push(`completed:${job.data.num}`));

    queue.process(async (job) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { done: true };
    });

    await queue.enqueue({ num: 1 });

    await new Promise((resolve) => {
      queue.on('job:completed', () => resolve());
    });

    assert.deepEqual(events, ['enqueued:1', 'started:1', 'completed:1']);
  });

  it('should handle and record job failures', async () => {
    let failedEventReceived = false;

    queue.on('job:failed', ({ job, error }) => {
      failedEventReceived = true;
      assert.equal(error.message, 'Intentional job failure');
    });

    queue.process(async () => {
      throw new Error('Intentional job failure');
    });

    const jobId = await queue.enqueue({ task: 'will-fail' });

    await new Promise((resolve) => {
      queue.on('job:failed', () => resolve());
    });

    assert.equal(failedEventReceived, true);
    const failedJob = queue.getJob(jobId);
    assert.equal(failedJob.status, 'failed');
    assert.equal(failedJob.error, 'Intentional job failure');
  });
});
