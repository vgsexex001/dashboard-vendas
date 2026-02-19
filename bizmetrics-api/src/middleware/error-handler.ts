import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors.js';
import { sendError } from '../shared/response.js';
import { logger } from './logger.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, {
      status: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details as unknown[] | undefined,
    });
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return sendError(res, {
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos',
      details,
    });
  }

  logger.error(err, 'Erro interno não tratado');
  return sendError(res, {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'Erro interno do servidor',
  });
}
