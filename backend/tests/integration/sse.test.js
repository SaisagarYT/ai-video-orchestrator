import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.NODE_ENV = 'test';

import app from '../../src/app.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { recordWorkflowEvent } from '../../src/orchestration/events.js';

describe('Server-Sent Events (SSE) Progress Stream Integration Tests', () => {
  let server;
  let baseUrl;

  const userAToken = 'test-token:user-a:usera@example.com';
  const userBToken = 'test-token:user-b:userb@example.com';

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

  it('should stream historical event replay followed by live broadcast events over SSE', async () => {
    const { data: campaign } = await supabase.from('campaigns').insert({
      id: 'camp-sse-1',
      user_id: 'user-a',
      title: 'SSE Streaming Ad',
      goal: 'Awareness',
      product_name: 'GlowStick',
      status: 'GENERATING',
    });

    await recordWorkflowEvent({
      executionId: 'exec-sse-1',
      campaignId: campaign.id,
      eventType: 'WORKFLOW_QUEUED',
      payload: { stage: 'INIT', progress: 0 },
    });

    await recordWorkflowEvent({
      executionId: 'exec-sse-1',
      campaignId: campaign.id,
      eventType: 'STAGE_TRANSITION',
      payload: { stage: 'CONTEXT_INGESTION', progress: 10 },
    });

    const receivedChunks = [];
    let resolveStream;
    const streamDonePromise = new Promise((resolve) => {
      resolveStream = resolve;
    });

    const sseReq = http.get(
      `${baseUrl}/api/campaigns/${campaign.id}/progress?token=${userAToken}`,
      (res) => {
        assert.equal(res.statusCode, 200);
        assert.equal(res.headers['content-type'], 'text/event-stream');

        res.on('data', (chunk) => {
          const text = chunk.toString();
          receivedChunks.push(text);

          if (text.includes('LIVE_BROADCAST_TEST')) {
            sseReq.destroy();
            resolveStream();
          }
        });
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    await recordWorkflowEvent({
      executionId: 'exec-sse-1',
      campaignId: campaign.id,
      eventType: 'LIVE_BROADCAST_TEST',
      payload: { message: 'Real-time update arriving live' },
    });

    await streamDonePromise;

    const allOutput = receivedChunks.join('');

    assert.ok(allOutput.includes('event: WORKFLOW_QUEUED'));
    assert.ok(allOutput.includes('event: STAGE_TRANSITION'));
    assert.ok(allOutput.includes('CONTEXT_INGESTION'));

    assert.ok(allOutput.includes('event: LIVE_BROADCAST_TEST'));
    assert.ok(allOutput.includes('Real-time update arriving live'));
  });

  it('should reject progress streaming for non-owners (404 Not Found)', async () => {
    const { data: campaign } = await supabase.from('campaigns').insert({
      id: 'camp-sse-isolated',
      user_id: 'user-a',
      title: 'Private Campaign',
      goal: 'Private',
      product_name: 'Secret',
    });

    const res = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/progress?token=${userBToken}`);
    assert.equal(res.status, 404);
  });
});
