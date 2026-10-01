import { z } from 'zod';
import { VISION_SEVERITY } from './types.js';

export const FrameMetadataSchema = z.object({
  frameId: z.string().min(1),
  path: z.string().min(1),
  timestampSeconds: z.number().nonnegative(),
  sceneId: z.string().min(1),
  sceneIndex: z.number().int().positive(),
  metadata: z.record(z.any()).optional().default({}),
});

export const VisionDimensionSchema = z.object({
  score: z.number().min(0).max(10),
  confidence: z.number().min(0).max(1).default(1.0),
  findings: z.string().min(1),
});

export const VisionIssueSchema = z.object({
  code: z.string().min(1),
  severity: z.enum([
    VISION_SEVERITY.INFO,
    VISION_SEVERITY.WARNING,
    VISION_SEVERITY.MAJOR,
    VISION_SEVERITY.CRITICAL,
  ]),
  category: z.string().default('visual'),
  sceneId: z.string().min(1),
  frameIds: z.array(z.string()).default([]),
  evidence: z.string().min(1),
  revisionInstructions: z.array(z.string()).default([]),
});

export const SceneVisionResultSchema = z.object({
  sceneId: z.string().min(1),
  sceneIndex: z.number().int().positive(),
  frameCount: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1).default(1.0),
  dimensions: z.object({
    productFidelity: VisionDimensionSchema,
    brandConsistency: VisionDimensionSchema,
    visualQuality: VisionDimensionSchema,
    sceneConsistency: VisionDimensionSchema,
  }),
  detectedIssues: z.array(VisionIssueSchema).default([]),
  observations: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional().default({}),
});

export const VideoUnderstandingResultSchema = z.object({
  id: z.string().optional(),
  campaignId: z.string().uuid(),
  workflowExecutionId: z.string().uuid(),
  finalVideoId: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  frameCount: z.number().int().nonnegative(),
  sceneCount: z.number().int().nonnegative(),
  overallConfidence: z.number().min(0).max(1),
  summary: z.string().optional(),
  dimensions: z.object({
    productFidelity: VisionDimensionSchema,
    brandConsistency: VisionDimensionSchema,
    visualQuality: VisionDimensionSchema,
    sceneConsistency: VisionDimensionSchema,
  }),
  detectedIssues: z.array(VisionIssueSchema).default([]),
  scenes: z.array(SceneVisionResultSchema).default([]),
  metadata: z.record(z.any()).optional().default({}),
  createdAt: z.string().optional(),
  completedAt: z.string().nullable().optional(),
});

export const validateSceneVisionResult = (data) => {
  return SceneVisionResultSchema.parse(data);
};

export const validateVideoUnderstandingResult = (data) => {
  return VideoUnderstandingResultSchema.parse(data);
};

export default {
  FrameMetadataSchema,
  VisionDimensionSchema,
  VisionIssueSchema,
  SceneVisionResultSchema,
  VideoUnderstandingResultSchema,
  validateSceneVisionResult,
  validateVideoUnderstandingResult,
};
