import {
  MEMORY_PRIORITY,
  CONFIDENCE_POLICY,
  MEMORY_STATUS,
  MEMORY_TYPES,
  MEMORY_SOURCES,
} from './memory.constants.js';

export class MemoryPolicy {
  /**
   * Determine priority level based on source and constraint type
   */
  resolvePriority({ source, type, isCampaignExplicit = false }) {
    if (isCampaignExplicit) {
      return MEMORY_PRIORITY.CAMPAIGN_EXPLICIT;
    }
    if (type === MEMORY_TYPES.HARD_CONSTRAINT) {
      return source === MEMORY_SOURCES.USER_DEFINED
        ? MEMORY_PRIORITY.USER_HARD
        : MEMORY_PRIORITY.BRAND_HARD;
    }
    if (source === MEMORY_SOURCES.CAMPAIGN) {
      return MEMORY_PRIORITY.CREATIVE_MEMORY;
    }
    return MEMORY_PRIORITY.BRAND_PREFERENCE;
  }

  /**
   * Calculate confidence score deterministically based on origin and occurrence count
   */
  calculateConfidence({ source, occurrenceCount = 1 }) {
    switch (source) {
      case MEMORY_SOURCES.USER_DEFINED:
        return CONFIDENCE_POLICY.USER_DEFINED;
      case MEMORY_SOURCES.CAMPAIGN:
        return CONFIDENCE_POLICY.EXPLICIT_CAMPAIGN_CONSTRAINT;
      case MEMORY_SOURCES.REVISION:
        return occurrenceCount > 1
          ? CONFIDENCE_POLICY.REPEATED_REVISION_PATTERN
          : CONFIDENCE_POLICY.SINGLE_REVISION;
      case MEMORY_SOURCES.EVALUATION:
        return occurrenceCount > 1
          ? CONFIDENCE_POLICY.REPEATED_EVALUATION_DEFECT
          : CONFIDENCE_POLICY.SINGLE_EVALUATION;
      default:
        return CONFIDENCE_POLICY.DEFAULT;
    }
  }

  /**
   * Check whether a new candidate memory should be auto-activated
   * Rule: AI-discovered patterns NEVER auto-activate to ACTIVE; they remain PENDING_REVIEW.
   */
  getInitialStatus({ source }) {
    if (source === MEMORY_SOURCES.USER_DEFINED) {
      return MEMORY_STATUS.ACTIVE;
    }
    return MEMORY_STATUS.PENDING_REVIEW;
  }

  /**
   * Determine if an item is a hard constraint or soft preference
   */
  classifyConstraintType({ category, explicitType }) {
    if (explicitType) return explicitType;
    if (category === 'NEGATIVE_CONSTRAINT' || category === 'COMPLIANCE') {
      return MEMORY_TYPES.HARD_CONSTRAINT;
    }
    return MEMORY_TYPES.SOFT_PREFERENCE;
  }
}

export const memoryPolicy = new MemoryPolicy();
export default memoryPolicy;

