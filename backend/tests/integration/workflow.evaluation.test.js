import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import {
  createWorkflowExecution,
  executeWorkflowJob,
  EVALUATION_WORKFLOW_STAGES,
} from '../../src/orchestration/engine.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { workflowQueue } from '../../src/orchestration/queue.js';
import { rendererRegistry } from '../../src/services/rendering/renderer.registry.js';
import { mockRenderer } from '../../src/services/rendering/mock-renderer.js';

describe('Workflow 13-Stage Quality Evaluation Pipeline Integration Tests', () => {
  const userId = 'user-eval-e2e-1';
  let campaignId;

  beforeEach(async () => {
    memoryDb.reset();
    workflowQueue.clear();

    rendererRegistry.register('mock', mockRenderer, { isDefault: true });

    await supabase.from('users').insert({
      id: userId,
      email: 'creator-eval@example.com',
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

  it('should execute complete 13-stage pipeline from context ingestion to quality evaluation', async () => {
    // 1. Create execution with evaluation stage enabled (13 stages)
    const { execution } = await createWorkflowExecution({
      campaignId,
      userId,
      includeEvaluation: true,
      idempotencyKey: 'e2e-eval-idemp-1',
    });

    assert.ok(execution.id);
    assert.equal(execution.status, 'QUEUED');

    // Verify 13 workflow steps are registered
    const { data: initialSteps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .order('sequence_number', { ascending: true });

    assert.equal(initialSteps.length, 13);
    assert.equal(initialSteps[0].step_name, 'CONTEXT_INGESTION');
    assert.equal(initialSteps[9].step_name, 'TIMELINE_BUILD');
    assert.equal(initialSteps[10].step_name, 'VIDEO_RENDER');
    assert.equal(initialSteps[11].step_name, 'FINAL_VIDEO_PERSISTENCE');
    assert.equal(initialSteps[12].step_name, 'QUALITY_EVALUATION');

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

    // 4. Verify all 13 steps COMPLETED
    const { data: finishedSteps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .order('sequence_number', { ascending: true });

    for (const step of finishedSteps) {
      assert.equal(step.status, 'COMPLETED', `Step ${step.step_name} did not complete`);
      assert.ok(step.output_artifact, `Step ${step.step_name} missing output artifact`);
    }

    // 5. Verify Subtitles asset was generated during TIMELINE_BUILD
    const { data: subAssets } = await supabase
      .from('assets')
      .select('*')
      .eq('workflow_execution_id', execution.id)
      .eq('asset_type', 'subtitles');

    assert.equal(subAssets.length, 1);
    assert.ok(subAssets[0].url);

    // 6. Verify Quality Evaluation record persisted in Supabase
    const { data: evaluations } = await supabase
      .from('quality_evaluations')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('workflow_execution_id', execution.id);

    assert.equal(evaluations.length, 1);
    const evaluation = evaluations[0];
    assert.equal(evaluation.evaluation_version, '1.0');
    assert.ok(Number(evaluation.overall_score) > 0);
    assert.ok(Number(evaluation.threshold) > 0);
    assert.equal(Boolean(evaluation.passed), true);
    assert.ok(evaluation.dimensions.productFidelity);
    assert.ok(evaluation.dimensions.brandConsistency);
    assert.ok(evaluation.dimensions.visualQuality);
    assert.equal(evaluation.technical_checks.videoReadable, true);

    // 7. Verify evaluation provenance
    const { data: finalVideo } = await supabase
      .from('final_videos')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    assert.equal(evaluation.final_video_id, finalVideo.id);

    // 8. Verify workflow events emitted for evaluation and subtitles
    const { data: events } = await supabase
      .from('workflow_events')
      .select('event_type')
      .eq('execution_id', execution.id);

    const eventTypes = events.map((e) => e.event_type);
    assert.ok(eventTypes.includes('SUBTITLE_GENERATED'));
    assert.ok(eventTypes.includes('QUALITY_EVALUATION_STARTED'));
    assert.ok(eventTypes.includes('QUALITY_EVALUATION_COMPLETED'));
    assert.ok(eventTypes.includes('WORKFLOW_COMPLETED'));
  });

  it('should support workflow idempotency and avoid duplicate evaluations', async () => {
    // Run initial execution
    const { execution: exec1 } = await createWorkflowExecution({
      campaignId,
      userId,
      includeEvaluation: true,
      idempotencyKey: 'idemp-eval-test-1',
    });

    const job1 = { data: { executionId: exec1.id, campaignId, userId } };
    await executeWorkflowJob(job1);

    // Try creating duplicate with same idempotency key
    const { execution: exec2, isExisting } = await createWorkflowExecution({
      campaignId,
      userId,
      includeEvaluation: true,
      idempotencyKey: 'idemp-eval-test-1',
    });

    assert.equal(isExisting, true);
    assert.equal(exec2.id, exec1.id);

    // Verify only 1 evaluation record exists in database
    const { data: evaluations } = await supabase
      .from('quality_evaluations')
      .select('*')
      .eq('campaign_id', campaignId);

    assert.equal(evaluations.length, 1);
  });
});
