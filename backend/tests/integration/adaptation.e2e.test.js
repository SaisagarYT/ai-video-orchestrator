import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.NODE_ENV = 'test';

import { memoryDb, supabase } from '../../src/config/supabase.js';
import { adaptationService } from '../../src/adaptation/adaptation.service.js';
import { ADAPTATION_PLATFORMS, ADAPTATION_STATUS } from '../../src/adaptation/constants.js';

describe('Slice 10 Multi-Platform Adaptation End-to-End (E2E) Test', () => {
  const userId = 'e2e-brand-manager';
  const user = { id: userId, email: 'manager@lumina.com', role: 'brand_manager' };

  let businessId;
  let campaignId;
  let executionId;
  let canonicalTimelineId;
  let canonicalSnapshot;

  beforeEach(async () => {
    memoryDb.reset();

    businessId = crypto.randomUUID();
    campaignId = crypto.randomUUID();
    executionId = crypto.randomUUID();
    canonicalTimelineId = crypto.randomUUID();

    // 1. Setup User & Business
    await supabase.from('users').insert([
      { id: userId, email: 'manager@lumina.com', role: 'brand_manager' },
    ]);

    await supabase.from('businesses').insert([
      {
        id: businessId,
        user_id: userId,
        name: 'Lumina Skincare',
        industry: 'Beauty & Cosmetics',
        brand_colors: '#FF4D8D, #1A1A2E',
      },
    ]);

    // 2. Setup Campaign
    await supabase.from('campaigns').insert([
      {
        id: campaignId,
        user_id: userId,
        business_id: businessId,
        name: 'Lumina Radiance Serum Launch',
        product_name: 'Radiance Glow Serum',
        call_to_action: 'Claim 20% Off Today',
        creative_bible: {
          tone: 'Sophisticated & Vibrant',
          visual_style: 'Clean minimal aesthetic with warm golden hour backlighting',
          call_to_action: 'Claim 20% Off Today',
        },
        status: 'READY',
      },
    ]);

    // 3. Setup Workflow Execution
    await supabase.from('workflow_executions').insert([
      {
        id: executionId,
        campaign_id: campaignId,
        current_step: 'COMPLETED',
        status: 'COMPLETED',
      },
    ]);

    // 4. Setup Canonical Timeline (9:16 vertical)
    const canonicalTimelineIR = {
      id: canonicalTimelineId,
      version: '1.0',
      campaignId,
      workflowExecutionId: executionId,
      durationMs: 15000,
      output: {
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        fps: 30,
        format: 'mp4',
        videoCodec: 'h264',
        audioCodec: 'aac',
      },
      tracks: [
        {
          type: 'video',
          items: [
            {
              id: crypto.randomUUID(),
              sceneId: 'scene-1',
              assetId: 'asset-video-s1',
              sourceUrl: 'https://res.cloudinary.com/lumina/video/upload/s1.mp4',
              startMs: 0,
              durationMs: 5000,
              sequenceNumber: 1,
              metadata: { prompt: 'Close up of dropper bottle on marble surface' },
            },
            {
              id: crypto.randomUUID(),
              sceneId: 'scene-2',
              assetId: 'asset-video-s2',
              sourceUrl: 'https://res.cloudinary.com/lumina/video/upload/s2.mp4',
              startMs: 5000,
              durationMs: 5000,
              sequenceNumber: 2,
              metadata: { prompt: 'Woman applying serum to radiant skin' },
            },
            {
              id: crypto.randomUUID(),
              sceneId: 'scene-3',
              assetId: 'asset-video-s3',
              sourceUrl: 'https://res.cloudinary.com/lumina/video/upload/s3.mp4',
              startMs: 10000,
              durationMs: 5000,
              sequenceNumber: 3,
              metadata: { prompt: 'Endcard with glowing bottle and CTA text' },
            },
          ],
        },
        {
          type: 'audio',
          items: [
            {
              id: crypto.randomUUID(),
              sceneId: 'scene-1',
              sourceUrl: 'https://res.cloudinary.com/lumina/video/upload/audio.mp3',
              startMs: 0,
              durationMs: 15000,
              volume: 1.0,
              sequenceNumber: 1,
            },
          ],
        },
      ],
      metadata: {
        isCanonical: true,
        source: 'creative-bible-v1',
      },
    };

    canonicalSnapshot = JSON.parse(JSON.stringify(canonicalTimelineIR));

    await supabase.from('timelines').insert([
      {
        id: canonicalTimelineId,
        campaign_id: campaignId,
        workflow_execution_id: executionId,
        version: '1.0',
        duration_ms: 15000,
        timeline_data: canonicalTimelineIR,
        status: 'COMPILED',
      },
    ]);
  });

  it('should execute end-to-end multi-platform adaptation for TikTok (9:16) and YouTube Landscape (16:9)', async () => {
    // -------------------------------------------------------------------------
    // STEP 1: Adapt to TikTok (9:16 vertical safe zone adaptation)
    // -------------------------------------------------------------------------
    const tiktokAdaptation = await adaptationService.createAdaptation({
      campaignId,
      workflowExecutionId: executionId,
      sourceTimelineId: canonicalTimelineId,
      platform: ADAPTATION_PLATFORMS.TIKTOK,
      user,
    });

    assert.ok(tiktokAdaptation.id);
    assert.equal(tiktokAdaptation.platform, ADAPTATION_PLATFORMS.TIKTOK);
    assert.equal(tiktokAdaptation.target_aspect_ratio, '9:16');
    assert.equal(tiktokAdaptation.target_width, 1080);
    assert.equal(tiktokAdaptation.target_height, 1920);

    const executedTikTok = await adaptationService.executeAdaptation(tiktokAdaptation.id, {
      user,
      runRender: true,
      runEvaluation: true,
    });

    assert.equal(executedTikTok.status, ADAPTATION_STATUS.APPROVED);
    assert.ok(executedTikTok.final_video_id);
    assert.ok(executedTikTok.evaluation_id);

    // -------------------------------------------------------------------------
    // STEP 2: Adapt to YouTube Landscape (16:9 reframed adaptation with vision focal points)
    // -------------------------------------------------------------------------
    const ytAdaptation = await adaptationService.createAdaptation({
      campaignId,
      workflowExecutionId: executionId,
      sourceTimelineId: canonicalTimelineId,
      platform: ADAPTATION_PLATFORMS.YOUTUBE_LANDSCAPE,
      options: {
        visionEvidence: {
          scenes: [
            {
              sceneId: 'scene-1',
              dimensions: {
                productFidelity: {
                  confidence: 0.98,
                  metadata: {
                    boundingBox: { x: 0.35, y: 0.25, width: 0.3, height: 0.5 },
                  },
                },
              },
            },
          ],
        },
      },
      user,
    });

    assert.ok(ytAdaptation.id);
    assert.equal(ytAdaptation.platform, ADAPTATION_PLATFORMS.YOUTUBE_LANDSCAPE);
    assert.equal(ytAdaptation.target_aspect_ratio, '16:9');
    assert.equal(ytAdaptation.target_width, 1920);
    assert.equal(ytAdaptation.target_height, 1080);

    const executedYt = await adaptationService.executeAdaptation(ytAdaptation.id, {
      user,
      runRender: true,
      runEvaluation: true,
    });

    assert.equal(executedYt.status, ADAPTATION_STATUS.APPROVED);
    assert.ok(executedYt.final_video_id);
    assert.ok(executedYt.evaluation_id);

    // -------------------------------------------------------------------------
    // STEP 3: Verify Invariants
    // -------------------------------------------------------------------------

    // Invariant 1: Canonical timeline remains completely untouched
    const { data: currentCanonicalRow } = await supabase
      .from('timelines')
      .select('*')
      .eq('id', canonicalTimelineId)
      .single();

    assert.deepEqual(
      currentCanonicalRow.timeline_data,
      canonicalSnapshot,
      'Canonical Timeline IR must be strictly immutable and unchanged'
    );

    // Invariant 2: Two independent adaptations exist
    const { data: allAdaptations } = await supabase
      .from('campaign_adaptations')
      .select('*')
      .eq('campaign_id', campaignId);

    assert.equal(allAdaptations.length, 2);

    // Invariant 3: Separate timeline versions exist
    const { data: tiktokTimeline } = await supabase
      .from('timelines')
      .select('*')
      .eq('id', executedTikTok.timeline_id)
      .single();

    const { data: ytTimeline } = await supabase
      .from('timelines')
      .select('*')
      .eq('id', executedYt.timeline_id)
      .single();

    assert.equal(tiktokTimeline.version, '1.0-tiktok-v1');
    assert.equal(tiktokTimeline.timeline_data.output.aspectRatio, '9:16');
    assert.equal(ytTimeline.version, '1.0-youtube_landscape-v1');
    assert.equal(ytTimeline.timeline_data.output.aspectRatio, '16:9');

    // Invariant 4: YouTube 16:9 scene 1 crop instructions reflect subject-aware focal point
    const ytVideoTrack = ytTimeline.timeline_data.tracks.find((t) => t.type === 'video');
    const ytScene1 = ytVideoTrack.items[0];
    assert.equal(ytScene1.metadata.adaptation.cropInstructions.strategy, 'SUBJECT_AWARE_CROP');
    assert.equal(ytScene1.metadata.adaptation.subjectPreservation.focalPoint.x, 0.5); // 0.35 + 0.3/2
    assert.equal(ytScene1.metadata.adaptation.subjectPreservation.focalPoint.y, 0.5); // 0.25 + 0.5/2

    // Invariant 5: Idempotency deduplication check
    const duplicateRequest = await adaptationService.createAdaptation({
      campaignId,
      workflowExecutionId: executionId,
      sourceTimelineId: canonicalTimelineId,
      platform: ADAPTATION_PLATFORMS.TIKTOK,
      user,
    });

    assert.equal(duplicateRequest.id, tiktokAdaptation.id, 'Duplicate request must return existing adaptation');
    const { data: countCheck } = await supabase
      .from('campaign_adaptations')
      .select('*')
      .eq('campaign_id', campaignId);
    assert.equal(countCheck.length, 2, 'No redundant adaptation row created');
  });
});
