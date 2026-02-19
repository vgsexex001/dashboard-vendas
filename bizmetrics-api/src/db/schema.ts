import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  businessName: text('business_name'),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
});

export const uploadBatches = sqliteTable('upload_batches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name'),
  totalRecords: integer('total_records').notNull(),
  totalRevenue: real('total_revenue').notNull(),
  status: text('status', { enum: ['processing', 'completed', 'failed'] }).default('processing').notNull(),
  errorMessage: text('error_message'),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
});

export const sales = sqliteTable('sales', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  saleDate: text('sale_date').notNull(),
  productName: text('product_name').notNull(),
  amount: real('amount').notNull(),
  batchId: text('batch_id').references(() => uploadBatches.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
}, (table) => [
  index('idx_sales_user_date').on(table.userId, table.saleDate),
  index('idx_sales_user_product').on(table.userId, table.productName),
  index('idx_sales_batch').on(table.batchId),
]);

export const aiAnalyses = sqliteTable('ai_analyses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  batchId: text('batch_id').references(() => uploadBatches.id),
  dataHash: text('data_hash').notNull(),
  promptUsed: text('prompt_used').notNull(),
  analysisText: text('analysis_text').notNull(),
  modelUsed: text('model_used').notNull(),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
}, (table) => [
  index('idx_ai_user_hash').on(table.userId, table.dataHash),
]);

export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  revoked: integer('revoked', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
});
