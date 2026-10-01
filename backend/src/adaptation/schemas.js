import { z } from 'zod';
import {
  ADAPTATION_PLATFORMS,
  ADAPTATION_STATUS,
  CROP_STRATEGIES,
  DURATION_STRATEGIES,
} from './constants.js';

export const platformEnum = z.nativeEnum(ADAPTATION_PLATFORMS);
export const adaptationStatusEnum = z.nativeEnum(ADAPTATION_STATUS);
export const cropStrategyEnum = z.nativeEnum(CROP_STRATEGIES);
export const durationStrategyEnum = z.nativeEnum(DURATION_STRATEGIES);

/**
 * Normalized Bounding Box Schema (0.0 - 1.0)
 */
export const normalizedRectSchema = z.object({
  x: z.number().min(0.0).max(1.0),
  y: z.number().min(0.0).max(1.0),
  width: z.number().min(0.0).max(1.0),
  height: z.number().min(0.0).max(1.0),
});

/**
 * Platform Safe Zones Schema
 */
export const platformSafeZonesSchema = z.object({
  visual: normalizedRectSchema,
  text: normalizedRectSchema,
  subtitle: normalizedRectSchema,
  cta: normalizedRectSchema,
});

/**
 * Hook Constraints Schema
 */
export const hookConstraintsSchema = z.object({
  maxOpeningDurationSeconds: z.number().positive(),
  visualHookTimingSeconds: z.number().positive(),
  requireDynamicOpening: z.boolean().default(true),
});

/**
 * Platform Profile Schema
 */
export const platformProfileSchema = z.object({
  platform: platformEnum,
  placement: z.string().min(1),
  version: z.string().min(1).default('v1'),
  aspectRatio: z.enum(['9:16', '16:9', '1:1']),
  width: z.number().int().min(320).max(3840),
  height: z.number().int().min(320).max(3840),
  minDurationSeconds: z.number().min(1).default(3),
  maxDurationSeconds: z.number().max(600).default(60),
  recommendedDurationSeconds: z.number().default(15),
  safeZone: platformSafeZonesSchema,
  hookConstraints: hookConstraintsSchema,
  cropStrategy: cropStrategyEnum.default(CROP_STRATEGIES.CENTER_CROP),
  audioRequirements: z.object({
    required: z.boolean().default(true),
    format: z.string().default('aac'),
    maxLoudnessLUFS: z.number().default(-14),
  }).default({}),
  metadata: z.record(z.any()).default({}),
});

/**
 * Scene Transformation Instruction Schema
 */
export const sceneTransformationSchema = z.object({
  sceneId: z.string(),
  sequenceNumber: z.number().int().min(1),
  cropInstructions: z.object({
    strategy: cropStrategyEnum,
    cropBox: normalizedRectSchema.optional().nullable(),
    scale: z.number().default(1.0),
    offset: z.object({ x: z.number(), y: z.number() }).default({ x: 0, y: 0 }),
    reason: z.string().optional(),
  }),
  subjectPreservation: z.object({
    detectedSubjectRegion: normalizedRectSchema.optional().nullable(),
    focalPoint: z.object({ x: z.number(), y: z.number() }).default({ x: 0.5, y: 0.5 }),
    confidence: z.number().min(0).max(1).default(1.0),
  }).optional(),
  durationModification: z.object({
    originalDurationMs: z.number().int().positive(),
    adaptedDurationMs: z.number().int().positive(),
    strategy: durationStrategyEnum.default(DURATION_STRATEGIES.PRESERVE_DURATION),
    trimStartMs: z.number().int().min(0).default(0),
    trimEndMs: z.number().int().min(0).default(0),
    reason: z.string().optional(),
  }),
  textTransformations: z.object({
    repositionedText: z.array(z.any()).default([]),
    safeZoneAdjustment: z.string().optional(),
  }).default({}),
  subtitleTransformations: z.object({
    repositionedSubtitles: z.boolean().default(true),
    verticalOffsetPct: z.number().default(0),
    safeZone: normalizedRectSchema.optional().nullable(),
  }).default({}),
  ctaTransformations: z.object({
    originalCTA: z.string().optional(),
    adaptedCTA: z.string().optional(),
    placement: z.string().default('CENTER_LOWER'),
    safeZone: normalizedRectSchema.optional().nullable(),
    reason: z.string().optional(),
  }).default({}),
});

