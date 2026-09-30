import { rendererRegistry } from './renderer.registry.js';
import { mockRenderer, MockRenderer } from './mock-renderer.js';
import { ffmpegRenderer, FFmpegRenderer } from './ffmpeg-renderer.js';
import { renderService, RenderService } from './render.service.js';
import { config } from '../../config/env.js';

// Register standard renderers
rendererRegistry.register('mock', mockRenderer, { isDefault: true });
rendererRegistry.register('ffmpeg', ffmpegRenderer);

// If environment specifies ffmpeg as default and it's available, configure it
if (config.rendering?.defaultRenderer === 'ffmpeg') {
  rendererRegistry.register('ffmpeg', ffmpegRenderer, { isDefault: true });
}

export * from './renderer.types.js';
export * from './renderer.errors.js';
export * from './renderer.registry.js';
export * from './mock-renderer.js';
export * from './ffmpeg-renderer.js';
export * from './render.service.js';

export { rendererRegistry, mockRenderer, ffmpegRenderer, renderService };
export default renderService;
