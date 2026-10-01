import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { supabase, memoryDb } from '../../src/config/supabase.js';
import { workflowQueue } from '../../src/orchestration/queue.js';
import { executeWorkflowJob, createWorkflowExecution, MULTIMODAL_REVISION_WORKFLOW_STAGES } from '../../src/orchestration/engine.js';
import { mockRenderer, rendererRegistry } from '../../src/services/rendering/index.js';
import { mockVisionProvider, VISION_SCENARIOS } from '../../src/providers/vision/mock-vision.provider.js';

describe('Vision-Driven Autonomous Revision Integration Tests', () => {
  const userId = crypto.randomUUID();
  let campaignId;

  beforeEach(async () => {
    memoryDb.reset();
    workflowQueue.clear();
    mockVisionProvider.reset();

    rendererRegistry.register('mock', mockRenderer, { isDefault: true });

    await supabase.from('users').insert({
      id: userId,
      email: 'creator-vision-revision@example.com',
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

  afterEach(() => {
    mockVisionProvider.reset();
  });

  it('should autonomously diagnose visual defect, selectively heal & regenerate ONLY affected scene, and pass re-evaluation', async () => {
    // 1. Configure Scene 2 with visual product fidelity defect
    mockVisionProvider.setSceneScenario('scene-2', VISION_SCENARIOS.PRODUCT_FIDELITY_FAILURE);

    // Also support fallback matching for scene ID if sequence number is matched
    mockVisionProvider.setSceneScenario('2', VISION_SCENARIOS.PRODUCT_FIDELITY_FAILURE);

    const { execution } = await createWorkflowExecution({
      campaignId,
      userId,
      stages: MULTIMODAL_REVISION_WORKFLOW_STAGES,
      idempotencyKey: 'idemp-vision-rev-1',
    });

    // On revision attempt, heal the scene so the next vision inspection passes
    let hasRevised = false;
    const originalAnalyze = mockVisionProvider.analyzeFrames.bind(mockVisionProvider);
    mockVisionProvider.analyzeFrames = async (params) => {
      if (hasRevised) {
        mockVisionProvider.reset();
      }
      return originalAnalyze(params);
    };

    // When scene video generation occurs during revision, mark hasRevised
    const { sceneGenerationService } = await import('../../src/services/media/scene-generation.service.js');
    const origGen = sceneGenerationService.generateSceneVideo.bind(sceneGenerationService);
    let genCount = 0;
    sceneGenerationService.generateSceneVideo = async (params) => {
      genCount++;
      // Initial generation generates all scenes (4 scenes), revision attempt will regenerate only 1
      if (genCount > 4) {
        hasRevised = true;
        mockVisionProvider.reset();
      }
      return origGen(params);
    };

    try {
      const job = { data: { executionId: execution.id, campaignId, userId } };
      const result = await executeWorkflowJob(job);

      assert.equal(result.success, true);
      assert.equal(result.status, 'COMPLETED');

      // 2. Verify durable revision attempt record was triggered by vision defect
      const { data: attempts } = await supabase
        .from('revision_attempts')
        .select('*')
        .eq('workflow_execution_id', execution.id);

      assert.equal(attempts.length, 1);
      assert.equal(attempts[0].attempt_number, 1);
      assert.equal(attempts[0].status, 'COMPLETED');
      assert.equal(attempts[0].passed, true);

      // 3. Verify selective scene regeneration (only scene 2 was targeted)
      const { data: targets } = await supabase
        .from('revision_targets')
        .select('*')
        .eq('revision_attempt_id', attempts[0].id);

      assert.equal(targets.length, 1);
      assert.equal(targets[0].scene_index, 2);
      assert.ok(targets[0].healed_prompt.includes('Aura Glow Serum'));

      // 4. Verify new video understanding run recorded for revised video
      const { data: visionRuns } = await supabase
        .from('video_understanding_runs')
        .select('*')
        .eq('workflow_execution_id', execution.id);

      assert.ok(visionRuns.length >= 1);
    } finally {
      sceneGenerationService.generateSceneVideo = origGen;
    }
  });
});
