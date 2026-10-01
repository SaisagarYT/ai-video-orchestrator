import { supabase } from '../config/supabase.js';
import { logger } from '../core/logger/logger.js';
import { memoryConflictService } from './memoryConflict.service.js';
import { memoryContextSchema } from './schemas.js';
import { MEMORY_STATUS, MEMORY_TYPES, BRAND_MEMORY_CATEGORIES } from './memory.constants.js';

export class MemoryRetrievalService {
  /**
   * Deterministically retrieves, filters, and snapshots brand and creative memory for a campaign.
   *
   * @param {object} params
   * @param {string} params.businessId
   * @param {object} [params.campaign={}]
   * @param {string} [params.executionId=null]
   * @returns {Promise<object>} Frozen MemoryContext snapshot
   */
  async retrieveMemoryContext({ businessId, campaign = {}, executionId = null }) {
    const campaignId = campaign.id || null;

    logger.info(`[MemoryRetrievalService] MEMORY_RETRIEVAL_STARTED`, {
      businessId,
      campaignId,
      workflowExecutionId: executionId,
    });

    // 1. Fetch core business record
    let business = null;
    if (businessId) {
      const { data: bData } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .maybeSingle();
      business = bData || null;
    }

    // 2. Fetch active brand memory items
    let allBrandItems = [];
    if (businessId) {
      const { data: items } = await supabase
        .from('brand_memory_items')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', MEMORY_STATUS.ACTIVE)
        .order('priority', { ascending: false });
      allBrandItems = items || [];
    }

    // 3. Fetch active creative memory items
    let allCreativeItems = [];
    if (businessId) {
      const { data: cItems } = await supabase
        .from('creative_memory_items')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', MEMORY_STATUS.ACTIVE)
        .order('confidence', { ascending: false });
      allCreativeItems = cItems || [];
    }

    // 4. Deterministic Filtering
    const hardConstraints = [];
    const softPreferences = [];
    const negativeConstraints = [];
    const identityMap = {
      name: business?.name || null,
      industry: business?.industry || null,
      targetAudience: business?.target_audience || null,
      toneOfVoice: business?.tone_of_voice || null,
      brandColors: business?.brand_colors || null,
      brandGuidelines: business?.brand_guidelines || null,
    };

    for (const item of allBrandItems) {
      // Identity categories
      if (
        item.category === BRAND_MEMORY_CATEGORIES.BRAND_IDENTITY ||
        item.category === BRAND_MEMORY_CATEGORIES.COLOR ||
        item.category === BRAND_MEMORY_CATEGORIES.TYPOGRAPHY ||
        item.category === BRAND_MEMORY_CATEGORIES.VOICE
      ) {
        identityMap[item.key] = item.value;
      }

      // Negative constraints
      if (item.category === BRAND_MEMORY_CATEGORIES.NEGATIVE_CONSTRAINT) {
        negativeConstraints.push(item);
        continue;
      }

      // Hard constraints
      if (item.type === MEMORY_TYPES.HARD_CONSTRAINT) {
        hardConstraints.push(item);
        continue;
      }

      // Soft preferences: Filter by relevance to platform, objective, or product
      if (this._isItemRelevantToCampaign(item, campaign)) {
        softPreferences.push(item);
      }
    }

    // Filter creative patterns: match platform, objective, or general applicability
    const relevantCreativePatterns = allCreativeItems.filter((pattern) =>
      this._isPatternRelevantToCampaign(pattern, campaign)
    );

    // 5. Conflict Detection
    const conflicts = memoryConflictService.detectAndResolveConflicts({
      businessId,
      campaign,
      brandMemoryItems: allBrandItems,
    });

    // 6. Build Snapshot
    const snapshotTimestamp = new Date().toISOString();
    const rawContext = {
      brandId: businessId || 'default-brand',
      identity: identityMap,
      hardConstraints,
      softPreferences,
      negativeConstraints,
      relevantCreativePatterns,
      conflicts,
      snapshotTimestamp,
      metadata: {
        executionId,
        campaignId,
        businessName: business?.name || 'Default Brand',
        totalItemsRetrieved:
          hardConstraints.length +
          softPreferences.length +
          negativeConstraints.length +
          relevantCreativePatterns.length,
        retrievalMethod: 'deterministic_structured_filter_v1',
      },
    };

    // Deep freeze the snapshot to guarantee historical immutability in runtime memory
    const validatedSnapshot = memoryContextSchema.parse(rawContext);
    const deepFreeze = (o) => {
      if (o && typeof o === 'object') {
        Object.freeze(o);
        Object.keys(o).forEach((k) => deepFreeze(o[k]));
      }
      return o;
    };
    const frozenSnapshot = deepFreeze(JSON.parse(JSON.stringify(validatedSnapshot)));

    logger.info(`[MemoryRetrievalService] MEMORY_RETRIEVAL_COMPLETED`, {
      businessId,
      campaignId,
      workflowExecutionId: executionId,
      hardConstraintsCount: hardConstraints.length,
      softPreferencesCount: softPreferences.length,
      creativePatternsCount: relevantCreativePatterns.length,
      conflictsCount: conflicts.length,
    });

    logger.info(`[MemoryRetrievalService] MEMORY_SNAPSHOT_CREATED`, {
      businessId,
      campaignId,
      workflowExecutionId: executionId,
      snapshotTimestamp,
    });

    return frozenSnapshot;
  }

  _isItemRelevantToCampaign(item, campaign) {
    if (!campaign) return true;

    // Platform-specific memory filtering
    if (item.metadata?.platform && campaign.target_platform) {
      if (item.metadata.platform.toLowerCase() !== campaign.target_platform.toLowerCase()) {
        return false;
      }
    }

    // Product-specific memory filtering
    if (item.metadata?.product && campaign.product_name) {
      if (
        !campaign.product_name.toLowerCase().includes(item.metadata.product.toLowerCase()) &&
        !item.metadata.product.toLowerCase().includes(campaign.product_name.toLowerCase())
      ) {
        return false;
      }
    }

    return true;
  }

  _isPatternRelevantToCampaign(pattern, campaign) {
    if (!campaign) return true;

    // Match platform if defined in metadata or constraints
    if (pattern.metadata?.platform && campaign.target_platform) {
      if (pattern.metadata.platform.toLowerCase() !== campaign.target_platform.toLowerCase()) {
        return false;
      }
    }

    return true;
  }
}

export const memoryRetrievalService = new MemoryRetrievalService();
export default memoryRetrievalService;

