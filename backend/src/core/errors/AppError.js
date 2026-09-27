/**
 * Custom Application Error Hierarchy
 */

export class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string} code
   * @param {any} [details=null]
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details = null) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', details = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict or duplicate detected', details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected internal server error occurred', details = null) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }
}

export default AppError;
