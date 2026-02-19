import { z } from 'zod';

export const analyzeSchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  force_refresh: z.boolean().default(false),
});

export const historySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type AnalyzeInput = z.infer<typeof analyzeSchema>;
