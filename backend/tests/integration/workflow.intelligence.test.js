import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { createWorkflowExecution, executeWorkflowJob } from '../../src/orchestration/engine.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { workflowQueue } from '../../src/orchestration/queue.js';
import { marketingStrategySchema } from '../../src/services/strategy/strategy.schema.js';
import { conceptListSchema } from '../../src/services/concept/concept.schema.js';
import { creativeBibleSchema } from '../../src/services/creative-direction/creative-direction.schema.js';
import { generationSpecificationSchema } from '../../src/services/prompt/prompt.schema.js';

describe('Workflow Intelligence E2E Integration Tests', () => {
  const userId = 'user-e2e-intelligence';
  let campaignId;

  beforeEach(async () => {
    memoryDb.reset();
    workflowQueue.clear();

    await supabase.from('users').insert({
      id: userId,
      email: 'intel@example.com',
      role: 'creator',
    });

    const { data: campaign } = await supabase.from('campaigns').insert({
      user_id: userId,
      title: 'SolarFlow Smart Thermostat',
      goal: 'Pre-order Conversions',
      product_name: 'SolarFlow Pro',
      product_summary: 'Self-charging wireless smart thermostat with AI energy optimization',
      unique_points: 'Solar harvesting glass, zero battery changes, 30% lower energy bills',
      call_to_action: 'Order now for 25% early-bird discount',
      target_platform: 'tiktok',
      aspect_ratio: '9:16',
      duration_seconds: 30,
      status: 'DRAFT',
    });

    campaignId = campaign.id;
  });

  it('should run end-to-end multi-stage pipeline and produce validated intelligence artifacts in PostgreSQL', async () => {
    // 1. Create and queue execution
    const { execution } = await createWorkflowExecution({
      campaignId,
      userId,
      idempotencyKey: 'intel-e2e-run-001',
    });

    assert.ok(execution.id);
    assert.equal(execution.status, 'QUEUED');

    // 2. Process workflow job
    await executeWorkflowJob({
      data: {
        executionId: execution.id,
        campaignId,
        userId,
      },
    });

    // 3. Verify final execution state
    const { data: finalExec } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', execution.id)
      .single();

    assert.equal(finalExec.status, 'COMPLETED');
    assert.equal(finalExec.progress_percent, 100);
    assert.ok(finalExec.completed_at);

    // 4. Verify campaign state
    const { data: finalCampaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    assert.equal(finalCampaign.status, 'COMPLETED');

    // 5. Verify all steps and their validated intelligence artifacts
    const { data: steps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .order('sequence_number', { ascending: true });

    assert.equal(steps.length, 6);

    // Step 1: CONTEXT_INGESTION
    const step1 = steps.find((s) => s.step_name === 'CONTEXT_INGESTION');
    assert.equal(step1.status, 'COMPLETED');
    assert.ok(step1.output_artifact.strategy);
    const validStrategy = marketingStrategySchema.parse(step1.output_artifact.strategy);
    assert.ok(validStrategy.campaign_objective);
    assert.ok(validStrategy.marketing_angle);

    // Step 2: DIRECTOR
    const step2 = steps.find((s) => s.step_name === 'DIRECTOR');
    assert.equal(step2.status, 'COMPLETED');
    assert.ok(step2.output_artifact.conceptTitle);
    assert.ok(step2.output_artifact.concepts);
    const validConcepts = conceptListSchema.parse({ concepts: step2.output_artifact.concepts });
    assert.ok(validConcepts.concepts.length >= 2);

    // Step 3: SCREENWRITER
    const step3 = steps.find((s) => s.step_name === 'SCREENWRITER');
    assert.equal(step3.status, 'COMPLETED');
    assert.ok(step3.output_artifact.creativeBible);
    const validBible = creativeBibleSchema.parse(step3.output_artifact.creativeBible);
    assert.ok(validBible.visual_style);
    assert.equal(step3.output_artifact.scenes.length, 4);

    // Step 4: CRITIC
    const step4 = steps.find((s) => s.step_name === 'CRITIC');
    assert.equal(step4.status, 'COMPLETED');
    assert.equal(step4.output_artifact.passed, true);
    assert.ok(step4.output_artifact.score >= 80);

    // Step 5: CINEMATOGRAPHER
    const step5 = steps.find((s) => s.step_name === 'CINEMATOGRAPHER');
    assert.equal(step5.status, 'COMPLETED');
    assert.equal(step5.output_artifact.cameraShots.length, 4);

    // Step 6: PROMPT_COMPILER
    const step6 = steps.find((s) => s.step_name === 'PROMPT_COMPILER');
    assert.equal(step6.status, 'COMPLETED');
    assert.equal(step6.output_artifact.prompts.length, 4);

    for (const promptItem of step6.output_artifact.prompts) {
      assert.ok(promptItem.visualPrompt);
      assert.ok(promptItem.specification);
      const validSpec = generationSpecificationSchema.parse(promptItem.specification);
      assert.ok(validSpec.compiled_positive_prompt);
      assert.ok(validSpec.compiled_negative_prompt);
      assert.equal(validSpec.aspect_ratio, '9:16');
    }
  });
});
