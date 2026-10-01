import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { promptCompilerService } from '../../src/services/prompt/prompt-compiler.service.js';

describe('Prompt Compiler Memory Integration Unit Tests', () => {
  const brandId = crypto.randomUUID();

  it('should compile brand hard constraints and negative constraints into generation specifications', () => {
    const memoryContext = {
      brandId,
      identity: {
        brandColors: '#013F32, #E7FE25',
      },
      hardConstraints: [
        {
          business_id: brandId,
          category: 'PRODUCT_PRESENTATION',
          key: 'centered_hero',
          value: 'Product must remain upright and centered in hero frames',
          type: 'HARD_CONSTRAINT',
          priority: 80,
          confidence: 1.0,
          status: 'ACTIVE',
        },
      ],
      softPreferences: [],
      negativeConstraints: [
        {
          business_id: brandId,
          category: 'NEGATIVE_CONSTRAINT',
          key: 'no_neon_green_bg',
          value: 'no neon green background',
          type: 'HARD_CONSTRAINT',
          priority: 80,
          confidence: 1.0,
          status: 'ACTIVE',
        },
      ],
      relevantCreativePatterns: [],
      conflicts: [],
      snapshotTimestamp: new Date().toISOString(),
    };

    const scene = {
      id: 'sc-1',
      sequence_number: 1,
      visual_prompt: 'High-energy studio showcase of energy drink can',
      shot_type: 'Close-Up',
      camera_movement: 'Dolly Push-In',
      duration_seconds: 5,
    };

    const spec = promptCompilerService.compileSceneSpecification({
      scene,
      memoryContext,
      aspectRatio: '9:16',
    });

    // 1. Positive prompt must contain brand hard constraint
    assert.match(
      spec.compiled_positive_prompt,
      /Brand Invariants: Product must remain upright and centered in hero frames/
    );

    // 2. Negative prompt must contain learned negative constraint
    assert.match(spec.compiled_negative_prompt, /no neon green background/);

    // 3. Aspect ratio and provider specs preserved
    assert.equal(spec.aspect_ratio, '9:16');
    assert.equal(spec.sequence_number, 1);
  });
});

