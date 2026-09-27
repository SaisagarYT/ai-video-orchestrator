import { z } from 'zod';

export const createCampaignSchema = z.object({
  title: z.string().min(1, 'Campaign title is required').max(255),
  goal: z.string().min(1, 'Campaign goal is required'),
  product_name: z.string().min(1, 'Product name is required').optional(),
  productName: z.string().min(1, 'Product name is required').optional(),
  product_summary: z.string().optional(),
  productSummary: z.string().optional(),
  unique_points: z.string().optional(),
  uniquePoints: z.string().optional(),
  call_to_action: z.string().optional(),
  callToAction: z.string().optional(),
  target_platform: z
    .enum(['tiktok', 'instagram_reels', 'youtube_shorts', 'facebook_feed', 'general'])
    .default('tiktok')
    .optional(),
  targetPlatform: z.string().optional(),
  aspect_ratio: z.enum(['9:16', '16:9', '1:1', '4:5']).default('9:16').optional(),
  aspectRatio: z.string().optional(),
  duration_seconds: z.coerce.number().int().min(5).max(300).default(30).optional(),
  durationSeconds: z.coerce.number().int().min(5).max(300).optional(),
  business_id: z.string().uuid().optional().nullable(),
  businessId: z.string().uuid().optional().nullable(),
}).refine(
  (data) => Boolean(data.product_name || data.productName),
  { message: 'product_name is required', path: ['product_name'] }
);

export const updateCampaignSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  goal: z.string().min(1).optional(),
  product_name: z.string().optional(),
  productName: z.string().optional(),
  product_summary: z.string().optional(),
  productSummary: z.string().optional(),
  unique_points: z.string().optional(),
  uniquePoints: z.string().optional(),
  call_to_action: z.string().optional(),
  callToAction: z.string().optional(),
  target_platform: z.string().optional(),
  aspect_ratio: z.string().optional(),
  duration_seconds: z.coerce.number().int().min(5).max(300).optional(),
  durationSeconds: z.coerce.number().int().min(5).max(300).optional(),
  status: z.enum(['DRAFT', 'GENERATING', 'COMPLETED', 'FAILED']).optional(),
});

export const generateCampaignSchema = z.object({
  idempotencyKey: z.string().min(1).max(255).optional(),
  idempotency_key: z.string().min(1).max(255).optional(),
});
