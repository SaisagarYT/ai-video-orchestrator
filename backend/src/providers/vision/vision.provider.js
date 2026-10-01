import { ProviderError } from '../core/provider.errors.js';

/**
 * Base abstract class for multimodal vision providers.
 */
export class VisionProvider {
  constructor(name, options = {}) {
    if (!name) throw new Error('Provider name is required');
    this.name = name;
    this.options = options;
  }

  /**
   * Analyze a single static image (legacy / general purpose).
   * @param {Object} request
   */
  async analyzeImage(request) {
    throw new ProviderError(`Method analyzeImage() not implemented on ${this.name} VisionProvider`);
  }

  /**
   * Analyze extracted video frames against scene specification and Creative Bible.
   * @param {Object} params
   * @param {Array<Object>} params.frames - Extracted frame metadata ({ frameId, path, timestampSeconds, sceneId })
   * @param {Object} params.expectedScene - Scene specification and visual prompts
   * @param {Object} [params.creativeBible] - Creative Bible rules, palette, camera rules
   * @param {Object} [params.brandContext] - Brand name, product details, guidelines
   * @param {Object} [params.options] - Execution options
   * @returns {Promise<Object>} Structured scene vision findings conforming to SceneVisionResultSchema
   */
  async analyzeFrames(params) {
    throw new ProviderError(`Method analyzeFrames() not implemented on ${this.name} VisionProvider`);
  }
}

export default VisionProvider;
