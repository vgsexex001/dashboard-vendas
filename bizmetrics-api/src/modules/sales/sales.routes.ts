import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../auth/auth.middleware.js';
import { uploadLimiter } from '../../middleware/rate-limiter.js';
import { sendSuccess } from '../../shared/response.js';
import { uploadQuerySchema, listSalesSchema } from './sales.schema.js';
import * as salesService from './sales.service.js';
import { ValidationError } from '../../shared/errors.js';

const router = Router();

router.use(requireAuth);

/** POST /api/sales/upload — Upload CSV */
router.post('/upload', uploadLimiter, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const query = uploadQuerySchema.parse(req.query);

  let csvText: string;
  if (typeof req.body === 'string') {
    csvText = req.body;
  } else if (req.body?.csv) {
    csvText = req.body.csv;
  } else {
    throw new ValidationError('Envie o CSV como text/plain no body ou como campo "csv" em JSON.');
  }

  if (!csvText.trim()) {
    throw new ValidationError('CSV vazio.');
  }

  const result = salesService.uploadCSV(user.id, csvText, query.file_name);
  sendSuccess(res, { data: result, status: 201 });
});

/** GET /api/sales — Listar vendas */
router.get('/', (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const input = listSalesSchema.parse(req.query);
  const result = salesService.listSales(user.id, input);
  sendSuccess(res, { data: result.data, pagination: result.pagination });
});

/** GET /api/sales/batches — Histórico de uploads */
router.get('/batches', (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const data = salesService.listBatches(user.id);
  sendSuccess(res, { data });
});

/** DELETE /api/sales/batch/:batchId — Remover batch */
router.delete('/batch/:batchId', (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const result = salesService.deleteBatch(user.id, req.params.batchId as string);
  sendSuccess(res, { data: result });
});

export default router;
