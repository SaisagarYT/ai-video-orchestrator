import { z } from 'zod';

export const creativeConceptSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  hook: z.string().min(1, 'Hook is required'),
  concept: z.string().min(1, 'Concept description is required'),
  visual_direction: z.string().min(1, 'Visual direction is required'),
  emotional_direction: z.string().min(1, 'Emotional direction is required'),
  call_to_action: z.string().min(1, 'Call to action is required'),
  estimated_duration: z.coerce.number().int().min(5).max(120).default(20),
});

export const conceptListSchema = z.object({
  concepts: z.array(creativeConceptSchema).min(1, 'At least one creative concept is required'),
});

export default {
  creativeConceptSchema,
  conceptListSchema,
};
