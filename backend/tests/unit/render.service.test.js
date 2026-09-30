import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { RenderService } from '../../src/services/rendering/render.service.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { rendererRegistry } from '../../src/services/rendering/renderer.registry.js';
import { mockRenderer } from '../../src/services/rendering/mock-renderer.js';
import { providerRegistry } from '../../src/providers/index.js';
import { timelineBuilder } from '../../src/services/timeline/timeline.builder.js';

describe('RenderService Unit Tests', () => {
  const campaignId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const executionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const userId = 'user-render-test-1';

  let renderService;

  beforeEach(async () => {
    memoryDb.reset();

    // Register mock renderer in registry
    rendererRegistry.register('mock', mockRenderer, { isDefault: true });

    renderService = new RenderService({
      supabase,
      timelineBuilder,
      rendererRegistry,
      providerRegistry,
      defaultRendererName: 'mock',
    });

    // Seed test campaign
    await supabase.from('campaigns').insert({
      id: campaignId,
      user_id: userId,
      title: 'Performance Sneakers Ad',
      aspect_ratio: '9:16',
      duration_seconds: 10,
      status: 'GENERATING',
    });

    // Seed test scenes
    await supabase.from('scenes').insert([
      { id: 'sc-1', campaign_id: campaignId, sequence_number: 1, duration_seconds: 5, shot_type: 'Close-Up' },
      { id: 'sc-2', campaign_id: campaignId, sequence_number: 2, duration_seconds: 5, shot_type: 'Wide Shot' },
    ]);

    // Seed test assets
    await supabase.from('assets').insert([
      {
        id: 'ast-v-1',
        campaign_id: campaignId,
        workflow_execution_id: executionId,
        scene_id: 'sc-1',
        asset_type: 'video',
        provider: 'mock',
        storage_provider: 'mock',
        url: 'https://mock.storage/sc1.mp4',
        duration_ms: 5000,
        width: 1080,
        height: 1920,
      },
      {
        id: 'ast-v-2',
        campaign_id: campaignId,
        workflow_execution_id: executionId,
        scene_id: 'sc-2',
        asset_type: 'video',
        provider: 'mock',
        storage_provider: 'mock',
        url: 'https://mock.storage/sc2.mp4',
        duration_ms: 5000,
        width: 1080,
        height: 1920,
      },
    ]);
  });

  it('should build and persist canonical Timeline IR and record workflow event', async () => {
    const { timeline, timelineIR, reused } = await renderService.buildAndPersistTimeline({
      campaignId,
      executionId,
      stepId: 'step-timeline-1',
    });

    assert.equal(reused, false);
    assert.ok(timeline.id);
    assert.equal(timeline.duration_ms, 10000);
    assert.equal(timeline.status, 'READY');
    assert.equal(timelineIR.tracks[0].items.length, 2);

    // Verify stored in Supabase timelines table
    const { data: stored } = await supabase.from('timelines').select('*').eq('id', timeline.id).single();
    assert.ok(stored);
    assert.equal(stored.duration_ms, 10000);

    // Verify TIMELINE_CREATED event was recorded
    const { data: events } = await supabase
      .from('workflow_events')
      .select('*')
      .eq('event_type', 'TIMELINE_CREATED');
    assert.equal(events.length, 1);
    assert.equal(events[0].payload.timelineId, timeline.id);
  });

  it('should enforce idempotency and reuse existing timeline for the same execution', async () => {
    const firstRun = await renderService.buildAndPersistTimeline({
      campaignId,
      executionId,
    });
    assert.equal(firstRun.reused, false);

    const secondRun = await renderService.buildAndPersistTimeline({
      campaignId,
      executionId,
    });
    assert.equal(secondRun.reused, true);
    assert.equal(secondRun.timeline.id, firstRun.timeline.id);
  });

  it('should execute rendering, create render_jobs, upload to storage, and mark job COMPLETED', async () => {
    const { timeline } = await renderService.buildAndPersistTimeline({
      campaignId,
      executionId,
    });

    const { job, renderResult, storageAsset, reused } = await renderService.renderTimeline({
      campaignId,
      executionId,
      timelineId: timeline.id,
      rendererName: 'mock',
      idempotencyKey: 'idemp-render-unit-1',
    });

    assert.equal(reused, false);
    assert.equal(job.status, 'COMPLETED');
    assert.equal(job.renderer, 'mock');
    assert.ok(storageAsset.url);
    assert.equal(renderResult.durationMs, 10000);

    // Verify render_job in Supabase
    const { data: storedJob } = await supabase
      .from('render_jobs')
      .select('*')
      .eq('id', job.id)
      .single();
    assert.equal(storedJob.status, 'COMPLETED');
  });

  it('should enforce rendering idempotency and reuse completed render job', async () => {
    const { timeline } = await renderService.buildAndPersistTimeline({
      campaignId,
      executionId,
    });

    const idempKey = 'idemp-render-unique-123';

    const firstRender = await renderService.renderTimeline({
      campaignId,
      executionId,
      timelineId: timeline.id,
      idempotencyKey: idempKey,
    });
    assert.equal(firstRender.reused, false);

    const secondRender = await renderService.renderTimeline({
      campaignId,
      executionId,
      timelineId: timeline.id,
      idempotencyKey: idempKey,
    });
    assert.equal(secondRender.reused, true);
    assert.equal(secondRender.job.id, firstRender.job.id);
  });

  it('should persist final video with complete provenance and update campaign status to COMPLETED', async () => {
    const { timeline } = await renderService.buildAndPersistTimeline({
      campaignId,
      executionId,
    });

    const { job, renderResult, storageAsset } = await renderService.renderTimeline({
      campaignId,
      executionId,
      timelineId: timeline.id,
    });

    const finalVideo = await renderService.persistFinalVideo({
      campaignId,
      executionId,
      timelineId: timeline.id,
      renderJobId: job.id,
      renderResult,
      storageAsset,
    });

    assert.ok(finalVideo.id);
    assert.equal(finalVideo.campaign_id, campaignId);
    assert.equal(finalVideo.timeline_id, timeline.id);
    assert.equal(finalVideo.render_job_id, job.id);
    assert.equal(finalVideo.renderer, 'mock');
    assert.equal(finalVideo.duration_ms, 10000);
    assert.equal(finalVideo.status, 'COMPLETED');

    // Verify campaign status updated to COMPLETED
    const { data: updatedCampaign } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', campaignId)
      .single();
    assert.equal(updatedCampaign.status, 'COMPLETED');
  });
});
