import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';

process.env.NODE_ENV = 'test';

import app from '../../src/app.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';

describe('Video Understanding API Integration Tests', () => {
  let server;
  let baseUrl;

  const userAToken = 'Bearer test-token:user-a:usera@example.com';
  const userBToken = 'Bearer test-token:user-b:userb@example.com';

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    memoryDb.reset();
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/c-123/video-understanding`);
    assert.equal(res.status, 401);
  });

  it('should return 404 when campaign belongs to another user', async () => {
    // User A creates campaign
    const createRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        title: 'User A Campaign',
        goal: 'Awareness',
        product_name: 'Product A',
      }),
    });
    const campaign = (await createRes.json()).data;

    // User B tries to access User A's video understanding
    const res = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/video-understanding`, {
      headers: { Authorization: userBToken },
    });
    assert.equal(res.status, 404);
  });

  it('should return 404 when no video understanding run exists', async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        title: 'New Campaign',
        goal: 'Conversions',
        product_name: 'Product B',
      }),
    });
    const campaign = (await createRes.json()).data;

    const res = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/video-understanding`, {
      headers: { Authorization: userAToken },
    });
    assert.equal(res.status, 404);
  });

  it('should return 200 with sanitized video understanding data when run exists', async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        title: 'Analyzed Campaign',
        goal: 'Sales',
        product_name: 'Product C',
      }),
    });
    const campaign = (await createRes.json()).data;
    const runId = crypto.randomUUID();
    const execId = crypto.randomUUID();

    await supabase.from('video_understanding_runs').insert({
      id: runId,
      campaign_id: campaign.id,
      workflow_execution_id: execId,
      status: 'COMPLETED',
      frame_count: 6,
      scene_count: 2,
      overall_confidence: 0.94,
      summary: 'Visual inspection complete.',
      dimensions: {
        productFidelity: { score: 9.3, confidence: 0.95, findings: 'Clean product' },
        brandConsistency: { score: 9.1, confidence: 0.90, findings: 'On brand' },
        visualQuality: { score: 9.5, confidence: 0.95, findings: 'Studio lighting' },
        sceneConsistency: { score: 9.2, confidence: 0.90, findings: 'Smooth' },
      },
      detected_issues: [],
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    await supabase.from('video_understanding_scenes').insert([
      {
        id: crypto.randomUUID(),
        run_id: runId,
        scene_id: 'scene-1',
        scene_index: 1,
        frame_count: 3,
        confidence: 0.95,
        dimensions: {
          productFidelity: { score: 9.3, confidence: 0.95, findings: 'Clean product' },
          brandConsistency: { score: 9.1, confidence: 0.90, findings: 'On brand' },
          visualQuality: { score: 9.5, confidence: 0.95, findings: 'Studio lighting' },
          sceneConsistency: { score: 9.2, confidence: 0.90, findings: 'Smooth' },
        },
        detected_issues: [],
        observations: ['Product upright'],
        created_at: new Date().toISOString(),
      },
    ]);

    const res = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/video-understanding`, {
      headers: { Authorization: userAToken },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.runId, runId);
    assert.equal(body.data.campaignId, campaign.id);
    assert.equal(body.data.frameCount, 6);
    assert.equal(body.data.sceneCount, 2);
    assert.equal(body.data.scenes.length, 1);
    assert.equal(body.data.scenes[0].sceneId, 'scene-1');
  });
});
