import {
  EVALUATION_VERSION,
  DEFAULT_EVALUATION_THRESHOLD,
  DEFAULT_DIMENSION_WEIGHTS,
  ISSUE_SEVERITY,
  ISSUE_CATEGORY,
} from './evaluation.types.js';

export class MockEvaluator {
  constructor(options = {}) {
    this.name = 'mock';
    this.options = options;
  }

  /**
   * Run deterministic mock evaluation.
   *
   * @param {object} params
   * @param {object} params.campaign
   * @param {object} [params.finalVideo]
   * @param {object} [params.timeline]
   * @param {number} [params.threshold=7.5]
   * @param {object} [params.options] - Custom simulation overrides
   * @param {boolean} [params.options.forceFail=false]
   * @param {number} [params.options.overrideOverallScore]
   * @param {object} [params.options.dimensionOverrides]
   * @returns {import('./evaluation.types.js').EvaluationResult}
   */
  evaluate({ campaign, finalVideo = null, timeline = null, threshold = DEFAULT_EVALUATION_THRESHOLD, options = {} }) {
    const forceFail = options.forceFail ?? this.options.forceFail ?? false;
    const weights = DEFAULT_DIMENSION_WEIGHTS;

    let productScore = options.productScore ?? this.options.productScore ?? (forceFail ? 5.5 : 9.2);
    let brandScore = options.brandScore ?? this.options.brandScore ?? (forceFail ? 6.0 : 8.8);
    let visualScore = options.visualScore ?? this.options.visualScore ?? (forceFail ? 6.0 : 9.4);

    const overrideScore = options.overrideOverallScore ?? this.options.overrideOverallScore;
    if (overrideScore !== undefined) {
      // Scale dimensions proportionally to hit the target overall score
      const target = Math.min(10, Math.max(0, overrideScore));
      productScore = target;
      brandScore = target;
      visualScore = target;
    }

    const rawIssues = options.issues ?? this.options.issues;
    const issues = rawIssues ? [...rawIssues] : [];
    const rawRecs = options.recommendations ?? this.options.recommendations;
    const recommendations = rawRecs ? [...rawRecs] : [];
    const rawInstr = options.revisionInstructions ?? this.options.revisionInstructions;
    const revisionInstructions = rawInstr ? [...rawInstr] : [];

    // Multimodal Vision Analysis Integration (Slice 8)
    const visionAnalysis = options.visionAnalysis || null;
    let hasMajorVisionIssue = false;

    if (visionAnalysis && visionAnalysis.dimensions && overrideScore === undefined) {
      const vDims = visionAnalysis.dimensions;
      if (typeof vDims.productFidelity?.score === 'number') {
        productScore = Math.round((productScore * 0.6 + vDims.productFidelity.score * 0.4) * 100) / 100;
      }
      if (typeof vDims.brandConsistency?.score === 'number') {
        brandScore = Math.round((brandScore * 0.6 + vDims.brandConsistency.score * 0.4) * 100) / 100;
      }
      if (typeof vDims.visualQuality?.score === 'number') {
        visualScore = Math.round((visualScore * 0.6 + vDims.visualQuality.score * 0.4) * 100) / 100;
      }

      const visionIssues = visionAnalysis.detected_issues || visionAnalysis.detectedIssues || [];
      for (const vi of visionIssues) {
        issues.push({
          severity: vi.severity || 'major',
          category: vi.category || 'visual',
          description: `[Vision Finding] ${vi.code || 'VISUAL_DEFECT'}: ${vi.evidence || 'Visual defect detected'}`,
          sceneId: vi.sceneId,
          evidence: vi.evidence,
        });

        if (Array.isArray(vi.revisionInstructions)) {
          for (const instr of vi.revisionInstructions) {
            if (!revisionInstructions.includes(instr)) {
              revisionInstructions.push(instr);
            }
          }
        }

        if (vi.severity === 'critical' || vi.severity === 'major') {
          hasMajorVisionIssue = true;
        }
      }
    }

    if (forceFail || hasMajorVisionIssue) {
      const currentRaw = productScore * weights.productFidelity + brandScore * weights.brandConsistency + visualScore * weights.visualQuality;
      if (currentRaw >= threshold) {
        const target = Math.max(1, threshold - 1.5);
        productScore = Math.min(productScore, target);
        brandScore = Math.min(brandScore, target);
        visualScore = Math.min(visualScore, target);
      }
    }

    const weightedProduct = Math.round(productScore * weights.productFidelity * 100) / 100;
    const weightedBrand = Math.round(brandScore * weights.brandConsistency * 100) / 100;
    const weightedVisual = Math.round(visualScore * weights.visualQuality * 100) / 100;

    const rawOverall = productScore * weights.productFidelity + brandScore * weights.brandConsistency + visualScore * weights.visualQuality;
    const overallScore = Math.round(rawOverall * 100) / 100;

    const passed = overallScore >= threshold;

    const technicalChecks = {
      videoReadable: options.videoReadable ?? true,
      durationValid: options.durationValid ?? true,
      resolutionValid: options.resolutionValid ?? true,
      aspectRatioValid: options.aspectRatioValid ?? true,
      audioPresent: options.audioPresent ?? true,
      subtitlesValid: options.subtitlesValid ?? true,
    };

    if (forceFail || !passed) {
      if (issues.length === 0) {
        issues.push({
          severity: ISSUE_SEVERITY.MAJOR,
          category: ISSUE_CATEGORY.PRODUCT,
          description: 'Simulated quality gate failure: product hero feature representation falls below standard.',
          evidence: 'Mock score penalty applied',
        });
      }
      recommendations.push('Review prompt specifications and increase product close-up duration.');
      revisionInstructions.push('Increase visual prompt density for product hero shots by 25%.');
      revisionInstructions.push('Adjust camera angles to prioritize product branding.');
    } else {
      recommendations.push('Excellent pacing and high brand fidelity maintained across all scenes.');
    }

    return {
      evaluationVersion: EVALUATION_VERSION,
      campaignId: campaign?.id,
      workflowExecutionId: finalVideo?.workflow_execution_id || null,
      finalVideoId: finalVideo?.id || null,
      overallScore,
      threshold,
      passed,
      dimensions: {
        productFidelity: {
          score: productScore,
          weight: weights.productFidelity,
          weightedScore: weightedProduct,
          findings: passed ? 'Strong product representation.' : 'Product features under-emphasized in hero shots.',
        },
        brandConsistency: {
          score: brandScore,
          weight: weights.brandConsistency,
          weightedScore: weightedBrand,
          findings: passed ? 'Adheres strictly to brand tone directives.' : 'Minor color grading discordance with brand style.',
        },
        visualQuality: {
          score: visualScore,
          weight: weights.visualQuality,
          weightedScore: weightedVisual,
          findings: passed ? 'High quality, coherent motion dynamics.' : 'Slight compression artifacts or motion blur.',
        },
      },
      technicalChecks,
      issues,
      recommendations,
      revisionInstructions,
      metadata: {
        evaluatedAt: new Date().toISOString(),
        mock: true,
        forceFail,
      },
    };
  }
}

export const mockEvaluator = new MockEvaluator();
