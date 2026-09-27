import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { recoverWorkflows } from '../../src/orchestration/engine.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { workflowQueue } from '../../src/orchestration/queue.js';

describe('Workflow Crash Recovery Integration Tests', () => {
  beforeEach(() => {
    memoryDb.reset();
    workflowQueue.clear();
  });

  it('should detect orphaned RUNNING workflow on startup, reset running steps, and re-enqueue', async () => {
    const campaignId = 'camp-crash-1';
    const executionId = 'exec-crash-1';
    const userId = 'user-crash-1';

    await supabase.from('campaigns').insert({
      id: campaignId,
      user_id: userId,
      title: 'Crash Recovery Test Campaign',
      goal: 'Recovery verification',
      product_name: 'ResilientBox',
      status: 'GENERATING',
    });

    await supabase.from('workflow_executions').insert({
      id: executionId,
      campaign_id: campaignId,
      user_id: userId,
      status: 'RUNNING',
      current_stage: 'SCREENWRITER',
      progress_percent: 33,
    });

    await supabase.from('workflow_steps').insert({
      id: 'step-done-1',
      execution_id: executionId,
      step_name: 'CONTEXT_INGESTION',
      sequence_number: 1,
      status: 'COMPLETED',
      output_artifact: { ready: true },
    });

    await supabase.from('workflow_steps').insert({
      id: 'step-stuck-2',
      execution_id: executionId,
      step_name: 'DIRECTOR',
      sequence_number: 2,
      status: 'RUNNING',
    });

    await supabase.from('workflow_steps').insert({
      id: 'step-pending-3',
      execution_id: executionId,
      step_name: 'SCREENWRITER',
      sequence_number: 3,
      status: 'PENDING',
    });

    const recoveryResult = await recoverWorkflows();

    assert.equal(recoveryResult.recoveredCount, 1);

    const { data: step2 } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('id', 'step-stuck-2')
      .single();

    assert.equal(step2.status, 'PENDING');

    const { data: step1 } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('id', 'step-done-1')
      .single();

    assert.equal(step1.status, 'COMPLETED');

    const { data: events } = await supabase
      .from('workflow_events')
      .select('*')
      .eq('execution_id', executionId)
      .eq('event_type', 'WORKFLOW_RECOVERED');

    assert.equal(events.length, 1);
    assert.equal(events[0].payload.previousStatus, 'RUNNING');

    const queuedJob = workflowQueue.getJob(executionId);
    assert.ok(queuedJob);
    assert.equal(queuedJob.data.executionId, executionId);
  });

  it('should report recoveredCount: 0 when no orphaned workflows exist', async () => {
    const recoveryResult = await recoverWorkflows();
    assert.equal(recoveryResult.recoveredCount, 0);
  });
});
