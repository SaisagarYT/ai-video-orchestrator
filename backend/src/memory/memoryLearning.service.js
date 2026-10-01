import { logger } from '../core/logger/logger.js';
import { memoryRepository } from './memoryRepository.js';
import { memoryPolicy } from './memoryPolicy.js';
import {
  MEMORY_STATUS,
  MEMORY_SOURCES,
  BRAND_MEMORY_CATEGORIES,
} from './memory.constants.js';

export class MemoryLearningService {
  /**
   * Conservatively propose candidate memory items from Slice 7 prompt repairs.
   * New items remain in PENDING_REVIEW status until explicitly approved by the user.
   *
   * @param {object} params
   * @param {string} params.businessId
   * @param {string} params.campaignId
   * @param {string} params.executionId
   * @param {Array<object>} params.targets - Revised scene targets
   * @param {object} [params.plan]
   * @returns {Promise<Array<object>>} Created candidate items
   */
  async proposeRevisionCandidates({ businessId, campaignId, executionId, targets = [], plan = null }) {
    if (!businessId || !targets.length) return [];

    const candidates = [];

    for (const target of targets) {
      const ops = target.appliedOperations || [];
      const explanation = target.explanation || '';

      // Determine pattern or candidate rule from applied prompt healing operations
      let proposedKey = null;
      let proposedValue = null;
      let category = BRAND_MEMORY_CATEGORIES.PRODUCT_PRESENTATION;

      if (
        ops.includes('PRESERVE_IDENTITY') ||
        ops.includes('PRODUCT_GEOMETRY') ||
        ops.includes('ADD_CONSTRAINT') ||
        explanation.includes('product orientation') ||
        explanation.includes('geometry') ||
        explanation.includes('constraint') ||
        explanation.includes('framing')
      ) {
        proposedKey = 'product_geometry_invariance';
        proposedValue = 'Product geometry and orientation must remain strictly preserved in hero closeups.';
        category = BRAND_MEMORY_CATEGORIES.PRODUCT_PRESENTATION;
      } else if (ops.includes('LIGHTING_REPAIR') || explanation.includes('lighting')) {
        proposedKey = 'lighting_consistency_rule';
        proposedValue = 'Maintain consistent sculpted directional lighting across scene transitions.';
        category = BRAND_MEMORY_CATEGORIES.LIGHTING;
      } else if (ops.includes('NEGATIVE_ENFORCEMENT') || explanation.includes('artifact')) {
        proposedKey = 'avoid_distortion_artifacts';
        proposedValue = 'Avoid motion distortion, unnatural warping, and texture jitter.';
        category = BRAND_MEMORY_CATEGORIES.NEGATIVE_CONSTRAINT;
      }

      if (!proposedKey || !proposedValue) continue;

      const idempotencyKey = `${businessId}:cand:rev:${target.sceneIndex || target.sceneId}:${proposedKey}`;

      const confidence = memoryPolicy.calculateConfidence({
        source: MEMORY_SOURCES.REVISION,
        occurrenceCount: 1,
      });

      try {
        const { item, isExisting } = await memoryRepository.createBrandMemoryItem(
          {
            business_id: businessId,
            category,
            key: proposedKey,
            value: proposedValue,
            type: memoryPolicy.classifyConstraintType({ category }),
            priority: 50,
            confidence,
            status: MEMORY_STATUS.PENDING_REVIEW,
            source: MEMORY_SOURCES.REVISION,
            source_id: campaignId,
            idempotency_key: idempotencyKey,
            metadata: {
              campaignId,
              executionId,
              sceneId: target.sceneId,
              appliedOperations: ops,
              rationale: explanation,
            },
          },
          `Candidate proposed from Scene ${target.sceneIndex || 1} revision: ${explanation || 'Prompt healed'}`
        );

        if (!isExisting) {
          logger.info(`[MemoryLearningService] MEMORY_CANDIDATE_CREATED`, {
            businessId,
            campaignId,
            workflowExecutionId: executionId,
            memoryId: item.id,
            key: item.key,
            source: MEMORY_SOURCES.REVISION,
            status: MEMORY_STATUS.PENDING_REVIEW,
          });
          candidates.push(item);
        }
      } catch (err) {
        logger.warn(`Failed to create revision memory candidate: ${err.message}`);
      }
    }

    return candidates;
  }

