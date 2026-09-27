import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CreativeDirectionService } from '../../src/services/creative-direction/creative-direction.service.js';
import { storyboardPlanSchema } from '../../src/services/creative-direction/creative-direction.schema.js';

describe('Creative Direction Service Unit Tests', () => {
  const mockConcept = {
    title: 'The Aura Ring Rush',
    hook: 'Ready to elevate your daily routine?',
    concept: 'Fast whip pans and macro reveals showing titanium finish and sleep diagnostics.',
    visual_direction: 'High-contrast studio rim lighting, 35mm anamorphic.',
    emotional_direction: 'Empowering, modern, and sleek.',
    call_to_action: 'Order yours today.',
    estimated_duration: 20,
  };

  const mockStrategy = {
    campaign_objective: 'Product Launch',
    target_audience: 'High-Performance Athletes',
    marketing_angle: 'Titanium durability',
    tone: 'Confident and refined',
    recommended_format: '9:16 vertical video',
    call_to_action: 'Order now',
  };

  const mockCampaign = {
    product_name: 'Aura Ring',
    unique_points: 'Hypoallergenic titanium chassis',
    aspect_ratio: '9:16',
  };

  const mockBusiness = {
    name: 'Aura Health',
    brand_colors: '#013F32, #E7FE25',
  };

  it('should generate a comprehensive Creative Bible and sequential scene plan', async () => {
    const service = new CreativeDirectionService();
    const result = await service.generateStoryboardPlan({
      concept: mockConcept,
      strategy: mockStrategy,
      campaign: mockCampaign,
      business: mockBusiness,
      aspectRatio: '9:16',
    });

    assert.ok(result.creativeBible);
    assert.ok(Array.isArray(result.scenes));
    assert.ok(result.scenes.length >= 3);

    const validated = storyboardPlanSchema.parse({
      creative_bible: result.creativeBible,
      scenes: result.scenes,
    });

    assert.ok(validated.creative_bible.visual_style);
    assert.ok(validated.creative_bible.color_palette);
    assert.ok(validated.creative_bible.lighting_rules);
    assert.ok(validated.creative_bible.voiceover_profile);
    assert.ok(validated.creative_bible.music_sound_design);
    assert.ok(validated.creative_bible.negative_prompts);

    for (const scene of validated.scenes) {
      assert.ok(scene.sequence_number >= 1);
      assert.ok(scene.shot_type);
      assert.ok(scene.camera_movement);
      assert.ok(scene.visual_prompt);
      assert.ok(scene.audio_narration);
      assert.ok(scene.duration_seconds > 0);
      assert.ok(scene.lighting_atmosphere);
    }
  });

  it('should calculate proportional shot durations totaling the target duration in fallback', () => {
    const service = new CreativeDirectionService();
    const fallback = service._synthesizeDeterministicStoryboard({
      concept: mockConcept,
      strategy: mockStrategy,
      campaign: mockCampaign,
      business: mockBusiness,
      aspectRatio: '9:16',
    });

    const totalCalculated = fallback.scenes.reduce((sum, s) => sum + s.duration_seconds, 0);
    assert.equal(totalCalculated, mockConcept.estimated_duration);
  });
});
