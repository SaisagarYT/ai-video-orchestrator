import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { supabase, memoryDb } from '../../src/config/supabase.js';
import { evaluationService } from '../../src/services/evaluation/index.js';
import { mockVisionProvider, VISION_SCENARIOS } from '../../src/providers/vision/mock-vision.provider.js';
import { videoUnderstandingService } from '../../src/video-understanding/index.js';

describe('Multimodal Quality Evaluation Integration Tests', () => {
  const campaignId = crypto.randomUUID();
  const executionId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const finalVideoId = crypto.randomUUID();

  beforeEach(async () => {
    memoryDb.reset();
    mockVisionProvider.reset();

    await supabase.from('users').insert({ id: userId, email: 'multimodal@test.com' });
    await supabase.from('campaigns').insert({
      id: campaignId,
      user_id: userId,
      product_name: 'Glow Serum',
      goal: 'Skincare awareness',
      aspect_ratio: '9:16',
      duration_seconds: 15,
      creative_bible: {
        visualStyle: { colorPalette: 'Pastel pink and white', tone: 'Elegant' },
      },
    });

    await supabase.from('scenes').insert([
      { id: 'sc-1', campaign_id: campaignId, sequence_number: 1, duration_seconds: 5, shot_type: 'Establishing' },
      { id: 'sc-2', campaign_id: campaignId, sequence_number: 2, duration_seconds: 5, shot_type: 'Product Macro' },
    ]);

    await supabase.from('workflow_executions').insert({
      id: executionId,
      campaign_id: campaignId,
      user_id: userId,
      status: 'RUNNING',
    });

    await supabase.from('final_videos').insert({
      id: finalVideoId,
      campaign_id: campaignId,
      workflow_execution_id: executionId,
      url: 'https://cdn.example.com/videos/glow-serum.mp4',
    });
  });

  it('should blend 60% rule / 40% vision score and pass evaluation with pristine vision analysis', async () => {
    const { run } = await videoUnderstandingService.analyzeVideo({
      campaignId,
      executionId,
      finalVideoId,
    });

    const { evaluationResult } = await evaluationService.evaluateFinalVideo({
      campaignId,
      executionId,
      finalVideoId,
      options: {
        visionAnalysis: run,
      },
    });

    assert.equal(evaluationResult.passed, true);
    assert.ok(evaluationResult.overallScore >= 7.5);
    assert.equal(evaluationResult.metadata.multimodalValidated, true);
    assert.equal(evaluationResult.metadata.visionRunId, run.id);
  });

  it('should fail quality evaluation when vision analysis detects PRODUCT_FIDELITY_MISMATCH', async () => {
    mockVisionProvider.setSceneScenario('sc-2', VISION_SCENARIOS.PRODUCT_FIDELITY_FAILURE);

    const { run } = await videoUnderstandingService.analyzeVideo({
      campaignId,
      executionId,
      finalVideoId,
      options: { forceRefresh: true },
    });

    const { evaluationResult } = await evaluationService.evaluateFinalVideo({
      campaignId,
      executionId,
      finalVideoId,
      options: {
        visionAnalysis: run,
      },
    });

    assert.equal(evaluationResult.passed, false);
    assert.equal(evaluationResult.metadata.multimodalValidated, true);

    // Verify vision issue is injected
    const visionIssues = evaluationResult.issues.filter((i) => i.description.includes('PRODUCT_FIDELITY_MISMATCH'));
    assert.ok(visionIssues.length >= 1);
    assert.equal(visionIssues[0].sceneId, 'sc-2');
    assert.equal(visionIssues[0].severity, 'major');

    // Verify revision instructions are populated
    assert.ok(evaluationResult.revisionInstructions.length > 0);
  });
});
