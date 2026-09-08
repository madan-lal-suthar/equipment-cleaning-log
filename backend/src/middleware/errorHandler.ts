import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';
import { AppError } from '../lib/errors.js';
import { env } from '../config/env.js';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} does not exist` },
  });
}

/**
 * Single funnel for error responses, so a client always sees the same shape:
 * `{ error: { code, message, details? } }`. Controllers can therefore just
 * throw (or let zod/Sequelize throw) instead of formatting responses by hand.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: { code: error.code, message: error.message, details: error.details },
    });
    return;
  }

  if (error instanceof UniqueConstraintError) {
    // Sequelize phrases these as "code must be unique", which reads like a rule
    // rather than a problem. The client renders `details` against the offending
    // input, so the message is written to make sense sitting under that field.
    res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'A record with these values already exists',
        details: error.errors.map((e) => ({
          path: e.path,
          message: e.path
            ? `This ${e.path} is already used by another record`
            : 'These values are already used by another record',
        })),
      },
    });
    return;
  }

  if (error instanceof ForeignKeyConstraintError) {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Referenced record does not exist' },
    });
    return;
  }

  if (env.NODE_ENV !== 'test') {
    console.error('Unhandled error:', error);
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
      ...(env.NODE_ENV === 'development' &&
        error instanceof Error && { details: error.message }),
    },
  });
}
