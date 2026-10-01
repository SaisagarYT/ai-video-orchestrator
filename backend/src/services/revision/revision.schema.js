import { z } from 'zod';
import { REPAIR_OPERATIONS, REVISION_STATUS } from './revision.types.js';
import { RevisionValidationError } from './revision.errors.js';

export const revisionOperationSchema = z.object({
  type: z.enum([
    REPAIR_OPERATIONS.ADD_CONSTRAINT,
    REPAIR_OPERATIONS.REMOVE_CONFLICT,
    REPAIR_OPERATIONS.STRENGTHEN_DESCRIPTION,
    REPAIR_OPERATIONS.PRESERVE_IDENTITY,
    REPAIR_OPERATIONS.CORRECT_LIGHTING,
    REPAIR_OPERATIONS.CORRECT_CAMERA,
    REPAIR_OPERATIONS.ENHANCE_BRANDING,
  ]),
  rule: z.string().min(1, 'Repair operation rule is required'),
  rationale: z.string().optional(),
});

export const revisionTargetSchema = z.object({
  sceneId: z.string().min(1, 'sceneId is required'),
  sceneIndex: z.number().int().min(1),
  issues: z.array(z.any()).default([]),
  operations: z.array(revisionOperationSchema).default([]),
  originalPrompt: z.string().min(1, 'originalPrompt is required'),
  healedPrompt: z.string().optional(),
  explanation: z.string().optional(),
  previousAssetId: z.string().nullable().optional(),
  newAssetId: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'GENERATED', 'FAILED']).default('PENDING'),
});

export const revisionPlanSchema = z.object({
  campaignId: z.string().min(1, 'campaignId is required'),
  workflowExecutionId: z.string().min(1).nullable().optional(),
  evaluationId: z.string().min(1, 'evaluationId is required'),
  attemptNumber: z.number().int().min(1),
  targets: z.array(revisionTargetSchema).min(1, 'At least one revision target scene is required'),
  unaffectedSceneIds: z.array(z.string()).default([]),
  diagnostics: z.record(z.any()).default({}),
});

export const revisionAttemptSchema = z.object({
  campaignId: z.string().min(1),
  workflowExecutionId: z.string().min(1),
  attemptNumber: z.number().int().min(1),
  evaluationId: z.string().min(1).nullable().optional(),
  status: z.enum([
    REVISION_STATUS.PENDING,
    REVISION_STATUS.IN_PROGRESS,
    REVISION_STATUS.COMPLETED,
    REVISION_STATUS.FAILED,
    REVISION_STATUS.EXHAUSTED,
    REVISION_STATUS.WARNING_ACCEPTED,
  ]).default(REVISION_STATUS.IN_PROGRESS),
  diagnostics: z.record(z.any()).default({}),
  affectedSceneIds: z.array(z.string()).default([]),
  timelineId: z.string().nullable().optional(),
  finalVideoId: z.string().nullable().optional(),
  subsequentEvaluationId: z.string().nullable().optional(),
  passed: z.boolean().default(false),
  metadata: z.record(z.any()).default({}),
});

/**
 * Validates a revision plan structure
 * @param {object} plan
 * @returns {import('./revision.types.js').RevisionPlan}
 */
export function validateRevisionPlan(plan) {
  const result = revisionPlanSchema.safeParse(plan);
  if (!result.success) {
    const errorDetails = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new RevisionValidationError(`Revision plan validation failed: ${errorDetails}`, {
      errors: result.error.errors,
    });
  }
  return result.data;
}
