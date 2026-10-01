/**
 * Canonical types and constants for Slice 7: Autonomous Revision Loops & Prompt Self-Healing
 */

export const MAX_REVISION_ATTEMPTS = 2;

export const REVISION_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  EXHAUSTED: 'EXHAUSTED',
  WARNING_ACCEPTED: 'WARNING_ACCEPTED',
};

export const REPAIR_OPERATIONS = {
  ADD_CONSTRAINT: 'ADD_CONSTRAINT',
  REMOVE_CONFLICT: 'REMOVE_CONFLICT',
  STRENGTHEN_DESCRIPTION: 'STRENGTHEN_DESCRIPTION',
  PRESERVE_IDENTITY: 'PRESERVE_IDENTITY',
  CORRECT_LIGHTING: 'CORRECT_LIGHTING',
  CORRECT_CAMERA: 'CORRECT_CAMERA',
  ENHANCE_BRANDING: 'ENHANCE_BRANDING',
};

/**
 * @typedef {Object} RevisionOperation
 * @property {string} type - One of REPAIR_OPERATIONS
 * @property {string} rule - Specific instruction/rule applied
 * @property {string} [rationale] - Why this repair was applied
 */

/**
 * @typedef {Object} RevisionTarget
 * @property {string} sceneId - Target scene ID to regenerate
 * @property {number} sceneIndex - 1-based sequence index
 * @property {Array<object>} issues - Related issues from evaluation
 * @property {Array<RevisionOperation>} operations - Operations to apply
 * @property {string} originalPrompt - Original prompt before repair
 * @property {string} [healedPrompt] - Repaired prompt after healing
 * @property {string} [explanation] - Human-readable explanation of repair
 * @property {string} [previousAssetId] - Asset ID before revision
 * @property {string} [newAssetId] - New asset ID generated in revision
 * @property {string} [status] - PENDING, GENERATED, FAILED
 */

/**
 * @typedef {Object} RevisionPlan
 * @property {string} campaignId
 * @property {string} workflowExecutionId
 * @property {string} evaluationId - Source evaluation triggering revision
 * @property {number} attemptNumber - 1-based revision attempt
 * @property {Array<RevisionTarget>} targets - Affected scenes to heal and regenerate
 * @property {Array<string>} unaffectedSceneIds - Preserved scenes (not regenerated)
 * @property {object} diagnostics - Root cause summary and defect categories
 */

/**
 * @typedef {Object} RevisionAttemptRecord
 * @property {string} id
 * @property {string} campaignId
 * @property {string} workflowExecutionId
 * @property {number} attemptNumber
 * @property {string} evaluationId
 * @property {string} status
 * @property {object} diagnostics
 * @property {Array<string>} affectedSceneIds
 * @property {string} [timelineId]
 * @property {string} [finalVideoId]
 * @property {string} [subsequentEvaluationId]
 * @property {boolean} passed
 * @property {object} metadata
 */
