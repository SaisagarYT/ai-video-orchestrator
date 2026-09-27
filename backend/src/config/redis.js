import { Redis } from '@upstash/redis';
import { config } from './env.js';

let redisClient = null;

// In-Memory Key-Value & Queue Fallback for local development or when Upstash is not configured
class InMemoryRedisFallback {
  constructor() {
    this.store = new Map();
    this.queues = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value, opts) {
    this.store.set(key, value);
    if (opts && opts.ex) {
      setTimeout(() => this.store.delete(key), opts.ex * 1000);
    }
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async lpush(key, ...values) {
    if (!this.queues.has(key)) {
      this.queues.set(key, []);
    }
    const q = this.queues.get(key);
    q.unshift(...values);
    return q.length;
  }

  async rpop(key) {
    if (!this.queues.has(key)) return null;
    const q = this.queues.get(key);
    return q.pop() || null;
  }

  async ping() {
    return 'PONG';
  }
}

if (config.redis.url && config.redis.token) {
  try {
    redisClient = new Redis({
      url: config.redis.url,
      token: config.redis.token,
    });
    console.log('✅ Upstash Serverless Redis client initialized');
  } catch (err) {
    console.warn('⚠️ Failed to initialize Upstash Redis, switching to in-memory fallback:', err.message);
    redisClient = new InMemoryRedisFallback();
  }
} else {
  console.warn('⚠️ Upstash Redis credentials not set. Operating with in-memory Redis fallback.');
  redisClient = new InMemoryRedisFallback();
}

export default redisClient;
