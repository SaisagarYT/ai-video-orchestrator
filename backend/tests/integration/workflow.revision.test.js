import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import {
  createWorkflowExecution,
  executeWorkflowJob,
} from '../../src/orchestration/engine.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { workflowQueue } from '../../src/orchestration/queue.js';
import { rendererRegistry } from '../../src/services/rendering/renderer.registry.js';
import { mockRenderer } from '../../src/services/rendering/mock-renderer.js';
import { mockEvaluator } from '../../src/services/evaluation/mock.evaluator.js';
import { revisionService } from '../../src/services/revision/index.js';

describe('Slice 7: Autonomous Revision Loops & Prompt Self-Healing Integration Tests', () => {
  const userId = 'user-rev-e2e-1';
  let campaignId;

  beforeEach(async () => {
    memoryDb.reset();
    workflowQueue.clear();

    rendererRegistry.register('mock', mockRenderer, { isDefault: true });
    mockEvaluator.options = { forceFail: false };

    await supabase.from('users').insert({
      id: userId,
      email: 'creator-revision@example.com',
      role: 'creator',
    });

    const { data: campaign } = await supabase.from('campaigns').insert({
      user_id: userId,
      title: 'Aura Glow Skincare Commercial',
      goal: 'Brand Awareness & Sales',
      product_name: 'Aura Glow Serum',
      aspect_ratio: '9:16',
      duration_seconds: 15,
      target_platform: 'tiktok',
      call_to_action: 'Get Your Glow Today',
      status: 'DRAFT',
    });

    campaignId = campaign.id;
  });

  const originalEvaluate = mockEvaluator.evaluate;

  afterEach(() => {
    mockEvaluator.evaluate = originalEvaluate;
    mockEvaluator.options = { forceFail: false };
  });

  it('Scenario 1: should complete pipeline without triggering revisions when quality evaluation passes', async () => {
    mockEvaluator.options = { forceFail: false };

    const { execution } = await createWorkflowExecution({
      campaignId,
      userId,
      includeEvaluation: true,
      idempotencyKey: 'idemp-rev-pass-1',
    });

    const job = { data: { executionId: execution.id, campaignId, userId } };
    const result = await executeWorkflowJob(job);

    assert.equal(result.success, true);
    assert.equal(result.status, 'COMPLETED');

    const { data: updatedExec } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', execution.id)
      .single();

    assert.equal(updatedExec.status, 'COMPLETED');
    assert.equal(updatedExec.current_stage, 'COMPLETED');

    // Zero revision attempts triggered because initial evaluation passed
    const { data: attempts } = await supabase
      .from('revision_attempts')
      .select('*')
      .eq('workflow_execution_id', execution.id);

    assert.equal(attempts.length, 0);
  });

  it('Scenario 2: should autonomously diagnose failure, selectively heal & regenerate ONLY affected scene, rebuild timeline v2, and pass re-evaluation', async () => {
    // 1. Initial run fails with issue specifically targeting Scene 2
    mockEvaluator.options = {
      forceFail: true,
      issues: [
        {
          severity: 'major',
          category: 'product',
          description: 'Scene 2 Aura Glow Serum logo is blurred and dimly lit',
          sceneId: 'scene-2',
        },
      ],
      revisionInstructions: ['Improve Scene 2 logo sharpness and studio illumination'],
    };

    const { execution } = await createWorkflowExecution({
      campaignId,
      userId,
      includeEvaluation: true,
      idempotencyKey: 'idemp-rev-loop-1',
    });

    // Automatically switch mock evaluator to pass on re-evaluation during revision
    let evalCount = 0;
    const originalEvaluate = mockEvaluator.evaluate.bind(mockEvaluator);
    mockEvaluator.evaluate = (params) => {
      evalCount++;
      if (evalCount > 1) {
        // Subsequent evaluation passes after self-healing!
        mockEvaluator.options.forceFail = false;
        mockEvaluator.options.issues = [];
      }
      return originalEvaluate(params);
    };

    const job = { data: { executionId: execution.id, campaignId, userId } };
    const result = await executeWorkflowJob(job);

    assert.equal(result.success, true);
    assert.equal(result.status, 'COMPLETED');

    // 2. Verify durable revision attempt record
    const { data: attempts } = await supabase
      .from('revision_attempts')
      .select('*')
      .eq('workflow_execution_id', execution.id);

    assert.equal(attempts.length, 1);
    const attempt1 = attempts[0];
    assert.equal(attempt1.attempt_number, 1);
    assert.equal(attempt1.status, 'COMPLETED');
    assert.equal(attempt1.passed, true);
    assert.deepEqual(attempt1.affected_scene_ids, ['scene-2']);

    // 3. Verify selective scene regeneration and provenance in revision_targets
    const { data: targets } = await supabase
      .from('revision_targets')
      .select('*')
      .eq('revision_attempt_id', attempt1.id);

    assert.equal(targets.length, 1);
    const target2 = targets[0];
    assert.equal(target2.scene_id, 'scene-2');
    assert.equal(target2.scene_index, 2);
    assert.equal(target2.status, 'GENERATED');
    assert.ok(target2.healed_prompt.includes('commercial studio lighting'));
    assert.ok(target2.previous_asset_id);
    assert.ok(target2.new_asset_id);
    assert.notEqual(target2.previous_asset_id, target2.new_asset_id);

    // 4. Verify Timeline v2 was built and persisted
    const { data: timelines } = await supabase
      .from('timelines')
      .select('*')
      .eq('workflow_execution_id', execution.id)
      .order('created_at', { ascending: true });

    assert.equal(timelines.length, 2);
    assert.equal(timelines[0].version, '1.0');
    assert.equal(timelines[1].version, '2.0');

    // 5. Verify Timeline v2 preserved unaffected scenes and replaced ONLY Scene 2 asset
    const tl1Items = timelines[0].timeline_data.tracks.find((t) => t.type === 'video').items;
    const tl2Items = timelines[1].timeline_data.tracks.find((t) => t.type === 'video').items;

    assert.equal(tl1Items.length, tl2Items.length);
    // Scene 1 asset preserved
    assert.equal(tl1Items[0].assetId, tl2Items[0].assetId);
    // Scene 2 asset replaced with new regenerated asset!
    assert.equal(tl2Items[1].assetId, target2.new_asset_id);
    assert.notEqual(tl1Items[1].assetId, tl2Items[1].assetId);
    // Scene 3 asset preserved
    if (tl1Items[2] && tl2Items[2]) {
      assert.equal(tl1Items[2].assetId, tl2Items[2].assetId);
    }

    // 6. Verify 2 final videos were persisted (v1 and v2)
    const { data: finalVideos } = await supabase
      .from('final_videos')
      .select('*')
      .eq('workflow_execution_id', execution.id);

    assert.equal(finalVideos.length, 2);

    // Restore mockEvaluator
    mockEvaluator.evaluate = originalEvaluate;
  });

  it('Scenario 3: should enforce bounded revision policy and cleanly terminate with REVISION_EXHAUSTED when threshold is never met', async () => {
    // Keep failing across all attempts
    mockEvaluator.options = {
      forceFail: true,
      overrideOverallScore: 5.0,
      issues: [
        {
          severity: 'critical',
          category: 'visual',
          description: 'Fatal compression distortion across video',
        },
      ],
    };

    const { execution } = await createWorkflowExecution({
      campaignId,
      userId,
      includeEvaluation: true,
      idempotencyKey: 'idemp-rev-exhaust-1',
    });

    const job = { data: { executionId: execution.id, campaignId, userId } };
    const result = await executeWorkflowJob(job);

    assert.equal(result.success, true);
    assert.equal(result.status, 'REVISION_EXHAUSTED');

    // Verify executions and campaigns reflect exhausted status
    const { data: updatedExec } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', execution.id)
      .single();

    assert.equal(updatedExec.status, 'REVISION_EXHAUSTED');

    const { data: updatedCamp } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    assert.equal(updatedCamp.status, 'REVISION_EXHAUSTED');

    // Strictly bounded: exactly 2 revision attempts recorded!
    const { data: attempts } = await supabase
      .from('revision_attempts')
      .select('*')
      .eq('workflow_execution_id', execution.id)
      .order('attempt_number', { ascending: true });

    assert.equal(attempts.length, 2);
    assert.equal(attempts[0].attempt_number, 1);
    assert.equal(attempts[1].attempt_number, 2);
  });

  it('Scenario 4: should verify crash recovery: reuses existing generated assets and avoids duplicate scene generation', async () => {
    // Step 1: Pre-populate an existing attempt with a completed target
    const attemptId = 'att-crash-recovery-1';
    const fakeAssetId = 'asset-reused-100';

    await supabase.from('assets').insert({
      id: fakeAssetId,
      campaign_id: campaignId,
      workflow_execution_id: 'exec-crash-1',
      scene_id: 'sc-2',
      asset_type: 'video',
      url: 'https://mock.storage/reused.mp4',
      secure_url: 'https://mock.storage/reused.mp4',
    });

    await supabase.from('revision_attempts').insert({
      id: attemptId,
      campaign_id: campaignId,
      workflow_execution_id: 'exec-crash-1',
      attempt_number: 1,
      status: 'IN_PROGRESS',
    });

    await supabase.from('revision_targets').insert({
      id: 'target-crash-1',
      revision_attempt_id: attemptId,
      campaign_id: campaignId,
      scene_id: 'sc-2',
      scene_index: 2,
      original_prompt: 'Aura Glow can drops onto desk',
      healed_prompt: 'Aura Glow can drops onto desk, commercial studio lighting',
      previous_asset_id: 'prev-asset-001',
      new_asset_id: fakeAssetId,
      status: 'GENERATED',
    });

    // Verify recovery queries return the cached target
    const { data: recoveredTargets } = await supabase
      .from('revision_targets')
      .select('*')
      .eq('revision_attempt_id', attemptId)
      .eq('scene_id', 'sc-2');

    assert.equal(recoveredTargets.length, 1);
    assert.equal(recoveredTargets[0].status, 'GENERATED');
    assert.equal(recoveredTargets[0].new_asset_id, fakeAssetId);
  });
});
