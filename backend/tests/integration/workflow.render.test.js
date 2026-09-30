import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import {
  createWorkflowExecution,
  executeWorkflowJob,
  RENDER_WORKFLOW_STAGES,
} from '../../src/orchestration/engine.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { workflowQueue } from '../../src/orchestration/queue.js';
import { rendererRegistry } from '../../src/services/rendering/renderer.registry.js';
import { mockRenderer } from '../../src/services/rendering/mock-renderer.js';

describe('Workflow 12-Stage Timeline & Render Pipeline Integration Tests', () => {
  const userId = 'user-render-e2e-1';
  let campaignId;

  beforeEach(async () => {
    memoryDb.reset();
    workflowQueue.clear();

    rendererRegistry.register('mock', mockRenderer, { isDefault: true });

    await supabase.from('users').insert({
      id: userId,
      email: 'filmmaker@example.com',
      role: 'creator',
    });

    const { data: campaign } = await supabase.from('campaigns').insert({
      user_id: userId,
      title: 'Apex Energy Drink Commercial',
      goal: 'Launch High Energy Drink',
      product_name: 'Apex Surge',
      aspect_ratio: '9:16',
      duration_seconds: 15,
      target_platform: 'tiktok',
      call_to_action: 'Fuel Your Focus Now',
      status: 'DRAFT',
    });

    campaignId = campaign.id;
  });

  it('should execute complete 12-stage pipeline from context ingestion to final video persistence', async () => {
    // 1. Create execution with render stages enabled (12 stages)
    const { execution } = await createWorkflowExecution({
      campaignId,
      userId,
      includeRender: true,
      idempotencyKey: 'e2e-render-idemp-1',
    });

    assert.ok(execution.id);
    assert.equal(execution.status, 'QUEUED');

    // Verify 12 workflow steps are registered
    const { data: initialSteps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .order('sequence_number', { ascending: true });

    assert.equal(initialSteps.length, 12);
    assert.equal(initialSteps[0].step_name, 'CONTEXT_INGESTION');
    assert.equal(initialSteps[8].step_name, 'ASSET_PERSISTENCE');
    assert.equal(initialSteps[9].step_name, 'TIMELINE_BUILD');
    assert.equal(initialSteps[10].step_name, 'VIDEO_RENDER');
    assert.equal(initialSteps[11].step_name, 'FINAL_VIDEO_PERSISTENCE');

    // 2. Execute workflow job
    const job = { data: { executionId: execution.id, campaignId, userId } };
    await executeWorkflowJob(job);

    // 3. Verify workflow execution finished with COMPLETED status
    const { data: finishedExecution } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', execution.id)
      .single();

    assert.equal(finishedExecution.status, 'COMPLETED');
    assert.equal(finishedExecution.progress_percent, 100);

    // 4. Verify all 12 steps COMPLETED
    const { data: finishedSteps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .order('sequence_number', { ascending: true });

    for (const step of finishedSteps) {
      assert.equal(step.status, 'COMPLETED', `Step ${step.step_name} did not complete`);
      assert.ok(step.output_artifact, `Step ${step.step_name} missing output artifact`);
    }

    // 5. Verify Timeline record persisted in Supabase
    const { data: timelines } = await supabase
      .from('timelines')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('workflow_execution_id', execution.id);

    assert.equal(timelines.length, 1);
    const timeline = timelines[0];
    assert.equal(timeline.status, 'READY');
    assert.ok(timeline.duration_ms > 0);
    assert.equal(timeline.timeline_data.output.aspectRatio, '9:16');
    assert.ok(timeline.timeline_data.tracks.length >= 1);

    // 6. Verify Render Job record in Supabase
    const { data: renderJobs } = await supabase
      .from('render_jobs')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('workflow_execution_id', execution.id);

    assert.equal(renderJobs.length, 1);
    const renderJob = renderJobs[0];
    assert.equal(renderJob.status, 'COMPLETED');
    assert.equal(renderJob.renderer, 'mock');

    // 7. Verify Final Video record in Supabase with complete provenance
    const { data: finalVideos } = await supabase
      .from('final_videos')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('workflow_execution_id', execution.id);

    assert.equal(finalVideos.length, 1);
    const finalVideo = finalVideos[0];
    assert.equal(finalVideo.campaign_id, campaignId);
    assert.equal(finalVideo.timeline_id, timeline.id);
    assert.equal(finalVideo.render_job_id, renderJob.id);
    assert.equal(finalVideo.renderer, 'mock');
    assert.equal(finalVideo.status, 'COMPLETED');
    assert.ok(finalVideo.url);
    assert.equal(finalVideo.width, 1080);
    assert.equal(finalVideo.height, 1920);

    // 8. Verify campaign status is COMPLETED
    const { data: campaignRecord } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    assert.equal(campaignRecord.status, 'COMPLETED');

    // 9. Verify workflow events emitted
    const { data: events } = await supabase
      .from('workflow_events')
      .select('event_type')
      .eq('execution_id', execution.id);

    const eventTypes = events.map((e) => e.event_type);
    assert.ok(eventTypes.includes('TIMELINE_CREATED'));
    assert.ok(eventTypes.includes('RENDER_JOB_CREATED'));
    assert.ok(eventTypes.includes('RENDER_PROCESSING'));
    assert.ok(eventTypes.includes('RENDER_COMPLETED'));
    assert.ok(eventTypes.includes('FINAL_VIDEO_CREATED'));
    assert.ok(eventTypes.includes('WORKFLOW_COMPLETED'));
  });

  it('should support workflow idempotency and crash recovery for render stages', async () => {
    // 1. Create first execution
    const { execution: exec1 } = await createWorkflowExecution({
      campaignId,
      userId,
      includeRender: true,
      idempotencyKey: 'idemp-render-recover-1',
    });

    const job1 = { data: { executionId: exec1.id, campaignId, userId } };
    await executeWorkflowJob(job1);

    // 2. Try to create execution again with same idempotency key
    const { execution: exec2, isExisting } = await createWorkflowExecution({
      campaignId,
      userId,
      includeRender: true,
      idempotencyKey: 'idemp-render-recover-1',
    });

    assert.equal(isExisting, true);
    assert.equal(exec2.id, exec1.id);

    // Verify no duplicate final video was created
    const { data: finalVideos } = await supabase
      .from('final_videos')
      .select('*')
      .eq('campaign_id', campaignId);
    assert.equal(finalVideos.length, 1);
  });
});
