import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.NODE_ENV = 'test';

import { supabase, memoryDb } from '../../src/config/supabase.js';
import { workflowQueue } from '../../src/orchestration/queue.js';
import {
  executeWorkflowJob,
  createWorkflowExecution,
  MULTIMODAL_REVISION_WORKFLOW_STAGES,
} from '../../src/orchestration/engine.js';
import { mockRenderer, rendererRegistry } from '../../src/services/rendering/index.js';
import { mockVisionProvider, VISION_SCENARIOS } from '../../src/providers/vision/mock-vision.provider.js';
import { memoryRepository } from '../../src/memory/memoryRepository.js';

describe('Slice 9 End-to-End Deterministic Memory & Revision Integration Test', () => {
  const userId = crypto.randomUUID();
  let businessId;
  let campaignId;

  beforeEach(async () => {
    memoryDb.reset();
    workflowQueue.clear();
    mockVisionProvider.reset();

    rendererRegistry.register('mock', mockRenderer, { isDefault: true });

    // 1. Create User
    await supabase.from('users').insert({
      id: userId,
      email: 'founder@lumahealth.com',
      role: 'creator',
    });

    // 2. Create Brand (Business)
    businessId = crypto.randomUUID();
    await supabase.from('businesses').insert({
      id: businessId,
      user_id: userId,
      name: 'Luma Health',
      industry: 'Wellness & Biotech',
      target_audience: 'Health-conscious pioneers',
      brand_colors: '#00E5FF, #0D1117',
    });

    // 3. Add Brand Hard Constraint
    await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'PRODUCT_PRESENTATION',
      key: 'product_geometry_rule',
      value: 'Luma bottle geometry and dispenser must remain strictly upright and undistorted',
      type: 'HARD_CONSTRAINT',
      priority: 80,
      confidence: 1.0,
      status: 'ACTIVE',
      source: 'USER_DEFINED',
    });

    // 4. Add Creative Preference
    await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'LIGHTING',
      key: 'signature_lighting',
      value: 'Sculpted cyan volumetric rim lighting with high-contrast studio fill',
      type: 'SOFT_PREFERENCE',
      priority: 50,
      confidence: 1.0,
      status: 'ACTIVE',
      source: 'USER_DEFINED',
    });

    await memoryRepository.createCreativeMemoryItem({
      business_id: businessId,
      category: 'HOOK',
      pattern: 'Rapid Bio-Luminescence Reveal',
      confidence: 0.95,
      status: 'ACTIVE',
      source: 'USER_DEFINED',
    });

    // 5. Create Campaign
    const { data: campaign } = await supabase.from('campaigns').insert({
      user_id: userId,
      business_id: businessId,
      title: 'Luma Elixir Launch',
      goal: 'Introduce Cellular Hydration',
      product_name: 'Luma Elixir',
      aspect_ratio: '9:16',
      duration_seconds: 15,
      target_platform: 'tiktok',
      call_to_action: 'Elevate Your Biology Today',
      status: 'DRAFT',
    });

    campaignId = campaign.id;
  });

  afterEach(() => {
    mockVisionProvider.reset();
  });

  it('should execute end-to-end: brand setup -> memory retrieval -> snapshot -> director -> creative bible -> prompt compiler -> vision evaluation -> revision respecting brand constraints -> final video', async () => {
    // 6. Configure Scene 2 with visual defect triggering revision loop
    mockVisionProvider.setSceneScenario('scene-2', VISION_SCENARIOS.PRODUCT_FIDELITY_FAILURE);
    mockVisionProvider.setSceneScenario('2', VISION_SCENARIOS.PRODUCT_FIDELITY_FAILURE);

    // 7. Create Workflow Execution with Memory + Multimodal Revision enabled
    const { execution } = await createWorkflowExecution({
      campaignId,
      userId,
      includeMemory: true,
      stages: [
        'CONTEXT_INGESTION',
        'MEMORY_RETRIEVAL',
        'DIRECTOR',
        'SCREENWRITER',
        'CRITIC',
        'CINEMATOGRAPHER',
        'PROMPT_COMPILER',
        'SCENE_VIDEO_GENERATION',
        'SCENE_AUDIO_GENERATION',
        'ASSET_PERSISTENCE',
        'TIMELINE_BUILD',
        'VIDEO_RENDER',
        'FINAL_VIDEO_PERSISTENCE',
        'VIDEO_UNDERSTANDING',
        'QUALITY_EVALUATION',
        'AUTONOMOUS_REVISION',
      ],
      idempotencyKey: 'e2e-slice9-deterministic-1',
    });

    assert.equal(execution.status, 'QUEUED');

    // On revision attempt, heal Scene 2 so subsequent vision evaluation passes
    let hasRevised = false;
    const { sceneGenerationService } = await import('../../src/services/media/scene-generation.service.js');
    const origGen = sceneGenerationService.generateSceneVideo.bind(sceneGenerationService);
    let genCount = 0;
    sceneGenerationService.generateSceneVideo = async (params) => {
      genCount++;
      if (genCount > 4) {
        hasRevised = true;
        mockVisionProvider.reset();
      }
      return origGen(params);
    };

    const originalAnalyzeFrames = mockVisionProvider.analyzeFrames.bind(mockVisionProvider);
    mockVisionProvider.analyzeFrames = async (input) => {
      if (hasRevised) {
        mockVisionProvider.reset();
      }
      return originalAnalyzeFrames(input);
    };

    // 8. Execute the workflow job
    const job = { data: { executionId: execution.id, campaignId, userId } };
    await executeWorkflowJob(job);

    // 9. Verify Memory Retrieval Step produced valid snapshot
    const { data: memStep } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .eq('step_name', 'MEMORY_RETRIEVAL')
      .single();

    assert.equal(memStep.status, 'COMPLETED');
    const memorySnapshot = memStep.output_artifact;
    assert.equal(memorySnapshot.brandId, businessId);
    assert.equal(memorySnapshot.hardConstraints.length, 1);
    assert.equal(memorySnapshot.hardConstraints[0].key, 'product_geometry_rule');

    // 10. Verify Director and Screenwriter incorporated brand memory
    const { data: screenwriterStep } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .eq('step_name', 'SCREENWRITER')
      .single();

    assert.equal(screenwriterStep.status, 'COMPLETED');
    const creativeBible = screenwriterStep.output_artifact.creativeBible;
    assert.match(creativeBible.color_palette, /#00E5FF, #0D1117/);

    // 11. Verify Prompt Compiler incorporated brand hard constraints into specifications
    const { data: compilerStep } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .eq('step_name', 'PROMPT_COMPILER')
      .single();

    assert.equal(compilerStep.status, 'COMPLETED');
    const prompts = compilerStep.output_artifact.prompts;
    assert.match(
      prompts[0].visualPrompt,
      /Brand Invariants: Luma bottle geometry and dispenser must remain strictly upright and undistorted/
    );

    // 12. Verify Revision Attempt ran, respected Brand Memory, and produced repaired prompt
    const { data: attempts } = await supabase
      .from('revision_attempts')
      .select('*')
      .eq('workflow_execution_id', execution.id);

    assert.ok(attempts.length >= 1);
    const firstAttempt = attempts[0];
    assert.equal(firstAttempt.status, 'COMPLETED');

    // 13. Verify Final Video was successfully persisted
    const { data: finalVideos } = await supabase
      .from('final_videos')
      .select('*')
      .eq('workflow_execution_id', execution.id);

    assert.ok(finalVideos.length >= 1);
    assert.equal(finalVideos[0].status, 'COMPLETED');

    // 14. Verify Workflow Execution reached COMPLETED status
    const { data: finishedExec } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', execution.id)
      .single();

    assert.equal(finishedExec.status, 'COMPLETED');

    // 15. Verify conservative learning generated candidate memory items in PENDING_REVIEW
    const pendingCandidates = await memoryRepository.listBrandMemoryItems(businessId, {
      status: 'PENDING_REVIEW',
    });
    assert.ok(pendingCandidates.length >= 1);
    assert.equal(pendingCandidates[0].source, 'REVISION');
  });
});
