import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { createWorkflowExecution, executeWorkflowJob } from '../../src/orchestration/engine.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { workflowQueue } from '../../src/orchestration/queue.js';
import { NotFoundError } from '../../src/core/errors/AppError.js';

describe('Workflow Engine Unit Tests', () => {
  const userId = 'user-owner-1';
  let campaignId;

  beforeEach(async () => {
    memoryDb.reset();
    workflowQueue.clear();

    await supabase.from('users').insert({
      id: userId,
      email: 'owner@example.com',
      role: 'creator',
    });

    const { data: campaign } = await supabase.from('campaigns').insert({
      user_id: userId,
      title: 'Viral Smart Watch',
      goal: 'Maximize Conversions',
      product_name: 'SmartWatch X',
      aspect_ratio: '9:16',
      duration_seconds: 30,
      target_platform: 'tiktok',
      status: 'DRAFT',
    });

    campaignId = campaign.id;
  });

  it('should initialize workflow execution with 6 pending steps and QUEUED status', async () => {
    const { execution, isExisting } = await createWorkflowExecution({
      campaignId,
      userId,
      idempotencyKey: 'idemp-key-001',
    });

    assert.equal(isExisting, false);
    assert.ok(execution.id);
    assert.equal(execution.status, 'QUEUED');
    assert.equal(execution.progress_percent, 0);

    const { data: steps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .order('sequence_number', { ascending: true });

    assert.equal(steps.length, 6);
    assert.equal(steps[0].step_name, 'CONTEXT_INGESTION');
    assert.equal(steps[5].step_name, 'PROMPT_COMPILER');
    assert.ok(steps.every((s) => s.status === 'PENDING'));

    const queuedJob = workflowQueue.getJob(execution.id);
    assert.ok(queuedJob);
    assert.equal(queuedJob.data.executionId, execution.id);
  });

  it('should enforce idempotency by returning existing execution without re-queueing', async () => {
    const firstCall = await createWorkflowExecution({
      campaignId,
      userId,
      idempotencyKey: 'idemp-duplicate-test',
    });

    assert.equal(firstCall.isExisting, false);

    const secondCall = await createWorkflowExecution({
      campaignId,
      userId,
      idempotencyKey: 'idemp-duplicate-test',
    });

    assert.equal(secondCall.isExisting, true);
    assert.equal(secondCall.execution.id, firstCall.execution.id);

    const { data: steps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', firstCall.execution.id);

    assert.equal(steps.length, 6);
  });

  it('should reject workflow creation when user does not own the campaign', async () => {
    const unauthorizedUserId = 'intruder-user-999';

    await assert.rejects(
      async () => {
        await createWorkflowExecution({
          campaignId,
          userId: unauthorizedUserId,
        });
      },
      (err) => err instanceof NotFoundError
    );
  });

  it('should execute entire 6-stage workflow and mark execution and campaign COMPLETED', async () => {
    const { execution } = await createWorkflowExecution({
      campaignId,
      userId,
      idempotencyKey: 'e2e-exec-test',
    });

    await executeWorkflowJob({
      data: {
        executionId: execution.id,
        campaignId,
        userId,
      },
    });

    const { data: finalExec } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', execution.id)
      .single();

    assert.equal(finalExec.status, 'COMPLETED');
    assert.equal(finalExec.current_stage, 'COMPLETED');
    assert.equal(finalExec.progress_percent, 100);
    assert.ok(finalExec.completed_at);

    const { data: finalCampaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    assert.equal(finalCampaign.status, 'COMPLETED');

    const { data: finalSteps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id);

    assert.equal(finalSteps.length, 6);
    assert.ok(finalSteps.every((s) => s.status === 'COMPLETED' && s.output_artifact));
  });
});
