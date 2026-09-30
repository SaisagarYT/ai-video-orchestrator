import { z } from 'zod';
import { TIMELINE_VERSION, TRACK_TYPES, TRANSITION_TYPES } from './timeline.types.js';

/**
 * Transition Specification Schema
 */
export const TransitionSchema = z.object({
  type: z.enum([TRANSITION_TYPES.CUT, TRANSITION_TYPES.FADE, TRANSITION_TYPES.DISSOLVE]).default(TRANSITION_TYPES.CUT),
  durationMs: z.number().int().min(0).default(0),
});

/**
 * Timeline Output Configuration Schema
 */
export const TimelineOutputConfigSchema = z.object({
  width: z.number().int().min(320).max(3840).default(1080),
  height: z.number().int().min(320).max(3840).default(1920),
  aspectRatio: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
  fps: z.number().int().min(15).max(60).default(30),
  format: z.enum(['mp4', 'webm']).default('mp4'),
  videoCodec: z.enum(['h264', 'libx264', 'h265', 'vp9']).default('h264'),
  audioCodec: z.enum(['aac', 'opus', 'mp3']).default('aac'),
  bitrateKbps: z.number().int().positive().optional(),
});

/**
 * Video Track Item Schema
 */
export const VideoTrackItemSchema = z.object({
  id: z.string().min(1, 'Video item ID is required'),
  sceneId: z.string().min(1, 'Scene ID is required'),
  assetId: z.string().min(1, 'Asset ID is required'),
  sourceUrl: z.string().min(1, 'Source URL is required'),
  startMs: z.number().int().min(0, 'startMs must be non-negative'),
  durationMs: z.number().int().positive('durationMs must be positive'),
  trimStartMs: z.number().int().min(0).default(0),
  trimEndMs: z.number().int().min(0).default(0),
  sequenceNumber: z.number().int().min(1).default(1),
  transitionIn: TransitionSchema.optional(),
  transitionOut: TransitionSchema.optional(),
  metadata: z.record(z.any()).optional().default({}),
});

/**
 * Audio Track Item Schema
 */
export const AudioTrackItemSchema = z.object({
  id: z.string().min(1, 'Audio item ID is required'),
  sceneId: z.string().min(1, 'Scene ID is required'),
  assetId: z.string().optional(),
  sourceUrl: z.string().min(1, 'Source URL is required'),
  startMs: z.number().int().min(0, 'startMs must be non-negative'),
  durationMs: z.number().int().positive('durationMs must be positive'),
  volume: z.number().min(0).max(2).default(1.0),
  sequenceNumber: z.number().int().min(1).optional(),
  metadata: z.record(z.any()).optional().default({}),
});

/**
 * Track Schemas
 */
export const VideoTrackSchema = z.object({
  type: z.literal(TRACK_TYPES.VIDEO),
  items: z.array(VideoTrackItemSchema).min(1, 'At least one video item is required'),
});

export const AudioTrackSchema = z.object({
  type: z.literal(TRACK_TYPES.AUDIO),
  items: z.array(AudioTrackItemSchema).default([]),
});

/**
 * Canonical Timeline IR Schema (Zod)
 */
export const TimelineIRSchema = z.object({
  version: z.literal(TIMELINE_VERSION).default(TIMELINE_VERSION),
  campaignId: z.string().uuid('Valid campaign UUID is required'),
  workflowExecutionId: z.string().uuid().optional().nullable(),
  output: TimelineOutputConfigSchema.default({}),
  durationMs: z.number().int().positive('Timeline durationMs must be positive'),
  tracks: z.array(z.union([VideoTrackSchema, AudioTrackSchema])).min(1, 'Timeline must contain at least one track'),
  metadata: z.record(z.any()).optional().default({}),
});
