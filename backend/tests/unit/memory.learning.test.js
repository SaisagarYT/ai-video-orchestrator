import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { memoryLearningService } from '../../src/memory/memoryLearning.service.js';
import { memoryRepository } from '../../src/memory/memoryRepository.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { MEMORY_STATUS } from '../../src/memory/memory.constants.js';

describe('Memory Conservative Learning Unit Tests', () => {
  const businessId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const campaignId = crypto.randomUUID();

  beforeEach(async () => {
    memoryDb.reset();

    await supabase.from('users').insert({
      id: userId,
      email: 'creator@studio.com',
      role: 'creator',
    });

    await supabase.from('businesses').insert({
      id: businessId,
      user_id: userId,
      name: 'Omni Watch',
    });
  });

  it('should conservatively propose candidate memory from revision prompt repairs in PENDING_REVIEW status', async () => {
    const targets = [
      {
        sceneId: 'sc-3',
        sceneIndex: 3,
        appliedOperations: ['PRESERVE_IDENTITY', 'PRODUCT_GEOMETRY'],
        explanation: 'Preserved product orientation and logo alignment in close-up',
      },
    ];

    const candidates = await memoryLearningService.proposeRevisionCandidates({
      businessId,
      campaignId,
      executionId: 'exec-rev-1',
      targets,
    });

    assert.equal(candidates.length, 1);
    const candidate = candidates[0];
    assert.equal(candidate.status, MEMORY_STATUS.PENDING_REVIEW);
    assert.equal(candidate.key, 'product_geometry_invariance');
    assert.equal(candidate.source, 'REVISION');
    assert.equal(candidate.confidence, 0.70);

    // Verify it is in PENDING_REVIEW and not active
    const activeRules = await memoryRepository.listBrandMemoryItems(businessId, {
      status: MEMORY_STATUS.ACTIVE,
    });
    assert.equal(activeRules.length, 0);

    const pendingRules = await memoryRepository.listBrandMemoryItems(businessId, {
      status: MEMORY_STATUS.PENDING_REVIEW,
    });
    assert.equal(pendingRules.length, 1);
  });

  it('should conservatively propose candidate memory from repeated visual defects (>= 2 scenes) in PENDING_REVIEW status', async () => {
    const detectedIssues = [
      {
        sceneId: 'sc-1',
        dimension: 'PRODUCT_FIDELITY',
        code: 'PRODUCT_GEOMETRY_WARP',
        message: 'Logo warped on can label',
      },
      {
        sceneId: 'sc-4',
        dimension: 'PRODUCT_FIDELITY',
        code: 'PRODUCT_GEOMETRY_WARP',
        message: 'Can label orientation rotated incorrectly',
      },
    ];

    const candidates = await memoryLearningService.proposeVisionCandidates({
      businessId,
      campaignId,
      executionId: 'exec-vision-1',
      detectedIssues,
    });

    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].status, MEMORY_STATUS.PENDING_REVIEW);
    assert.equal(candidates[0].source, 'EVALUATION');
    assert.equal(candidates[0].confidence, 0.75);
  });

  it('should promote candidate memory to ACTIVE upon explicit user review & approval', async () => {
    // 1. Propose candidate
    const [candidate] = await memoryLearningService.proposeRevisionCandidates({
      businessId,
      campaignId,
      executionId: 'exec-1',
      targets: [
        {
          sceneId: 'sc-2',
          sceneIndex: 2,
          appliedOperations: ['LIGHTING_REPAIR'],
          explanation: 'Restored consistent studio rim lighting',
        },
      ],
    });

    assert.equal(candidate.status, MEMORY_STATUS.PENDING_REVIEW);

    // 2. User approves candidate
    const approved = await memoryLearningService.approveCandidate({
      businessId,
      userId,
      memoryId: candidate.id,
      type: 'HARD_CONSTRAINT',
      priority: 80,
    });

    assert.equal(approved.status, MEMORY_STATUS.ACTIVE);
    assert.equal(approved.confidence, 1.0);
    assert.equal(approved.type, 'HARD_CONSTRAINT');
    assert.equal(approved.priority, 80);

    // Now it appears in active brand memory queries
    const activeRules = await memoryRepository.listBrandMemoryItems(businessId, {
      status: MEMORY_STATUS.ACTIVE,
    });
    assert.equal(activeRules.length, 1);
    assert.equal(activeRules[0].id, candidate.id);
  });
});

