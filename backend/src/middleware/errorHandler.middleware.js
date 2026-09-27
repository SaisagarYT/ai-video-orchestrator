import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload validation failed',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Handle Prisma Known Request Errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Requested resource not found' },
      });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'A unique constraint was violated' },
      });
    }
  }

  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};
