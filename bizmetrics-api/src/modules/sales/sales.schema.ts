import { z } from 'zod';

export const uploadQuerySchema = z.object({
  file_name: z.string().max(255).optional(),
});

export const listSalesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD').optional(),
  product: z.string().optional(),
  batch_id: z.string().uuid().optional(),
  sort_by: z.enum(['sale_date', 'product_name', 'amount']).default('sale_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListSalesInput = z.infer<typeof listSalesSchema>;
