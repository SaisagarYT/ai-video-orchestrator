import { providerRegistry } from '../../providers/index.js';
import { marketingStrategySchema } from './strategy.schema.js';
import { STRATEGY_SYSTEM_PROMPT, buildStrategyUserPrompt } from './strategy.prompts.js';
import { logger } from '../../core/logger/logger.js';

export class StrategyService {
  constructor(options = {}) {
    this.providerName = options.providerName;
  }

  async generateStrategy({ campaign, business = {} }) {
    const llm = providerRegistry.getLLM(this.providerName);
    const userPrompt = buildStrategyUserPrompt({ campaign, business });

    try {
      const response = await llm.generateStructured(
        {
          messages: [
            { role: 'system', content: STRATEGY_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        },
        marketingStrategySchema
      );

      return {
        strategy: response.parsed,
        usage: response.usage,
        latencyMs: response.latencyMs,
        provider: llm.name,
      };
    } catch (err) {
      logger.warn(`LLM strategy generation failed (${err.message}), falling back to deterministic synthesis`, {
        error: err.message,
      });

      const fallbackStrategy = this._synthesizeDeterministicStrategy({ campaign, business });
      const validated = marketingStrategySchema.parse(fallbackStrategy);

      return {
        strategy: validated,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        latencyMs: 1,
        provider: 'deterministic-fallback',
      };
    }
  }

  _synthesizeDeterministicStrategy({ campaign, business = {} }) {
    const productName = campaign.product_name || 'Featured Product';
    const objective = campaign.goal || 'Drive Brand Awareness & Conversions';
    const targetAudience = campaign.target_audience || business.target_audience || 'Target Consumers & Prospective Clients';
    const tone = campaign.tone || business.tone_of_voice || 'Energetic, Authentic & Engaging';
    const cta = campaign.call_to_action || 'Order Now & Experience the Difference';
    const platform = campaign.target_platform || 'tiktok';
    const usps = campaign.unique_points || '';

    const marketingAngle = usps
      ? `Highlighting ${productName}'s breakthrough advantage: ${usps}`
      : `Positioning ${productName} as the premier choice for ${targetAudience}`;

    const coreMessage = `Discover ${productName} — crafted for ${targetAudience} to deliver outstanding performance.`;

    const isVertical = ['tiktok', 'instagram_reels', 'youtube_shorts', '9:16'].includes(platform.toLowerCase());
    const recommendedPlatform = isVertical ? 'Instagram Reels & TikTok' : 'Digital Broadcast & Multi-Platform';
    const recommendedFormat = isVertical
      ? 'Short-form vertical video (9:16, 15-30s) with high-retention opening hook'
      : 'Cinematic widescreen (16:9, 30-45s) with narrative pacing';

    return {
      campaign_objective: objective,
      target_audience: targetAudience,
      marketing_angle: marketingAngle,
      core_message: coreMessage,
      call_to_action: cta,
      tone,
      recommended_platform: recommendedPlatform,
      recommended_format: recommendedFormat,
    };
  }
}

export const strategyService = new StrategyService();
export default strategyService;
