import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isTest: process.env.NODE_ENV === 'test',
  isProduction: process.env.NODE_ENV === 'production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
    isConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  },

  // Upstash Redis (Optional / Transient)
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    isConfigured: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
  },

  // AI & Media Providers Configuration
  ai: {
    // LLM
    llmProvider: process.env.AI_LLM_PROVIDER || 'mock',
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    openrouterDefaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet',
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '60000', 10),

    // Video (Fal.ai / Mock)
    videoProvider: process.env.AI_VIDEO_PROVIDER || 'mock',
    falApiKey: process.env.FAL_API_KEY || process.env.FAL_KEY,
    falVideoModel: process.env.FAL_VIDEO_MODEL || 'fal-ai/fast-svd',
    videoTimeoutMs: parseInt(process.env.AI_VIDEO_TIMEOUT_MS || '120000', 10),
    videoPollIntervalMs: parseInt(process.env.AI_VIDEO_POLL_INTERVAL_MS || '1500', 10),
    videoMaxPollTimeMs: parseInt(process.env.AI_VIDEO_MAX_POLL_TIME_MS || '300000', 10),

    // Audio (ElevenLabs / Mock)
    audioProvider: process.env.AI_AUDIO_PROVIDER || 'mock',
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
    elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
    elevenlabsModel: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
    audioTimeoutMs: parseInt(process.env.AI_AUDIO_TIMEOUT_MS || '60000', 10),

    // Storage (Cloudinary / Mock)
    storageProvider: process.env.AI_STORAGE_PROVIDER || 'mock',
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    storageTimeoutMs: parseInt(process.env.AI_STORAGE_TIMEOUT_MS || '60000', 10),
  },

  // Queue Configuration
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '2', 10),
  },

  // Rendering Configuration (FFmpeg / Mock)
  rendering: {
    defaultRenderer: process.env.DEFAULT_RENDERER || 'mock',
    renderTimeoutMs: parseInt(process.env.RENDER_TIMEOUT_MS || '120000', 10),
    maxScenes: parseInt(process.env.RENDER_MAX_INPUTS || '20', 10),
    maxDurationMs: parseInt(process.env.RENDER_MAX_DURATION_MS || '300000', 10),
    tempDir: process.env.RENDER_TEMP_DIR || null,
  },

  // Quality Evaluation Configuration (Slice 6)
  evaluation: {
    provider: process.env.AI_EVALUATION_PROVIDER || 'mock',
    threshold: parseFloat(process.env.EVALUATION_THRESHOLD || '7.5'),
    productWeight: parseFloat(process.env.EVALUATION_PRODUCT_WEIGHT || '0.40'),
    brandWeight: parseFloat(process.env.EVALUATION_BRAND_WEIGHT || '0.30'),
    visualWeight: parseFloat(process.env.EVALUATION_VISUAL_WEIGHT || '0.30'),
    strictMode: process.env.EVALUATION_STRICT_MODE === 'true',
  },

  // Automated Subtitle Configuration (Slice 6)
  subtitles: {
    provider: process.env.SUBTITLE_PROVIDER || 'mock',
    mode: process.env.SUBTITLE_MODE || 'sidecar', // 'none' | 'sidecar' | 'burned'
    language: process.env.SUBTITLE_LANGUAGE || 'en',
    format: process.env.SUBTITLE_FORMAT || 'srt', // 'srt' | 'vtt'
  },

  // Audio Mastering Configuration (Slice 6)
  audioMastering: {
    provider: process.env.AUDIO_MASTERING_PROVIDER || 'mock',
    targetLufs: parseFloat(process.env.AUDIO_TARGET_LUFS || '-16.0'),
    truePeak: parseFloat(process.env.AUDIO_TRUE_PEAK || '-1.5'),
    sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '48000', 10),
    channels: parseInt(process.env.AUDIO_CHANNELS || '2', 10),
    codec: process.env.AUDIO_CODEC || 'aac',
    bitrate: process.env.AUDIO_BITRATE || '192k',
  },

  // Multimodal Video Understanding Configuration (Slice 8)
  videoUnderstanding: {
    provider: process.env.VISION_PROVIDER || 'mock',
    framesPerScene: parseInt(process.env.FRAMES_PER_SCENE || '5', 10),
    maxFramesPerScene: parseInt(process.env.MAX_FRAMES_PER_SCENE || '10', 10),
    maxTotalFrames: parseInt(process.env.MAX_TOTAL_FRAMES || '30', 10),
    visionTimeoutMs: parseInt(process.env.VISION_TIMEOUT_MS || '60000', 10),
    tempDir: process.env.VISION_TEMP_DIR || null,
  },
};

export default config;
