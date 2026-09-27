import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { Readable } from 'node:stream';

/**
 * Upload a Buffer to Cloudinary using upload_stream
 */
export const uploadBufferToCloudinary = (buffer, options = {}) => {
  if (!isCloudinaryConfigured()) {
    return Promise.resolve({
      publicId: `dev_${Date.now()}`,
      secureUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1080&q=80',
      duration: 5,
    });
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'ai_video_orchestrator',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          duration: result.duration,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Upload a remote URL directly to Cloudinary (e.g., from Fal.ai CDN)
 */
export const uploadRemoteUrlToCloudinary = async (remoteUrl, options = {}) => {
  if (!isCloudinaryConfigured()) {
    return {
      publicId: `remote_${Date.now()}`,
      secureUrl: remoteUrl,
      duration: 5,
      width: 1080,
      height: 1920,
    };
  }

  try {
    const result = await cloudinary.uploader.upload(remoteUrl, {
      folder: 'ai_video_orchestrator',
      resource_type: 'auto',
      ...options,
    });

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      duration: result.duration,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (err) {
    console.error('Cloudinary Remote Upload Error:', err.message);
    throw err;
  }
};

/**
 * Generate 9:16 vertical TikTok/Reels crop URL with smart subject auto-gravity
 */
export const getVerticalFormatUrl = (publicId, resourceType = 'video') => {
  if (!isCloudinaryConfigured()) return publicId;

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    transformation: [
      { width: 1080, height: 1920, crop: 'fill', gravity: 'auto', aspect_ratio: '9:16' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
};

/**
 * Cloudinary-based multi-scene video concatenation
 */
export const assembleScenesUrl = (scenePublicIds) => {
  if (!scenePublicIds.length) return '';
  if (!isCloudinaryConfigured() || scenePublicIds.length === 1) {
    return getVerticalFormatUrl(scenePublicIds[0]);
  }

  const [firstId, ...remainingIds] = scenePublicIds;

  const transformations = remainingIds.map((id) => ({
    flags: 'splice',
    overlay: `video:${id.replace(/\//g, ':')}`,
  }));

  transformations.push({
    width: 1080,
    height: 1920,
    crop: 'fill',
    gravity: 'auto',
  });

  return cloudinary.url(firstId, {
    resource_type: 'video',
    transformation: transformations,
  });
};
