import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  brandMemoryItemSchema,
  creativeMemoryItemSchema,
  memoryEvidenceSchema,
  memoryContextSchema,
} from '../../src/memory/schemas.js';

describe('Brand & Creative Memory Schemas Unit Tests', () => {
  const validBusinessId = crypto.randomUUID();

  describe('Brand Memory Item Schema', () => {
    it('should validate a valid brand memory item', () => {
      const validItem = {
        business_id: validBusinessId,
        category: 'COLOR',
        key: 'primary_palette',
        value: '#013F32, #E7FE25',
        value_type: 'string',
        type: 'HARD_CONSTRAINT',
        priority: 80,
        confidence: 1.0,
        status: 'ACTIVE',
        source: 'USER_DEFINED',
      };

      const parsed = brandMemoryItemSchema.parse(validItem);
      assert.equal(parsed.category, 'COLOR');
      assert.equal(parsed.priority, 80);
      assert.equal(parsed.confidence, 1.0);
    });

    it('should reject an invalid category', () => {
      const invalid = {
        business_id: validBusinessId,
        category: 'INVALID_CATEGORY',
        key: 'test_key',
        value: 'test_val',
      };

      assert.throws(() => brandMemoryItemSchema.parse(invalid), (err) => {
        return err.name === 'ZodError';
      });
    });

    it('should reject invalid confidence (< 0.0 or > 1.0)', () => {
      assert.throws(() => {
        brandMemoryItemSchema.parse({
          business_id: validBusinessId,
          category: 'LIGHTING',
          key: 'lighting_rule',
          value: 'cinematic',
          confidence: 1.5,
        });
      }, (err) => err.name === 'ZodError');

      assert.throws(() => {
        brandMemoryItemSchema.parse({
          business_id: validBusinessId,
          category: 'LIGHTING',
          key: 'lighting_rule',
          value: 'cinematic',
          confidence: -0.1,
        });
      }, (err) => err.name === 'ZodError');
    });

    it('should reject invalid priority (< 1 or > 100)', () => {
      assert.throws(() => {
        brandMemoryItemSchema.parse({
          business_id: validBusinessId,
          category: 'CAMERA',
          key: 'camera_angle',
          value: 'wide',
          priority: 0,
        });
      }, (err) => err.name === 'ZodError');

      assert.throws(() => {
        brandMemoryItemSchema.parse({
          business_id: validBusinessId,
          category: 'CAMERA',
          key: 'camera_angle',
          value: 'wide',
          priority: 101,
        });
      }, (err) => err.name === 'ZodError');
    });

    it('should reject invalid status', () => {
      assert.throws(() => {
        brandMemoryItemSchema.parse({
          business_id: validBusinessId,
          category: 'VOICE',
          key: 'tone',
          value: 'authoritative',
          status: 'NOT_A_REAL_STATUS',
        });
      }, (err) => err.name === 'ZodError');
    });
  });

  describe('Creative Memory Item Schema', () => {
    it('should validate a valid creative memory pattern', () => {
      const pattern = {
        business_id: validBusinessId,
        category: 'HOOK',
        pattern: 'Immediate Problem-Agitation Reveal',
        description: 'Open with high-contrast shock factor within first 1.5 seconds',
        constraints: ['Keep duration under 2s', 'Logo appears on second 1'],
        confidence: 0.95,
        status: 'ACTIVE',
        source: 'CAMPAIGN',
      };

      const parsed = creativeMemoryItemSchema.parse(pattern);
      assert.equal(parsed.pattern, 'Immediate Problem-Agitation Reveal');
      assert.equal(parsed.category, 'HOOK');
      assert.equal(parsed.constraints.length, 2);
    });
  });

  describe('Memory Context Snapshot Schema', () => {
    it('should validate a complete frozen memory context snapshot', () => {
      const snapshot = {
        brandId: validBusinessId,
        identity: {
          name: 'Apex Energy',
          brandColors: '#013F32, #E7FE25',
        },
        hardConstraints: [
          {
            business_id: validBusinessId,
            category: 'NEGATIVE_CONSTRAINT',
            key: 'no_cartoon_art',
            value: 'Never render cartoon or anime aesthetics',
            type: 'HARD_CONSTRAINT',
            priority: 80,
            confidence: 1.0,
            status: 'ACTIVE',
            source: 'USER_DEFINED',
          },
        ],
        softPreferences: [],
        negativeConstraints: [],
        relevantCreativePatterns: [],
        conflicts: [],
        snapshotTimestamp: new Date().toISOString(),
      };

      const parsed = memoryContextSchema.parse(snapshot);
      assert.equal(parsed.brandId, validBusinessId);
      assert.equal(parsed.hardConstraints.length, 1);
    });
  });
});