  /**
   * Conservatively propose candidate memory items from Slice 8 visual defects.
   *
   * @param {object} params
   * @param {string} params.businessId
   * @param {string} params.campaignId
   * @param {string} params.executionId
   * @param {Array<object>} params.detectedIssues - Issues detected by vision analyzer
   * @returns {Promise<Array<object>>} Created candidate items
   */
  async proposeVisionCandidates({ businessId, campaignId, executionId, detectedIssues = [] }) {
    if (!businessId || !detectedIssues.length) return [];

    const candidates = [];

    // Group defects by category/issue code
    const countsByCode = {};
    for (const issue of detectedIssues) {
      const code = issue.code || issue.dimension || 'GENERAL_DEFECT';
      countsByCode[code] = (countsByCode[code] || 0) + 1;
    }

    for (const [code, count] of Object.entries(countsByCode)) {
      // Conservative policy: only trigger candidates if defect was flagged across multiple scenes/frames
      if (count < 2) continue;

      let key = `vision_guardrail_${code.toLowerCase()}`;
      let value = `Enforce visual consistency to prevent repeated ${code} defects.`;
      let category = BRAND_MEMORY_CATEGORIES.NEGATIVE_CONSTRAINT;

      if (code.includes('PRODUCT') || code.includes('FIDELITY')) {
        key = 'hero_product_fidelity_guardrail';
        value = 'Hero product shape, branding, and orientation must remain visually consistent across all shots.';
        category = BRAND_MEMORY_CATEGORIES.PRODUCT_PRESENTATION;
      } else if (code.includes('LIGHTING') || code.includes('ATMOSPHERE')) {
        key = 'scene_lighting_coherence_guardrail';
        value = 'Avoid abrupt lighting changes and preserve volumetric studio lighting coherence.';
        category = BRAND_MEMORY_CATEGORIES.LIGHTING;
      }

      const idempotencyKey = `${businessId}:cand:vision:${code}`;
      const confidence = memoryPolicy.calculateConfidence({
        source: MEMORY_SOURCES.EVALUATION,
        occurrenceCount: count,
      });

      try {
        const { item, isExisting } = await memoryRepository.createBrandMemoryItem(
          {
            business_id: businessId,
            category,
            key,
            value,
            type: memoryPolicy.classifyConstraintType({ category }),
            priority: 50,
            confidence,
            status: MEMORY_STATUS.PENDING_REVIEW,
            source: MEMORY_SOURCES.EVALUATION,
            source_id: campaignId,
            idempotency_key: idempotencyKey,
            metadata: {
              campaignId,
              executionId,
              issueCode: code,
              defectCount: count,
            },
          },
          `Candidate proposed from ${count} visual defect occurrences of ${code} in Video Understanding`
        );

        if (!isExisting) {
          logger.info(`[MemoryLearningService] MEMORY_CANDIDATE_CREATED`, {
            businessId,
            campaignId,
            workflowExecutionId: executionId,
            memoryId: item.id,
            key: item.key,
            source: MEMORY_SOURCES.EVALUATION,
            status: MEMORY_STATUS.PENDING_REVIEW,
          });
          candidates.push(item);
        }
      } catch (err) {
        logger.warn(`Failed to create vision memory candidate: ${err.message}`);
      }
    }

    return candidates;
  }

  /**
   * Explicitly approve a candidate memory item into an ACTIVE rule.
   */
  async approveCandidate({ businessId, userId, memoryId, type = null, priority = null }) {
    const existing = await memoryRepository.getBrandMemoryItem(memoryId);
    if (existing.business_id !== businessId) {
      throw new Error(`Memory candidate ${memoryId} does not belong to business ${businessId}`);
    }

    const updates = {
      status: MEMORY_STATUS.ACTIVE,
      confidence: 1.0,
      source: MEMORY_SOURCES.USER_DEFINED,
    };
    if (type) updates.type = type;
    if (priority) updates.priority = priority;

    const approved = await memoryRepository.updateBrandMemoryItem(
      memoryId,
      updates,
      `User ${userId} reviewed and approved candidate into active brand rule`
    );

    logger.info(`[MemoryLearningService] MEMORY_APPROVED`, {
      businessId,
      memoryId,
      key: approved.key,
      approvedBy: userId,
    });

    return approved;
  }
}

export const memoryLearningService = new MemoryLearningService();
export default memoryLearningService;

