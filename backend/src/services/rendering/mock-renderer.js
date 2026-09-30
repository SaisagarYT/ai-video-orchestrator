import { validateTimelineIR } from '../timeline/timeline.validator.js';
import { RendererError } from './renderer.errors.js';
import { logger } from '../../core/logger/logger.js';

export class MockRenderer {
  constructor(options = {}) {
    this.name = 'mock';
    this.options = options;
  }

  /**
   * Render a timeline into a deterministic mock video artifact.
   *
   * @param {object} timeline - Canonical Timeline IR
   * @param {object} [options] - Optional execution settings
   * @param {boolean} [options.simulateFailure] - Simulate an unrecoverable rendering crash
   * @param {string} [options.mockOutputPath] - Override fake output path
   * @returns {Promise<import('./renderer.types.js').RenderResult>}
   */
  async render(timeline, options = {}) {
    // 1. Validate Timeline IR integrity
    const validatedTimeline = validateTimelineIR(timeline);

    // 2. Simulated failure hook for testing
    if (options.simulateFailure || options.forceError) {
      const errorMsg = options.errorMessage || 'Mock renderer simulated execution failure';
      logger.error(`[MockRenderer] ${errorMsg}`);
      throw new RendererError(errorMsg, { campaignId: timeline.campaignId });
    }

    const videoTrack = validatedTimeline.tracks.find((t) => t.type === 'video');
    const audioTrack = validatedTimeline.tracks.find((t) => t.type === 'audio');

    const totalScenes = videoTrack?.items.length || 0;
    const hasAudio = Boolean(audioTrack && audioTrack.items.length > 0);

    const outputPath =
      options.mockOutputPath ||
      `/tmp/mock-renders/${validatedTimeline.campaignId}/final_${validatedTimeline.output.aspectRatio.replace(':', '_')}.mp4`;

    logger.info(
      `[MockRenderer] Rendered timeline for campaign ${validatedTimeline.campaignId}: ${totalScenes} scenes, duration: ${validatedTimeline.durationMs}ms`
    );

    return {
      renderer: 'mock',
      status: 'COMPLETED',
      outputPath,
      durationMs: validatedTimeline.durationMs,
      width: validatedTimeline.output.width,
      height: validatedTimeline.output.height,
      format: validatedTimeline.output.format,
      mimeType: 'video/mp4',
      metadata: {
        mock: true,
        totalScenes,
        hasAudio,
        fps: validatedTimeline.output.fps,
        videoCodec: validatedTimeline.output.videoCodec,
        audioCodec: validatedTimeline.output.audioCodec,
        renderedAt: new Date().toISOString(),
      },
    };
  }
}

export const mockRenderer = new MockRenderer();
