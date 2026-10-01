import { z } from 'zod';
import {
  EVALUATION_VERSION,
  DEFAULT_EVALUATION_THRESHOLD,
  DEFAULT_DIMENSION_WEIGHTS,
} from './evaluation.types.js';
import { EvaluationValidationError } from './evaluation.errors.js';

export const evaluationIssueSchema = z.object({
  severity: z.enum(['critical', 'major', 'minor', 'info']),
  category: z.enum(['product', 'brand', 'visual', 'technical', 'subtitles', 'audio']),
  description: z.string().min(1, 'Issue description is required'),
  sceneId: z.string().nullable().optional(),
  evidence: z.string().optional(),
});

export const dimensionScoreSchema = z.object({
  score: z
    .number()
    .min(0, 'Score cannot be negative')
    .max(10, 'Score cannot exceed 10.0')
    .refine((v) => !Number.isNaN(v) && Number.isFinite(v), {
      message: 'Score must be a finite number',
    }),
  weight: z
    .number()
    .min(0, 'Weight cannot be negative')
    .max(1, 'Weight cannot exceed 1.0')
    .refine((v) => !Number.isNaN(v) && Number.isFinite(v), {
      message: 'Weight must be a finite number',
    }),
  weightedScore: z
    .number()
    .min(0, 'Weighted score cannot be negative')
    .max(10, 'Weighted score cannot exceed 10.0')
    .refine((v) => !Number.isNaN(v) && Number.isFinite(v), {
      message: 'Weighted score must be a finite number',
    }),
  findings: z.string().min(1, 'Dimension findings are required'),
});

export const technicalChecksSchema = z.object({
  videoReadable: z.boolean(),
  durationValid: z.boolean(),
  resolutionValid: z.boolean(),
  aspectRatioValid: z.boolean(),
  audioPresent: z.boolean(),
  subtitlesValid: z.boolean(),
});

export const canonicalEvaluationResultSchema = z.object({
  evaluationVersion: z.literal(EVALUATION_VERSION).default(EVALUATION_VERSION),
  campaignId: z.string().min(1, 'Valid campaign ID is required'),
  workflowExecutionId: z.string().min(1).nullable().optional(),
  finalVideoId: z.string().min(1).nullable().optional(),
  overallScore: z
    .number()
    .min(0, 'Overall score cannot be negative')
    .max(10, 'Overall score cannot exceed 10.0')
    .refine((v) => !Number.isNaN(v) && Number.isFinite(v), {
      message: 'Overall score must be a finite number',
    }),
  threshold: z
    .number()
    .min(0, 'Threshold cannot be negative')
    .max(10, 'Threshold cannot exceed 10.0')
    .default(DEFAULT_EVALUATION_THRESHOLD),
  passed: z.boolean(),
  dimensions: z.object({
    productFidelity: dimensionScoreSchema,
    brandConsistency: dimensionScoreSchema,
    visualQuality: dimensionScoreSchema,
  }),
  technicalChecks: technicalChecksSchema,
  issues: z.array(evaluationIssueSchema).default([]),
  recommendations: z.array(z.string()).default([]),
  revisionInstructions: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});

/**
 * Validates canonical evaluation result and verifies mathematical consistency.
 *
 * @param {object} rawResult
 * @returns {import('./evaluation.types.js').EvaluationResult}
 */
export function validateEvaluationResult(rawResult) {
  const parseResult = canonicalEvaluationResultSchema.safeParse(rawResult);

  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new EvaluationValidationError(`Evaluation result schema validation failed: ${errorDetails}`, {
      errors: parseResult.error.errors,
    });
  }

  const result = parseResult.data;

  // 1. Verify mathematical calculation of weighted score
  const dims = result.dimensions;
  const expectedWeightedSum =
    dims.productFidelity.score * dims.productFidelity.weight +
    dims.brandConsistency.score * dims.brandConsistency.weight +
    dims.visualQuality.score * dims.visualQuality.weight;

  const roundedExpected = Math.round(expectedWeightedSum * 100) / 100;
  const difference = Math.abs(roundedExpected - result.overallScore);

  if (difference > 0.05) {
    throw new EvaluationValidationError(
      `Mathematical inconsistency: overallScore (${result.overallScore}) does not match weighted sum (${roundedExpected})`,
      { overallScore: result.overallScore, expected: roundedExpected }
    );
  }

  // 2. Verify passed flag strictly matches overallScore >= threshold
  const expectedPassed = result.overallScore >= result.threshold;
  if (result.passed !== expectedPassed) {
    throw new EvaluationValidationError(
      `Pass/Fail inconsistency: passed is ${result.passed} but overallScore (${result.overallScore}) vs threshold (${result.threshold}) requires ${expectedPassed}`,
      { passed: result.passed, expectedPassed }
    );
  }

  return result;
}
