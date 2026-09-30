/**
 * Rendering Domain Types & Interfaces
 *
 * @typedef {object} RenderResult
 * @property {string} renderer - Name of the renderer (e.g., 'mock', 'ffmpeg')
 * @property {'COMPLETED' | 'FAILED'} status - Render completion status
 * @property {string} outputPath - Local filesystem or virtual path to the rendered video file
 * @property {number} durationMs - Final video duration in milliseconds
 * @property {number} width - Video width in pixels
 * @property {number} height - Video height in pixels
 * @property {string} format - Container format (e.g. 'mp4')
 * @property {string} mimeType - Media MIME type (e.g. 'video/mp4')
 * @property {object} [metadata] - Technical and operational render metadata
 */

export const RENDER_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

export const DEFAULT_RENDERER = 'mock';
