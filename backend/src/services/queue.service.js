import { EventEmitter } from 'node:events';
import redisClient from '../config/redis.js';

export const jobEmitter = new EventEmitter();

// Active SSE client connections keyed by campaignId
const activeSSEClients = new Map();

/**
 * Register an SSE client connection for real-time progress events
 */
export const registerSSEClient = (campaignId, res) => {
  if (!activeSSEClients.has(campaignId)) {
    activeSSEClients.set(campaignId, new Set());
  }
  const clientSet = activeSSEClients.get(campaignId);
  clientSet.add(res);

  res.on('close', () => {
    clientSet.delete(res);
    if (clientSet.size === 0) {
      activeSSEClients.delete(campaignId);
    }
  });
};

/**
 * Broadcast an event to all connected SSE clients for a campaign
 */
export const broadcastCampaignEvent = async (campaignId, event, data) => {
  const payload = {
    campaignId,
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  await redisClient.set(`campaign:progress:${campaignId}`, JSON.stringify(payload), { ex: 3600 });

  const clientSet = activeSSEClients.get(campaignId);
  if (clientSet && clientSet.size > 0) {
    const formattedMessage = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of clientSet) {
      client.write(formattedMessage);
    }
  }

  jobEmitter.emit(`campaign:${campaignId}`, payload);
};

/**
 * Get current progress of a campaign
 */
export const getCampaignProgress = async (campaignId) => {
  const cached = await redisClient.get(`campaign:progress:${campaignId}`);
  if (!cached) return null;
  return typeof cached === 'string' ? JSON.parse(cached) : cached;
};
