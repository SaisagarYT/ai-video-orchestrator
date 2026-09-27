import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { narrationGenerationService } from '../../src/services/media/narration-generation.service.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { providerRegistry } from '../../src/providers/index.js';

describe('NarrationGenerationService Unit Tests', () => {
  const campaignId = 'camp-audio-test-1';
  const executionId = 'exec-audio-test-1';

  beforeEach(() => {
    memoryDb.reset();
  });

  it('should generate speech narration, mirror to storage, and persist asset and job', async () => {
    const text = 'Discover the next evolution of intelligent performance.';
    const voiceId = 'voice-eleven-test-1';

    const { job, asset } = await narrationGenerationService.generateSceneNarration({
      campaignId,
      executionId,
      stepId: 'step-audio-1',
      sceneId: 'sc-audio-001',
      text,
      voiceId,
      providerName: 'mock',
      storageProviderName: 'mock',
      idempotencyKey: 'idemp-audio-1',
    });

    assert.ok(job);
    assert.equal(job.status, 'COMPLETED');
    assert.equal(job.media_type, 'audio');
    assert.equal(job.idempotency_key, 'idemp-audio-1');

    assert.ok(asset);
    assert.equal(asset.asset_type, 'audio');
    assert.equal(asset.scene_id, 'sc-audio-001');
    assert.ok(asset.url);
    assert.ok(asset.duration_ms > 0);

    const { data: dbJobs } = await supabase.from('provider_jobs').select('*').eq('id', job.id);
    assert.equal(dbJobs.length, 1);
    assert.equal(dbJobs[0].status, 'COMPLETED');

    const { data: dbAssets } = await supabase.from('assets').select('*').eq('id', asset.id);
    assert.equal(dbAssets.length, 1);
    assert.equal(dbAssets[0].asset_type, 'audio');
  });

  it('should enforce idempotency and avoid duplicate audio generation on identical key', async () => {
    const text = 'Unmatched comfort engineered for champions.';
    const idempKey = 'idemp-audio-unique-2';

    const firstRun = await narrationGenerationService.generateSceneNarration({
      campaignId,
      executionId,
      sceneId: 'sc-002',
      text,
      idempotencyKey: idempKey,
      providerName: 'mock',
      storageProviderName: 'mock',
    });

    const secondRun = await narrationGenerationService.generateSceneNarration({
      campaignId,
      executionId,
      sceneId: 'sc-002',
      text,
      idempotencyKey: idempKey,
      providerName: 'mock',
      storageProviderName: 'mock',
    });

    assert.equal(firstRun.job.id, secondRun.job.id);
    assert.equal(firstRun.asset.id, secondRun.asset.id);
    assert.equal(firstRun.asset.url, secondRun.asset.url);

    const { data: allJobs } = await supabase.from('provider_jobs').select('*');
    assert.equal(allJobs.length, 1);
    const { data: allAssets } = await supabase.from('assets').select('*');
    assert.equal(allAssets.length, 1);
  });

  it('should batch generate narration audio for all scenes in a workflow', async () => {
    const scenes = [
      { id: 'sc-1', sequence_number: 1, audio_narration: 'Are you ready for change?' },
      { id: 'sc-2', sequence_number: 2, audio_narration: 'Introducing the ultimate solution.' },
      { id: 'sc-3', sequence_number: 3, audio_narration: 'Claim yours now.' },
    ];

    const results = await narrationGenerationService.generateNarrationForWorkflow({
      campaignId,
      executionId,
      scenes,
      providerName: 'mock',
      storageProviderName: 'mock',
    });

    assert.equal(results.length, 3);
    assert.ok(results.every((r) => r.job.status === 'COMPLETED'));
    assert.ok(results.every((r) => r.asset.asset_type === 'audio'));

    const { data: assets } = await supabase.from('assets').select('*');
    assert.equal(assets.length, 3);
  });

  it('should throw error when narration text is empty', async () => {
    await assert.rejects(
      async () => {
        await narrationGenerationService.generateSceneNarration({
          campaignId,
          executionId,
          sceneId: 'sc-err',
          text: '',
        });
      },
      (err) => {
        assert.match(err.message, /Narration text is required/);
        return true;
      }
    );
  });

  it('should mark job as FAILED when audio provider throws', async () => {
    const failingAudioProvider = {
      name: 'failing-audio',
      generateSpeech: async () => {
        throw new Error('ElevenLabs concurrency limit reached');
      },
    };
    providerRegistry.register('audio', 'failing-audio', failingAudioProvider);

    await assert.rejects(
      async () => {
        await narrationGenerationService.generateSceneNarration({
          campaignId,
          executionId,
          sceneId: 'sc-audio-fail',
          text: 'This should fail',
          providerName: 'failing-audio',
          storageProviderName: 'mock',
        });
      },
      (err) => {
        assert.match(err.message, /ElevenLabs concurrency limit reached/);
        return true;
      }
    );

    const { data: jobs } = await supabase.from('provider_jobs').select('*');
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].status, 'FAILED');
    assert.match(jobs[0].error_message, /ElevenLabs concurrency limit reached/);
  });
});
