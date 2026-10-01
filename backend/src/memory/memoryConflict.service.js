import { logger } from '../core/logger/logger.js';
import { MEMORY_CONFLICT_RESOLUTIONS } from './memory.constants.js';

export class MemoryConflictService {
  /**
   * Detect and resolve conflicts between brand memory items and explicit campaign requirements.
   * Explicit campaign instructions always win for the current execution,
   * without mutating the persistent brand memory.
   *
   * @param {object} params
   * @param {string} params.businessId
   * @param {object} params.campaign
   * @param {Array<object>} params.brandMemoryItems
   * @returns {Array<object>} Detected conflicts
   */
  detectAndResolveConflicts({ businessId, campaign = {}, brandMemoryItems = [] }) {
    const conflicts = [];
    const campaignId = campaign.id || null;

    for (const item of brandMemoryItems) {
      if (item.status !== 'ACTIVE') continue;

      const conflict = this._checkItemConflict(item, campaign);
      if (conflict) {
        const conflictRecord = {
          type: 'CAMPAIGN_OVERRIDE',
          memoryId: item.id,
          category: item.category,
          memoryKey: item.key,
          memoryValue: item.value,
          campaignInstruction: conflict.campaignInstruction,
          resolution: MEMORY_CONFLICT_RESOLUTIONS.CAMPAIGN_EXPLICIT_PRECEDENCE,
          reason: conflict.reason,
        };

        conflicts.push(conflictRecord);

        logger.info(`[MemoryConflictService] MEMORY_CONFLICT_DETECTED`, {
          businessId,
          campaignId,
          memoryId: item.id,
          category: item.category,
          key: item.key,
          resolution: conflictRecord.resolution,
        });
      }
    }

    return conflicts;
  }

  _checkItemConflict(item, campaign) {
    const key = (item.key || '').toLowerCase();
    const cat = (item.category || '').toUpperCase();
    const memoryVal = typeof item.value === 'string' ? item.value.toLowerCase() : JSON.stringify(item.value).toLowerCase();

    // 1. Direct campaign parameter override (e.g. campaign.options or custom fields)
    if (campaign.options && campaign.options[item.key] !== undefined) {
      const explicitVal = String(campaign.options[item.key]).toLowerCase();
      if (explicitVal !== memoryVal) {
        return {
          campaignInstruction: campaign.options[item.key],
          reason: `Campaign explicit option for '${item.key}' overrides brand ${item.type}`,
        };
      }
    }

    // 2. Lighting & Atmosphere conflicts
    if (cat === 'LIGHTING' || key.includes('lighting')) {
      const goalAndPrompt = `${campaign.goal || ''} ${campaign.title || ''} ${campaign.visual_prompt_prefix || ''}`.toLowerCase();
      const isBrightCampaign = goalAndPrompt.includes('bright') || goalAndPrompt.includes('summer') || goalAndPrompt.includes('daylight') || goalAndPrompt.includes('high-key');
      const isDarkMemory = memoryVal.includes('dark') || memoryVal.includes('moody') || memoryVal.includes('noir') || memoryVal.includes('low-key');

      if (isBrightCampaign && isDarkMemory) {
        return {
          campaignInstruction: campaign.goal || 'Bright summer campaign',
          reason: `Current campaign specifies bright/summer lighting which conflicts with brand memory '${item.value}'`,
        };
      }

      const isDarkCampaign = goalAndPrompt.includes('dark') || goalAndPrompt.includes('moody') || goalAndPrompt.includes('night') || goalAndPrompt.includes('noir');
      const isBrightMemory = memoryVal.includes('bright') || memoryVal.includes('daylight') || memoryVal.includes('high-key');

      if (isDarkCampaign && isBrightMemory) {
        return {
          campaignInstruction: campaign.goal || 'Moody night campaign',
          reason: `Current campaign specifies dark/moody lighting which conflicts with brand memory '${item.value}'`,
        };
      }
    }

    // 3. Aspect Ratio / Format conflicts
    if (cat === 'CAMERA' || key.includes('aspect_ratio') || key.includes('format')) {
      if (campaign.aspect_ratio) {
        const campRatio = String(campaign.aspect_ratio).trim();
        if (memoryVal.includes(':') && !memoryVal.includes(campRatio)) {
          return {
            campaignInstruction: campaign.aspect_ratio,
            reason: `Campaign aspect ratio ${campRatio} overrides brand preferred format '${item.value}'`,
          };
        }
      }
    }

    // 4. Call to Action / Promotion conflicts
    if (cat === 'CTA' || key.includes('cta') || key.includes('discount')) {
      const campaignCta = (campaign.call_to_action || '').toLowerCase();
      const forbidsDiscount = memoryVal.includes('no discount') || memoryVal.includes('never discount') || memoryVal.includes('full price');
      const hasDiscountCta = campaignCta.includes('%') || campaignCta.includes('off') || campaignCta.includes('sale') || campaignCta.includes('discount');

      if (forbidsDiscount && hasDiscountCta) {
        return {
          campaignInstruction: campaign.call_to_action,
          reason: `Campaign CTA '${campaign.call_to_action}' includes promotional discount overriding brand constraint '${item.value}'`,
        };
      }
    }

    // 5. Visual Style conflicts
    if (cat === 'VISUAL_STYLE' || key.includes('style')) {
      const campGoal = `${campaign.goal || ''} ${campaign.title || ''}`.toLowerCase();
      if (campGoal.includes('minimalist') && memoryVal.includes('maximalist')) {
        return {
          campaignInstruction: campaign.goal,
          reason: `Campaign style 'minimalist' overrides brand memory '${item.value}'`,
        };
      }
    }

    return null;
  }
}

export const memoryConflictService = new MemoryConflictService();
export default memoryConflictService;

