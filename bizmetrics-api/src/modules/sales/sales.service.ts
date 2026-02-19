import { eq, and, gte, lte, like, sql, asc, desc, count } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { sales, uploadBatches } from '../../db/schema.js';
import { ValidationError, NotFoundError } from '../../shared/errors.js';
import { parseCSV } from './sales.utils.js';
import { paginate } from '../../shared/pagination.js';
import type { ListSalesInput } from './sales.schema.js';

/** Upload e parsing de CSV, insere no banco em batch */
export function uploadCSV(userId: string, csvText: string, fileName?: string) {
  const { records, rejected } = parseCSV(csvText);

  if (records.length === 0) {
    throw new ValidationError('Nenhuma linha válida encontrada no CSV.', rejected);
  }

  const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0);

  // Create batch
  const batch = db
    .insert(uploadBatches)
    .values({
      userId,
      fileName: fileName || null,
      totalRecords: records.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      status: 'completed',
    })
    .returning()
    .get();

  // Insert sales in chunks of 500
  const CHUNK = 500;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK).map((r) => ({
      userId,
      saleDate: r.saleDate,
      productName: r.productName,
      amount: r.amount,
      batchId: batch.id,
    }));
    db.insert(sales).values(chunk).run();
  }

  return {
    batch_id: batch.id,
    records_imported: records.length,
    records_rejected: rejected.length,
    rejected_details: rejected.slice(0, 50),
    revenue_total: Math.round(totalRevenue * 100) / 100,
  };
}

/** Listar vendas com filtros e paginação */
export function listSales(userId: string, input: ListSalesInput) {
  const conditions = [eq(sales.userId, userId)];

  if (input.date_from) conditions.push(gte(sales.saleDate, input.date_from));
  if (input.date_to) conditions.push(lte(sales.saleDate, input.date_to));
  if (input.product) conditions.push(like(sales.productName, `%${input.product}%`));
  if (input.batch_id) conditions.push(eq(sales.batchId, input.batch_id));

  const where = and(...conditions);

  const totalResult = db.select({ total: count() }).from(sales).where(where).get();
  const total = totalResult?.total ?? 0;
  const { offset, pagination } = paginate(input.page, input.limit, total);

  const sortCol = {
    sale_date: sales.saleDate,
    product_name: sales.productName,
    amount: sales.amount,
  }[input.sort_by];

  const orderFn = input.sort_order === 'asc' ? asc : desc;

  const data = db
    .select({
      id: sales.id,
      sale_date: sales.saleDate,
      product_name: sales.productName,
      amount: sales.amount,
      batch_id: sales.batchId,
      created_at: sales.createdAt,
    })
    .from(sales)
    .where(where)
    .orderBy(orderFn(sortCol))
    .limit(input.limit)
    .offset(offset)
    .all();

  return { data, pagination };
}

/** Histórico de uploads */
export function listBatches(userId: string) {
  return db
    .select({
      id: uploadBatches.id,
      file_name: uploadBatches.fileName,
      total_records: uploadBatches.totalRecords,
      total_revenue: uploadBatches.totalRevenue,
      status: uploadBatches.status,
      created_at: uploadBatches.createdAt,
    })
    .from(uploadBatches)
    .where(eq(uploadBatches.userId, userId))
    .orderBy(desc(uploadBatches.createdAt))
    .all();
}

/** Remove batch e vendas associadas */
export function deleteBatch(userId: string, batchId: string) {
  const batch = db
    .select()
    .from(uploadBatches)
    .where(and(eq(uploadBatches.id, batchId), eq(uploadBatches.userId, userId)))
    .get();

  if (!batch) throw new NotFoundError('Batch não encontrado');

  const result = db.delete(sales).where(eq(sales.batchId, batchId)).run();
  db.delete(uploadBatches).where(eq(uploadBatches.id, batchId)).run();

  return { deleted_count: result.changes };
}
