import { AppError } from '../core/errors/AppError.js';

export class MemoryError extends AppError {
  constructor(message = 'Memory operation failed', details = null) {
    super(message, 500, 'MEMORY_ERROR', details);
  }
}

export class MemoryNotFoundError extends AppError {
  constructor(message = 'Memory item not found', details = null) {
    super(message, 404, 'MEMORY_NOT_FOUND', details);
  }
}

export class MemoryValidationError extends AppError {
  constructor(message = 'Memory validation failed', details = null) {
    super(message, 400, 'MEMORY_VALIDATION_ERROR', details);
  }
}

export class MemoryConflictError extends AppError {
  constructor(message = 'Memory conflict detected', details = null) {
    super(message, 409, 'MEMORY_CONFLICT', details);
  }
}

export class MemoryForbiddenError extends AppError {
  constructor(message = 'Unauthorized access to brand memory', details = null) {
    super(message, 403, 'MEMORY_FORBIDDEN', details);
  }
}

