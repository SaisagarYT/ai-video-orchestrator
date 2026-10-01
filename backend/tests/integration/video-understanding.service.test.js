import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { supabase, memoryDb } from '../../src/config/supabase.js';
import { VideoUnderstandingService } from '../../src/video-understanding/videoUnderstandingService.js';
import { mockVisionProvider, VISION_SCENARIOS } from '../../src/providers/vision/mock-vision.provider.js';

describe('VideoUnderstandingService Integration Tests', () => {
  let service;
  const campaignId = crypto.randomUUID();
  const executionId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  beforeEach(async () => {
    memoryDb.reset();
    mockVisionProvider.reset();
    service = new VideoUnderstandingService();

    // Setup base user & campaign
    await supabase.from('users').insert({ id: userId, email: 'vision@test.com' });
    await supabase.from('campaigns').insert({
      id: campaignId,
      user_id: userId,
      product_name: 'Apex Vision Pro',
      goal: 'Commercial showcase',
      aspect_ratio: '9:16',
      duration_seconds: 15,
      creative_bible: {
        visualStyle: { colorPalette: 'Electric blue and neon lime', tone: 'Energetic' },
      },
    });

    await supabase.from('scenes').insert([
      { id: 'sc-1', campaign_id: campaignId, sequence_number: 1, duration_seconds: 5, shot_type: 'Establishing' },
      { id: 'sc-2', campaign_id: campaignId, sequence_number: 2, duration_seconds: 5, shot_type: 'Hero Packshot' },
      { id: 'sc-3', campaign_id: campaignId, sequence_number: 3, duration_seconds: 5, shot_type: 'Call to Action' },
    ]);

    await supabase.from('workflow_executions').insert({
      id: executionId,
      campaign_id: campaignId,
      user_id: userId,
      status: 'RUNNING',
    });
  });

  it('should run full video understanding pipeline, persist runs and scenes, and emit events', async () => {
    const finalVideoId = crypto.randomUUID();
    await supabase.from('final_videos').insert({
      id: finalVideoId,
      campaign_id: campaignId,
      workflow_execution_id: executionId,
      url: 'https://cdn.example.com/videos/apex-final.mp4',
    });

    const result = await service.analyzeVideo({
      campaignId,
      executionId,
      finalVideoId,
    });

    assert.equal(result.reused, false);
    assert.equal(result.run.status, 'COMPLETED');
    assert.equal(result.run.scene_count, 3);
    assert.ok(result.run.frame_count > 0);
    assert.equal(result.scenes.length, 3);

    // Verify stored in Supabase
    const { data: dbRuns } = await supabase
      .from('video_understanding_runs')
      .select('*')
      .eq('id', result.run.id);
    assert.equal(dbRuns.length, 1);
    assert.equal(dbRuns[0].status, 'COMPLETED');

    const { data: dbScenes } = await supabase
      .from('video_understanding_scenes')
      .select('*')
      .eq('run_id', result.run.id);
    assert.equal(dbScenes.length, 3);
  });

  it('should enforce idempotency and reuse existing completed run', async () => {
    const finalVideoId = crypto.randomUUID();
    await supabase.from('final_videos').insert({
      id: finalVideoId,
      campaign_id: campaignId,
      workflow_execution_id: executionId,
      url: 'https://cdn.example.com/videos/apex-final.mp4',
    });

    const run1 = await service.analyzeVideo({
      campaignId,
      executionId,
      finalVideoId,
    });
    assert.equal(run1.reused, false);

    const run2 = await service.analyzeVideo({
      campaignId,
      executionId,
      finalVideoId,
    });
    assert.equal(run2.reused, true);
    assert.equal(run2.run.id, run1.run.id);
  });

  it('should record detected issues when a scene has visual defect', async () => {
    mockVisionProvider.setSceneScenario('sc-2', VISION_SCENARIOS.PRODUCT_FIDELITY_FAILURE);

    const finalVideoId = crypto.randomUUID();
    await supabase.from('final_videos').insert({
      id: finalVideoId,
      campaign_id: campaignId,
      workflow_execution_id: executionId,
      url: 'https://cdn.example.com/videos/apex-defect.mp4',
    });

    const result = await service.analyzeVideo({
      campaignId,
      executionId,
      finalVideoId,
      options: { forceRefresh: true },
    });

    assert.equal(result.run.status, 'COMPLETED');
    assert.equal(result.run.detected_issues.length, 1);
    assert.equal(result.run.detected_issues[0].code, 'PRODUCT_FIDELITY_MISMATCH');
    assert.equal(result.run.detected_issues[0].sceneId, 'sc-2');
  });
});
