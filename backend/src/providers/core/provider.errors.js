import { AppError } from '../../core/errors/AppError.js';

export class ProviderError extends AppError {
  constructor(message, statusCode = 500, code = 'PROVIDER_ERROR', details = null) {
    super(message, statusCode, code, details);
    this.provider = details?.provider || 'unknown';
  }
}

export class ProviderAuthenticationError extends ProviderError {
  constructor(message = 'Provider authentication failed: invalid or missing API key', details = null) {
    super(message, 401, 'PROVIDER_AUTH_ERROR', details);
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(message = 'Provider rate limit exceeded. Please retry later.', details = null) {
    super(message, 429, 'PROVIDER_RATE_LIMIT', details);
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(message = 'Provider request timed out', details = null) {
    super(message, 504, 'PROVIDER_TIMEOUT', details);
  }
}

export class ProviderBadRequestError extends ProviderError {
  constructor(message = 'Provider rejected request due to malformed parameters', details = null) {
    super(message, 400, 'PROVIDER_BAD_REQUEST', details);
  }
}

export class ProviderUnavailableError extends ProviderError {
  constructor(message = 'Provider service is temporarily unavailable or returned a 5xx error', details = null) {
    super(message, 503, 'PROVIDER_UNAVAILABLE', details);
  }
}

export class ProviderResponseError extends ProviderError {
  constructor(message = 'Provider returned an unparseable or invalid response format', details = null) {
    super(message, 502, 'PROVIDER_BAD_RESPONSE', details);
  }
}

export default {
  ProviderError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  ProviderBadRequestError,
  ProviderUnavailableError,
  ProviderResponseError,
};