/**
 * Adaptation Plan Schema
 */
export const adaptationPlanSchema = z.object({
  id: z.string().uuid(),
  sourceTimelineId: z.string().uuid(),
  sourceTimelineVersion: z.string(),
  platform: platformEnum,
  platformProfileVersion: z.string(),
  targetAspectRatio: z.enum(['9:16', '16:9', '1:1']),
  targetResolution: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  targetDurationSeconds: z.number().positive(),
  sceneTransformations: z.array(sceneTransformationSchema).min(1),
  audioTransformations: z.object({
    volumeAdjustment: z.number().default(1.0),
    ducking: z.boolean().default(false),
    trackPreservation: z.boolean().default(true),
  }).default({}),
  validationStatus: z.enum(['PENDING', 'VALID', 'INVALID']).default('PENDING'),
  provenance: z.object({
    generatedAt: z.string().datetime(),
    plannerVersion: z.string().default('v1'),
    sourceCampaignId: z.string().uuid(),
    sourceExecutionId: z.string().uuid().optional().nullable(),
  }),
});

/**
 * Platform Violation Schema
 */
export const platformViolationSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(['ERROR', 'WARNING']),
  sceneId: z.string().optional(),
  message: z.string().min(1),
  correction: z.string().optional(),
});

/**
 * Platform Validation Result Schema
 */
export const adaptationValidationResultSchema = z.object({
  valid: z.boolean(),
  platform: platformEnum,
  profileVersion: z.string(),
  violations: z.array(platformViolationSchema).default([]),
  warnings: z.array(platformViolationSchema).default([]),
});

/**
 * API Request Schemas
 */
export const createAdaptationInputSchema = z.object({
  platform: platformEnum,
  sourceTimelineId: z.string().uuid().optional(),
  profileVersion: z.string().optional(),
  options: z.record(z.any()).optional().default({}),
  idempotencyKey: z.string().optional(),
});

export const bulkAdaptationInputSchema = z.object({
  platforms: z.array(platformEnum).min(1, 'At least one platform must be specified').max(5, 'Maximum 5 platforms per bulk request'),
  sourceTimelineId: z.string().uuid().optional(),
  options: z.record(z.any()).optional().default({}),
  idempotencyKey: z.string().optional(),
});

/**
 * Database Record Schema
 */
export const campaignAdaptationRecordSchema = z.object({
  id: z.string().uuid().optional(),
  campaign_id: z.string().uuid(),
  workflow_execution_id: z.string().uuid().nullable().optional(),
  source_timeline_id: z.string().uuid(),
  source_timeline_version: z.string(),
  platform: platformEnum,
  platform_profile_version: z.string().default('v1'),
  target_aspect_ratio: z.enum(['9:16', '16:9', '1:1']),
  target_width: z.number().int().positive(),
  target_height: z.number().int().positive(),
  target_duration_seconds: z.coerce.number().positive(),
  status: adaptationStatusEnum.default(ADAPTATION_STATUS.PLANNED),
  adaptation_plan: z.record(z.any()).default({}),
  timeline_id: z.string().uuid().nullable().optional(),
  render_job_id: z.string().uuid().nullable().optional(),
  final_video_id: z.string().uuid().nullable().optional(),
  validation_result: z.record(z.any()).default({}),
  evaluation_id: z.string().uuid().nullable().optional(),
  provenance: z.record(z.any()).default({}),
  idempotency_key: z.string().nullable().optional(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
