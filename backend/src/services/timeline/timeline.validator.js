import { TimelineIRSchema } from './timeline.schema.js';
import { AppError } from '../../core/errors/AppError.js';
import { TRACK_TYPES } from './timeline.types.js';

/**
 * Validates a Timeline Intermediate Representation object against schema and business invariants.
 *
 * @param {object} timeline
 * @returns {object} Validated and normalized Timeline IR
 * @throws {AppError} If validation fails
 */
export function validateTimelineIR(timeline) {
  if (!timeline || typeof timeline !== 'object') {
    throw AppError.badRequest('Timeline payload must be a non-null object', { timeline });
  }

  // 1. Zod Schema Validation
  const parseResult = TimelineIRSchema.safeParse(timeline);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    throw AppError.badRequest(`Invalid Timeline IR: ${errorDetails[0]?.message || 'Schema validation failed'}`, {
      errors: errorDetails,
    });
  }

  const validated = parseResult.data;

  // 2. Track Invariants
  const videoTracks = validated.tracks.filter((t) => t.type === TRACK_TYPES.VIDEO);
  if (videoTracks.length !== 1) {
    throw AppError.badRequest(`Timeline must have exactly 1 video track, found ${videoTracks.length}`);
  }

  const videoTrack = videoTracks[0];
  const videoItems = videoTrack.items;

  // 3. Scene Uniqueness and Sequential Continuity
  const seenSceneIds = new Set();
  let expectedStartMs = 0;

  for (let i = 0; i < videoItems.length; i++) {
    const item = videoItems[i];

    // Check duplicate scene ID
    if (seenSceneIds.has(item.sceneId)) {
      throw AppError.badRequest(`Duplicate scene placement detected for sceneId: ${item.sceneId}`);
    }
    seenSceneIds.add(item.sceneId);

    // Validate trim range
    if (item.trimStartMs + item.trimEndMs >= item.durationMs) {
      throw AppError.badRequest(
        `Invalid trim range on scene ${item.sceneId}: trimStart (${item.trimStartMs}) + trimEnd (${item.trimEndMs}) >= duration (${item.durationMs})`
      );
    }

    // Sequence / continuity check: startMs must match expected continuity
    if (item.startMs !== expectedStartMs) {
      throw AppError.badRequest(
        `Video track discontinuity at scene index ${i} (sceneId: ${item.sceneId}): expected startMs ${expectedStartMs}, found ${item.startMs}`
      );
    }

    expectedStartMs += (item.durationMs - item.trimStartMs - item.trimEndMs);
  }

  // 4. Total Duration Match
  if (validated.durationMs !== expectedStartMs) {
    throw AppError.badRequest(
      `Timeline total durationMs (${validated.durationMs}) does not match cumulative video track duration (${expectedStartMs})`
    );
  }

  // 5. Audio Tracks Invariants
  const audioTracks = validated.tracks.filter((t) => t.type === TRACK_TYPES.AUDIO);
  for (const audioTrack of audioTracks) {
    for (const audioItem of audioTrack.items) {
      if (audioItem.startMs >= validated.durationMs) {
        throw AppError.badRequest(
          `Audio track item ${audioItem.id} starts at ${audioItem.startMs}ms, which is beyond timeline duration (${validated.durationMs}ms)`
        );
      }
    }
  }

  return validated;
}
