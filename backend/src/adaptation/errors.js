import { AppError } from '../core/errors/AppError.js';

export class AdaptationError extends AppError {
  constructor(message, statusCode = 500, details = null) {
    super(message, statusCode, details);
    this.name = 'AdaptationError';
    this.code = 'ADAPTATION_ERROR';
  }
}

export class AdaptationNotFoundError extends AdaptationError {
  constructor(message = 'Adaptation not found', details = null) {
    super(message, 404, details);
    this.name = 'AdaptationNotFoundError';
    this.code = 'ADAPTATION_NOT_FOUND';
  }
}

export class AdaptationValidationError extends AdaptationError {
  constructor(message = 'Invalid adaptation data', details = null) {
    super(message, 400, details);
    this.name = 'AdaptationValidationError';
    this.code = 'ADAPTATION_VALIDATION_ERROR';
  }
}

export class AdaptationConflictError extends AdaptationError {
  constructor(message = 'Adaptation conflict detected', details = null) {
    super(message, 409, details);
    this.name = 'AdaptationConflictError';
    this.code = 'ADAPTATION_CONFLICT';
  }
}

export class AdaptationForbiddenError extends AdaptationError {
  constructor(message = 'Access to adaptation forbidden', details = null) {
    super(message, 403, details);
    this.name = 'AdaptationForbiddenError';
    this.code = 'ADAPTATION_FORBIDDEN';
  }
}
