import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { evaluationRulesEngine } from '../../src/services/evaluation/evaluation.rules.js';
import { mockEvaluator } from '../../src/services/evaluation/mock.evaluator.js';
import { evaluationService } from '../../src/services/evaluation/evaluation.service.js';
import { workflowEventEmitter } from '../../src/orchestration/events.js';

describe('Evaluation Service & Rules Engine Unit Tests', () => {
  const campaignId = 'c1111111-1111-4111-8111-111111111111';
  const executionId = 'e2222222-2222-4222-8222-222222222222';
  const finalVideoId = 'v3333333-3333-4333-8333-333333333333';
  const userId = 'u4444444-4444-4444-8444-444444444444';

  const mockCampaign = {
    id: campaignId,
    user_id: userId,
    title: 'Apex Energy Drink Commercial',
    goal: 'Boost Brand Awareness',
    product_name: 'Apex Surge',
    aspect_ratio: '9:16',
    duration_seconds: 15,
  };

  const mockFinalVideo = {
    id: finalVideoId,
    campaign_id: campaignId,
    workflow_execution_id: executionId,
    url: 'https://cloudinary.com/video/apex_surge.mp4',
    secure_url: 'https://cloudinary.com/video/apex_surge.mp4',
    duration_ms: 15000,
    width: 1080,
    height: 1920,
    format: 'mp4',
    mime_type: 'video/mp4',
    status: 'COMPLETED',
  };

  const mockScenes = [
    {
      sequence_number: 1,
      shot_type: 'Close-Up',
      visual_prompt: 'High resolution crisp close-up of condensation on ice-cold Apex Surge energy can',
      audio_narration: 'Unleash your true peak energy with Apex Surge.',
      duration_seconds: 5,
    },
    {
      sequence_number: 2,
      shot_type: 'Action Shot',
      visual_prompt: 'Dynamic camera movement tracking an athlete sprinting through neon city lights',
      audio_narration: 'Fuel your workout anytime, anywhere.',
      duration_seconds: 5,
    },
    {
      sequence_number: 3,
      shot_type: 'Hero Shot',
      visual_prompt: 'Cinematic hero reveal of Apex Surge can on stone pedestal with rim lighting',
      audio_narration: 'Apex Surge. Available now.',
      duration_seconds: 5,
    },
  ];

  beforeEach(() => {
    memoryDb.reset();
  });

  describe('EvaluationRulesEngine (Python Migration)', () => {
    it('should compute passing score for high quality scenes matching Python engine baseline', () => {
      const result = evaluationRulesEngine.evaluate({
        campaign: mockCampaign,
        creativeBible: { visual_style: 'Cyberpunk Neon', color_palette: ['#00FFCC', '#FF0055'] },
        scenes: mockScenes,
        finalVideo: mockFinalVideo,
        threshold: 7.5,
      });

      // product: 9.2 (weight 0.4 = 3.68), brand: 8.8 (weight 0.3 = 2.64), visual: 9.4 (weight 0.3 = 2.82)
      // total = 9.14 >= 7.5 -> passed: true
      assert.equal(result.passed, true);
      assert.equal(result.overallScore, 9.14);
      assert.equal(result.dimensions.productFidelity.score, 9.2);
      assert.equal(result.dimensions.brandConsistency.score, 8.8);
      assert.equal(result.dimensions.visualQuality.score, 9.4);
      assert.equal(result.technicalChecks.videoReadable, true);
    });

    it('should penalize product and visual scores when visual prompts are sparse (< 15 chars)', () => {
      const sparseScenes = [
        {
          sequence_number: 1,
          visual_prompt: 'can', // < 15 chars!
          audio_narration: 'Apex Surge.',
        },
      ];

      const result = evaluationRulesEngine.evaluate({
        campaign: mockCampaign,
        creativeBible: { visual_style: 'Cyberpunk Neon' },
        scenes: sparseScenes,
        finalVideo: mockFinalVideo,
        threshold: 7.5,
      });

      // In Python: product_score drops to 6.0, visual_score drops to 6.5
      assert.equal(result.dimensions.productFidelity.score, 6.0);
      assert.equal(result.dimensions.visualQuality.score, 6.5);
      // brand: 8.8. overall: 6.0*0.4 (2.4) + 8.8*0.3 (2.64) + 6.5*0.3 (1.95) = 6.99 < 7.5
      assert.equal(result.passed, false);
      assert.ok(result.issues.some((i) => i.category === 'product'));
      assert.ok(result.revisionInstructions.length > 0);
    });

    it('should penalize brand score when Creative Bible is missing', () => {
      const result = evaluationRulesEngine.evaluate({
        campaign: mockCampaign,
        creativeBible: null, // missing!
        scenes: mockScenes,
        finalVideo: mockFinalVideo,
        threshold: 7.5,
      });

      // In Python: brand_score drops to 7.0
      assert.equal(result.dimensions.brandConsistency.score, 7.0);
      assert.ok(result.issues.some((i) => i.category === 'brand'));
    });
  });

  describe('MockEvaluator', () => {
    it('should generate deterministic PASS mock evaluation result', () => {
      const result = mockEvaluator.evaluate({
        campaign: mockCampaign,
        finalVideo: mockFinalVideo,
        threshold: 7.5,
      });

      assert.equal(result.passed, true);
      assert.ok(result.overallScore >= 7.5);
      assert.equal(result.metadata.mock, true);
    });

    it('should generate deterministic FAIL mock evaluation result with revision instructions', () => {
      const result = mockEvaluator.evaluate({
        campaign: mockCampaign,
        finalVideo: mockFinalVideo,
        threshold: 7.5,
        options: { forceFail: true },
      });

      assert.equal(result.passed, false);
      assert.ok(result.overallScore < 7.5);
      assert.ok(result.revisionInstructions.length > 0);
      assert.ok(result.issues.length > 0);
    });
  });

  describe('EvaluationService Core & Persistence', () => {
    beforeEach(async () => {
      await supabase.from('users').insert({ id: userId, email: 'test@example.com' });
      await supabase.from('campaigns').insert(mockCampaign);
      await supabase.from('final_videos').insert(mockFinalVideo);
    });

    it('should evaluate, persist, and emit events for final video', async () => {
      let eventFired = false;
      const listener = (evt) => {
        if (evt.event_type === 'QUALITY_EVALUATION_COMPLETED') {
          eventFired = true;
          assert.equal(evt.payload.finalVideoId, finalVideoId);
        }
      };
      workflowEventEmitter.on(`campaign:${campaignId}`, listener);

      const { evaluation, evaluationResult, reused } = await evaluationService.evaluateFinalVideo({
        campaignId,
        executionId,
        stepId: 'step-eval-1',
        finalVideoId,
        threshold: 7.5,
        options: { scenes: mockScenes },
      });

      workflowEventEmitter.off(`campaign:${campaignId}`, listener);

      assert.equal(reused, false);
      assert.ok(evaluation.id);
      assert.equal(evaluationResult.passed, true);
      assert.ok(eventFired);

      // Verify persisted in database
      const { data: dbRecords } = await supabase
        .from('quality_evaluations')
        .select('*')
        .eq('campaign_id', campaignId);

      assert.equal(dbRecords.length, 1);
      assert.equal(dbRecords[0].final_video_id, finalVideoId);
      assert.equal(Boolean(dbRecords[0].passed), true);
    });

    it('should enforce idempotency and reuse existing evaluation record', async () => {
      // First evaluation
      const first = await evaluationService.evaluateFinalVideo({
        campaignId,
        executionId,
        stepId: 'step-eval-1',
        finalVideoId,
      });

      assert.equal(first.reused, false);

      // Second identical call
      const second = await evaluationService.evaluateFinalVideo({
        campaignId,
        executionId,
        stepId: 'step-eval-1',
        finalVideoId,
      });

      assert.equal(second.reused, true);
      assert.equal(second.evaluation.id, first.evaluation.id);

      // Verify no duplicate row was created
      const { data: allEvals } = await supabase
        .from('quality_evaluations')
        .select('*')
        .eq('workflow_execution_id', executionId);

      assert.equal(allEvals.length, 1);
    });

    it('should retrieve latest evaluation via getLatestEvaluation', async () => {
      await evaluationService.evaluateFinalVideo({
        campaignId,
        executionId,
        finalVideoId,
      });

      const latest = await evaluationService.getLatestEvaluation(campaignId);
      assert.ok(latest);
      assert.equal(latest.campaign_id, campaignId);
      assert.equal(latest.final_video_id, finalVideoId);
    });
  });
});
