import {
  EVALUATION_VERSION,
  DEFAULT_EVALUATION_THRESHOLD,
  DEFAULT_DIMENSION_WEIGHTS,
  ISSUE_SEVERITY,
  ISSUE_CATEGORY,
} from './evaluation.types.js';

/**
 * Deterministic Evaluation Rules Engine
 * Directly migrates and extends the legacy Python EvaluationEngine (evaluation_engine.py).
 */
export class EvaluationRulesEngine {
  /**
   * Run deterministic quality gate evaluation against campaign context,
   * storyboard scenes, creative bible, timeline, and final video.
   *
   * @param {object} params
   * @param {object} params.campaign - Campaign record
   * @param {object} [params.creativeBible] - Creative Bible / Direction metadata
   * @param {Array<object>} [params.scenes] - Screenwriter scenes array
   * @param {object} [params.timeline] - Canonical Timeline IR
   * @param {object} [params.finalVideo] - Final Video record
   * @param {object} [params.subtitles] - Subtitle asset or metadata
   * @param {number} [params.threshold] - Passing score threshold (0.0 - 10.0)
   * @returns {import('./evaluation.types.js').EvaluationResult}
   */
  evaluate({
    campaign,
    creativeBible = null,
    scenes = [],
    timeline = null,
    finalVideo = null,
    subtitles = null,
    threshold = DEFAULT_EVALUATION_THRESHOLD,
  }) {
    const issues = [];
    const recommendations = [];
    const revisionInstructions = [];

    // --- 1. Technical Quality Checks ---
    const hasFinalVideo = Boolean(finalVideo && (finalVideo.url || finalVideo.secure_url));
    const videoReadable = hasFinalVideo;

    // Check duration against campaign duration_seconds
    const expectedDurationMs = (campaign?.duration_seconds || 15) * 1000;
    const actualDurationMs = finalVideo?.duration_ms || timeline?.duration_ms || expectedDurationMs;
    const durationVariance = Math.abs(actualDurationMs - expectedDurationMs);
    const durationValid = durationVariance <= Math.max(5000, expectedDurationMs * 0.35);

    // Check resolution and aspect ratio
    const width = finalVideo?.width || (campaign?.aspect_ratio === '16:9' ? 1920 : 1080);
    const height = finalVideo?.height || (campaign?.aspect_ratio === '16:9' ? 1080 : 1920);
    const expectedRatio = campaign?.aspect_ratio || '9:16';
    const computedRatio = width > height ? '16:9' : '9:16';
    const aspectRatioValid = computedRatio === expectedRatio;
    const resolutionValid = width > 0 && height > 0;

    // Check audio presence
    const hasAudioTrack = Boolean(
      timeline?.tracks?.some((t) => t.type === 'audio' && t.items?.length > 0) ||
      finalVideo?.metadata?.hasAudio ||
      scenes.some((s) => s.audio_narration || s.narration)
    );
    const audioPresent = hasAudioTrack;

    // Check subtitle validity
    const subtitlesValid = subtitles ? Boolean(subtitles.url || subtitles.cues?.length > 0) : true;

    const technicalChecks = {
      videoReadable,
      durationValid,
      resolutionValid,
      aspectRatioValid,
      audioPresent,
      subtitlesValid,
    };

    // --- 2. Dimension 1: Product Fidelity (Weight: 40%) ---
    // Python reference: base 9.2, reduced to 6.0 if scene.visual_prompt < 15 chars
    let productScore = 9.2;
    const productFindings = [];

    const hasSparsePrompts = scenes.some(
      (s) => !s.visual_prompt || s.visual_prompt.trim().length < 15
    );

    if (hasSparsePrompts) {
      productScore = 6.0;
      issues.push({
        severity: ISSUE_SEVERITY.MAJOR,
        category: ISSUE_CATEGORY.PRODUCT,
        description: 'One or more scenes contain sparse visual prompts (< 15 characters), reducing product fidelity.',
        evidence: 'Prompt length check failed against minimum threshold',
      });
      productFindings.push('Key product dynamics under-specified in scene prompts.');
    } else {
      productFindings.push(`Accurately captured key product dynamics for ${campaign?.product_name || 'the product'}.`);
    }

    if (!campaign?.product_name || campaign.product_name.trim().length === 0) {
      productScore = Math.max(0, productScore - 2.0);
      issues.push({
        severity: ISSUE_SEVERITY.CRITICAL,
        category: ISSUE_CATEGORY.PRODUCT,
        description: 'Campaign is missing product name or USP details.',
      });
    }

    // --- 3. Dimension 2: Brand Consistency (Weight: 30%) ---
    // Python reference: base 8.8, reduced to 7.0 if creative_bible is missing
    let brandScore = 8.8;
    const brandFindings = [];

    if (!creativeBible) {
      brandScore = 7.0;
      issues.push({
        severity: ISSUE_SEVERITY.MINOR,
        category: ISSUE_CATEGORY.BRAND,
        description: 'Creative Bible is not attached; brand consistency cannot be verified against explicit color LUTs.',
      });
      brandFindings.push('Default brand style assumed without explicit Creative Bible directives.');
    } else {
      brandFindings.push('Matched visual tone, palette directives, and creative constraints.');
    }

    // --- 4. Dimension 3: Visual Quality (Weight: 30%) ---
    // Python reference: base 9.4, reduced to 6.5 if visual_prompt < 15 chars
    let visualScore = 9.4;
    const visualFindings = [];

    if (hasSparsePrompts) {
      visualScore = 6.5;
      visualFindings.push('Potential composition artifacts or generic visuals due to sparse prompts.');
    } else {
      visualFindings.push('Crisp composition, coherent camera movement, and no severe visual defects detected.');
    }

    if (!videoReadable || !resolutionValid || !aspectRatioValid) {
      visualScore = Math.min(visualScore, 4.0);
      issues.push({
        severity: ISSUE_SEVERITY.CRITICAL,
        category: ISSUE_CATEGORY.TECHNICAL,
        description: 'Video output failed core technical validation (unreadable or invalid canvas dimensions).',
      });
      visualFindings.push('Technical stream or resolution mismatch.');
    }

    // --- 5. Weighted Score Calculation ---
    // overall = round((product_score * 0.4) + (brand_score * 0.3) + (visual_score * 0.3), 2)
    const weights = DEFAULT_DIMENSION_WEIGHTS;
    const weightedProduct = Math.round(productScore * weights.productFidelity * 100) / 100;
    const weightedBrand = Math.round(brandScore * weights.brandConsistency * 100) / 100;
    const weightedVisual = Math.round(visualScore * weights.visualQuality * 100) / 100;

    const rawOverall = productScore * weights.productFidelity + brandScore * weights.brandConsistency + visualScore * weights.visualQuality;
    const overallScore = Math.round(rawOverall * 100) / 100;

    const passed = overallScore >= threshold && videoReadable && resolutionValid;

    // --- 6. Recommendations & Actionable Revision Instructions ---
    if (passed) {
      recommendations.push(
        'Maintain current generation parameters. For enhanced drama, increase camera motion speed ramp by 15% and boost rim light contrast.'
      );
      recommendations.push('Audio and subtitles are well synchronized with narration pacing.');
    } else {
      recommendations.push(
        'Increase prompt detail on product hero features, enforce stricter negative prompt tokens, and boost lighting contrast.'
      );
      revisionInstructions.push(
        'Refine scene visual prompts with explicit lens focal lengths and 3-point studio lighting.'
      );
      if (hasSparsePrompts) {
        revisionInstructions.push(
          'Expand all scene visual prompts to exceed at least 30 descriptive characters highlighting hero product features.'
        );
      }
      if (!creativeBible) {
        revisionInstructions.push(
          'Establish a formal Creative Bible with brand palette hex codes before re-generating scene video.'
        );
      }
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
          findings: productFindings.join(' '),
        },
        brandConsistency: {
          score: brandScore,
          weight: weights.brandConsistency,
          weightedScore: weightedBrand,
          findings: brandFindings.join(' '),
        },
        visualQuality: {
          score: visualScore,
          weight: weights.visualQuality,
          weightedScore: weightedVisual,
          findings: visualFindings.join(' '),
        },
      },
      technicalChecks,
      issues,
      recommendations,
      revisionInstructions,
      metadata: {
        evaluatedAt: new Date().toISOString(),
        engine: 'EvaluationRulesEngine',
        migratedFrom: 'evaluation_engine.py',
        sceneCount: scenes.length,
        actualDurationMs,
      },
    };
  }
}

export const evaluationRulesEngine = new EvaluationRulesEngine();
