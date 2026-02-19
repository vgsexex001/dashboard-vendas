import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { sendError } from '../shared/response.js';
import type { Request, Response } from 'express';

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    sendError(res, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Muitas requisições. Tente novamente em instantes.',
    });
  },
});

export const authLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    sendError(res, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Muitas tentativas de autenticação. Aguarde um minuto.',
    });
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60000,
  max: env.AI_RATE_LIMIT_MAX,
  keyGenerator: (req: Request) => (req as unknown as Record<string, { id: string }>).user?.id || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    sendError(res, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Limite de análises IA atingido. Aguarde um minuto.',
    });
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  keyGenerator: (req: Request) => (req as unknown as Record<string, { id: string }>).user?.id || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    sendError(res, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Muitos uploads. Aguarde um minuto.',
    });
  },
});
