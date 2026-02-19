import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

export function paginate(page: number, limit: number, totalRecords: number) {
  const totalPages = Math.ceil(totalRecords / limit);
  const offset = (page - 1) * limit;
  return {
    offset,
    pagination: {
      page,
      limit,
      total_records: totalRecords,
      total_pages: totalPages,
    },
  };
}
