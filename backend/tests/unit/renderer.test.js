import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RendererRegistry } from '../../src/services/rendering/renderer.registry.js';
import { MockRenderer } from '../../src/services/rendering/mock-renderer.js';
import { FFmpegRenderer } from '../../src/services/rendering/ffmpeg-renderer.js';
import { RendererError, RenderTimeoutError } from '../../src/services/rendering/renderer.errors.js';

describe('Renderer & Registry Unit Tests', () => {
  const dummyTimeline = {
    version: '1.0',
    campaignId: '11111111-1111-4111-8111-111111111111',
    output: {
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      fps: 30,
      format: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
    },
    durationMs: 5000,
    tracks: [
      {
        type: 'video',
        items: [
          {
            id: 'v-1',
            sceneId: 'sc-1',
            assetId: 'ast-1',
            sourceUrl: 'https://cdn.example.com/v1.mp4',
            startMs: 0,
            durationMs: 5000,
            trimStartMs: 0,
            trimEndMs: 0,
            sequenceNumber: 1,
          },
        ],
      },
    ],
  };

  it('should register and retrieve renderers in RendererRegistry', () => {
    const registry = new RendererRegistry();
    const mock = new MockRenderer();

    registry.register('mock', mock, { isDefault: true });

    assert.equal(registry.has('mock'), true);
    assert.equal(registry.get('mock'), mock);
    assert.equal(registry.getDefault(), mock);
  });

  it('should throw error when requesting unregistered renderer', () => {
    const registry = new RendererRegistry();

    assert.throws(
      () => registry.get('nonexistent'),
      (err) => err.message.includes("Renderer 'nonexistent' is not registered")
    );
  });

  it('should render timeline deterministically with MockRenderer offline', async () => {
    const mock = new MockRenderer();
    const result = await mock.render(dummyTimeline);

    assert.equal(result.renderer, 'mock');
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.durationMs, 5000);
    assert.equal(result.width, 1080);
    assert.equal(result.height, 1920);
    assert.equal(result.format, 'mp4');
    assert.equal(result.mimeType, 'video/mp4');
    assert.equal(result.metadata.mock, true);
    assert.equal(result.metadata.totalScenes, 1);
  });

  it('should simulate failure in MockRenderer when requested', async () => {
    const mock = new MockRenderer();

    await assert.rejects(
      async () => {
        await mock.render(dummyTimeline, { simulateFailure: true, errorMessage: 'GPU memory limit' });
      },
      (err) => err instanceof RendererError && err.message === 'GPU memory limit'
    );
  });

  it('should construct secure FFmpeg argument arrays without shell injection', () => {
    const ffmpeg = new FFmpegRenderer();
    const inputVideos = ['/tmp/input1.mp4', '/tmp/input2.mp4'];
    const inputAudios = ['/tmp/narration.mp3'];
    const outputPath = '/tmp/out.mp4';

    const args = ffmpeg.buildFFmpegArguments(dummyTimeline, inputVideos, inputAudios, outputPath);

    // Verify args is an array of arguments, not a concatenated shell string
    assert.ok(Array.isArray(args));
    assert.ok(args.includes('-hide_banner'));
    assert.ok(args.includes('-filter_complex'));
    assert.ok(args.includes('libx264'));
    assert.ok(args.includes('aac'));
    assert.equal(args[args.length - 1], outputPath);

    // Verify filter_complex contains proper scaling and padding for 1080x1920
    const filterArg = args[args.indexOf('-filter_complex') + 1];
    assert.ok(filterArg.includes('scale=1080:1920:force_original_aspect_ratio=decrease'));
    assert.ok(filterArg.includes('pad=1080:1920:(ow-iw)/2:(oh-ih)/2'));
    assert.ok(filterArg.includes('concat=n=2:v=1:a=0'));
  });

  it('should correctly report FFmpeg availability in the current environment', () => {
    const ffmpeg = new FFmpegRenderer();
    const isAvail = ffmpeg.isAvailable();
    // On this machine, FFmpeg is expected to be boolean
    assert.equal(typeof isAvail, 'boolean');
  });
});
