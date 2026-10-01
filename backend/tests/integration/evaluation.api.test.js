import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.NODE_ENV = 'test';

import app from '../../src/app.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';

describe('Evaluation API Integration Tests', () => {
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
    const res = await fetch(`${baseUrl}/api/campaigns/c-123/evaluation`);
    assert.equal(res.status, 401);
  });

  it('should return 404 when campaign does not exist or belongs to another user', async () => {
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
        product_name: 'Product X',
      }),
    });
    const campaign = (await createRes.json()).data;

    // User B tries to view evaluation
    const res = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/evaluation`, {
      headers: { Authorization: userBToken },
    });
    assert.equal(res.status, 404);
  });

  it('should return 404 when evaluation has not been performed yet', async () => {
    const createRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        title: 'Pending Eval Campaign',
        goal: 'Conversions',
        product_name: 'Product Y',
      }),
    });
    const campaign = (await createRes.json()).data;

    const res = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/evaluation`, {
      headers: { Authorization: userAToken },
    });
    assert.equal(res.status, 404);
  });

  it('should return 200 with canonical evaluation details when evaluation exists', async () => {
    // 1. Create Campaign
    const createRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userAToken,
      },
      body: JSON.stringify({
        title: 'Evaluated Campaign',
        goal: 'Conversions',
        product_name: 'Product Z',
      }),
    });
    const campaign = (await createRes.json()).data;

    // 2. Insert Quality Evaluation record in Supabase
    await supabase.from('quality_evaluations').insert({
      id: 'eval-uuid-1',
      campaign_id: campaign.id,
      workflow_execution_id: 'exec-uuid-1',
      final_video_id: 'vid-uuid-1',
      evaluation_version: '1.0',
      overall_score: 8.8,
      threshold: 7.5,
      passed: true,
      dimensions: {
        productFidelity: { score: 9.0, weight: 0.4, weightedScore: 3.6, findings: 'Great' },
        brandConsistency: { score: 8.5, weight: 0.3, weightedScore: 2.55, findings: 'Strong' },
        visualQuality: { score: 8.8, weight: 0.3, weightedScore: 2.64, findings: 'Crisp' },
      },
      technical_checks: {
        videoReadable: true,
        durationValid: true,
        resolutionValid: true,
        aspectRatioValid: true,
        audioPresent: true,
        subtitlesValid: true,
      },
      issues: [],
      recommendations: ['Great job'],
      revision_instructions: [],
      metadata: {},
      created_at: new Date().toISOString(),
    });

    // 3. Fetch evaluation
    const res = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/evaluation`, {
      headers: { Authorization: userAToken },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.evaluationId, 'eval-uuid-1');
    assert.equal(body.data.overallScore, 8.8);
    assert.equal(body.data.passed, true);
    assert.ok(body.data.dimensions.productFidelity);
    assert.equal(body.data.technicalChecks.videoReadable, true);
  });
});
