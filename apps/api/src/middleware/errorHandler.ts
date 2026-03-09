import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';
import { env } from '../config/env';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = res.getHeader('X-Request-Id') as string | undefined;

  // Known operational errors — no stack trace needed
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
      ...(requestId && { requestId }),
    });
    return;
  }

  // Zod validation errors — surface first field error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.errors[0]?.message ?? 'Validation failed',
        fields: err.flatten().fieldErrors,
      },
      ...(requestId && { requestId }),
    });
    return;
  }

  // Mongoose duplicate key (e.g. email already taken)
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 11000
  ) {
    res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_KEY', message: 'A record with that value already exists' },
      ...(requestId && { requestId }),
    });
    return;
  }

  // Unexpected server errors — log with context, never leak details to client
  console.error(`[error] ${req.method} ${req.path}`, {
    requestId,
    error: err instanceof Error ? err.message : err,
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    ...(requestId && { requestId }),
    ...(env.NODE_ENV === 'development' && err instanceof Error && { debug: err.message }),
  });
};
