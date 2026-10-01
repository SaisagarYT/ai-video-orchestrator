import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PlatformConstraintValidator } from '../../src/adaptation/validator.js';
import { tiktokProfile, youtubeLandscapeProfile } from '../../src/adaptation/profiles/index.js';

describe('PlatformConstraintValidator Unit Tests', () => {
  const createBaseTimeline = ({
    aspectRatio = '9:16',
    width = 1080,
    height = 1920,
    durationMs = 15000,
    includeAudio = true,
  } = {}) => ({
    version: '1.0',
    campaignId: '98d745e6-2394-4340-9a29-e3fa0293da22',
    output: {
      aspectRatio,
      width,
      height,
      fps: 30,
      format: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
    },
    durationMs,
    tracks: [
      {
        type: 'video',
        items: [
          {
            id: 'v1',
            sceneId: 'sc-1',
            assetId: 'a1',
            sourceUrl: 'http://cdn.example.com/v1.mp4',
            startMs: 0,
            durationMs,
            trimStartMs: 0,
            trimEndMs: 0,
            sequenceNumber: 1,
          },
        ],
      },
      ...(includeAudio
        ? [
            {
              type: 'audio',
              items: [
                {
                  id: 'a1',
                  sceneId: 'sc-1',
                  sourceUrl: 'http://cdn.example.com/a1.mp3',
                  startMs: 0,
                  durationMs,
                  volume: 1.0,
                },
              ],
            },
          ]
        : []),
    ],
  });

  it('should validate a compliant timeline and return valid: true', () => {
    const timeline = createBaseTimeline();
    const result = PlatformConstraintValidator.validateTimelineForPlatform({
      timeline,
      profile: tiktokProfile,
    });

    assert.equal(result.valid, true);
    assert.equal(result.violations.length, 0);
    assert.equal(result.platform, 'TIKTOK');
  });

  it('should flag aspect ratio and resolution mismatches', () => {
    // 9:16 video validated against 16:9 YouTube profile
    const timeline = createBaseTimeline({
      aspectRatio: '9:16',
      width: 1080,
      height: 1920,
    });

    const result = PlatformConstraintValidator.validateTimelineForPlatform({
      timeline,
      profile: youtubeLandscapeProfile,
    });

    assert.equal(result.valid, false);
    const codes = result.violations.map((v) => v.code);
    assert.ok(codes.includes('ASPECT_RATIO_MISMATCH'));
    assert.ok(codes.includes('RESOLUTION_MISMATCH'));
  });

  it('should flag duration limits (too short or too long)', () => {
    // Duration 1 second (below TikTok minimum of 3s)
    const tooShort = createBaseTimeline({ durationMs: 1000 });
    const shortResult = PlatformConstraintValidator.validateTimelineForPlatform({
      timeline: tooShort,
      profile: tiktokProfile,
    });
    assert.equal(shortResult.valid, false);
    assert.ok(shortResult.violations.some((v) => v.code === 'DURATION_TOO_SHORT'));

    // Duration 75 seconds (above TikTok maximum of 60s)
    const tooLong = createBaseTimeline({ durationMs: 75000 });
    const longResult = PlatformConstraintValidator.validateTimelineForPlatform({
      timeline: tooLong,
      profile: tiktokProfile,
    });
    assert.equal(longResult.valid, false);
    assert.ok(longResult.violations.some((v) => v.code === 'DURATION_TOO_LONG'));
  });

  it('should flag missing audio track when required by platform', () => {
    const noAudioTimeline = createBaseTimeline({ includeAudio: false });
    const result = PlatformConstraintValidator.validateTimelineForPlatform({
      timeline: noAudioTimeline,
      profile: tiktokProfile,
    });

    assert.equal(result.valid, false);
    assert.ok(result.violations.some((v) => v.code === 'MISSING_AUDIO_TRACK'));
  });

  it('should flag subtitle and CTA safe zone breaches', () => {
    const timeline = createBaseTimeline();

    // Subtitle placed at bottom y=0.90 (outside TikTok subtitle safe zone y=0.55 to 0.75)
    const subtitles = {
      cues: [
        {
          text: 'Get 50% discount right now',
          position: { x: 0.1, y: 0.90, width: 0.8, height: 0.08 },
        },
      ],
    };

    // CTA placed outside safe zone
    const ctaPlacement = { x: 0.05, y: 0.92, width: 0.9, height: 0.06 };

    const result = PlatformConstraintValidator.validateTimelineForPlatform({
      timeline,
      profile: tiktokProfile,
      subtitles,
      ctaPlacement,
    });

    assert.equal(result.valid, false);
    const codes = result.violations.map((v) => v.code);
    assert.ok(codes.includes('SUBTITLE_OUTSIDE_SAFE_ZONE'));
    assert.ok(codes.includes('CTA_OUTSIDE_SAFE_ZONE'));
  });
});
