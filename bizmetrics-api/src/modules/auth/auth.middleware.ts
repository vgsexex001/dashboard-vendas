import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './auth.service.js';
import { AuthError } from '../../shared/errors.js';

export interface AuthenticatedRequest extends Request {
  user: { id: string };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AuthError('Token de acesso não fornecido');
  }

  const token = header.slice(7);
  const userId = verifyAccessToken(token);
  (req as AuthenticatedRequest).user = { id: userId };
  next();
}
