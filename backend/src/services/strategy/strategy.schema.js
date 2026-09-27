import { z } from 'zod';

export const marketingStrategySchema = z.object({
  campaign_objective: z.string().min(1, 'Campaign objective is required'),
  target_audience: z.string().min(1, 'Target audience is required'),
  marketing_angle: z.string().min(1, 'Marketing angle is required'),
  core_message: z.string().min(1, 'Core message is required'),
  call_to_action: z.string().min(1, 'Call to action is required'),
  tone: z.string().min(1, 'Tone is required'),
  recommended_platform: z.string().min(1, 'Recommended platform is required'),
  recommended_format: z.string().min(1, 'Recommended format is required'),
});

export default marketingStrategySchema;
