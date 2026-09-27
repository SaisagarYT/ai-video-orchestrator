import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { sceneGenerationService } from '../../src/services/media/scene-generation.service.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { providerRegistry } from '../../src/providers/index.js';
import { assetService } from '../../src/services/media/asset.service.js';

describe('SceneGenerationService Unit Tests', () => {
  const campaignId = 'camp-media-1';
  const executionId = 'exec-media-1';

  beforeEach(() => {
    memoryDb.reset();
  });

  it('should generate scene video, mirror to storage, and persist asset and job', async () => {
    const scene = {
      id: 'sc-001',
      sequence_number: 1,
      visual_prompt: 'Cinematic wide shot of neon sneakers running across puddles',
      camera_movement: 'Tracking shot',
      duration_seconds: 5,
    };

    const promptSpec = {
      compiled_positive_prompt: '8k hyperrealistic commercial, neon sneakers running across puddles',
      aspect_ratio: '9:16',
      seed: 12345,
    };

    const { job, asset } = await sceneGenerationService.generateSceneVideo({
      campaignId,
      executionId,
      stepId: 'step-vid-1',
      scene,
      promptSpec,
      providerName: 'mock',
      storageProviderName: 'mock',
      idempotencyKey: 'idemp-scene-1-test',
    });

    assert.ok(job);
    assert.equal(job.status, 'COMPLETED');
    assert.equal(job.media_type, 'video');
    assert.equal(job.campaign_id, campaignId);
    assert.equal(job.idempotency_key, 'idemp-scene-1-test');

    assert.ok(asset);
    assert.equal(asset.asset_type, 'video');
    assert.equal(asset.scene_id, 'sc-001');
    assert.ok(asset.url);
    assert.equal(asset.duration_ms, 5000);

    // Verify database state
    const { data: dbJobs } = await supabase.from('provider_jobs').select('*').eq('id', job.id);
    assert.equal(dbJobs.length, 1);
    assert.equal(dbJobs[0].status, 'COMPLETED');

    const { data: dbAssets } = await supabase.from('assets').select('*').eq('id', asset.id);
    assert.equal(dbAssets.length, 1);
    assert.equal(dbAssets[0].asset_type, 'video');
  });

  it('should enforce idempotency and avoid duplicate video generation on identical idempotency key', async () => {
    const scene = {
      id: 'sc-002',
      sequence_number: 2,
      visual_prompt: 'Close up product shot',
      duration_seconds: 4,
    };

    const idempKey = 'idemp-unique-scene-2';

    const firstRun = await sceneGenerationService.generateSceneVideo({
      campaignId,
      executionId,
      scene,
      idempotencyKey: idempKey,
      providerName: 'mock',
      storageProviderName: 'mock',
    });

    const secondRun = await sceneGenerationService.generateSceneVideo({
      campaignId,
      executionId,
      scene,
      idempotencyKey: idempKey,
      providerName: 'mock',
      storageProviderName: 'mock',
    });

    assert.equal(firstRun.job.id, secondRun.job.id);
    assert.equal(firstRun.asset.id, secondRun.asset.id);
    assert.equal(firstRun.asset.url, secondRun.asset.url);

    // Verify only 1 job and 1 asset exist
    const { data: allJobs } = await supabase.from('provider_jobs').select('*');
    assert.equal(allJobs.length, 1);

    const { data: allAssets } = await supabase.from('assets').select('*');
    assert.equal(allAssets.length, 1);
  });

  it('should batch generate video clips for all scenes in a workflow', async () => {
    const scenes = [
      { id: 'sc-1', sequence_number: 1, visual_prompt: 'Hero shot' },
      { id: 'sc-2', sequence_number: 2, visual_prompt: 'Features shot' },
      { id: 'sc-3', sequence_number: 3, visual_prompt: 'Call to action shot' },
    ];

    const results = await sceneGenerationService.generateScenesForWorkflow({
      campaignId,
      executionId,
      scenes,
      providerName: 'mock',
      storageProviderName: 'mock',
    });

    assert.equal(results.length, 3);
    assert.ok(results.every((r) => r.job.status === 'COMPLETED'));
    assert.ok(results.every((r) => r.asset.asset_type === 'video'));

    const { data: assets } = await supabase.from('assets').select('*');
    assert.equal(assets.length, 3);
  });

  it('should mark job as FAILED and record failure event when provider throws', async () => {
    // Register temporary failing video provider
    const failingProvider = {
      name: 'failing-video',
      createVideo: async () => {
        throw new Error('Fal.ai GPU cluster out of memory');
      },
      getVideoJob: async () => {},
    };
    providerRegistry.register('video', 'failing-video', failingProvider);

    const scene = { id: 'sc-err', visual_prompt: 'Failing shot' };

    await assert.rejects(
      async () => {
        await sceneGenerationService.generateSceneVideo({
          campaignId,
          executionId,
          scene,
          providerName: 'failing-video',
          storageProviderName: 'mock',
        });
      },
      (err) => {
        assert.match(err.message, /Fal.ai GPU cluster out of memory/);
        return true;
      }
    );

    const { data: jobs } = await supabase.from('provider_jobs').select('*');
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].status, 'FAILED');
    assert.match(jobs[0].error_message, /GPU cluster out of memory/);
  });
});
