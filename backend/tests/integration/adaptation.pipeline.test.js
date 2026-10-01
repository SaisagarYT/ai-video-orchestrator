import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.NODE_ENV = 'test';

import { memoryDb, supabase } from '../../src/config/supabase.js';
import { adaptationService } from '../../src/adaptation/adaptation.service.js';
import { ADAPTATION_PLATFORMS, ADAPTATION_STATUS } from '../../src/adaptation/constants.js';
import { WORKFLOW_EVENT_TYPES } from '../../src/orchestration/events.js';

describe('Adaptation Pipeline Integration Tests', () => {
  const userId = 'creator-1';
  const user = { id: userId, email: 'creator@example.com', role: 'creator' };
  let campaignId;
  let executionId;
  let canonicalTimelineId;

  beforeEach(async () => {
    memoryDb.reset();

    campaignId = crypto.randomUUID();
    executionId = crypto.randomUUID();
    canonicalTimelineId = crypto.randomUUID();

    await supabase.from('users').insert([
      { id: userId, email: 'creator@example.com', role: 'creator' },
    ]);

    await supabase.from('campaigns').insert([
      {
        id: campaignId,
        user_id: userId,
        name: 'GlowHydrate Launch',
        product_name: 'GlowHydrate Serum',
        call_to_action: 'Shop Now',
        status: 'READY',
      },
    ]);

    await supabase.from('workflow_executions').insert([
      {
        id: executionId,
        campaign_id: campaignId,
        current_step: 'RENDERING',
        status: 'RUNNING',
      },
    ]);

    // Insert canonical timeline
    await supabase.from('timelines').insert([
      {
        id: canonicalTimelineId,
        campaign_id: campaignId,
        workflow_execution_id: executionId,
        version: '1.0',
        duration_ms: 10000,
        timeline_data: {
          id: canonicalTimelineId,
          version: '1.0',
          campaignId,
          workflowExecutionId: executionId,
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
                  assetId: 'asset-video-1',
                  sourceUrl: 'https://res.cloudinary.com/demo/video/upload/scene1.mp4',
                  startMs: 0,
                  durationMs: 5000,
                  sequenceNumber: 1,
                },
                {
                  id: crypto.randomUUID(),
                  sceneId: 'scene-2',
                  assetId: 'asset-video-2',
                  sourceUrl: 'https://res.cloudinary.com/demo/video/upload/scene2.mp4',
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
                  sourceUrl: 'https://res.cloudinary.com/demo/video/upload/audio1.mp3',
                  startMs: 0,
                  durationMs: 5000,
                  volume: 1.0,
                  sequenceNumber: 1,
                },
                {
                  id: crypto.randomUUID(),
                  sceneId: 'scene-2',
                  sourceUrl: 'https://res.cloudinary.com/demo/video/upload/audio2.mp3',
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

  it('should execute full adaptation pipeline: create -> render -> evaluate -> approved', async () => {
    // 1. Create adaptation
    const adaptation = await adaptationService.createAdaptation({
      campaignId,
      workflowExecutionId: executionId,
      sourceTimelineId: canonicalTimelineId,
      platform: ADAPTATION_PLATFORMS.TIKTOK,
      user,
    });

    assert.ok(adaptation.id);
    assert.equal(adaptation.platform, ADAPTATION_PLATFORMS.TIKTOK);
    assert.equal(adaptation.status, ADAPTATION_STATUS.PLANNED);
    assert.ok(adaptation.timeline_id);

    // 2. Execute adaptation (Render + Evaluate)
    const executed = await adaptationService.executeAdaptation(adaptation.id, {
      user,
      runRender: true,
      runEvaluation: true,
    });

    assert.equal(executed.status, ADAPTATION_STATUS.APPROVED);
    assert.ok(executed.render_job_id);
    assert.ok(executed.final_video_id);
    assert.ok(executed.evaluation_id);

    // 3. Verify Events Emitted
    const { data: events } = await supabase
      .from('workflow_events')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true });

    const eventTypes = events.map((e) => e.event_type);
    assert.ok(eventTypes.includes(WORKFLOW_EVENT_TYPES.ADAPTATION_CREATED));
    assert.ok(eventTypes.includes(WORKFLOW_EVENT_TYPES.ADAPTATION_PLANNED));
    assert.ok(eventTypes.includes(WORKFLOW_EVENT_TYPES.ADAPTATION_TRANSFORMED));
    assert.ok(eventTypes.includes(WORKFLOW_EVENT_TYPES.ADAPTATION_VALIDATED));
    assert.ok(eventTypes.includes(WORKFLOW_EVENT_TYPES.ADAPTATION_RENDER_STARTED));
    assert.ok(eventTypes.includes(WORKFLOW_EVENT_TYPES.ADAPTATION_RENDER_COMPLETED));
    assert.ok(eventTypes.includes(WORKFLOW_EVENT_TYPES.ADAPTATION_EVALUATION_STARTED));
    assert.ok(eventTypes.includes(WORKFLOW_EVENT_TYPES.ADAPTATION_EVALUATION_COMPLETED));
    assert.ok(eventTypes.includes(WORKFLOW_EVENT_TYPES.ADAPTATION_APPROVED));
  });

  it('should support reviseAdaptation on warning or revision request', async () => {
    // 1. Create adaptation
    const adaptation = await adaptationService.createAdaptation({
      campaignId,
      workflowExecutionId: executionId,
      sourceTimelineId: canonicalTimelineId,
      platform: ADAPTATION_PLATFORMS.TIKTOK,
      user,
    });

    // Manually mark status as WARNING to simulate a condition requiring revision
    await adaptationService.transitionStatus(adaptation.id, ADAPTATION_STATUS.WARNING);

    // 2. Execute revision
    const revised = await adaptationService.reviseAdaptation(adaptation.id, {
      user,
      maxAttempts: 2,
    });

    assert.equal(revised.status, ADAPTATION_STATUS.APPROVED);
    assert.ok(revised.final_video_id);
    assert.ok(revised.evaluation_id);

    // Verify revision event was recorded
    const { data: events } = await supabase
      .from('workflow_events')
      .select('*')
      .eq('event_type', WORKFLOW_EVENT_TYPES.ADAPTATION_REVISION_STARTED);

    assert.ok(events && events.length > 0);
  });
});
