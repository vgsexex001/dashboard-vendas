import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../auth/auth.middleware.js';
import { sendSuccess } from '../../shared/response.js';
import * as analyticsService from './analytics.service.js';

const router = Router();
router.use(requireAuth);

const dateRangeSchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  batch_id: z.string().uuid().optional(),
});

const topProductsSchema = dateRangeSchema.extend({
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

function rangeFromQuery(req: Request) {
  const { user } = req as AuthenticatedRequest;
  const params = dateRangeSchema.parse(req.query);
  return { userId: user.id, dateFrom: params.date_from, dateTo: params.date_to, batchId: params.batch_id };
}

/** GET /api/analytics/kpis */
router.get('/kpis', (req: Request, res: Response) => {
  const range = rangeFromQuery(req);
  const data = analyticsService.getKPIs(range);
  sendSuccess(res, { data });
});

/** GET /api/analytics/daily-revenue */
router.get('/daily-revenue', (req: Request, res: Response) => {
  const range = rangeFromQuery(req);
  const data = analyticsService.getDailyRevenue(range);
  sendSuccess(res, { data });
});

/** GET /api/analytics/top-products */
router.get('/top-products', (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const params = topProductsSchema.parse(req.query);
  const range = { userId: user.id, dateFrom: params.date_from, dateTo: params.date_to, batchId: params.batch_id };
  const data = analyticsService.getTopProducts(range, params.limit);
  sendSuccess(res, { data });
});

/** GET /api/analytics/weekday-distribution */
router.get('/weekday-distribution', (req: Request, res: Response) => {
  const range = rangeFromQuery(req);
  const data = analyticsService.getWeekdayDistribution(range);
  sendSuccess(res, { data });
});

/** GET /api/analytics/summary — tudo em uma chamada */
router.get('/summary', (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const params = topProductsSchema.parse(req.query);
  const range = { userId: user.id, dateFrom: params.date_from, dateTo: params.date_to, batchId: params.batch_id };
  const data = analyticsService.getSummary(range, params.limit);
  sendSuccess(res, { data });
});

export default router;
