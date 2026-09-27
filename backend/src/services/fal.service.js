import { fal } from '@fal-ai/client';
import { config } from '../config/env.js';

if (config.ai.falKey) {
  fal.config({
    credentials: config.ai.falKey,
  });
}

/**
 * Generate a photorealistic visual keyframe using Fal.ai FLUX.1
 */
export const generateFluxImage = async ({ prompt, aspectRatio = '9:16' }) => {
  if (!config.ai.falKey) {
    console.warn('⚠️ FAL_KEY not configured. Returning fallback stock visual.');
    return {
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1080&q=80',
      width: 1080,
      height: 1920,
    };
  }

  try {
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: aspectRatio === '9:16' ? { width: 768, height: 1344 } : { width: 1024, height: 1024 },
        num_inference_steps: 4,
        enable_safety_checker: true,
      },
    });

    const imageUrl = result.data?.images?.[0]?.url || result.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error('Fal.ai FLUX did not return an image URL');
    }

    return {
      imageUrl,
      width: 768,
      height: 1344,
    };
  } catch (err) {
    console.error('Fal.ai FLUX Generation Error:', err.message);
    throw new Error(`FLUX image generation failed: ${err.message}`);
  }
};

/**
 * Generate real AI dynamic video using Fal.ai Kling Video
 */
export const generateKlingVideo = async ({
  prompt,
  imageUrl,
  durationSeconds = 5,
  aspectRatio = '9:16',
}) => {
  if (!config.ai.falKey) {
    console.warn('⚠️ FAL_KEY not configured. Returning fallback commercial video clip.');
    return {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: durationSeconds,
    };
  }

  try {
    const duration = durationSeconds > 5 ? '10' : '5';
    let endpoint = 'fal-ai/kling-video/v1/standard/text-to-video';
    let input = {
      prompt,
      duration,
      aspect_ratio: aspectRatio === '9:16' ? '9:16' : '16:9',
    };

    if (imageUrl) {
      endpoint = 'fal-ai/kling-video/v1/standard/image-to-video';
      input = {
        prompt,
        image_url: imageUrl,
        duration,
        aspect_ratio: aspectRatio === '9:16' ? '9:16' : '16:9',
      };
    }

    console.log(`🎬 Dispatching Kling AI video generation via ${endpoint}...`);
    const result = await fal.subscribe(endpoint, {
      input,
      pollInterval: 3000,
    });

    const videoUrl = result.data?.video?.url || result.video?.url;
    if (!videoUrl) {
      throw new Error('Fal.ai Kling did not return a video URL');
    }

    return {
      videoUrl,
      duration: parseFloat(duration),
    };
  } catch (err) {
    console.error('Fal.ai Kling Video Generation Error:', err.message);
    throw new Error(`Kling video generation failed: ${err.message}`);
  }
};
