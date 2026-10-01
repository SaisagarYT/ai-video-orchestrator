import { AppError } from '../../core/errors/AppError.js';

export class RevisionError extends AppError {
  constructor(message, details = {}) {
    super(message, 500, 'REVISION_ERROR', details);
    this.name = 'RevisionError';
  }
}

export class RevisionExhaustedError extends AppError {
  constructor(message, details = {}) {
    super(
      message || 'Autonomous revision attempts have been exhausted without achieving pass threshold',
      422,
      'REVISION_EXHAUSTED',
      details
    );
    this.name = 'RevisionExhaustedError';
  }
}

export class PromptRepairError extends AppError {
  constructor(message, details = {}) {
    super(message, 500, 'PROMPT_REPAIR_ERROR', details);
    this.name = 'PromptRepairError';
  }
}

export class RevisionValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, 'REVISION_VALIDATION_ERROR', details);
    this.name = 'RevisionValidationError';
  }
}
