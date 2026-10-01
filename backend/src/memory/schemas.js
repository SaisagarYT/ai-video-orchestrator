import { z } from 'zod';
import {
  BRAND_MEMORY_CATEGORIES,
  CREATIVE_MEMORY_CATEGORIES,
  MEMORY_TYPES,
  MEMORY_STATUS,
  MEMORY_SOURCES,
} from './memory.constants.js';

export const brandMemoryCategoryEnum = z.enum(
  Object.values(BRAND_MEMORY_CATEGORIES)
);

export const creativeMemoryCategoryEnum = z.enum(
  Object.values(CREATIVE_MEMORY_CATEGORIES)
);

export const memoryTypeEnum = z.enum(
  Object.values(MEMORY_TYPES)
);

export const memoryStatusEnum = z.enum(
  Object.values(MEMORY_STATUS)
);

export const memorySourceEnum = z.enum(
  Object.values(MEMORY_SOURCES)
);

/**
 * Brand Memory Item Schema
 */
export const brandMemoryItemSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid({ message: 'Valid business_id UUID is required' }),
  category: brandMemoryCategoryEnum,
  key: z.string().min(1, 'Key is required').max(100),
  value: z.any(),
  value_type: z.enum(['string', 'array', 'object', 'boolean', 'number']).default('string'),
  type: memoryTypeEnum.default('SOFT_PREFERENCE'),
  priority: z.coerce.number().int().min(1).max(100).default(50),
  confidence: z.coerce.number().min(0.0).max(1.0).default(1.0),
  status: memoryStatusEnum.default('ACTIVE'),
  source: memorySourceEnum.default('USER_DEFINED'),
  source_id: z.string().nullable().optional(),
  idempotency_key: z.string().nullable().optional(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Creative Memory Item Schema
 */
export const creativeMemoryItemSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid({ message: 'Valid business_id UUID is required' }),
  campaign_id: z.string().uuid().nullable().optional(),
  category: creativeMemoryCategoryEnum,
  pattern: z.string().min(1, 'Pattern title is required').max(150),
  description: z.string().nullable().optional(),
  constraints: z.array(z.string()).default([]),
  evidence_summary: z.string().nullable().optional(),
  confidence: z.coerce.number().min(0.0).max(1.0).default(1.0),
  usage_count: z.coerce.number().int().min(0).default(0),
  approval_count: z.coerce.number().int().min(0).default(0),
  rejection_count: z.coerce.number().int().min(0).default(0),
  status: memoryStatusEnum.default('ACTIVE'),
  source: memorySourceEnum.default('USER_DEFINED'),
  source_id: z.string().nullable().optional(),
  idempotency_key: z.string().nullable().optional(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Memory Evidence Schema
 */
export const memoryEvidenceSchema = z.object({
  id: z.string().uuid().optional(),
  memory_item_id: z.string().uuid(),
  memory_type: z.enum(['BRAND_MEMORY', 'CREATIVE_MEMORY']).default('BRAND_MEMORY'),
  source_type: memorySourceEnum,
  source_id: z.string().nullable().optional(),
  evidence: z.string().min(1, 'Evidence description is required'),
  confidence: z.coerce.number().min(0.0).max(1.0).default(1.0),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime().optional(),
});

/**
 * Memory Conflict Schema
 */
export const memoryConflictSchema = z.object({
  type: z.enum(['CAMPAIGN_OVERRIDE', 'POLICY_CONFLICT', 'INCOMPATIBLE_PREFERENCE']).default('CAMPAIGN_OVERRIDE'),
  memoryId: z.string().uuid().or(z.string()),
  category: z.string(),
  memoryKey: z.string(),
  memoryValue: z.any(),
  campaignInstruction: z.any(),
  resolution: z.string().default('CAMPAIGN_EXPLICIT_PRECEDENCE'),
  reason: z.string(),
});

/**
 * Memory Context Snapshot Schema
 */
export const memoryContextSchema = z.object({
  brandId: z.string().uuid().or(z.string()),
  identity: z.record(z.any()).default({}),
  hardConstraints: z.array(brandMemoryItemSchema).default([]),
  softPreferences: z.array(brandMemoryItemSchema).default([]),
  negativeConstraints: z.array(brandMemoryItemSchema).default([]),
  relevantCreativePatterns: z.array(creativeMemoryItemSchema).default([]),
  conflicts: z.array(memoryConflictSchema).default([]),
  snapshotTimestamp: z.string(),
  metadata: z.record(z.any()).default({}),
});

/**
 * Input Schemas for API Endpoints
 */
export const createBrandMemoryInputSchema = z.object({
  category: brandMemoryCategoryEnum,
  key: z.string().min(1).max(100),
  value: z.any(),
  value_type: z.enum(['string', 'array', 'object', 'boolean', 'number']).optional(),
  type: memoryTypeEnum.optional(),
  priority: z.coerce.number().int().min(1).max(100).optional(),
  confidence: z.coerce.number().min(0.0).max(1.0).optional(),
  source: memorySourceEnum.optional(),
  source_id: z.string().optional(),
  idempotency_key: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateBrandMemoryInputSchema = z.object({
  value: z.any().optional(),
  value_type: z.enum(['string', 'array', 'object', 'boolean', 'number']).optional(),
  type: memoryTypeEnum.optional(),
  priority: z.coerce.number().int().min(1).max(100).optional(),
  confidence: z.coerce.number().min(0.0).max(1.0).optional(),
  status: memoryStatusEnum.optional(),
  metadata: z.record(z.any()).optional(),
});

export const createCreativeMemoryInputSchema = z.object({
  category: creativeMemoryCategoryEnum,
  pattern: z.string().min(1).max(150),
  description: z.string().optional(),
  constraints: z.array(z.string()).optional(),
  evidence_summary: z.string().optional(),
  confidence: z.coerce.number().min(0.0).max(1.0).optional(),
  source: memorySourceEnum.optional(),
  source_id: z.string().optional(),
  idempotency_key: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

