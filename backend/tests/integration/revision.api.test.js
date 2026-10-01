import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.NODE_ENV = 'test';

import app from '../../src/app.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';

describe('Revision API Integration Tests', () => {
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
    const res = await fetch(`${baseUrl}/api/campaigns/c-123/revisions`);
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
        title: 'Secret Campaign',
        goal: 'Awareness',
        product_name: 'Product A',
      }),
    });
    const campaign = (await createRes.json()).data;

    // User B tries to view revisions
    const res = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/revisions`, {
      headers: { Authorization: userBToken },
    });
    assert.equal(res.status, 404);
  });

  it('should return empty list when no revisions have run yet', async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        title: 'Fresh Campaign',
        goal: 'Conversions',
        product_name: 'Product B',
      }),
    });
    const campaign = (await createRes.json()).data;

    const res = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/revisions`, {
      headers: { Authorization: userAToken },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.campaignId, campaign.id);
    assert.equal(body.data.totalAttempts, 0);
    assert.deepEqual(body.data.revisions, []);
  });

  it('should return populated revision history and targets with full provenance', async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        title: 'Revision Campaign',
        goal: 'Sales',
        product_name: 'Product C',
      }),
    });
    const campaign = (await createRes.json()).data;

    const attemptId = 'att-api-test-1';
    await supabase.from('revision_attempts').insert({
      id: attemptId,
      campaign_id: campaign.id,
      workflow_execution_id: 'exec-api-1',
      attempt_number: 1,
      status: 'COMPLETED',
      passed: true,
      diagnostics: { failedDimensions: ['productFidelity'] },
      affected_scene_ids: ['scene-2'],
    });

    await supabase.from('revision_targets').insert({
      id: 'target-api-1',
      revision_attempt_id: attemptId,
      campaign_id: campaign.id,
      scene_id: 'scene-2',
      scene_index: 2,
      original_prompt: 'Product C on table',
      healed_prompt: 'Product C on table, commercial studio lighting, centered logo',
      explanation: 'Healed lighting and brand focus',
      previous_asset_id: 'prev-asset-1',
      new_asset_id: 'new-asset-2',
      status: 'GENERATED',
    });

    const res = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/revisions`, {
      headers: { Authorization: userAToken },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.totalAttempts, 1);

    const rev1 = body.data.revisions[0];
    assert.equal(rev1.id, attemptId);
    assert.equal(rev1.attempt_number, 1);
    assert.equal(rev1.status, 'COMPLETED');
    assert.equal(rev1.passed, true);
    assert.equal(rev1.targets.length, 1);
    assert.equal(rev1.targets[0].scene_id, 'scene-2');
    assert.equal(rev1.targets[0].new_asset_id, 'new-asset-2');
  });
});
