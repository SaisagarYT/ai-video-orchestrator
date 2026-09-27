import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PromptCompilerService } from '../../src/services/prompt/prompt-compiler.service.js';
import { generationSpecificationSchema } from '../../src/services/prompt/prompt.schema.js';

describe('Prompt Compiler Service Unit Tests', () => {
  const mockScene = {
    id: 'sc-uuid-1',
    sequence_number: 1,
    shot_type: 'Dynamic Extreme Closeup (ECU)',
    camera_movement: 'High-Speed Dolly In with Slow-Motion Speed Ramp',
    visual_prompt: 'Extreme close-up of smart ring with metallic titanium texture',
    duration_seconds: 4,
    lighting_atmosphere: 'Volumetric dark obsidian backdrop with razor-sharp neon rim illumination',
  };

  const mockCreativeBible = {
    visual_style: '35mm Anamorphic Cinema look, ARRI Alexa sensor grade, organic film grain',
    color_palette: 'Dark obsidian (#111111) with electric neon accents and Kodak 5219 LUT',
    lighting_rules: 'Directional sculpted key lighting with vibrant rim lights and volumetric atmospheric haze',
    voiceover_profile: 'Confident narrator with modern delivery',
    music_sound_design: 'Rhythmic electronic pulse',
    negative_prompts: 'blurry, low quality, distorted, artificial CGI look, watermarks',
  };

  it('should compile scene and creative bible into a validated GenerationSpecification', () => {
    const compiler = new PromptCompilerService();
    const spec = compiler.compileSceneSpecification({
      scene: mockScene,
      creativeBible: mockCreativeBible,
      targetProvider: 'mock-video',
      aspectRatio: '9:16',
      seed: 42,
    });

    const validated = generationSpecificationSchema.parse(spec);
    assert.equal(validated.scene_id, mockScene.id);
    assert.equal(validated.sequence_number, 1);
    assert.equal(validated.aspect_ratio, '9:16');
    assert.equal(validated.duration_seconds, 4);
    assert.equal(validated.target_provider, 'mock-video');
    assert.equal(validated.seed, 42);

    assert.ok(validated.compiled_positive_prompt.includes(mockScene.visual_prompt));
    assert.ok(validated.compiled_positive_prompt.includes('Camera Direction: Dynamic Extreme Closeup'));
    assert.ok(validated.compiled_positive_prompt.includes('Visual Style: 35mm Anamorphic Cinema look'));
    assert.equal(validated.compiled_negative_prompt, mockCreativeBible.negative_prompts);
  });

  it('should provide robust fallbacks when creative bible is omitted', () => {
    const compiler = new PromptCompilerService();
    const spec = compiler.compileSceneSpecification({
      scene: mockScene,
      creativeBible: null,
      aspectRatio: '16:9',
    });

    assert.equal(spec.aspect_ratio, '16:9');
    assert.ok(spec.compiled_positive_prompt.includes('35mm anamorphic'));
    assert.ok(spec.compiled_negative_prompt.length > 0);
  });
});
