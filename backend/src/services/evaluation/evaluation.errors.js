import { AppError } from '../../core/errors/AppError.js';

export class EvaluationError extends AppError {
  constructor(message, details = null) {
    super(message, 500, 'EVALUATION_ERROR', details);
  }
}

export class EvaluationValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'EVALUATION_VALIDATION_ERROR', details);
  }
}

export class EvaluationExecutionError extends AppError {
  constructor(message, details = null) {
    super(message, 502, 'EVALUATION_EXECUTION_ERROR', details);
  }
}
