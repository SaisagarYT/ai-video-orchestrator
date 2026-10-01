import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { memoryRetrievalService } from '../../src/memory/memoryRetrieval.service.js';
import { memoryRepository } from '../../src/memory/memoryRepository.js';
import { memoryDb, supabase } from '../../src/config/supabase.js';

describe('Memory Retrieval Service Unit Tests', () => {
  const businessId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  beforeEach(async () => {
    memoryDb.reset();

    await supabase.from('users').insert({
      id: userId,
      email: 'marketer@fashionbrand.com',
      role: 'creator',
    });

    await supabase.from('businesses').insert({
      id: businessId,
      user_id: userId,
      name: 'Luxe Aura',
      industry: 'Luxury Apparel',
      target_audience: 'Affluent Professionals',
      brand_colors: '#0A0A0A, #D4AF37',
    });

    // 1. Hard constraint (always returned)
    await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'NEGATIVE_CONSTRAINT',
      key: 'no_cheap_visuals',
      value: 'Never display cartoon fonts or low-grade stock footage',
      type: 'HARD_CONSTRAINT',
      priority: 80,
      status: 'ACTIVE',
    });

    // 2. Platform-specific soft preference (TikTok)
    await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'CAMERA',
      key: 'tiktok_speed',
      value: 'Fast dynamic whip pans under 2 seconds',
      type: 'SOFT_PREFERENCE',
      priority: 50,
      status: 'ACTIVE',
      metadata: { platform: 'tiktok' },
    });

    // 3. Platform-specific soft preference (YouTube 16:9 - irrelevant for TikTok)
    await memoryRepository.createBrandMemoryItem({
      business_id: businessId,
      category: 'CAMERA',
      key: 'youtube_cinematic',
      value: 'Slow 16:9 documentary pan across landscape',
      type: 'SOFT_PREFERENCE',
      priority: 50,
      status: 'ACTIVE',
      metadata: { platform: 'youtube' },
    });

    // 4. Creative memory pattern
    await memoryRepository.createCreativeMemoryItem({
      business_id: businessId,
      category: 'HOOK',
      pattern: 'Direct luxury silhouette tease',
      metadata: { platform: 'tiktok' },
    });
  });

  it('should retrieve relevant memory and exclude irrelevant platform memory deterministically', async () => {
    const campaign = {
      id: crypto.randomUUID(),
      target_platform: 'tiktok',
      aspect_ratio: '9:16',
      goal: 'Launch Winter Trench Coat',
      product_name: 'Cashmere Trench',
    };

    const snapshot = await memoryRetrievalService.retrieveMemoryContext({
      businessId,
      campaign,
    });

    // Identity populated from business table
    assert.equal(snapshot.identity.name, 'Luxe Aura');
    assert.equal(snapshot.identity.brandColors, '#0A0A0A, #D4AF37');

    // Negative hard constraint must be present
    assert.equal(snapshot.negativeConstraints.length, 1);
    assert.equal(snapshot.negativeConstraints[0].key, 'no_cheap_visuals');

    // Relevant tiktok memory included
    const tiktokMem = snapshot.softPreferences.find((p) => p.key === 'tiktok_speed');
    assert.ok(tiktokMem);

    // Irrelevant youtube memory excluded
    const youtubeMem = snapshot.softPreferences.find((p) => p.key === 'youtube_cinematic');
    assert.equal(youtubeMem, undefined);

    // Relevant creative patterns included
    assert.equal(snapshot.relevantCreativePatterns.length, 1);
    assert.equal(snapshot.relevantCreativePatterns[0].pattern, 'Direct luxury silhouette tease');
  });
});

