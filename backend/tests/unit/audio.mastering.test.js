import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAudioMasteringConfig,
  audioMasteringConfigSchema,
} from '../../src/services/audio/audio.config.js';
import { audioMasteringService } from '../../src/services/audio/audio.mastering.service.js';
import { workflowEventEmitter } from '../../src/orchestration/events.js';
import { ValidationError } from '../../src/core/errors/AppError.js';

describe('Audio Mastering Unit Tests', () => {
  describe('Configuration & Validation', () => {
    it('should validate default audio mastering configuration', () => {
      const config = validateAudioMasteringConfig();
      assert.equal(config.targetLufs, -16.0);
      assert.equal(config.truePeak, -1.5);
      assert.equal(config.sampleRate, 48000);
      assert.equal(config.channels, 2);
    });

    it('should reject invalid sample rates', () => {
      assert.throws(
        () => validateAudioMasteringConfig({ sampleRate: 12345 }),
        ValidationError
      );
    });

    it('should reject true peak greater than 0 dBTP to avoid clipping', () => {
      assert.throws(
        () => validateAudioMasteringConfig({ truePeak: 1.0 }),
        ValidationError
      );
    });

    it('should reject invalid channel counts (only 1 or 2 supported)', () => {
      assert.throws(
        () => validateAudioMasteringConfig({ channels: 6 }),
        ValidationError
      );
    });
  });

  describe('Filter String Construction', () => {
    it('should construct correct FFmpeg loudnorm filter string', () => {
      const filter = audioMasteringService.buildAudioFilterString({
        targetLufs: -14.0,
        truePeak: -1.0,
      });

      assert.equal(filter, 'loudnorm=I=-14:TP=-1:LRA=11:print_format=none');
    });
  });

  describe('Mastering Execution Lifecycle & Events', () => {
    it('should process audio mastering and emit AUDIO_MASTERED event', async () => {
      const campaignId = 'camp-aud-1';
      const executionId = 'exec-aud-1';

      let eventFired = false;
      const listener = (evt) => {
        if (evt.event_type === 'AUDIO_MASTERED') {
          eventFired = true;
          assert.equal(evt.payload.targetLufs, -16.0);
          assert.equal(evt.payload.clipCount, 2);
        }
      };
      workflowEventEmitter.on(`campaign:${campaignId}`, listener);

      const audioTrack = {
        type: 'audio',
        items: [
          { id: 'a1', sourceUrl: 'https://cloudinary.com/audio1.mp3' },
          { id: 'a2', sourceUrl: 'https://cloudinary.com/audio2.mp3' },
        ],
      };

      const result = await audioMasteringService.processAudioMastering({
        campaignId,
        executionId,
        stepId: 'step-audio-1',
        audioTrack,
      });

      workflowEventEmitter.off(`campaign:${campaignId}`, listener);

      assert.equal(result.status, 'COMPLETED');
      assert.equal(result.targetLufs, -16.0);
      assert.ok(result.filterString.includes('loudnorm'));
      assert.ok(eventFired);
    });

    it('should mark status as SKIPPED when audio track has no clips', async () => {
      const result = await audioMasteringService.processAudioMastering({
        campaignId: 'camp-aud-2',
        audioTrack: { type: 'audio', items: [] },
      });

      assert.equal(result.status, 'SKIPPED');
    });
  });
});
