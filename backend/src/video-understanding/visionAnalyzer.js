import { sceneAnalyzer } from './sceneAnalyzer.js';
import { logger } from '../core/logger/logger.js';

export class VisionAnalyzer {
  constructor(options = {}) {
    this.analyzer = options.sceneAnalyzer || sceneAnalyzer;
  }

  // Group extracted frames by sceneId or sceneIndex
  groupFramesByScene(frames = []) {
    const map = new Map();
    for (const frame of frames) {
      const key = String(frame.sceneId || `scene-${frame.sceneIndex || 1}`);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(frame);
    }
    return map;
  }

    // Analyze all scenes in a video and synthesize overall multimodal findings.
  async analyzeVideo({ scenes = [], frames = [], creativeBible = {}, brandContext = {}, options = {} }) {
    const framesByScene = this.groupFramesByScene(frames);
    const sceneResults = [];
    const allIssues = [];

    logger.info(`[VisionAnalyzer] Starting visual analysis for ${scenes.length} scene(s) with ${frames.length} total frames`);

    for (const scene of scenes) {
      const sceneId = String(scene.id || scene.sceneId || `scene-${scene.sequence_number || 1}`);
      const sceneFrames = framesByScene.get(sceneId) || [];

      const result = await this.analyzer.analyzeScene({
        scene,
        frames: sceneFrames,
        creativeBible,
        brandContext,
        options,
      });

      sceneResults.push(result);
      if (Array.isArray(result.detectedIssues)) {
        allIssues.push(...result.detectedIssues);
      }
    }

    // Aggregate Dimensions across all scenes
    const sceneCount = sceneResults.length || 1;
    let sumProduct = 0;
    let sumBrand = 0;
    let sumVisual = 0;
    let sumConsistency = 0;
    let sumConfidence = 0;

    const productFindings = [];
    const brandFindings = [];
    const visualFindings = [];
    const consistencyFindings = [];

    for (const sr of sceneResults) {
      sumProduct += sr.dimensions.productFidelity.score;
      sumBrand += sr.dimensions.brandConsistency.score;
      sumVisual += sr.dimensions.visualQuality.score;
      sumConsistency += sr.dimensions.sceneConsistency.score;
      sumConfidence += sr.confidence || 0.95;

      if (sr.dimensions.productFidelity.findings) productFindings.push(sr.dimensions.productFidelity.findings);
      if (sr.dimensions.brandConsistency.findings) brandFindings.push(sr.dimensions.brandConsistency.findings);
      if (sr.dimensions.visualQuality.findings) visualFindings.push(sr.dimensions.visualQuality.findings);
      if (sr.dimensions.sceneConsistency.findings) consistencyFindings.push(sr.dimensions.sceneConsistency.findings);
    }

    const avgProduct = Math.round((sumProduct / sceneCount) * 100) / 100;
    const avgBrand = Math.round((sumBrand / sceneCount) * 100) / 100;
    const avgVisual = Math.round((sumVisual / sceneCount) * 100) / 100;
    const avgConsistency = Math.round((sumConsistency / sceneCount) * 100) / 100;
    const overallConfidence = Math.round((sumConfidence / sceneCount) * 100) / 100;

    const dimensions = {
      productFidelity: {
        score: avgProduct,
        confidence: overallConfidence,
        findings: productFindings.join(' | ') || 'Product fidelity evaluated across all scenes.',
      },
      brandConsistency: {
        score: avgBrand,
        confidence: overallConfidence,
        findings: brandFindings.join(' | ') || 'Brand consistency evaluated across all scenes.',
      },
      visualQuality: {
        score: avgVisual,
        confidence: overallConfidence,
        findings: visualFindings.join(' | ') || 'Visual composition and lighting evaluated across all scenes.',
      },
      sceneConsistency: {
        score: avgConsistency,
        confidence: overallConfidence,
        findings: consistencyFindings.join(' | ') || 'Temporal scene consistency evaluated across all scenes.',
      },
    };

    const majorIssuesCount = allIssues.filter((i) => i.severity === 'critical' || i.severity === 'major').length;
    let summary = `Visual inspection completed across ${sceneCount} scene(s) (${frames.length} frames).`;
    if (majorIssuesCount > 0) {
      summary += ` Identified ${majorIssuesCount} major/critical visual issue(s) requiring revision.`;
    } else {
      summary += ` All scenes conform to Creative Bible and commercial visual quality standards.`;
    }

    return {
      sceneCount: sceneResults.length,
      frameCount: frames.length,
      overallConfidence,
      summary,
      dimensions,
      detectedIssues: allIssues,
      scenes: sceneResults,
    };
  }
}

export const visionAnalyzer = new VisionAnalyzer();
export default VisionAnalyzer;
