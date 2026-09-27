import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StrategyService } from '../../src/services/strategy/strategy.service.js';
import { marketingStrategySchema } from '../../src/services/strategy/strategy.schema.js';

describe('Strategy Service Unit Tests', () => {
  const mockCampaign = {
    title: 'Aura Smart Ring Launch',
    product_name: 'Aura Ring Gen 3',
    goal: 'App Downloads & Pre-orders',
    call_to_action: 'Pre-order now and get 3 months free',
    target_platform: 'tiktok',
    unique_points: 'Titanium chassis, 7-day battery, sleep staging AI',
    aspect_ratio: '9:16',
    duration_seconds: 30,
  };

  const mockBusiness = {
    name: 'Aura Health Inc.',
    industry: 'Wearable Tech',
    tone_of_voice: 'Sophisticated, empowering and scientific',
    brand_guidelines: 'Clean minimalist obsidian aesthetic',
  };

  it('should generate a valid structured marketing strategy matching the schema', async () => {
    const service = new StrategyService();
    const result = await service.generateStrategy({
      campaign: mockCampaign,
      business: mockBusiness,
    });

    assert.ok(result.strategy);
    const validated = marketingStrategySchema.parse(result.strategy);
    assert.ok(validated.campaign_objective);
    assert.ok(validated.target_audience);
    assert.ok(validated.marketing_angle);
    assert.ok(validated.core_message);
    assert.ok(validated.call_to_action);
    assert.ok(validated.tone);
    assert.ok(validated.recommended_platform);
    assert.ok(validated.recommended_format);
  });

  it('should synthesize a deterministic strategy fallback matching Python StrategyEngine', async () => {
    const service = new StrategyService();
    const fallback = service._synthesizeDeterministicStrategy({
      campaign: mockCampaign,
      business: mockBusiness,
    });

    assert.equal(fallback.campaign_objective, mockCampaign.goal);
    assert.ok(fallback.marketing_angle.includes('Titanium chassis'));
    assert.equal(fallback.recommended_platform, 'Instagram Reels & TikTok');
    assert.ok(fallback.recommended_format.includes('9:16'));
    assert.equal(fallback.call_to_action, mockCampaign.call_to_action);
  });
});
