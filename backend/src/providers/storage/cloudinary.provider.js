import crypto from 'node:crypto';
import { StorageProvider } from './storage.provider.js';
import {
  ProviderAuthenticationError,
  ProviderBadRequestError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ProviderError,
} from '../core/provider.errors.js';
import { logger } from '../../core/logger/logger.js';

export class CloudinaryStorageProvider extends StorageProvider {
  /**
   * @param {Object} [options]
   * @param {string} [options.cloudName]
   * @param {string} [options.apiKey]
   * @param {string} [options.apiSecret]
   * @param {number} [options.timeoutMs]
   */
  constructor(options = {}) {
    super('cloudinary', options);
    this.cloudName = options.cloudName || process.env.CLOUDINARY_CLOUD_NAME;
    this.apiKey = options.apiKey || process.env.CLOUDINARY_API_KEY;
    this.apiSecret = options.apiSecret || process.env.CLOUDINARY_API_SECRET;
    this.timeoutMs = options.timeoutMs || parseInt(process.env.AI_STORAGE_TIMEOUT_MS || '60000', 10);
  }

  _validateCredentials() {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new ProviderAuthenticationError(
        'Cloudinary credentials incomplete. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.'
      );
    }
  }

  _validateSource(source) {
    if (!source) {
      throw new ProviderBadRequestError('Asset source is required for upload');
    }

    if (Buffer.isBuffer(source)) {
      return `data:application/octet-stream;base64,${source.toString('base64')}`;
    }

    if (typeof source === 'string') {
      if (source.startsWith('data:')) {
        return source;
      }

      // Validate URL against SSRF
      try {
        const parsed = new URL(source);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new ProviderBadRequestError(`Invalid URL protocol: ${parsed.protocol}`);
        }

        const hostname = parsed.hostname.toLowerCase();
        const forbiddenHosts = ['localhost', '127.0.0.1', '::1', '0.0.0.0', '169.254.169.254'];
        if (
          forbiddenHosts.includes(hostname) ||
          hostname.startsWith('10.') ||
          hostname.startsWith('192.168.') ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
        ) {
          throw new ProviderBadRequestError(`Upload source URL points to restricted private host: ${hostname}`);
        }

        return source;
      } catch (err) {
        if (err instanceof ProviderBadRequestError) throw err;
        throw new ProviderBadRequestError(`Malformed source URL: ${err.message}`);
      }
    }

    throw new ProviderBadRequestError('Unsupported source format. Must be a valid URL or Buffer');
  }

  _generateSignature(params) {
    const sortedKeys = Object.keys(params).sort();
    const serialized = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');
    return crypto.createHash('sha1').update(serialized + this.apiSecret).digest('hex');
  }

  async uploadAsset(request) {
    this._validateCredentials();

    const filePayload = this._validateSource(request.source);
    const resourceType = request.resourceType || 'video';
    const folder = request.folder || 'ai-video-orchestrator';
    const timestamp = Math.floor(Date.now() / 1000);

    const signParams = {
      folder,
      timestamp,
    };
    if (request.publicId) {
      signParams.public_id = request.publicId;
    }

    const signature = this._generateSignature(signParams);
    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const formData = new URLSearchParams();
    formData.append('file', filePayload);
    formData.append('api_key', this.apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('folder', folder);
    formData.append('signature', signature);
    if (request.publicId) {
      formData.append('public_id', request.publicId);
    }

    logger.debug(`[CloudinaryStorage] Uploading ${resourceType} to folder: ${folder}`);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let errJson = null;
        try {
          errJson = JSON.parse(errText);
        } catch (_) {}

        const message = errJson?.error?.message || errText || `HTTP ${response.status}`;

        if (response.status === 401 || response.status === 403) {
          throw new ProviderAuthenticationError(`Cloudinary authentication failed: ${message}`, {
            provider: 'cloudinary',
            statusCode: response.status,
          });
        }
        if (response.status === 400) {
          throw new ProviderBadRequestError(`Cloudinary upload rejected: ${message}`, {
            provider: 'cloudinary',
            statusCode: 400,
          });
        }
        if (response.status >= 500) {
          throw new ProviderUnavailableError(`Cloudinary service error: ${message}`, {
            provider: 'cloudinary',
            statusCode: response.status,
          });
        }

        throw new ProviderError(`Cloudinary upload failed: ${message}`, response.status, 'PROVIDER_ERROR', {
          provider: 'cloudinary',
          statusCode: response.status,
        });
      }

      const data = await response.json();

      return {
        provider: 'cloudinary',
        assetId: data.public_id,
        url: data.url,
        secureUrl: data.secure_url,
        resourceType: data.resource_type || resourceType,
        format: data.format,
        bytes: data.bytes,
        width: data.width,
        height: data.height,
        duration: data.duration,
        metadata: {
          etag: data.etag,
          version: data.version,
          createdAt: data.created_at,
          ...(request.metadata || {}),
        },
      };
    } catch (err) {
      clearTimeout(timer);

      if (err.name === 'AbortError' || err.code === 'ABORT_ERR') {
        throw new ProviderTimeoutError(`Cloudinary upload timed out after ${this.timeoutMs}ms`, {
          provider: 'cloudinary',
          timeoutMs: this.timeoutMs,
        });
      }

      if (err instanceof ProviderError) throw err;

      throw new ProviderError(`Cloudinary upload error: ${err.message}`, 500, 'PROVIDER_ERROR', {
        provider: 'cloudinary',
        cause: err.message,
      });
    }
  }

  async getAsset(publicId) {
    this._validateCredentials();
    return {
      provider: 'cloudinary',
      assetId: publicId,
      url: `http://res.cloudinary.com/${this.cloudName}/video/upload/${publicId}`,
      secureUrl: `https://res.cloudinary.com/${this.cloudName}/video/upload/${publicId}`,
    };
  }

  async deleteAsset(publicId) {
    this._validateCredentials();
    return {
      provider: 'cloudinary',
      assetId: publicId,
      deleted: true,
    };
  }
}

export default CloudinaryStorageProvider;
