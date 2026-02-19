import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface SuccessOptions {
  data?: unknown;
  pagination?: unknown;
  status?: number;
}

interface ErrorOptions {
  code: string;
  message: string;
  details?: unknown[];
  status: number;
}

export function sendSuccess(res: Response, opts: SuccessOptions = {}) {
  const { data = null, pagination, status = 200 } = opts;
  const body: Record<string, unknown> = {
    success: true,
    data,
    meta: {
      request_id: uuidv4(),
      timestamp: new Date().toISOString(),
    },
  };
  if (pagination) body.pagination = pagination;
  return res.status(status).json(body);
}

export function sendError(res: Response, opts: ErrorOptions) {
  const { code, message, details, status } = opts;
  return res.status(status).json({
    success: false,
    error: { code, message, details },
    meta: {
      request_id: uuidv4(),
      timestamp: new Date().toISOString(),
    },
  });
}
