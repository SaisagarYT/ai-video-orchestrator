import { supabase } from '../config/supabase.js';
import { logger } from '../core/logger/logger.js';
import { memoryRepository } from './memoryRepository.js';
import { MemoryNotFoundError, MemoryForbiddenError } from './errors.js';
import { MEMORY_STATUS } from './memory.constants.js';

export class BrandMemoryService {
  /**
   * Verify that the requesting user owns the business.
   */
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

  /**
   * Retrieve full brand profile including stored memory rules
   */
  async getBrandProfile(businessId, userId) {
    const business = await this.verifyBusinessOwnership(businessId, userId);
    const memoryItems = await memoryRepository.listBrandMemoryItems(businessId, {
      status: MEMORY_STATUS.ACTIVE,
    });

    return {
      business,
      memoryItems,
      totalRules: memoryItems.length,
    };
  }

  /**
   * Create a user-defined brand memory item
   */
  async createMemoryItem(businessId, userId, payload) {
    await this.verifyBusinessOwnership(businessId, userId);

    const { item, isExisting, wasUpdated } = await memoryRepository.createBrandMemoryItem(
      {
        ...payload,
        business_id: businessId,
        source: payload.source || 'USER_DEFINED',
        status: payload.status || MEMORY_STATUS.ACTIVE,
      },
      `User ${userId} defined brand rule for '${payload.key}'`
    );

    logger.info(`[BrandMemoryService] MEMORY_UPDATED`, {
      businessId,
      memoryId: item.id,
      key: item.key,
      category: item.category,
      isExisting,
      wasUpdated,
    });

    return item;
  }

  /**
   * Update an existing brand memory item
   */
  async updateMemoryItem(businessId, userId, memoryId, updates) {
    await this.verifyBusinessOwnership(businessId, userId);

    // Verify item belongs to this business
    const existing = await memoryRepository.getBrandMemoryItem(memoryId);
    if (existing.business_id !== businessId) {
      throw new MemoryForbiddenError(`Memory item ${memoryId} does not belong to business ${businessId}`);
    }

    const updated = await memoryRepository.updateBrandMemoryItem(
      memoryId,
      updates,
      `User ${userId} updated memory item '${existing.key}'`
    );

    logger.info(`[BrandMemoryService] MEMORY_UPDATED`, {
      businessId,
      memoryId,
      key: updated.key,
      updates,
    });

    return updated;
  }

  /**
   * Archive a brand memory item
   */
  async archiveMemoryItem(businessId, userId, memoryId, reason = 'Archived by user') {
    await this.verifyBusinessOwnership(businessId, userId);

    const existing = await memoryRepository.getBrandMemoryItem(memoryId);
    if (existing.business_id !== businessId) {
      throw new MemoryForbiddenError(`Memory item ${memoryId} does not belong to business ${businessId}`);
    }

    const archived = await memoryRepository.archiveBrandMemoryItem(memoryId, reason);

    logger.info(`[BrandMemoryService] MEMORY_ARCHIVED`, {
      businessId,
      memoryId,
      key: archived.key,
      reason,
    });

    return archived;
  }

  /**
   * List brand memory items with optional filters
   */
  async listMemoryItems(businessId, userId, filters = {}) {
    await this.verifyBusinessOwnership(businessId, userId);
    return memoryRepository.listBrandMemoryItems(businessId, filters);
  }
}

export const brandMemoryService = new BrandMemoryService();
export default brandMemoryService;

