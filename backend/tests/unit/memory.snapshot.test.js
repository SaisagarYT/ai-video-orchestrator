import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { memoryRetrievalService } from '../../src/memory/memoryRetrieval.service.js';
import { memoryRepository } from '../../src/memory/memoryRepository.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';

describe('Memory Snapshot Immutability Unit Tests', () => {
  const businessId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  beforeEach(async () => {
    memoryDb.reset();

    await supabase.from('users').insert({
      id: userId,
      email: 'founder@techbrand.com',
      role: 'creator',
    });

    await supabase.from('businesses').insert({
      id: businessId,
      user_id: userId,
      name: 'TechNova',
      brand_colors: '#0055FF',
    });
  });

  it('should freeze memory snapshot so that subsequent mutations to live brand memory never mutate historical snapshot', async () => {
    // 1. Create initial brand memory
    const { item: initialColor } = await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'COLOR',
      key: 'primary_palette',
      value: 'Deep Electric Blue (#0055FF)',
      type: 'HARD_CONSTRAINT',
      priority: 80,
      status: 'ACTIVE',
    });

    const campaign = {
      id: crypto.randomUUID(),
      product_name: 'NovaBook Pro',
      target_platform: 'tiktok',
    };

    // 2. Retrieve snapshot for campaign execution
    const historicalSnapshot = await memoryRetrievalService.retrieveMemoryContext({
      businessId,
      campaign,
      executionId: 'exec-hist-1',
    });

    assert.equal(historicalSnapshot.identity.primary_palette, 'Deep Electric Blue (#0055FF)');
    assert.equal(historicalSnapshot.metadata.executionId, 'exec-hist-1');

    // 3. Brand later pivots to Red
    await memoryRepository.updateBrandMemoryItem(
      initialColor.id,
      { value: 'Crimson Red (#FF0033)' },
      'Brand rebranded to crimson red'
    );

    // 4. Verify live database reflects the update
    const liveItem = await memoryRepository.getBrandMemoryItem(initialColor.id);
    assert.equal(liveItem.value, 'Crimson Red (#FF0033)');

    // 5. Verify historical snapshot is IMMUTABLE and retains original value
    assert.equal(historicalSnapshot.identity.primary_palette, 'Deep Electric Blue (#0055FF)');
    assert.equal(historicalSnapshot.metadata.executionId, 'exec-hist-1');

    // Verify snapshot object is frozen against runtime mutation
    assert.ok(Object.isFrozen(historicalSnapshot));
    assert.ok(Object.isFrozen(historicalSnapshot.identity));
    assert.throws(() => {
      'use strict';
      historicalSnapshot.identity.primary_palette = 'Modified In Memory';
    }, TypeError);
  });
});

