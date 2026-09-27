import { z } from 'zod';

export const creativeBibleSchema = z.object({
  visual_style: z.string().min(1, 'Visual style is required'),
  color_palette: z.string().min(1, 'Color palette is required'),
  lighting_rules: z.string().min(1, 'Lighting rules are required'),
  voiceover_profile: z.string().min(1, 'Voiceover profile is required'),
  music_sound_design: z.string().min(1, 'Music and sound design is required'),
  negative_prompts: z.string().min(1, 'Negative prompts are required'),
});

export const scenePlanSchema = z.object({
  sequence_number: z.coerce.number().int().min(1),
  shot_type: z.string().min(1, 'Shot type is required'),
  camera_movement: z.string().min(1, 'Camera movement is required'),
  visual_prompt: z.string().min(1, 'Visual prompt is required'),
  audio_narration: z.string().min(1, 'Audio narration is required'),
  duration_seconds: z.coerce.number().min(1).max(60),
  lighting_atmosphere: z.string().min(1, 'Lighting atmosphere is required'),
});

export const storyboardPlanSchema = z.object({
  creative_bible: creativeBibleSchema,
  scenes: z.array(scenePlanSchema).min(1, 'At least one scene is required'),
});

export default {
  creativeBibleSchema,
  scenePlanSchema,
  storyboardPlanSchema,
};
