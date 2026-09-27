import { v2 as cloudinary } from 'cloudinary';
import { config } from './env.js';

let isConfigured = false;

if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
  isConfigured = true;
  console.log('✅ Cloudinary initialized successfully');
} else {
  console.warn('⚠️ Cloudinary credentials missing. Media upload and transforms will operate in fallback mode.');
}

export const isCloudinaryConfigured = () => isConfigured;
export default cloudinary;
