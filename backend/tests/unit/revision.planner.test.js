import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { RevisionPlanner } from '../../src/services/revision/revision.planner.js';
import { REPAIR_OPERATIONS } from '../../src/services/revision/revision.types.js';

describe('RevisionPlanner Unit Tests', () => {
  const planner = new RevisionPlanner();

  const campaign = {
    id: 'c-test-camp-1',
    product_name: 'Apex Surge Energy',
    goal: 'Conversion',
    aspect_ratio: '9:16',
  };

  const sampleScenes = [
    {
      id: 'sc-1',
      sequence_number: 1,
      shot_type: 'Close-up hook',
      visual_prompt: 'Exhausted student staring at laptop in dimly lit room',
    },
    {
      id: 'sc-2',
      sequence_number: 2,
      shot_type: 'Product showcase',
      visual_prompt: 'Apex Surge can drops onto desk with ice splash',
    },
    {
      id: 'sc-3',
      sequence_number: 3,
      shot_type: 'Action shot',
      visual_prompt: 'Student takes a sip, feeling instant surge of energy',
    },
    {
      id: 'sc-4',
      sequence_number: 4,
      shot_type: 'Wide CTA',
      visual_prompt: 'Can next to laptop with CTA: Fuel Your Focus Now',
    },
  ];

  it('should selectively identify affected scene from explicit issue sceneId', () => {
    const evaluationResult = {
      evaluationId: 'eval-1',
      overallScore: 6.8,
      threshold: 7.5,
      passed: false,
      dimensions: {
        productFidelity: { score: 6.5, weight: 0.4, findings: 'Logo blurred in scene 2' },
        brandConsistency: { score: 8.0, weight: 0.3, findings: 'Good brand tone' },
        visualQuality: { score: 7.0, weight: 0.3, findings: 'Slightly dark lighting' },
      },
      issues: [
        {
          severity: 'major',
          category: 'product',
          description: 'Product logo is obscured by motion blur',
          sceneId: 'sc-2',
          evidence: 'Timestamp 00:04',
        },
      ],
      revisionInstructions: ['Improve logo sharpness and lighting on scene 2'],
    };

    const plan = planner.planRevision({
      campaign,
      evaluationResult,
      scenes: sampleScenes,
      attemptNumber: 1,
    });

    assert.equal(plan.campaignId, campaign.id);
    assert.equal(plan.attemptNumber, 1);
    // Selective regeneration: ONLY Scene 2 is targeted!
    assert.equal(plan.targets.length, 1);
    assert.equal(plan.targets[0].sceneId, 'sc-2');
    assert.equal(plan.targets[0].sceneIndex, 2);

    // Unaffected scenes are preserved!
    assert.equal(plan.unaffectedSceneIds.length, 3);
    assert.deepEqual(plan.unaffectedSceneIds.sort(), ['sc-1', 'sc-3', 'sc-4'].sort());

    // Verified structured repair operations
    const opTypes = plan.targets[0].operations.map((op) => op.type);
    assert.ok(opTypes.includes(REPAIR_OPERATIONS.ADD_CONSTRAINT));
    assert.ok(opTypes.includes(REPAIR_OPERATIONS.ENHANCE_BRANDING));
  });

  it('should extract scene references from issue descriptions when sceneId is omitted', () => {
    const evaluationResult = {
      evaluationId: 'eval-2',
      overallScore: 6.0,
      threshold: 7.5,
      passed: false,
      dimensions: {
        productFidelity: { score: 8.0, weight: 0.4, findings: 'Fine' },
        brandConsistency: { score: 8.0, weight: 0.3, findings: 'Fine' },
        visualQuality: { score: 5.0, weight: 0.3, findings: 'Scene 1 is too dark' },
      },
      issues: [
        {
          severity: 'major',
          category: 'visual',
          description: 'Scene 1 lighting is excessively dim and shadowy',
          sceneId: null,
        },
      ],
      revisionInstructions: ['Brighten Scene 1 illumination'],
    };

    const plan = planner.planRevision({
      campaign,
      evaluationResult,
      scenes: sampleScenes,
      attemptNumber: 1,
    });

    assert.equal(plan.targets.length, 1);
    assert.equal(plan.targets[0].sceneId, 'sc-1');
    assert.equal(plan.targets[0].sceneIndex, 1);

    const opTypes = plan.targets[0].operations.map((op) => op.type);
    assert.ok(opTypes.includes(REPAIR_OPERATIONS.CORRECT_LIGHTING));
    assert.ok(opTypes.includes(REPAIR_OPERATIONS.REMOVE_CONFLICT));
  });

  it('should map product fidelity failure to hero product scene if no scene is explicitly named', () => {
    const evaluationResult = {
      evaluationId: 'eval-3',
      overallScore: 6.5,
      threshold: 7.5,
      passed: false,
      dimensions: {
        productFidelity: { score: 5.5, weight: 0.4, findings: 'Product not clear' },
        brandConsistency: { score: 8.0, weight: 0.3, findings: 'Consistent tone' },
        visualQuality: { score: 8.0, weight: 0.3, findings: 'High quality' },
      },
      issues: [],
      revisionInstructions: ['Improve product fidelity across commercial'],
    };

    const plan = planner.planRevision({
      campaign,
      evaluationResult,
      scenes: sampleScenes,
      attemptNumber: 2,
    });

    // Diagnoses product fidelity failure and targets the product showcase scene (sc-2)
    assert.equal(plan.targets.length, 1);
    assert.equal(plan.targets[0].sceneId, 'sc-2');
    assert.equal(plan.unaffectedSceneIds.length, 3);
  });
});
