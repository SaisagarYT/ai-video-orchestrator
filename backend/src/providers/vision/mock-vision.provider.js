import { VisionProvider } from './vision.provider.js';
import {
  ProviderTimeoutError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderResponseError,
} from '../core/provider.errors.js';

export const VISION_SCENARIOS = {
  PERFECT: 'PERFECT',
  PRODUCT_FIDELITY_FAILURE: 'PRODUCT_FIDELITY_FAILURE',
  LIGHTING_MISMATCH: 'LIGHTING_MISMATCH',
  BRAND_INCONSISTENCY: 'BRAND_INCONSISTENCY',
  SCENE_INCONSISTENCY: 'SCENE_INCONSISTENCY',
  TIMEOUT: 'TIMEOUT',
  AUTH_ERROR: 'AUTH_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  MALFORMED_RESPONSE: 'MALFORMED_RESPONSE',
};

export class MockVisionProvider extends VisionProvider {
  constructor(options = {}) {
    super('mock-vision', options);
    this.scenario = options.scenario || VISION_SCENARIOS.PERFECT;
    this.sceneScenarios = new Map();
  }

  setScenario(scenario) {
    this.scenario = scenario;
    return this;
  }

  setSceneScenario(sceneId, scenario) {
    this.sceneScenarios.set(String(sceneId), scenario);
    return this;
  }

  reset() {
    this.scenario = VISION_SCENARIOS.PERFECT;
    this.sceneScenarios.clear();
  }

  async analyzeImage(request) {
    const startTime = Date.now();
    return {
      description: 'High-contrast commercial product shot with crisp details, clean background bokeh, and cinematic studio lighting.',
      provider: 'mock-vision',
      latencyMs: Math.max(1, Date.now() - startTime),
    };
  }

