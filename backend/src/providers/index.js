import { config } from '../config/env.js';
import { providerRegistry } from './core/provider.registry.js';
import { PROVIDER_TYPES } from './core/provider.types.js';

// Provider Implementations
import { MockLLMProvider } from './llm/mock-llm.provider.js';
import { OpenRouterLLMProvider } from './llm/openrouter.provider.js';

import { MockVideoProvider } from './video/mock-video.provider.js';
import { FalVideoProvider } from './video/fal-video.provider.js';

import { MockAudioProvider } from './audio/mock-audio.provider.js';
import { ElevenLabsAudioProvider } from './audio/elevenlabs-audio.provider.js';

import { MockStorageProvider } from './storage/mock-storage.provider.js';
import { CloudinaryStorageProvider } from './storage/cloudinary.provider.js';

import { MockImageProvider } from './image/mock-image.provider.js';
import { MockVisionProvider, mockVisionProvider } from './vision/mock-vision.provider.js';

// Instantiate Providers
const mockLLM = new MockLLMProvider();
const openRouterLLM = new OpenRouterLLMProvider({
  apiKey: config.ai.openrouterApiKey,
  baseUrl: config.ai.openrouterBaseUrl,
  defaultModel: config.ai.openrouterDefaultModel,
  timeoutMs: config.ai.timeoutMs,
});

const mockVideo = new MockVideoProvider();
const falVideo = new FalVideoProvider({
  apiKey: config.ai.falApiKey,
  model: config.ai.falVideoModel,
  timeoutMs: config.ai.videoTimeoutMs,
});

const mockAudio = new MockAudioProvider();
const elevenLabsAudio = new ElevenLabsAudioProvider({
  apiKey: config.ai.elevenlabsApiKey,
  defaultVoiceId: config.ai.elevenlabsVoiceId,
  defaultModel: config.ai.elevenlabsModel,
  timeoutMs: config.ai.audioTimeoutMs,
});

const mockStorage = new MockStorageProvider();
const cloudinaryStorage = new CloudinaryStorageProvider({
  cloudName: config.ai.cloudinaryCloudName,
  apiKey: config.ai.cloudinaryApiKey,
  apiSecret: config.ai.cloudinaryApiSecret,
  timeoutMs: config.ai.storageTimeoutMs,
});

const mockImage = new MockImageProvider();

// Register into registry
providerRegistry.register(PROVIDER_TYPES.LLM, 'mock', mockLLM, { isDefault: true });
providerRegistry.register(PROVIDER_TYPES.LLM, 'openrouter', openRouterLLM);

providerRegistry.register(PROVIDER_TYPES.VIDEO, 'mock', mockVideo, { isDefault: true });
providerRegistry.register(PROVIDER_TYPES.VIDEO, 'fal', falVideo);

providerRegistry.register(PROVIDER_TYPES.AUDIO, 'mock', mockAudio, { isDefault: true });
providerRegistry.register(PROVIDER_TYPES.AUDIO, 'elevenlabs', elevenLabsAudio);

providerRegistry.register(PROVIDER_TYPES.STORAGE, 'mock', mockStorage, { isDefault: true });
providerRegistry.register(PROVIDER_TYPES.STORAGE, 'cloudinary', cloudinaryStorage);

providerRegistry.register(PROVIDER_TYPES.IMAGE, 'mock', mockImage, { isDefault: true });
providerRegistry.register(PROVIDER_TYPES.VISION, 'mock', mockVisionProvider, { isDefault: true });

// Configure defaults based on environment
if (config.ai.llmProvider === 'openrouter' && config.ai.openrouterApiKey) {
  providerRegistry.setDefault(PROVIDER_TYPES.LLM, 'openrouter');
} else {
  providerRegistry.setDefault(PROVIDER_TYPES.LLM, 'mock');
}

if (config.ai.videoProvider === 'fal' && config.ai.falApiKey) {
  providerRegistry.setDefault(PROVIDER_TYPES.VIDEO, 'fal');
} else {
  providerRegistry.setDefault(PROVIDER_TYPES.VIDEO, 'mock');
}

if (config.ai.audioProvider === 'elevenlabs' && config.ai.elevenlabsApiKey) {
  providerRegistry.setDefault(PROVIDER_TYPES.AUDIO, 'elevenlabs');
} else {
  providerRegistry.setDefault(PROVIDER_TYPES.AUDIO, 'mock');
}

if (config.ai.storageProvider === 'cloudinary' && config.ai.cloudinaryApiKey) {
  providerRegistry.setDefault(PROVIDER_TYPES.STORAGE, 'cloudinary');
} else {
  providerRegistry.setDefault(PROVIDER_TYPES.STORAGE, 'mock');
}

export * from './core/provider.types.js';
export * from './core/provider.errors.js';
export * from './core/provider.registry.js';
export * from './llm/llm.provider.js';
export * from './llm/mock-llm.provider.js';
export * from './llm/openrouter.provider.js';
export * from './video/video.provider.js';
export * from './video/mock-video.provider.js';
export * from './video/fal-video.provider.js';
export * from './audio/audio.provider.js';
export * from './audio/mock-audio.provider.js';
export * from './audio/elevenlabs-audio.provider.js';
export * from './storage/storage.provider.js';
export * from './storage/mock-storage.provider.js';
export * from './storage/cloudinary.provider.js';
export * from './image/image.provider.js';
export * from './image/mock-image.provider.js';
export * from './vision/vision.provider.js';
export * from './vision/mock-vision.provider.js';

export { providerRegistry };
export default providerRegistry;
