import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FrameExtractor } from '../../src/video-understanding/frameExtractor.js';
import { FrameMetadataSchema } from '../../src/video-understanding/schemas.js';
import { FrameExtractionError } from '../../src/video-understanding/errors.js';

describe('FrameExtractor Unit Tests', () => {
  const extractor = new FrameExtractor();

  it('should create an isolated temp directory and clean it up safely', () => {
    const tempDir = extractor.createTempDirectory();
    assert.equal(fs.existsSync(tempDir), true);

    extractor.cleanup(tempDir);
    assert.equal(fs.existsSync(tempDir), false);
  });

  it('should generate valid frames matching schema using synthetic fallback', async () => {
    const tempDir = extractor.createTempDirectory();

    try {
      const samplingPlan = [
        {
          sceneId: 'sc-101',
          sceneIndex: 1,
          timelineTimestamps: [0, 2.5, 5],
        },
      ];

      const frames = await extractor.extractFrames({
        videoPath: 'https://storage.provider.com/videos/mock-render.mp4',
        samplingPlan,
        tempDir,
      });

      assert.equal(frames.length, 3);

      for (const frame of frames) {
        // Validate each frame with Zod
        const parsed = FrameMetadataSchema.parse(frame);
        assert.equal(parsed.sceneId, 'sc-101');
        assert.equal(parsed.sceneIndex, 1);
        assert.equal(fs.existsSync(parsed.path), true);
      }
    } finally {
      extractor.cleanup(tempDir);
    }
  });

  it('should extract frames across multiple scenes with ordered timestamps', async () => {
    const tempDir = extractor.createTempDirectory();

    try {
      const samplingPlan = [
        { sceneId: 'sc-1', sceneIndex: 1, timelineTimestamps: [0, 2] },
        { sceneId: 'sc-2', sceneIndex: 2, timelineTimestamps: [4, 6] },
      ];

      const frames = await extractor.extractFrames({
        videoPath: 'nonexistent-local-file.mp4',
        samplingPlan,
        tempDir,
      });

      assert.equal(frames.length, 4);
      assert.equal(frames[0].sceneId, 'sc-1');
      assert.equal(frames[0].timestampSeconds, 0);
      assert.equal(frames[1].timestampSeconds, 2);
      assert.equal(frames[2].sceneId, 'sc-2');
      assert.equal(frames[2].timestampSeconds, 4);
      assert.equal(frames[3].timestampSeconds, 6);
    } finally {
      extractor.cleanup(tempDir);
    }
  });

  it('should throw FrameExtractionError if videoPath is missing', async () => {
    await assert.rejects(
      async () => {
        await extractor.extractFrames({ videoPath: '' });
      },
      (err) => err instanceof FrameExtractionError && err.code === 'FRAME_EXTRACTION_ERROR'
    );
  });
});
