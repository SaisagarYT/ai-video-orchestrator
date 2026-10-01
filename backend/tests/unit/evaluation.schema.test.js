import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalEvaluationResultSchema,
  validateEvaluationResult,
} from '../../src/services/evaluation/evaluation.schema.js';
import { EvaluationValidationError } from '../../src/services/evaluation/evaluation.errors.js';

describe('Evaluation Schema & Validator Unit Tests', () => {
  const validResult = {
    evaluationVersion: '1.0',
    campaignId: '11111111-1111-4111-8111-111111111111',
    workflowExecutionId: '22222222-2222-4222-8222-222222222222',
    finalVideoId: '33333333-3333-4333-8333-333333333333',
    overallScore: 8.6,
    threshold: 7.5,
    passed: true,
    dimensions: {
      productFidelity: {
        score: 9.0,
        weight: 0.4,
        weightedScore: 3.6,
        findings: 'Accurate product presentation',
      },
      brandConsistency: {
        score: 8.5,
        weight: 0.3,
        weightedScore: 2.55,
        findings: 'Brand directives followed',
      },
      visualQuality: {
        score: 8.2,
        weight: 0.3,
        weightedScore: 2.46,
        findings: 'High resolution render',
      },
    },
    technicalChecks: {
      videoReadable: true,
      durationValid: true,
      resolutionValid: true,
      aspectRatioValid: true,
      audioPresent: true,
      subtitlesValid: true,
    },
    issues: [
      {
        severity: 'minor',
        category: 'product',
        description: 'Slight glare on bottle label in scene 2',
        sceneId: 'sc-2',
      },
    ],
    recommendations: ['Maintain camera motion parameters.'],
    revisionInstructions: [],
    metadata: { test: true },
  };

  it('should validate and parse a valid canonical EvaluationResult', () => {
    // 9.0*0.4 + 8.5*0.3 + 8.2*0.3 = 3.6 + 2.55 + 2.46 = 8.61 -> rounded 8.61
    const testData = {
      ...validResult,
      overallScore: 8.61,
      dimensions: {
        ...validResult.dimensions,
        visualQuality: {
          score: 8.2,
          weight: 0.3,
          weightedScore: 2.46,
          findings: 'High resolution render',
        },
      },
    };

    const validated = validateEvaluationResult(testData);
    assert.equal(validated.overallScore, 8.61);
    assert.equal(validated.passed, true);
    assert.equal(validated.dimensions.productFidelity.score, 9.0);
  });

  it('should reject score below 0 or above 10', () => {
    const invalidNegative = {
      ...validResult,
      dimensions: {
        ...validResult.dimensions,
        productFidelity: {
          ...validResult.dimensions.productFidelity,
          score: -1.0,
        },
      },
    };

    assert.throws(
      () => validateEvaluationResult(invalidNegative),
      /Score cannot be negative/
    );

    const invalidTooHigh = {
      ...validResult,
      dimensions: {
        ...validResult.dimensions,
        productFidelity: {
          ...validResult.dimensions.productFidelity,
          score: 11.5,
        },
      },
    };

    assert.throws(
      () => validateEvaluationResult(invalidTooHigh),
      /Score cannot exceed 10.0/
    );
  });

  it('should reject NaN or Infinity scores', () => {
    const nanScore = {
      ...validResult,
      dimensions: {
        ...validResult.dimensions,
        productFidelity: {
          ...validResult.dimensions.productFidelity,
          score: NaN,
        },
      },
    };

    assert.throws(
      () => validateEvaluationResult(nanScore),
      EvaluationValidationError
    );

    const infinityScore = {
      ...validResult,
      dimensions: {
        ...validResult.dimensions,
        productFidelity: {
          ...validResult.dimensions.productFidelity,
          score: Infinity,
        },
      },
    };

    assert.throws(
      () => validateEvaluationResult(infinityScore),
      EvaluationValidationError
    );
  });

  it('should reject mathematical inconsistency between overallScore and weighted sum', () => {
    // Expected is ~8.61, but claim 9.5
    const inconsistent = {
      ...validResult,
      overallScore: 9.5,
    };

    assert.throws(
      () => validateEvaluationResult(inconsistent),
      /Mathematical inconsistency/
    );
  });

  it('should reject pass flag inconsistency with threshold', () => {
    // Score is 8.61, threshold is 7.5, but claim passed: false
    const inconsistentPass = {
      ...validResult,
      overallScore: 8.61,
      threshold: 7.5,
      passed: false,
    };

    assert.throws(
      () => validateEvaluationResult(inconsistentPass),
      /Pass\/Fail inconsistency/
    );
  });

  it('should correctly validate failing evaluation result', () => {
    // product: 5.0 (2.0), brand: 6.0 (1.8), visual: 6.0 (1.8) -> sum = 5.6
    const failResult = {
      ...validResult,
      overallScore: 5.6,
      threshold: 7.5,
      passed: false,
      dimensions: {
        productFidelity: {
          score: 5.0,
          weight: 0.4,
          weightedScore: 2.0,
          findings: 'Sparse product detail',
        },
        brandConsistency: {
          score: 6.0,
          weight: 0.3,
          weightedScore: 1.8,
          findings: 'Missing creative bible',
        },
        visualQuality: {
          score: 6.0,
          weight: 0.3,
          weightedScore: 1.8,
          findings: 'Visual artifacts detected',
        },
      },
      issues: [
        {
          severity: 'major',
          category: 'product',
          description: 'Product hero feature obscured',
        },
      ],
      revisionInstructions: ['Regenerate scene 1 with enhanced prompt.'],
    };

    const validated = validateEvaluationResult(failResult);
    assert.equal(validated.passed, false);
    assert.equal(validated.overallScore, 5.6);
    assert.equal(validated.revisionInstructions.length, 1);
  });
});
