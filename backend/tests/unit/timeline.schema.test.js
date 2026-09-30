import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateTimelineIR } from '../../src/services/timeline/timeline.validator.js';
import { TimelineIRSchema } from '../../src/services/timeline/timeline.schema.js';
import { TIMELINE_VERSION } from '../../src/services/timeline/timeline.types.js';

describe('Timeline Schema & Validator Unit Tests', () => {
  const validCampaignId = '66666666-6666-4666-8666-666666666666';
  const validExecutionId = '77777777-7777-4777-8777-777777777777';

  const createValidTimeline = () => ({
    version: TIMELINE_VERSION,
    campaignId: validCampaignId,
    workflowExecutionId: validExecutionId,
    output: {
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      fps: 30,
      format: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
    },
    durationMs: 10000,
    tracks: [
      {
        type: 'video',
        items: [
          {
            id: 'item-v-1',
            sceneId: 'sc-1',
            assetId: 'asset-v-1',
            sourceUrl: 'https://cloudinary.com/video1.mp4',
            startMs: 0,
            durationMs: 5000,
            trimStartMs: 0,
            trimEndMs: 0,
            sequenceNumber: 1,
          },
          {
            id: 'item-v-2',
            sceneId: 'sc-2',
            assetId: 'asset-v-2',
            sourceUrl: 'https://cloudinary.com/video2.mp4',
            startMs: 5000,
            durationMs: 5000,
            trimStartMs: 0,
            trimEndMs: 0,
            sequenceNumber: 2,
          },
        ],
      },
      {
        type: 'audio',
        items: [
          {
            id: 'item-a-1',
            sceneId: 'sc-1',
            assetId: 'asset-a-1',
            sourceUrl: 'https://cloudinary.com/audio1.mp3',
            startMs: 0,
            durationMs: 4000,
            volume: 1.0,
          },
        ],
      },
    ],
    metadata: {
      tags: ['commercial', 'test'],
    },
  });

  it('should validate and parse a valid canonical Timeline IR', () => {
    const timeline = createValidTimeline();
    const validated = validateTimelineIR(timeline);

    assert.equal(validated.version, '1.0');
    assert.equal(validated.campaignId, validCampaignId);
    assert.equal(validated.durationMs, 10000);
    assert.equal(validated.tracks.length, 2);
    assert.equal(validated.tracks[0].items.length, 2);
  });

  it('should reject timeline with invalid or missing campaignId', () => {
    const timeline = createValidTimeline();
    timeline.campaignId = 'not-a-valid-uuid';

    assert.throws(
      () => validateTimelineIR(timeline),
      (err) => err.message.includes('Valid campaign UUID is required')
    );
  });

  it('should reject negative duration or timestamps', () => {
    const timeline = createValidTimeline();
    timeline.durationMs = -5000;

    assert.throws(
      () => validateTimelineIR(timeline),
      (err) => err.message.includes('Timeline durationMs must be positive')
    );
  });

  it('should reject timeline with no video track', () => {
    const timeline = createValidTimeline();
    timeline.tracks = [
      {
        type: 'audio',
        items: [],
      },
    ];

    assert.throws(
      () => validateTimelineIR(timeline),
      (err) => err.message.includes('Timeline must have exactly 1 video track')
    );
  });

  it('should reject duplicate scene IDs in the video track', () => {
    const timeline = createValidTimeline();
    timeline.tracks[0].items[1].sceneId = 'sc-1'; // Duplicate of first item

    assert.throws(
      () => validateTimelineIR(timeline),
      (err) => err.message.includes('Duplicate scene placement detected for sceneId: sc-1')
    );
  });

  it('should reject invalid trim ranges exceeding item duration', () => {
    const timeline = createValidTimeline();
    timeline.tracks[0].items[0].trimStartMs = 3000;
    timeline.tracks[0].items[0].trimEndMs = 3000; // 3000 + 3000 = 6000 >= 5000

    assert.throws(
      () => validateTimelineIR(timeline),
      (err) => err.message.includes('Invalid trim range on scene sc-1')
    );
  });

  it('should reject video track discontinuity where startMs does not follow preceding clip', () => {
    const timeline = createValidTimeline();
    timeline.tracks[0].items[1].startMs = 7000; // Expected 5000, gap of 2000

    assert.throws(
      () => validateTimelineIR(timeline),
      (err) => err.message.includes('Video track discontinuity at scene index 1')
    );
  });

  it('should reject timeline when total durationMs does not match cumulative video track duration', () => {
    const timeline = createValidTimeline();
    timeline.durationMs = 12000; // Cumulative is 10000

    assert.throws(
      () => validateTimelineIR(timeline),
      (err) => err.message.includes('Timeline total durationMs (12000) does not match cumulative video track duration (10000)')
    );
  });

  it('should reject audio track item that starts beyond the total timeline duration', () => {
    const timeline = createValidTimeline();
    timeline.tracks[1].items[0].startMs = 15000; // Total duration is 10000

    assert.throws(
      () => validateTimelineIR(timeline),
      (err) => err.message.includes('is beyond timeline duration')
    );
  });
});
