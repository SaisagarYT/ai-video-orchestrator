import { supabase } from '../config/supabase.js';
import { logger } from '../core/logger/logger.js';
import { memoryRepository } from './memoryRepository.js';
import { MemoryNotFoundError, MemoryForbiddenError } from './errors.js';
import { MEMORY_STATUS } from './memory.constants.js';

export class CreativeMemoryService {
  async verifyBusinessOwnership(businessId, userId) {
    if (!businessId || !userId) {
      throw new MemoryForbiddenError('Business ID and User ID are required');
    }

    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (error) throw error;
    if (!business) {
      throw new MemoryNotFoundError(`Business ${businessId} not found`);
    }

    if (business.user_id !== userId) {
      throw new MemoryForbiddenError(`User ${userId} does not own business ${businessId}`);
    }

    return business;
  }

  async createPattern(businessId, userId, payload) {
    await this.verifyBusinessOwnership(businessId, userId);

    const { item, isExisting } = await memoryRepository.createCreativeMemoryItem(
      {
        ...payload,
        business_id: businessId,
        source: payload.source || 'USER_DEFINED',
        status: payload.status || MEMORY_STATUS.ACTIVE,
      },
      `User ${userId} created creative pattern '${payload.pattern}'`
    );

    logger.info(`[CreativeMemoryService] MEMORY_UPDATED`, {
      businessId,
      patternId: item.id,
      pattern: item.pattern,
      isExisting,
    });

    return item;
  }

  async listPatterns(businessId, userId, filters = {}) {
    await this.verifyBusinessOwnership(businessId, userId);
    return memoryRepository.listCreativeMemoryItems(businessId, filters);
  }

  async recordPatternUsage(patternId) {
    try {
      const pattern = await memoryRepository.getCreativeMemoryItem(patternId);
      return memoryRepository.updateCreativeMemoryItem(patternId, {
        usage_count: (pattern.usage_count || 0) + 1,
      });
    } catch (err) {
      logger.warn(`Could not increment usage for creative pattern ${patternId}: ${err.message}`);
    }
  }

  async recordPatternApproval(patternId) {
    try {
      const pattern = await memoryRepository.getCreativeMemoryItem(patternId);
      return memoryRepository.updateCreativeMemoryItem(patternId, {
        approval_count: (pattern.approval_count || 0) + 1,
      });
    } catch (err) {
      logger.warn(`Could not increment approval for creative pattern ${patternId}: ${err.message}`);
    }
  }

  async recordPatternRejection(patternId) {
    try {
      const pattern = await memoryRepository.getCreativeMemoryItem(patternId);
      return memoryRepository.updateCreativeMemoryItem(patternId, {
        rejection_count: (pattern.rejection_count || 0) + 1,
      });
    } catch (err) {
      logger.warn(`Could not increment rejection for creative pattern ${patternId}: ${err.message}`);
    }
  }

  async archivePattern(businessId, userId, patternId, reason = 'Archived by user') {
    await this.verifyBusinessOwnership(businessId, userId);
    const existing = await memoryRepository.getCreativeMemoryItem(patternId);
    if (existing.business_id !== businessId) {
      throw new MemoryForbiddenError(`Pattern ${patternId} does not belong to business ${businessId}`);
    }

    const archived = await memoryRepository.archiveCreativeMemoryItem(patternId, reason);
    logger.info(`[CreativeMemoryService] MEMORY_ARCHIVED`, {
      businessId,
      patternId,
      pattern: archived.pattern,
      reason,
    });
    return archived;
  }
}

export const creativeMemoryService = new CreativeMemoryService();
export default creativeMemoryService;

