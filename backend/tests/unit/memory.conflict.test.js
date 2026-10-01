import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { memoryConflictService } from '../../src/memory/memoryConflict.service.js';
import { memoryRepository } from '../../src/memory/memoryRepository.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';

describe('Memory Conflict Detection Unit Tests', () => {
  const businessId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  beforeEach(async () => {
    memoryDb.reset();

    await supabase.from('users').insert({
      id: userId,
      email: 'owner@coffee.com',
      role: 'creator',
    });

    await supabase.from('businesses').insert({
      id: businessId,
      user_id: userId,
      name: 'Midnight Roast',
    });
  });

  it('should detect conflict when campaign explicit instruction opposes brand constraint, prioritize campaign for execution, and preserve brand memory', async () => {
    // Brand Hard Constraint: Dark low-key lighting
    const { item: lightingMemory } = await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'LIGHTING',
      key: 'brand_lighting_style',
      value: 'Always use dark moody noir cinematic lighting',
      type: 'HARD_CONSTRAINT',
      priority: 80,
      status: 'ACTIVE',
    });

    // Current Campaign explicitly requests bright summer daylight
    const campaign = {
      id: crypto.randomUUID(),
      goal: 'Launch Bright Summer Iced Brew with high-key daylight',
      title: 'Summer Splash Coffee',
    };

    const conflicts = memoryConflictService.detectAndResolveConflicts({
      businessId,
      campaign,
      brandMemoryItems: [lightingMemory],
    });

    // 1. Conflict detected
    assert.equal(conflicts.length, 1);
    const conflict = conflicts[0];
    assert.equal(conflict.type, 'CAMPAIGN_OVERRIDE');
    assert.equal(conflict.memoryId, lightingMemory.id);
    assert.equal(conflict.resolution, 'CAMPAIGN_EXPLICIT_PRECEDENCE');
    assert.match(conflict.reason, /Current campaign specifies bright\/summer lighting/);

    // 2. Campaign instruction wins for current execution
    assert.ok(conflict.campaignInstruction);

    // 3. Persistent Brand Memory in DB remains unchanged
    const dbItem = await memoryRepository.getBrandMemoryItem(lightingMemory.id);
    assert.equal(dbItem.value, 'Always use dark moody noir cinematic lighting');
    assert.equal(dbItem.status, 'ACTIVE');
  });

  it('should detect CTA discount conflict when brand memory forbids discounts', async () => {
    const { item: ctaMemory } = await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'CTA',
      key: 'cta_discount_policy',
      value: 'Never discount luxury products or show sales percentages',
      type: 'HARD_CONSTRAINT',
      priority: 80,
      status: 'ACTIVE',
    });

    const campaign = {
      id: crypto.randomUUID(),
      goal: 'Clearance Push',
      call_to_action: 'Get 50% off clearance sale today!',
    };

    const conflicts = memoryConflictService.detectAndResolveConflicts({
      businessId,
      campaign,
      brandMemoryItems: [ctaMemory],
    });

    assert.equal(conflicts.length, 1);
    assert.equal(conflicts[0].memoryId, ctaMemory.id);
    assert.equal(conflicts[0].resolution, 'CAMPAIGN_EXPLICIT_PRECEDENCE');
  });
});

