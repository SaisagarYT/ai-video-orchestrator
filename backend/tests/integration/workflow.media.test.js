import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { createWorkflowExecution, executeWorkflowJob, FULL_WORKFLOW_STAGES } from '../../src/orchestration/engine.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { workflowQueue } from '../../src/orchestration/queue.js';
import { assetService } from '../../src/services/media/asset.service.js';

describe('Workflow Media Pipeline End-to-End Integration Tests', () => {
  const userId = 'user-media-e2e-1';
  let campaignId;

  beforeEach(async () => {
    memoryDb.reset();
    workflowQueue.clear();

    await supabase.from('users').insert({
      id: userId,
      email: 'creator@example.com',
      role: 'creator',
    });

    const { data: campaign } = await supabase.from('campaigns').insert({
      user_id: userId,
      title: 'AeroPulse Wireless Earbuds',
      goal: 'Drive Direct Conversions',
      product_name: 'AeroPulse X',
      aspect_ratio: '9:16',
      duration_seconds: 15,
      target_platform: 'tiktok',
      call_to_action: 'Order now for 30% discount',
      status: 'DRAFT',
    });

    campaignId = campaign.id;
  });

  it('should execute complete 9-stage pipeline including video, audio, and asset persistence', async () => {
    // 1. Create execution with media stages enabled
    const { execution } = await createWorkflowExecution({
      campaignId,
      userId,
      includeMedia: true,
      idempotencyKey: 'e2e-media-idemp-1',
    });

    assert.ok(execution.id);
    assert.equal(execution.status, 'QUEUED');

    // Verify 9 workflow steps are queued
    const { data: initialSteps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .order('sequence_number', { ascending: true });

    assert.equal(initialSteps.length, 9);
    assert.equal(initialSteps[0].step_name, 'CONTEXT_INGESTION');
    assert.equal(initialSteps[5].step_name, 'PROMPT_COMPILER');
    assert.equal(initialSteps[6].step_name, 'SCENE_VIDEO_GENERATION');
    assert.equal(initialSteps[7].step_name, 'SCENE_AUDIO_GENERATION');
    assert.equal(initialSteps[8].step_name, 'ASSET_PERSISTENCE');

    // 2. Execute the workflow job
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

    // 4. Verify all 9 steps completed
    const { data: completedSteps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .order('sequence_number', { ascending: true });

    assert.equal(completedSteps.length, 9);
    for (const step of completedSteps) {
      assert.equal(step.status, 'COMPLETED', `Step ${step.step_name} should be COMPLETED`);
      assert.ok(step.output_artifact, `Step ${step.step_name} should have an output artifact`);
    }

    // 5. Verify Video Generation Artifact
    const videoStep = completedSteps.find((s) => s.step_name === 'SCENE_VIDEO_GENERATION');
    assert.ok(videoStep.output_artifact.scenes);
    assert.ok(videoStep.output_artifact.scenes.length > 0);
    assert.ok(videoStep.output_artifact.scenes[0].videoUrl);

    // 6. Verify Audio Generation Artifact
    const audioStep = completedSteps.find((s) => s.step_name === 'SCENE_AUDIO_GENERATION');
    assert.ok(audioStep.output_artifact.audioTracks);
    assert.ok(audioStep.output_artifact.audioTracks.length > 0);
    assert.ok(audioStep.output_artifact.audioTracks[0].audioUrl);

    // 7. Verify Asset Persistence Artifact
    const persistenceStep = completedSteps.find((s) => s.step_name === 'ASSET_PERSISTENCE');
    assert.ok(persistenceStep.output_artifact.persistedAssetCount > 0);

    // 8. Verify provider_jobs records in database
    const { data: providerJobs } = await supabase
      .from('provider_jobs')
      .select('*')
      .eq('workflow_execution_id', execution.id);

    assert.ok(providerJobs.length >= 2, 'Should record both video and audio provider jobs');
    assert.ok(providerJobs.some((j) => j.media_type === 'video' && j.status === 'COMPLETED'));
    assert.ok(providerJobs.some((j) => j.media_type === 'audio' && j.status === 'COMPLETED'));

    // 9. Verify assets table records and provenance
    const campaignAssets = await assetService.getAssetsByCampaign(campaignId);
    assert.ok(campaignAssets.length >= 2);

    const videoAsset = campaignAssets.find((a) => a.asset_type === 'video');
    assert.ok(videoAsset);
    assert.ok(videoAsset.url);
    assert.equal(videoAsset.storage_provider, 'mock-storage');

    const provenance = await assetService.getAssetProvenance(videoAsset.id);
    assert.equal(provenance.provenance.campaignId, campaignId);
    assert.equal(provenance.provenance.executionId, execution.id);
    assert.equal(provenance.provenance.provider, 'mock-video');
  });
});
