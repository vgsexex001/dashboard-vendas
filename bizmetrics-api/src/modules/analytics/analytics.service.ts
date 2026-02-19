import { sql, eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { sales } from '../../db/schema.js';
import { ValidationError } from '../../shared/errors.js';

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface DateRange {
  userId: string;
  dateFrom: string;
  dateTo: string;
  batchId?: string;
}

function buildWhere(r: DateRange) {
  const conditions = [
    eq(sales.userId, r.userId),
    gte(sales.saleDate, r.dateFrom),
    lte(sales.saleDate, r.dateTo),
  ];
  if (r.batchId) conditions.push(eq(sales.batchId, r.batchId));
  return and(...conditions);
}

/** Retorna KPIs calculados via SQL */
export function getKPIs(range: DateRange) {
  const where = buildWhere(range);

  const result = db
    .select({
      faturamento_total: sql<number>`COALESCE(SUM(${sales.amount}), 0)`,
      total_pedidos: sql<number>`COUNT(*)`,
      ticket_medio: sql<number>`COALESCE(AVG(${sales.amount}), 0)`,
    })
    .from(sales)
    .where(where)
    .get();

  if (!result || result.total_pedidos === 0) {
    throw new ValidationError('Sem dados de vendas no período selecionado.');
  }

  // Produto mais vendido (por quantidade)
  const topProduct = db
    .select({
      nome: sales.productName,
      quantidade: sql<number>`COUNT(*)`,
      receita: sql<number>`SUM(${sales.amount})`,
    })
    .from(sales)
    .where(where)
    .groupBy(sales.productName)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(1)
    .get();

  // Dias de operação
  const daysResult = db
    .select({
      dias: sql<number>`COUNT(DISTINCT ${sales.saleDate})`,
    })
    .from(sales)
    .where(where)
    .get();

  const dias = daysResult?.dias ?? 1;

  return {
    faturamento_total: Math.round((result.faturamento_total) * 100) / 100,
    ticket_medio: Math.round((result.ticket_medio) * 100) / 100,
    total_pedidos: result.total_pedidos,
    produto_mais_vendido: topProduct
      ? {
          nome: topProduct.nome,
          quantidade: topProduct.quantidade,
          receita: Math.round(topProduct.receita * 100) / 100,
        }
      : null,
    periodo: {
      dias_operacao: dias,
      media_vendas_dia: Math.round((result.total_pedidos / dias) * 10) / 10,
    },
  };
}

/** Faturamento diário para gráfico de área */
export function getDailyRevenue(range: DateRange) {
  const where = buildWhere(range);

  return db
    .select({
      date: sales.saleDate,
      revenue: sql<number>`SUM(${sales.amount})`,
      orders: sql<number>`COUNT(*)`,
    })
    .from(sales)
    .where(where)
    .groupBy(sales.saleDate)
    .orderBy(sales.saleDate)
    .all()
    .map((r) => ({
      date: r.date,
      revenue: Math.round(r.revenue * 100) / 100,
      orders: r.orders,
    }));
}

/** Top N produtos por receita */
export function getTopProducts(range: DateRange, limit = 5) {
  const where = buildWhere(range);

  return db
    .select({
      product_name: sales.productName,
      revenue: sql<number>`SUM(${sales.amount})`,
      quantity: sql<number>`COUNT(*)`,
    })
    .from(sales)
    .where(where)
    .groupBy(sales.productName)
    .orderBy(sql`SUM(${sales.amount}) DESC`)
    .limit(limit)
    .all()
    .map((r) => ({
      product_name: r.product_name,
      revenue: Math.round(r.revenue * 100) / 100,
      quantity: r.quantity,
    }));
}

/** Distribuição por dia da semana */
export function getWeekdayDistribution(range: DateRange) {
  const where = buildWhere(range);

  // SQLite: strftime('%w', date) retorna 0=Sunday .. 6=Saturday
  return db
    .select({
      weekday: sql<number>`CAST(strftime('%w', ${sales.saleDate}) AS INTEGER)`,
      revenue: sql<number>`SUM(${sales.amount})`,
      orders: sql<number>`COUNT(*)`,
    })
    .from(sales)
    .where(where)
    .groupBy(sql`strftime('%w', ${sales.saleDate})`)
    .orderBy(sql`CAST(strftime('%w', ${sales.saleDate}) AS INTEGER)`)
    .all()
    .map((r) => ({
      weekday: r.weekday,
      weekday_name: WEEKDAY_NAMES[r.weekday],
      revenue: Math.round(r.revenue * 100) / 100,
      orders: r.orders,
    }));
}

/** Endpoint de summary — tudo junto */
export function getSummary(range: DateRange, topLimit = 5) {
  return {
    kpis: getKPIs(range),
    daily_revenue: getDailyRevenue(range),
    top_products: getTopProducts(range, topLimit),
    weekday_distribution: getWeekdayDistribution(range),
  };
}
