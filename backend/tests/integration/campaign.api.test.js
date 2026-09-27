import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.NODE_ENV = 'test';

import app from '../../src/app.js';
import { memoryDb } from '../../src/config/supabase.js';

describe('Campaign API Integration Tests', () => {
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

  it('should create a new campaign for authenticated user (201 Created)', async () => {
    const res = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        title: 'Q4 Fitness Launch',
        goal: 'Drive App Installs',
        product_name: 'FitTrack Ultra',
        target_platform: 'tiktok',
        aspect_ratio: '9:16',
        duration_seconds: 30,
        call_to_action: 'Download now on iOS & Android',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.id);
    assert.equal(body.data.user_id, 'user-a');
    assert.equal(body.data.title, 'Q4 Fitness Launch');
    assert.equal(body.data.product_name, 'FitTrack Ultra');
  });

  it('should enforce strict user ownership isolation on campaign listing and retrieval', async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        title: 'User A Secret Campaign',
        goal: 'Classified',
        product_name: 'Project Alpha',
      }),
    });
    const created = await createRes.json();
    const campaignId = created.data.id;

    const listResA = await fetch(`${baseUrl}/api/campaigns`, {
      headers: { Authorization: userAToken },
    });
    const listA = await listResA.json();
    assert.equal(listA.data.length, 1);
    assert.equal(listA.data[0].id, campaignId);

    const getResA = await fetch(`${baseUrl}/api/campaigns/${campaignId}`, {
      headers: { Authorization: userAToken },
    });
    assert.equal(getResA.status, 200);

    const listResB = await fetch(`${baseUrl}/api/campaigns`, {
      headers: { Authorization: userBToken },
    });
    const listB = await listResB.json();
    assert.equal(listB.data.length, 0);

    const getResB = await fetch(`${baseUrl}/api/campaigns/${campaignId}`, {
      headers: { Authorization: userBToken },
    });
    assert.equal(getResB.status, 404);
  });

  it('should update campaign attributes for owner and reject non-owner', async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: userAToken },
      body: JSON.stringify({
        title: 'Original Title',
        goal: 'Original Goal',
        product_name: 'Item 1',
      }),
    });
    const { data: campaign } = await createRes.json();

    const resB = await fetch(`${baseUrl}/api/campaigns/${campaign.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: userBToken },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    assert.equal(resB.status, 404);

    const resA = await fetch(`${baseUrl}/api/campaigns/${campaign.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: userAToken },
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    assert.equal(resA.status, 200);
    const bodyA = await resA.json();
    assert.equal(bodyA.data.title, 'Updated Title');
  });

  it('should trigger video generation with HTTP 202 Accepted and support Idempotency-Key', async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: userAToken },
      body: JSON.stringify({
        title: 'Video Generation Test',
        goal: 'Sales',
        product_name: 'Smart Lamp',
      }),
    });
    const { data: campaign } = await createRes.json();

    const idempotencyKey = 'client-idemp-uuid-12345';

    const genRes1 = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
        'Idempotency-Key': idempotencyKey,
      },
    });

    assert.equal(genRes1.status, 202);
    const gen1 = await genRes1.json();
    assert.equal(gen1.success, true);
    assert.ok(gen1.data.workflowExecutionId);
    assert.equal(gen1.data.sseStreamUrl, `/api/campaigns/${campaign.id}/progress`);

    const genRes2 = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
        'Idempotency-Key': idempotencyKey,
      },
    });

    assert.equal(genRes2.status, 202);
    const gen2 = await genRes2.json();
    assert.equal(gen2.success, true);
    assert.equal(gen2.data.workflowExecutionId, gen1.data.workflowExecutionId);

    const genResB = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/generate`, {
      method: 'POST',
      headers: {
        Authorization: userBToken,
      },
    });
    assert.equal(genResB.status, 404);
  });
});
