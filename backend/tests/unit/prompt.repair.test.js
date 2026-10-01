import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { PromptRepairEngine } from '../../src/services/revision/prompt.repair.js';
import { REPAIR_OPERATIONS } from '../../src/services/revision/revision.types.js';

describe('PromptRepairEngine Unit Tests', () => {
  const engine = new PromptRepairEngine();

  const campaign = {
    id: 'camp-repair-1',
    product_name: 'Apex Surge',
    goal: 'Energy Drink Conversion',
    aspect_ratio: '9:16',
  };

  const creativeBible = {
    visualStyle: {
      colorPalette: 'Electric blue and neon lime',
      mood: 'Energetic and modern',
    },
  };

  it('should preserve shot type, duration, and camera movement while healing prompt', () => {
    const scene = {
      id: 'sc-2',
      sequence_number: 2,
      shot_type: 'Close-up Macro',
      camera_movement: 'Quick Zoom-In',
      duration_seconds: 4,
      visual_prompt: 'Apex Surge can drops onto desk',
    };

    const target = {
      sceneId: 'sc-2',
      sceneIndex: 2,
      originalPrompt: 'Apex Surge can drops onto desk',
      operations: [
        {
          type: REPAIR_OPERATIONS.CORRECT_LIGHTING,
          rule: 'High-contrast studio lighting',
        },
        {
          type: REPAIR_OPERATIONS.ADD_CONSTRAINT,
          rule: 'Apex Surge logo centered in sharp focus',
        },
      ],
    };

    const result = engine.repairPrompt({
      target,
      scene,
      campaign,
      creativeBible,
    });

    // Invariants preserved
    assert.equal(result.updatedSpec.shot_type, 'Close-up Macro');
    assert.equal(result.updatedSpec.camera_movement, 'Quick Zoom-In');
    assert.equal(result.updatedSpec.duration_seconds, 4);
    assert.equal(result.updatedSpec.aspect_ratio, '9:16');

    // Healed prompt modified with repairs
    assert.ok(result.healedPrompt.includes('commercial studio lighting'));
    assert.ok(result.healedPrompt.includes('centered in sharp focus'));

    // Human-readable explanation provided
    assert.ok(result.explanation.length > 10);
    assert.match(result.explanation, /Self-healed/i);
    assert.match(result.explanation, /Close-up Macro/i);
  });

  it('should remove conflicting terms specified by REMOVE_CONFLICT', () => {
    const scene = {
      id: 'sc-1',
      sequence_number: 1,
      shot_type: 'Wide',
      duration_seconds: 5,
      visual_prompt: 'Dark and dim room with blurry silhouette of tired gamer',
    };

    const target = {
      sceneId: 'sc-1',
      sceneIndex: 1,
      originalPrompt: 'Dark and dim room with blurry silhouette of tired gamer',
      operations: [
        {
          type: REPAIR_OPERATIONS.REMOVE_CONFLICT,
          rule: 'dark, dim, blurry',
        },
        {
          type: REPAIR_OPERATIONS.CORRECT_LIGHTING,
          rule: 'commercial studio lighting',
        },
      ],
    };

    const result = engine.repairPrompt({
      target,
      scene,
      campaign,
      creativeBible,
    });

    // Conflicting words removed
    assert.equal(/\bdark\b/i.test(result.healedPrompt), false);
    assert.equal(/\bdim\b/i.test(result.healedPrompt), false);
    assert.equal(/\bblurry\b/i.test(result.healedPrompt), false);

    // New lighting operation added
    assert.ok(result.healedPrompt.includes('commercial studio lighting'));
  });

  it('should enhance brand identity and colors from Creative Bible', () => {
    const scene = {
      id: 'sc-3',
      sequence_number: 3,
      shot_type: 'Product Reveal',
      duration_seconds: 5,
      visual_prompt: 'Hands holding beverage container',
    };

    const target = {
      sceneId: 'sc-3',
      sceneIndex: 3,
      originalPrompt: 'Hands holding beverage container',
      operations: [
        {
          type: REPAIR_OPERATIONS.ENHANCE_BRANDING,
          rule: 'official brand styling',
        },
      ],
    };

    const result = engine.repairPrompt({
      target,
      scene,
      campaign,
      creativeBible,
    });

    assert.ok(result.healedPrompt.includes('Electric blue and neon lime'));
    assert.ok(result.healedPrompt.includes('official branding of Apex Surge'));
  });
});
