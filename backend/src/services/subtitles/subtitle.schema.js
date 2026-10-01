import { z } from 'zod';
import { SUBTITLE_VERSION } from './subtitle.types.js';
import { ValidationError } from '../../core/errors/AppError.js';

export const subtitleCueSchema = z.object({
  startMs: z
    .number()
    .min(0, 'Subtitle startMs cannot be negative')
    .refine((v) => !Number.isNaN(v) && Number.isFinite(v), {
      message: 'startMs must be a finite number',
    }),
  endMs: z
    .number()
    .min(0, 'Subtitle endMs cannot be negative')
    .refine((v) => !Number.isNaN(v) && Number.isFinite(v), {
      message: 'endMs must be a finite number',
    }),
  text: z.string().min(1, 'Subtitle text cannot be empty').max(500, 'Subtitle text exceeds maximum character limit'),
});

export const subtitleDocumentSchema = z
  .object({
    version: z.literal(SUBTITLE_VERSION).default(SUBTITLE_VERSION),
    language: z.string().min(2).max(10).default('en'),
    cues: z.array(subtitleCueSchema).min(1, 'Subtitle document must contain at least one cue'),
  })
  .refine(
    (doc) => {
      // Validate chronological ordering and endMs > startMs for every cue
      for (let i = 0; i < doc.cues.length; i++) {
        const cue = doc.cues[i];
        if (cue.endMs <= cue.startMs) {
          return false;
        }
        if (i > 0) {
          const prevCue = doc.cues[i - 1];
          if (cue.startMs < prevCue.startMs) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message: 'Subtitle cues must have endMs > startMs and must be in strictly non-decreasing chronological order',
    }
  );

/**
 * Validates a subtitle document against canonical schema and optional max timeline duration.
 *
 * @param {object} doc
 * @param {number} [maxDurationMs]
 * @returns {import('./subtitle.types.js').SubtitleDocument}
 */
export function validateSubtitleDocument(doc, maxDurationMs = null) {
  const result = subtitleDocumentSchema.safeParse(doc);

  if (!result.success) {
    const errorDetails = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(`Subtitle document validation failed: ${errorDetails}`, {
      errors: result.error.errors,
    });
  }

  const validDoc = result.data;

  if (maxDurationMs && maxDurationMs > 0) {
    const lastCue = validDoc.cues[validDoc.cues.length - 1];
    if (lastCue.endMs > maxDurationMs + 2000) {
      throw new ValidationError(
        `Subtitle cue exceeds timeline duration: last cue ends at ${lastCue.endMs}ms but timeline duration is ${maxDurationMs}ms`,
        { lastCueEndMs: lastCue.endMs, maxDurationMs }
      );
    }
  }

  return validDoc;
}
