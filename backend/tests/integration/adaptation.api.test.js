import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';

process.env.NODE_ENV = 'test';

import app from '../../src/app.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { ADAPTATION_PLATFORMS, ADAPTATION_STATUS } from '../../src/adaptation/constants.js';

describe('Adaptation API Integration Tests', () => {
  let server;
  let baseUrl;

  const userAId = 'user-a';
  const userBId = 'user-b';
  const userAToken = `Bearer test-token:${userAId}:usera@example.com`;
  const userBToken = `Bearer test-token:${userBId}:userb@example.com`;

  let campaignAId;
  let campaignBId;
  let timelineAId;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(async () => {
    memoryDb.reset();

    campaignAId = crypto.randomUUID();
    campaignBId = crypto.randomUUID();
    timelineAId = crypto.randomUUID();

    await supabase.from('users').insert([
      { id: userAId, email: 'usera@example.com', role: 'creator' },
      { id: userBId, email: 'userb@example.com', role: 'creator' },
    ]);

    await supabase.from('campaigns').insert([
      {
        id: campaignAId,
        user_id: userAId,
        name: 'Brand A Promo',
        product_name: 'SuperBottle',
        call_to_action: 'Get 20% Off',
      },
      {
        id: campaignBId,
        user_id: userBId,
        name: 'Brand B Launch',
        product_name: 'GamerChair',
        call_to_action: 'Pre-order',
      },
    ]);

    await supabase.from('timelines').insert([
      {
        id: timelineAId,
        campaign_id: campaignAId,
        version: '1.0',
        duration_ms: 10000,
        output: {
          width: 1080,
          height: 1920,
          aspectRatio: '9:16',
          fps: 30,
          format: 'mp4',
          videoCodec: 'h264',
          audioCodec: 'aac',
        },
        timeline_data: {
          id: timelineAId,
          version: '1.0',
          campaignId: campaignAId,
          durationMs: 10000,
          output: {
            width: 1080,
            height: 1920,
            aspectRatio: '9:16',
            fps: 30,
            format: 'mp4',
            videoCodec: 'h264',
            audioCodec: 'aac',
          },
          tracks: [
            {
              type: 'video',
              items: [
                {
                  id: crypto.randomUUID(),
                  sceneId: 'scene-1',
                  assetId: 'asset-1',
                  sourceUrl: 'https://res.cloudinary.com/demo/video/upload/s1.mp4',
                  startMs: 0,
                  durationMs: 5000,
                  sequenceNumber: 1,
                },
                {
                  id: crypto.randomUUID(),
                  sceneId: 'scene-2',
                  assetId: 'asset-2',
                  sourceUrl: 'https://res.cloudinary.com/demo/video/upload/s2.mp4',
                  startMs: 5000,
                  durationMs: 5000,
                  sequenceNumber: 2,
                },
              ],
            },
            {
              type: 'audio',
              items: [
                {
                  id: crypto.randomUUID(),
                  sceneId: 'scene-1',
                  sourceUrl: 'https://res.cloudinary.com/demo/video/upload/a1.mp3',
                  startMs: 0,
                  durationMs: 5000,
                  volume: 1.0,
                  sequenceNumber: 1,
                },
                {
                  id: crypto.randomUUID(),
                  sceneId: 'scene-2',
                  sourceUrl: 'https://res.cloudinary.com/demo/video/upload/a2.mp3',
                  startMs: 5000,
                  durationMs: 5000,
                  volume: 1.0,
                  sequenceNumber: 2,
                },
              ],
            },
          ],
        },
      },
    ]);
  });

  it('should reject unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: ADAPTATION_PLATFORMS.TIKTOK }),
    });

    assert.equal(res.status, 401);
  });

  it('should reject cross-tenant access with 403 Forbidden', async () => {
    // User B attempts to create adaptation on User A's campaign
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userBToken,
      },
      body: JSON.stringify({ platform: ADAPTATION_PLATFORMS.TIKTOK }),
    });

    assert.equal(res.status, 403);
  });

  it('should reject invalid platform with 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({ platform: 'MYSPACE_VIDEO' }),
    });

    assert.equal(res.status, 400);
  });

  it('should create a platform adaptation (201 Created)', async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        platform: ADAPTATION_PLATFORMS.TIKTOK,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.adaptation.id);
    assert.equal(body.adaptation.platform, ADAPTATION_PLATFORMS.TIKTOK);
    assert.equal(body.adaptation.target_aspect_ratio, '9:16');
    assert.ok(body.adaptation.timeline_id);
  });

  it('should bulk create adaptations with 202 Accepted semantics', async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        platforms: [ADAPTATION_PLATFORMS.TIKTOK, ADAPTATION_PLATFORMS.YOUTUBE_LANDSCAPE],
      }),
    });

    assert.equal(res.status, 202);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.accepted, true);
    assert.equal(body.count, 2);
    assert.equal(body.adaptations.length, 2);
  });

  it('should list adaptations for a campaign', async () => {
    // Create one first
    await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({ platform: ADAPTATION_PLATFORMS.META_FEED }),
    });

    const res = await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations`, {
      headers: { Authorization: userAToken },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.count, 1);
    assert.equal(body.adaptations[0].platform, ADAPTATION_PLATFORMS.META_FEED);
  });

  it('should get single adaptation by ID', async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({ platform: ADAPTATION_PLATFORMS.INSTAGRAM_REELS }),
    });
    const { adaptation } = await createRes.json();

    const getRes = await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations/${adaptation.id}`, {
      headers: { Authorization: userAToken },
    });

    assert.equal(getRes.status, 200);
    const body = await getRes.json();
    assert.equal(body.adaptation.id, adaptation.id);
  });

  it('should cancel an adaptation', async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({ platform: ADAPTATION_PLATFORMS.YOUTUBE_SHORTS }),
    });
    const { adaptation } = await createRes.json();

    const cancelRes = await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations/${adaptation.id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({ reason: 'No longer needed' }),
    });

    assert.equal(cancelRes.status, 200);
    const body = await cancelRes.json();
    assert.equal(body.adaptation.status, ADAPTATION_STATUS.CANCELLED);
  });

  it('should retrieve events for an adaptation', async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({ platform: ADAPTATION_PLATFORMS.TIKTOK }),
    });
    const { adaptation } = await createRes.json();

    const eventsRes = await fetch(`${baseUrl}/api/campaigns/${campaignAId}/adaptations/${adaptation.id}/events`, {
      headers: { Authorization: userAToken },
    });

    assert.equal(eventsRes.status, 200);
    const body = await eventsRes.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.events));
  });
});
