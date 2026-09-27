/**
 * Provider Types and Normalized Constants
 */

export const PROVIDER_TYPES = {
  LLM: 'llm',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  STORAGE: 'storage',
  VISION: 'vision',
};

export const VIDEO_JOB_STATUS = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

/**
 * @typedef {Object} TokenUsage
 * @property {number} promptTokens
 * @property {number} completionTokens
 * @property {number} totalTokens
 */

/**
 * @typedef {Object} LLMRequest
 * @property {Array<{role: string, content: string}>} messages
 * @property {string} [model]
 * @property {number} [temperature]
 * @property {number} [maxTokens]
 * @property {Object} [responseFormat]
 * @property {number} [timeoutMs]
 */

/**
 * @typedef {Object} LLMResponse
 * @property {string} content
 * @property {string} model
 * @property {TokenUsage} usage
 * @property {number} latencyMs
 * @property {any} [parsed]
 */

/**
 * @typedef {Object} VideoRequest
 * @property {string} prompt
 * @property {string} [negativePrompt]
 * @property {number} [durationSeconds]
 * @property {string} [aspectRatio] - '9:16' | '16:9' | '1:1'
 * @property {string} [resolution]
 * @property {number} [seed]
 * @property {string[]} [referenceImages]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} VideoJobCreationResponse
 * @property {string} provider
 * @property {string} providerJobId
 * @property {'QUEUED'|'PROCESSING'|'COMPLETED'|'FAILED'|'CANCELLED'} status
 * @property {string} createdAt
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} VideoJobStatusResponse
 * @property {string} provider
 * @property {string} providerJobId
 * @property {'QUEUED'|'PROCESSING'|'COMPLETED'|'FAILED'|'CANCELLED'} status
 * @property {number} [progress]
 * @property {string} [assetUrl]
 * @property {string} [error]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} AudioRequest
 * @property {string} text
 * @property {string} [voiceId]
 * @property {string} [model]
 * @property {string} [language]
 * @property {string} [outputFormat]
 * @property {Object} [voiceSettings]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} AudioResponse
 * @property {string} provider
 * @property {{ url?: string, buffer?: Buffer, mimeType?: string }} asset
 * @property {number} durationMs
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} StorageUploadRequest
 * @property {string|Buffer} source - Remote URL or Buffer
 * @property {'video'|'audio'|'image'|'raw'} [resourceType]
 * @property {string} [folder]
 * @property {string} [publicId]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} StorageUploadResponse
 * @property {string} provider
 * @property {string} assetId
 * @property {string} url
 * @property {string} secureUrl
 * @property {string} resourceType
 * @property {string} [format]
 * @property {number} [bytes]
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [duration]
 * @property {Object} [metadata]
 */

export default {
  PROVIDER_TYPES,
  VIDEO_JOB_STATUS,
};
