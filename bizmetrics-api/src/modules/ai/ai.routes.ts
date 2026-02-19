import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../auth/auth.middleware.js';
import { aiLimiter } from '../../middleware/rate-limiter.js';
import { sendSuccess } from '../../shared/response.js';
import { analyzeSchema, historySchema } from './ai.schema.js';
import * as aiService from './ai.service.js';

const router = Router();
router.use(requireAuth);

/** POST /api/ai/analyze — Gera análise IA */
router.post('/analyze', aiLimiter, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const input = analyzeSchema.parse(req.body);
  const result = await aiService.analyze(user.id, input.date_from, input.date_to, input.force_refresh);
  sendSuccess(res, { data: result });
});

/** GET /api/ai/history — Histórico de análises */
router.get('/history', (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const input = historySchema.parse(req.query);
  const data = aiService.getHistory(user.id, input.limit);
  sendSuccess(res, { data });
});

export default router;
