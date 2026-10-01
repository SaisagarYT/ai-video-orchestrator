import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.NODE_ENV = 'test';

import {
  createWorkflowExecution,
  executeWorkflowJob,
  MEMORY_WORKFLOW_STAGES,
} from '../../src/orchestration/engine.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { workflowQueue } from '../../src/orchestration/queue.js';
import { memoryRepository } from '../../src/memory/memoryRepository.js';

describe('Memory Workflow Pipeline Integration Tests', () => {
  const userId = 'user-memory-wf-1';
  let businessId;
  let campaignId;

  beforeEach(async () => {
    memoryDb.reset();
    workflowQueue.clear();

    businessId = crypto.randomUUID();

    await supabase.from('users').insert({
      id: userId,
      email: 'director@production.com',
      role: 'creator',
    });

    await supabase.from('businesses').insert({
      id: businessId,
      user_id: userId,
      name: 'CyberAura Tech',
      tone_of_voice: 'Futuristic and hyper-dynamic',
      brand_colors: '#00FFA3, #03001C',
    });

    // Brand Hard Constraint
    await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'PRODUCT_PRESENTATION',
      key: 'hero_lockup',
      value: 'Hero device must always remain centered and upright',
      type: 'HARD_CONSTRAINT',
      priority: 80,
      status: 'ACTIVE',
    });

    // Negative Constraint
    await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'NEGATIVE_CONSTRAINT',
      key: 'no_retro_sepia',
      value: 'no vintage sepia or 80s synthwave styling',
      type: 'HARD_CONSTRAINT',
      priority: 80,
      status: 'ACTIVE',
    });

    // Creative Pattern
    await memoryRepository.createCreativeMemoryItem({
      business_id: businessId,
      category: 'HOOK',
      pattern: 'Rapid Neon Flash Disruption',
      constraints: ['Initial cut within 1.2s'],
      status: 'ACTIVE',
    });

    const { data: campaign } = await supabase.from('campaigns').insert({
      user_id: userId,
      business_id: businessId,
      title: 'HoloGlow Earbuds Launch',
      goal: 'Launch New Audio Wearable',
      product_name: 'HoloGlow X',
      aspect_ratio: '9:16',
      duration_seconds: 15,
      target_platform: 'tiktok',
      call_to_action: 'Experience Tomorrow Today',
      status: 'DRAFT',
    });

    campaignId = campaign.id;
  });

  it('should execute workflow with MEMORY_RETRIEVAL stage, freeze memory snapshot, and pass memory to Director and Screenwriter', async () => {
    const { execution } = await createWorkflowExecution({
      campaignId,
      userId,
      includeMemory: true,
      idempotencyKey: 'wf-memory-test-1',
    });

    assert.equal(execution.status, 'QUEUED');

    // Verify MEMORY_WORKFLOW_STAGES (7 stages)
    const { data: initialSteps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .order('sequence_number', { ascending: true });

    assert.equal(initialSteps.length, 7);
    assert.equal(initialSteps[0].step_name, 'CONTEXT_INGESTION');
    assert.equal(initialSteps[1].step_name, 'MEMORY_RETRIEVAL');
    assert.equal(initialSteps[2].step_name, 'DIRECTOR');
    assert.equal(initialSteps[3].step_name, 'SCREENWRITER');
    assert.equal(initialSteps[6].step_name, 'PROMPT_COMPILER');

    // Execute workflow
    const job = { data: { executionId: execution.id, campaignId, userId } };
    await executeWorkflowJob(job);

    // 1. Verify MEMORY_RETRIEVAL step output
    const { data: memStep } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .eq('step_name', 'MEMORY_RETRIEVAL')
      .single();

    assert.equal(memStep.status, 'COMPLETED');
    const memorySnapshot = memStep.output_artifact;
    assert.ok(memorySnapshot);
    assert.equal(memorySnapshot.brandId, businessId);
    assert.equal(memorySnapshot.hardConstraints.length, 1);
    assert.equal(memorySnapshot.hardConstraints[0].key, 'hero_lockup');
    assert.equal(memorySnapshot.negativeConstraints.length, 1);
    assert.equal(memorySnapshot.negativeConstraints[0].key, 'no_retro_sepia');

    // 2. Verify SCREENWRITER incorporated brand colors & negative constraints into creative bible
    const { data: screenwriterStep } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .eq('step_name', 'SCREENWRITER')
      .single();

    assert.equal(screenwriterStep.status, 'COMPLETED');
    const creativeBible = screenwriterStep.output_artifact.creativeBible;
    assert.match(creativeBible.color_palette, /#00FFA3, #03001C/);
    assert.match(creativeBible.negative_prompts, /no vintage sepia/);

    // 3. Verify PROMPT_COMPILER compiled brand hard constraints into positive prompts
    const { data: compilerStep } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .eq('step_name', 'PROMPT_COMPILER')
      .single();

    assert.equal(compilerStep.status, 'COMPLETED');
    const prompts = compilerStep.output_artifact.prompts;
    assert.ok(prompts.length > 0);
    assert.match(
      prompts[0].visualPrompt,
      /Brand Invariants: Hero device must always remain centered and upright/
    );
  });
});

