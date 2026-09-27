import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { runStep, registerStepHandler, resetStepHandlers } from '../../src/orchestration/stepRunner.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';

describe('Step Runner & Handlers Unit Tests', () => {
  beforeEach(() => {
    memoryDb.reset();
    resetStepHandlers();
  });

  afterEach(() => {
    resetStepHandlers();
  });

  const mockCampaign = {
    id: 'camp-123',
    user_id: 'user-123',
    title: 'Summer Launch',
    goal: 'Boost Sales',
    product_name: 'HydroBottle Pro',
    aspect_ratio: '9:16',
    duration_seconds: 30,
    target_platform: 'tiktok',
    call_to_action: 'Get 20% off today!',
  };

  it('should run CONTEXT_INGESTION and produce brand/creative constraints', async () => {
    const step = {
      id: 'step-1',
      execution_id: 'exec-1',
      step_name: 'CONTEXT_INGESTION',
      sequence_number: 1,
      max_retries: 3,
      retry_count: 0,
      status: 'PENDING',
    };
    await supabase.from('workflow_steps').insert(step);

    const context = { campaign: mockCampaign };
    const output = await runStep(step, context);

    assert.ok(output.creativeConstraints);
    assert.equal(output.creativeConstraints.aspectRatio, '9:16');
    assert.equal(output.creativeConstraints.durationSeconds, 30);
    assert.ok(output.keyThemes.includes('HydroBottle Pro'));

    const { data: stepInDb } = await supabase.from('workflow_steps').select('*').eq('id', 'step-1').single();
    assert.equal(stepInDb.status, 'COMPLETED');
    assert.ok(stepInDb.output_artifact);
  });

  it('should run all 6 workflow stages in sequence and produce comprehensive artifacts', async () => {
    const context = { campaign: mockCampaign };

    const stages = [
      { name: 'CONTEXT_INGESTION', key: 'contextIngestion' },
      { name: 'DIRECTOR', key: 'director' },
      { name: 'SCREENWRITER', key: 'screenwriter' },
      { name: 'CRITIC', key: 'critic' },
      { name: 'CINEMATOGRAPHER', key: 'cinematographer' },
      { name: 'PROMPT_COMPILER', key: 'promptCompiler' },
    ];

    for (let i = 0; i < stages.length; i++) {
      const step = {
        id: `s-${i + 1}`,
        execution_id: 'exec-seq',
        step_name: stages[i].name,
        sequence_number: i + 1,
        max_retries: 3,
        retry_count: 0,
        status: 'PENDING',
      };
      await supabase.from('workflow_steps').insert(step);
      const out = await runStep(step, context);
      context[stages[i].key] = out;
      assert.ok(out);
    }

    assert.ok(context.contextIngestion.brandSummary);
    assert.ok(context.director.conceptTitle);
    assert.equal(context.screenwriter.scenes.length, 4);
    assert.equal(context.critic.passed, true);
    assert.equal(context.cinematographer.cameraShots.length, 4);
    assert.equal(context.promptCompiler.prompts.length, 4);
  });

  it('should retry a failing step up to max_retries and recover on subsequent attempt', async () => {
    let attempts = 0;
    registerStepHandler('TEST_RETRY_STEP', async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error(`Transient network glitch on attempt ${attempts}`);
      }
      return { success: true, attemptsTaken: attempts };
    });

    const step = {
      id: 'step-retry-1',
      execution_id: 'exec-retry',
      step_name: 'TEST_RETRY_STEP',
      sequence_number: 1,
      max_retries: 3,
      retry_count: 0,
      status: 'PENDING',
    };
    await supabase.from('workflow_steps').insert(step);

    const output = await runStep(step, { campaign: mockCampaign });

    assert.equal(attempts, 3);
    assert.equal(output.success, true);

    const { data: stepInDb } = await supabase.from('workflow_steps').select('*').eq('id', 'step-retry-1').single();
    assert.equal(stepInDb.status, 'COMPLETED');
    assert.equal(stepInDb.retry_count, 2);
  });

  it('should transition step to FAILED and throw error when max_retries are exceeded', async () => {
    registerStepHandler('TEST_FAIL_STEP', async () => {
      throw new Error('Permanent database failure');
    });

    const step = {
      id: 'step-fail-1',
      execution_id: 'exec-fail',
      step_name: 'TEST_FAIL_STEP',
      sequence_number: 1,
      max_retries: 2,
      retry_count: 0,
      status: 'PENDING',
    };
    await supabase.from('workflow_steps').insert(step);

    await assert.rejects(
      async () => {
        await runStep(step, { campaign: mockCampaign });
      },
      /failed after 2 retries/
    );

    const { data: stepInDb } = await supabase.from('workflow_steps').select('*').eq('id', 'step-fail-1').single();
    assert.equal(stepInDb.status, 'FAILED');
    assert.equal(stepInDb.retry_count, 3);
    assert.ok(stepInDb.error_message.includes('Permanent database failure'));
  });
});
