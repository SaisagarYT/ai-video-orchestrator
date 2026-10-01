import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import {
  formatToSRT,
  formatToWebVTT,
  formatSrtTimestamp,
  formatVttTimestamp,
  sanitizeSubtitleText,
} from '../../src/services/subtitles/subtitle.formatter.js';
import { validateSubtitleDocument } from '../../src/services/subtitles/subtitle.schema.js';
import { subtitleService } from '../../src/services/subtitles/subtitle.service.js';
import { ValidationError } from '../../src/core/errors/AppError.js';

describe('Subtitle Service & Formatter Unit Tests', () => {
  const campaignId = 'c-sub-1111-1111-1111-111111111111';
  const executionId = 'e-sub-2222-2222-2222-222222222222';

  beforeEach(() => {
    memoryDb.reset();
  });

  describe('Timestamp & Format Helpers', () => {
    it('should correctly format SRT and WebVTT timestamps', () => {
      // 0 ms -> 00:00:00,000 / 00:00:00.000
      assert.equal(formatSrtTimestamp(0), '00:00:00,000');
      assert.equal(formatVttTimestamp(0), '00:00:00.000');

      // 2500 ms -> 00:00:02,500
      assert.equal(formatSrtTimestamp(2500), '00:00:02,500');
      assert.equal(formatVttTimestamp(2500), '00:00:02.500');

      // 3661500 ms -> 1 hour, 1 minute, 1 second, 500 ms
      assert.equal(formatSrtTimestamp(3661500), '01:01:01,500');
      assert.equal(formatVttTimestamp(3661500), '01:01:01.500');
    });

    it('should sanitize subtitle text preventing shell injection and control characters', () => {
      const dirty = 'Hello \x00World!\n<script>alert(1)</script> \r\nTest; rm -rf /';
      const clean = sanitizeSubtitleText(dirty);
      assert.equal(clean.includes('<script>'), false);
      assert.equal(clean.includes('\x00'), false);
      assert.equal(clean.includes('\n'), false);
    });

    it('should format document into standard SRT text', () => {
      const doc = {
        version: '1.0',
        language: 'en',
        cues: [
          { startMs: 0, endMs: 2500, text: 'Unleash your true peak energy.' },
          { startMs: 2500, endMs: 5000, text: 'Available everywhere now.' },
        ],
      };

      const srt = formatToSRT(doc);
      assert.ok(srt.includes('1\n00:00:00,000 --> 00:00:02,500\nUnleash your true peak energy.'));
      assert.ok(srt.includes('2\n00:00:02,500 --> 00:00:05,000\nAvailable everywhere now.'));
    });

    it('should format document into standard WebVTT text', () => {
      const doc = {
        version: '1.0',
        language: 'en',
        cues: [{ startMs: 0, endMs: 3000, text: 'Clean WebVTT subtitle.' }],
      };

      const vtt = formatToWebVTT(doc);
      assert.ok(vtt.startsWith('WEBVTT'));
      assert.ok(vtt.includes('00:00:00.000 --> 00:00:03.000'));
    });
  });

  describe('Subtitle Schema Validation', () => {
    it('should validate valid subtitle document', () => {
      const valid = {
        version: '1.0',
        language: 'en',
        cues: [
          { startMs: 0, endMs: 2000, text: 'First line.' },
          { startMs: 2000, endMs: 4000, text: 'Second line.' },
        ],
      };

      const result = validateSubtitleDocument(valid, 5000);
      assert.equal(result.cues.length, 2);
    });

    it('should reject cue where endMs <= startMs', () => {
      const invalid = {
        version: '1.0',
        language: 'en',
        cues: [{ startMs: 3000, endMs: 2000, text: 'End is before start' }],
      };

      assert.throws(() => validateSubtitleDocument(invalid), ValidationError);
    });

    it('should reject out-of-order cues', () => {
      const outOfOrder = {
        version: '1.0',
        language: 'en',
        cues: [
          { startMs: 3000, endMs: 4000, text: 'Late cue first' },
          { startMs: 1000, endMs: 2000, text: 'Early cue second' },
        ],
      };

      assert.throws(() => validateSubtitleDocument(outOfOrder), ValidationError);
    });
  });

  describe('SubtitleService Pipeline & Persistence', () => {
    const scenes = [
      {
        sequence_number: 1,
        audio_narration: 'Introducing Apex Surge energy drink.',
        duration_seconds: 4,
      },
      {
        sequence_number: 2,
        audio_narration: 'Zero sugar, pure focus.',
        duration_seconds: 4,
      },
    ];

    it('should generate, validate, format and persist subtitle asset', async () => {
      const { subtitleDoc, srtContent, asset, reused } =
        await subtitleService.generateSubtitlesFromScenes({
          campaignId,
          executionId,
          stepId: 'step-sub-1',
          scenes,
          maxDurationMs: 8000,
        });

      assert.equal(reused, false);
      assert.equal(subtitleDoc.cues.length, 2);
      assert.ok(srtContent.includes('Introducing Apex Surge'));
      assert.ok(asset.id);
      assert.equal(asset.asset_type, 'subtitles');

      // Verify stored in Supabase assets table
      const { data: dbAssets } = await supabase
        .from('assets')
        .select('*')
        .eq('workflow_execution_id', executionId)
        .eq('asset_type', 'subtitles');

      assert.equal(dbAssets.length, 1);
      assert.equal(dbAssets[0].id, asset.id);
    });

    it('should enforce idempotency and reuse existing subtitle asset', async () => {
      const first = await subtitleService.generateSubtitlesFromScenes({
        campaignId,
        executionId,
        scenes,
      });

      assert.equal(first.reused, false);

      const second = await subtitleService.generateSubtitlesFromScenes({
        campaignId,
        executionId,
        scenes,
      });

      assert.equal(second.reused, true);
      assert.equal(second.asset.id, first.asset.id);
    });
  });
});
