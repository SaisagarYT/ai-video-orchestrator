import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { memoryRepository } from '../../src/memory/memoryRepository.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';
import { MEMORY_STATUS } from '../../src/memory/memory.constants.js';

describe('Memory Repository Unit Tests', () => {
  const businessId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  beforeEach(async () => {
    memoryDb.reset();

    await supabase.from('users').insert({
      id: userId,
      email: 'founder@brand.com',
      role: 'creator',
    });

    await supabase.from('businesses').insert({
      id: businessId,
      user_id: userId,
      name: 'Vortex Audio',
      brand_colors: '#000000, #FFD700',
    });
  });

  it('should create and retrieve brand memory item with evidence', async () => {
    const { item } = await memoryRepository.createBrandMemoryItem(
      {
        business_id: businessId,
        category: 'COLOR',
        key: 'primary_colors',
        value: '#000000, #FFD700',
        type: 'HARD_CONSTRAINT',
        priority: 80,
        confidence: 1.0,
        status: 'ACTIVE',
        source: 'USER_DEFINED',
      },
      'User explicitly specified gold and black identity'
    );

    assert.ok(item.id);
    assert.equal(item.key, 'primary_colors');

    const retrieved = await memoryRepository.getBrandMemoryItem(item.id);
    assert.equal(retrieved.value, '#000000, #FFD700');

    const evidenceList = await memoryRepository.listEvidenceForMemoryItem(item.id);
    assert.equal(evidenceList.length, 1);
    assert.match(evidenceList[0].evidence, /gold and black/);
  });

  it('should prevent duplicate active memory items with the same key and update cleanly', async () => {
    // Insert initial rule
    const res1 = await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'LIGHTING',
      key: 'studio_lighting',
      value: 'Warm low-key lighting',
      type: 'SOFT_PREFERENCE',
      status: 'ACTIVE',
    });
    assert.equal(res1.isExisting, false);

    // Re-insert exact same rule -> should reuse existing
    const res2 = await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'LIGHTING',
      key: 'studio_lighting',
      value: 'Warm low-key lighting',
      type: 'SOFT_PREFERENCE',
      status: 'ACTIVE',
    });
    assert.equal(res2.isExisting, true);
    assert.equal(res2.item.id, res1.item.id);

    // Insert updated value for same key -> should update without creating duplicate row
    const res3 = await memoryRepository.createBrandMemoryItem(
      {
        business_id: businessId,
        category: 'LIGHTING',
        key: 'studio_lighting',
        value: 'High-contrast neon studio lighting',
        type: 'SOFT_PREFERENCE',
        status: 'ACTIVE',
      },
      'Updated to neon style'
    );
    assert.equal(res3.wasUpdated, true);
    assert.equal(res3.item.value, 'High-contrast neon studio lighting');

    const activeList = await memoryRepository.listBrandMemoryItems(businessId, {
      category: 'LIGHTING',
      status: 'ACTIVE',
    });
    assert.equal(activeList.length, 1);
  });

  it('should update and soft-archive brand memory item preserving provenance', async () => {
    const { item } = await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'CAMERA',
      key: 'preferred_shot',
      value: 'Dutch angle macro shots',
      type: 'SOFT_PREFERENCE',
      status: 'ACTIVE',
    });

    // Update
    const updated = await memoryRepository.updateBrandMemoryItem(
      item.id,
      { value: 'Slow dolly zoom shots' },
      'Pivoted cinematography language'
    );
    assert.equal(updated.value, 'Slow dolly zoom shots');

    // Archive
    const archived = await memoryRepository.archiveBrandMemoryItem(item.id, 'Deemed ineffective');
    assert.equal(archived.status, MEMORY_STATUS.ARCHIVED);

    // Active query should not include archived item
    const activeItems = await memoryRepository.listBrandMemoryItems(businessId, {
      status: 'ACTIVE',
    });
    assert.equal(activeItems.length, 0);

    // Evidence should trace the full lifecycle
    const evidenceList = await memoryRepository.listEvidenceForMemoryItem(item.id);
    assert.ok(evidenceList.length >= 2);
  });

  it('should support creative memory patterns and idempotency keys', async () => {
    const idempotencyKey = `creative:${businessId}:hook:1`;

    const res1 = await memoryRepository.createCreativeMemoryItem({
      business_id: businessId,
      category: 'HOOK',
      pattern: 'Problem-first disruption hook',
      idempotency_key: idempotencyKey,
      confidence: 0.9,
    });
    assert.equal(res1.isExisting, false);

    const res2 = await memoryRepository.createCreativeMemoryItem({
      business_id: businessId,
      category: 'HOOK',
      pattern: 'Problem-first disruption hook',
      idempotency_key: idempotencyKey,
      confidence: 0.9,
    });
    assert.equal(res2.isExisting, true);
    assert.equal(res2.item.id, res1.item.id);
  });
});

