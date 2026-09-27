import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConceptService } from '../../src/services/concept/concept.service.js';
import { conceptListSchema } from '../../src/services/concept/concept.schema.js';

describe('Concept Service Unit Tests', () => {
  const mockStrategy = {
    campaign_objective: 'Maximize conversions',
    target_audience: 'Urban Professionals & Fitness Enthusiasts',
    marketing_angle: 'Revolutionary wearable tracking without the screen distraction',
    core_message: 'Track what matters most effortlessly.',
    call_to_action: 'Order today with 20% discount',
    tone: 'Premium, energetic and sleek',
    recommended_platform: 'Instagram Reels & TikTok',
    recommended_format: '9:16 vertical video',
  };

  const mockCampaign = {
    product_name: 'Aura Ring',
    unique_points: 'Seamless sleep tracking, ultra-light aerospace titanium',
  };

  it('should generate multiple creative concepts matching schema requirements', async () => {
    const service = new ConceptService();
    const result = await service.generateConcepts({
      strategy: mockStrategy,
      campaign: mockCampaign,
    });

    assert.ok(Array.isArray(result.concepts));
    assert.ok(result.concepts.length >= 2);

    const validated = conceptListSchema.parse({ concepts: result.concepts });
    assert.ok(validated.concepts.length >= 2);

    for (const concept of validated.concepts) {
      assert.ok(concept.title);
      assert.ok(concept.hook);
      assert.ok(concept.concept);
      assert.ok(concept.visual_direction);
      assert.ok(concept.emotional_direction);
      assert.ok(concept.call_to_action);
      assert.ok(concept.estimated_duration > 0);
    }
  });

  it('should include 4 distinct creative archetypes in deterministic fallback', () => {
    const service = new ConceptService();
    const concepts = service._synthesizeDeterministicConcepts({
      strategy: mockStrategy,
      campaign: mockCampaign,
    });

    assert.equal(concepts.length, 4);
    assert.equal(concepts[0].title, 'The Aura Ring Rush');
    assert.equal(concepts[1].title, 'The Everyday Difference');
    assert.equal(concepts[2].title, 'Precision & Craft');
    assert.ok(concepts[3].title.includes('Why Everyone Is Talking About'));
  });
});
