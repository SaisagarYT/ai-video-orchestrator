import { providerRegistry } from '../providers/index.js';
import { validateSceneVisionResult } from './schemas.js';
import { VisionAnalysisError } from './errors.js';
import { logger } from '../core/logger/logger.js';

export class SceneAnalyzer {
  constructor(options = {}) {
    this.providerName = options.providerName || null;
  }

    // Analyze extracted frames for a single scene against expected specification.
  async analyzeScene({ scene, frames = [], creativeBible = {}, brandContext = {}, options = {} }) {
    if (!scene) {
      throw new VisionAnalysisError('Expected scene specification is required for scene vision analysis');
    }

    const sceneId = scene.id || scene.sceneId || (frames[0]?.sceneId) || 'scene-unknown';
    const sceneIndex = scene.sequence_number ?? scene.sceneIndex ?? 1;

    if (!Array.isArray(frames) || frames.length === 0) {
      logger.warn(`[SceneAnalyzer] No frames available for scene ${sceneId}, returning fallback evaluation`);
      return validateSceneVisionResult({
        sceneId: String(sceneId),
        sceneIndex,
        frameCount: 0,
        confidence: 0.5,
        dimensions: {
          productFidelity: { score: 7.0, confidence: 0.5, findings: 'No frames captured for verification.' },
          brandConsistency: { score: 7.0, confidence: 0.5, findings: 'No frames captured for verification.' },
          visualQuality: { score: 7.0, confidence: 0.5, findings: 'No frames captured for verification.' },
          sceneConsistency: { score: 7.0, confidence: 0.5, findings: 'No frames captured for verification.' },
        },
        detectedIssues: [],
        observations: ['No frames available for visual analysis.'],
      });
    }

    try {
      const targetProvider = options.provider || providerRegistry.getVision(this.providerName);
      const rawResult = await targetProvider.analyzeFrames({
        frames,
        expectedScene: scene,
        creativeBible,
        brandContext,
        options,
      });

      // Strict validation
      return validateSceneVisionResult(rawResult);
    } catch (err) {
      if (err instanceof VisionAnalysisError) throw err;
      logger.error(`[SceneAnalyzer] Error analyzing scene ${sceneId}: ${err.message}`);
      throw new VisionAnalysisError(`Scene analysis failed for scene ${sceneId}: ${err.message}`, { cause: err });
    }
  }
}

export const sceneAnalyzer = new SceneAnalyzer();
export default SceneAnalyzer;
