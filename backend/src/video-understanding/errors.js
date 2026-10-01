import { AppError } from '../core/errors/AppError.js';

export class VideoUnderstandingError extends AppError {
  constructor(message, statusCode = 500, code = 'VIDEO_UNDERSTANDING_ERROR', details = null) {
    super(message, statusCode, code, details);
  }
}

export class FrameExtractionError extends VideoUnderstandingError {
  constructor(message = 'Failed to extract video frames', details = null) {
    super(message, 500, 'FRAME_EXTRACTION_ERROR', details);
  }
}

export class VisionAnalysisError extends VideoUnderstandingError {
  constructor(message = 'Vision analysis failed', details = null) {
    super(message, 502, 'VISION_ANALYSIS_ERROR', details);
  }
}

export class VisionValidationError extends VideoUnderstandingError {
  constructor(message = 'Vision evaluation payload validation failed', details = null) {
    super(message, 400, 'VISION_VALIDATION_ERROR', details);
  }
}

export class VisionTimeoutError extends VideoUnderstandingError {
  constructor(message = 'Vision evaluation request timed out', details = null) {
    super(message, 504, 'VISION_TIMEOUT_ERROR', details);
  }
}

export default {
  VideoUnderstandingError,
  FrameExtractionError,
  VisionAnalysisError,
  VisionValidationError,
  VisionTimeoutError,
};