  async analyzeFrames({ frames = [], expectedScene = {}, creativeBible = {}, brandContext = {}, options = {} }) {
    const sceneId = expectedScene.id || expectedScene.sceneId || (frames[0]?.sceneId) || 'scene-unknown';
    const effectiveScenario =
      this.sceneScenarios.get(String(sceneId)) ||
      options.scenario ||
      this.scenario;

    if (effectiveScenario === VISION_SCENARIOS.TIMEOUT) {
      throw new ProviderTimeoutError('Vision provider timed out after 60000ms', { provider: 'mock-vision' });
    }

    if (effectiveScenario === VISION_SCENARIOS.AUTH_ERROR) {
      throw new ProviderAuthenticationError('Invalid vision provider credentials', { provider: 'mock-vision' });
    }

    if (effectiveScenario === VISION_SCENARIOS.RATE_LIMIT) {
      throw new ProviderRateLimitError('Vision provider rate limit exceeded', { provider: 'mock-vision' });
    }

    if (effectiveScenario === VISION_SCENARIOS.MALFORMED_RESPONSE) {
      throw new ProviderResponseError('Malformed JSON payload from vision provider', { provider: 'mock-vision' });
    }

    const frameIds = frames.map((f) => f.frameId || f.id || 'frame');
    const firstFrameId = frameIds[0] || 'frame-1';

    if (effectiveScenario === VISION_SCENARIOS.PRODUCT_FIDELITY_FAILURE) {
      return {
        sceneId: String(sceneId),
        sceneIndex: expectedScene.sequence_number || expectedScene.sceneIndex || 1,
        frameCount: frames.length,
        confidence: 0.94,
        dimensions: {
          productFidelity: {
            score: 4.5,
            confidence: 0.95,
            findings: 'Reference scene requires the product container to remain upright. In sampled frames, the generated object appears horizontally oriented with deformed geometry.',
          },
          brandConsistency: {
            score: 8.8,
            confidence: 0.90,
            findings: 'Brand color styling adheres to baseline guidelines.',
          },
          visualQuality: {
            score: 8.9,
            confidence: 0.92,
            findings: 'Cinematic lighting and clear focus.',
          },
          sceneConsistency: {
            score: 8.6,
            confidence: 0.88,
            findings: 'Consistent background composition.',
          },
        },
        detectedIssues: [
          {
            code: 'PRODUCT_FIDELITY_MISMATCH',
            severity: 'major',
            category: 'product',
            sceneId: String(sceneId),
            frameIds: [firstFrameId],
            evidence: `Reference scene requires the product container to remain upright. In sampled frame at ${frames[0]?.timestampSeconds?.toFixed(2) || '0.00'}s, the generated object appears horizontally oriented.`,
            revisionInstructions: [
              'Preserve original product geometry and proportions.',
              'Ensure the product container remains upright and centered in frame.',
            ],
          },
        ],
        observations: [
          `Sampled ${frames.length} frame(s) for scene ${sceneId}.`,
          'Identified packaging distortion and horizontal orientation defect.',
        ],
      };
    }

    if (effectiveScenario === VISION_SCENARIOS.LIGHTING_MISMATCH) {
      return {
        sceneId: String(sceneId),
        sceneIndex: expectedScene.sequence_number || expectedScene.sceneIndex || 1,
        frameCount: frames.length,
        confidence: 0.92,
        dimensions: {
          productFidelity: {
            score: 8.9,
            confidence: 0.90,
            findings: 'Product container accurately recognized.',
          },
          brandConsistency: {
            score: 8.5,
            confidence: 0.88,
            findings: 'Brand identity partially visible.',
          },
          visualQuality: {
            score: 4.8,
            confidence: 0.94,
            findings: 'Creative Bible mandates high-key studio lighting, but sampled frames are severely underexposed, murky, and shadowed.',
          },
          sceneConsistency: {
            score: 8.7,
            confidence: 0.90,
            findings: 'Temporal continuity maintained across scene.',
          },
        },
        detectedIssues: [
          {
            code: 'LIGHTING_MISMATCH',
            severity: 'major',
            category: 'visual',
            sceneId: String(sceneId),
            frameIds: [firstFrameId],
            evidence: 'Visual lighting is dark, murky, and lacks key lighting mandated by Creative Bible directives.',
            revisionInstructions: [
              'Apply high-contrast professional commercial studio lighting with clean key light and balanced fill.',
              'Eliminate shadowy, dim, or murky lighting.',
            ],
          },
        ],
        observations: [
          `Sampled ${frames.length} frame(s) for scene ${sceneId}.`,
          'Detected underexposed illumination across all frames.',
        ],
      };
    }

    if (effectiveScenario === VISION_SCENARIOS.BRAND_INCONSISTENCY) {
      return {
        sceneId: String(sceneId),
        sceneIndex: expectedScene.sequence_number || expectedScene.sceneIndex || 1,
        frameCount: frames.length,
        confidence: 0.91,
        dimensions: {
          productFidelity: {
            score: 8.8,
            confidence: 0.90,
            findings: 'Product container accurately recognized.',
          },
          brandConsistency: {
            score: 5.0,
            confidence: 0.93,
            findings: 'Visual palette diverges significantly from Creative Bible color guidelines.',
          },
          visualQuality: {
            score: 9.0,
            confidence: 0.95,
            findings: 'High clarity and sharp definition.',
          },
          sceneConsistency: {
            score: 8.8,
            confidence: 0.90,
            findings: 'Smooth motion transition.',
          },
        },
        detectedIssues: [
          {
            code: 'BRAND_INCONSISTENCY',
            severity: 'major',
            category: 'brand',
            sceneId: String(sceneId),
            frameIds: [firstFrameId],
            evidence: 'Color grading and environmental palette diverge from the approved Creative Bible color scheme.',
            revisionInstructions: [
              'Adhere strictly to brand identity guidelines and color palette.',
            ],
          },
        ],
        observations: [
          `Sampled ${frames.length} frame(s) for scene ${sceneId}.`,
          'Identified off-brand palette in scene environment.',
        ],
      };
    }

    if (effectiveScenario === VISION_SCENARIOS.SCENE_INCONSISTENCY) {
      return {
        sceneId: String(sceneId),
        sceneIndex: expectedScene.sequence_number || expectedScene.sceneIndex || 1,
        frameCount: frames.length,
        confidence: 0.90,
        dimensions: {
          productFidelity: {
            score: 8.5,
            confidence: 0.88,
            findings: 'Product container recognized.',
          },
          brandConsistency: {
            score: 8.7,
            confidence: 0.90,
            findings: 'Brand elements present.',
          },
          visualQuality: {
            score: 8.8,
            confidence: 0.92,
            findings: 'Sharp frames.',
          },
          sceneConsistency: {
            score: 4.6,
            confidence: 0.92,
            findings: 'Spatial discontinuity and product morphing detected between early and late sampled frames.',
          },
        },
        detectedIssues: [
          {
            code: 'SCENE_INCONSISTENCY',
            severity: 'major',
            category: 'visual',
            sceneId: String(sceneId),
            frameIds: [firstFrameId],
            evidence: 'Spatial geometry morphs abruptly between early and late frames of the scene.',
            revisionInstructions: [
              'Maintain spatial stability and consistent product geometry across all frames.',
            ],
          },
        ],
        observations: [
          `Sampled ${frames.length} frame(s) for scene ${sceneId}.`,
          'Identified temporal geometry distortion.',
        ],
      };
    }

    // Default: PERFECT
    return {
      sceneId: String(sceneId),
      sceneIndex: expectedScene.sequence_number || expectedScene.sceneIndex || 1,
      frameCount: frames.length,
      confidence: 0.95,
      dimensions: {
        productFidelity: {
          score: 9.5,
          confidence: 0.96,
          findings: 'Product container, branding, and geometry match expected specifications with pristine fidelity.',
        },
        brandConsistency: {
          score: 9.3,
          confidence: 0.94,
          findings: 'Color palette and visual tone strictly align with Creative Bible guidelines.',
        },
        visualQuality: {
          score: 9.6,
          confidence: 0.97,
          findings: 'Studio lighting, crisp focus, clean composition, and high commercial appeal.',
        },
        sceneConsistency: {
          score: 9.4,
          confidence: 0.95,
          findings: 'Temporal stability and smooth visual continuity maintained across all frames.',
        },
      },
      detectedIssues: [],
      observations: [
        `Sampled ${frames.length} frame(s) for scene ${sceneId}.`,
        'Product geometry and branding verified upright and sharp.',
        'Lighting and color palette strictly adhere to Creative Bible directives.',
      ],
    };
  }
}

export const mockVisionProvider = new MockVisionProvider();
export default MockVisionProvider;
