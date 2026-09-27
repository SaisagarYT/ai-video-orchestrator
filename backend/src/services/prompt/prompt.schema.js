import { z } from 'zod';

export const generationSpecificationSchema = z.object({
  scene_id: z.string().optional(),
  sequence_number: z.coerce.number().int().min(1),
  compiled_positive_prompt: z.string().min(1, 'Compiled positive prompt is required'),
  compiled_negative_prompt: z.string().min(1, 'Compiled negative prompt is required'),
  shot_type: z.string().min(1, 'Shot type is required'),
  camera_movement: z.string().min(1, 'Camera movement is required'),
  aspect_ratio: z.string().default('9:16'),
  duration_seconds: z.coerce.number().min(1).max(60).default(5),
  visual_style: z.string().min(1),
  color_palette: z.string().min(1),
  lighting_directives: z.string().min(1),
  target_provider: z.string().default('mock-video'),
  fps: z.coerce.number().int().default(24),
  seed: z.coerce.number().int().default(42),
});

export default generationSpecificationSchema;
