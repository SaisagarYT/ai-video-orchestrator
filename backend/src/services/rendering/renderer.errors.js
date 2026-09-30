import { AppError } from '../../core/errors/AppError.js';

export class RendererError extends AppError {
  constructor(message, details = {}, statusCode = 500) {
    super(message, statusCode, 'RENDERER_ERROR', details);
    this.name = 'RendererError';
  }
}

export class RenderTimeoutError extends RendererError {
  constructor(message = 'Rendering process timed out', details = {}) {
    super(message, details, 504);
    this.code = 'RENDER_TIMEOUT_ERROR';
    this.name = 'RenderTimeoutError';
  }
}

export class RenderValidationError extends RendererError {
  constructor(message = 'Render output failed technical validation', details = {}) {
    super(message, details, 422);
    this.code = 'RENDER_VALIDATION_ERROR';
    this.name = 'RenderValidationError';
  }
}
