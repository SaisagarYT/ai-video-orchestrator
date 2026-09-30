import { AppError } from '../../core/errors/AppError.js';
import { logger } from '../../core/logger/logger.js';

export class RendererRegistry {
  constructor() {
    this.renderers = new Map();
    this.defaultRendererName = 'mock';
  }

  /**
   * Register a renderer instance.
   *
   * @param {string} name
   * @param {object} renderer
   * @param {object} [options]
   * @param {boolean} [options.isDefault]
   */
  register(name, renderer, { isDefault = false } = {}) {
    if (!name || typeof name !== 'string') {
      throw AppError.badRequest('Renderer name must be a non-empty string');
    }
    if (!renderer || typeof renderer.render !== 'function') {
      throw AppError.badRequest(`Renderer '${name}' must implement a render(timeline, options) method`);
    }

    this.renderers.set(name.toLowerCase(), renderer);
    if (isDefault || !this.renderers.has(this.defaultRendererName)) {
      this.defaultRendererName = name.toLowerCase();
    }

    logger.debug(`[RendererRegistry] Registered renderer: '${name}' (default: ${isDefault})`);
  }

  /**
   * Retrieve a renderer by name.
   *
   * @param {string} [name]
   * @returns {object}
   */
  get(name) {
    if (!name) {
      return this.getDefault();
    }
    const renderer = this.renderers.get(name.toLowerCase());
    if (!renderer) {
      throw AppError.notFound(`Renderer '${name}' is not registered`);
    }
    return renderer;
  }

  /**
   * Retrieve the default renderer.
   *
   * @returns {object}
   */
  getDefault() {
    const renderer = this.renderers.get(this.defaultRendererName);
    if (!renderer) {
      throw AppError.notFound(`Default renderer '${this.defaultRendererName}' is not registered`);
    }
    return renderer;
  }

  has(name) {
    return this.renderers.has(name.toLowerCase());
  }

  list() {
    return Array.from(this.renderers.keys());
  }
}

export const rendererRegistry = new RendererRegistry();
