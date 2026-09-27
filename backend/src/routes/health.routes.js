import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import redisClient from '../config/redis.js';

const router = Router();

router.get('/health', async (req, res) => {
  const startTime = Date.now();
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      checks.services.database = `unhealthy: ${error.message}`;
      checks.status = 'degraded';
    } else {
      checks.services.database = 'healthy';
    }
  } catch (err) {
    checks.services.database = `unhealthy: ${err.message}`;
    checks.status = 'degraded';
  }

  try {
    await redisClient.ping();
    checks.services.redis = 'healthy';
  } catch (err) {
    checks.services.redis = 'degraded_in_memory_fallback';
  }

  checks.latencyMs = Date.now() - startTime;
  const statusCode = checks.status === 'ok' || checks.status === 'degraded' ? 200 : 503;
  return res.status(statusCode).json(checks);
});

export default router;
