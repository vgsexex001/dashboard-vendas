import { Router } from 'express';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema.js';
import * as authService from './auth.service.js';
import { requireAuth, type AuthenticatedRequest } from './auth.middleware.js';
import { sendSuccess } from '../../shared/response.js';
import { authLimiter } from '../../middleware/rate-limiter.js';
import type { Request, Response } from 'express';

const router = Router();

router.use(authLimiter);

router.post('/register', async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  sendSuccess(res, { data: result, status: 201 });
});

router.post('/login', async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  sendSuccess(res, { data: result });
});

router.post('/refresh', async (req: Request, res: Response) => {
  const input = refreshSchema.parse(req.body);
  const result = await authService.refresh(input.refresh_token);
  sendSuccess(res, { data: result });
});

router.post('/logout', requireAuth, (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  authService.logout(user.id);
  res.status(204).send();
});

export default router;
