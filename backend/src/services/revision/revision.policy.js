import { MAX_REVISION_ATTEMPTS, REVISION_STATUS } from './revision.types.js';

export class RevisionPolicy {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts ?? MAX_REVISION_ATTEMPTS;
  }

  /**
   * Evaluates whether a workflow execution is eligible to proceed with another revision attempt.
   *
   * @param {object} params
   * @param {number} params.attemptCount - Current number of completed revision attempts
   * @param {object} params.evaluationResult - Result from quality evaluation
   * @param {number} [params.maxAttempts] - Optional override
   * @returns {{ allowed: boolean, reason?: string, exhausted: boolean, nextAttemptNumber?: number }}
   */
  canRevise({ attemptCount = 0, evaluationResult, maxAttempts = null }) {
    const effectiveMax = maxAttempts ?? this.maxAttempts;

    if (!evaluationResult) {
      return {
        allowed: false,
        reason: 'Missing evaluation result',
        exhausted: false,
      };
    }

    // 1. If evaluation passed, revision is unnecessary
    if (evaluationResult.passed === true) {
      return {
        allowed: false,
        reason: 'Quality evaluation has already passed threshold',
        exhausted: false,
      };
    }

    // 2. Bound revision loop: stop when max attempts reached
    if (attemptCount >= effectiveMax) {
      return {
        allowed: false,
        reason: `Maximum autonomous revision attempts (${effectiveMax}) reached`,
        exhausted: true,
      };
    }

    return {
      allowed: true,
      nextAttemptNumber: attemptCount + 1,
      exhausted: false,
    };
  }

  /**
   * Deterministic idempotency key for scene regeneration during revision.
   * Prevents duplicate scene generation if worker restarts.
   *
   * @param {string} executionId
   * @param {string} sceneId
   * @param {number} attemptNumber
   * @returns {string}
   */
  generateSceneIdempotencyKey(executionId, sceneId, attemptNumber) {
    return `revision-scene:${executionId}:${sceneId}:att-${attemptNumber}`;
  }

  /**
   * Deterministic idempotency key for timeline rendering during revision.
   *
   * @param {string} campaignId
   * @param {string} executionId
   * @param {number} attemptNumber
   * @returns {string}
   */
  generateRenderIdempotencyKey(campaignId, executionId, attemptNumber) {
    return `${campaignId}:${executionId}:render:rev-${attemptNumber}`;
  }

  /**
   * Determine whether an exhausted revision can be marked as WARNING_ACCEPTED
   * (e.g. near-threshold score without critical fatal defects).
   *
   * @param {object} evaluationResult
   * @returns {boolean}
   */
  canAcceptWithWarning(evaluationResult) {
    if (!evaluationResult) return false;
    const hasCriticalIssues = (evaluationResult.issues || []).some(
      (issue) => issue.severity === 'critical'
    );
    // If no critical defects and score is within reasonable proximity to threshold (>= 6.5)
    return !hasCriticalIssues && (evaluationResult.overallScore || 0) >= 6.5;
  }
}

export const revisionPolicy = new RevisionPolicy();
