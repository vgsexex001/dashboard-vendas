import crypto from 'node:crypto';
import OpenAI from 'openai';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { aiAnalyses } from '../../db/schema.js';
import { env } from '../../config/env.js';
import { ExternalApiError } from '../../shared/errors.js';
import * as analyticsService from '../analytics/analytics.service.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Gera análise IA dos dados de vendas */
export async function analyze(
  userId: string,
  dateFrom: string,
  dateTo: string,
  forceRefresh: boolean
) {
  const range = { userId, dateFrom, dateTo };
  const summary = analyticsService.getSummary(range);

  // Hash para cache
  const dataStr = JSON.stringify(summary);
  const dataHash = crypto.createHash('sha256').update(dataStr).digest('hex');

  // Verificar cache
  if (!forceRefresh) {
    const cached = db
      .select()
      .from(aiAnalyses)
      .where(and(eq(aiAnalyses.userId, userId), eq(aiAnalyses.dataHash, dataHash)))
      .get();

    if (cached) {
      return {
        analysis: cached.analysisText,
        cached: true,
        model: cached.modelUsed,
        tokens: { input: cached.tokensInput, output: cached.tokensOutput },
        generated_at: cached.createdAt,
      };
    }
  }

  // Montar dados resumidos para o prompt
  const dadosResumidos = {
    periodo: `${dateFrom} a ${dateTo}`,
    faturamento_total: formatBRL(summary.kpis.faturamento_total),
    ticket_medio: formatBRL(summary.kpis.ticket_medio),
    total_pedidos: summary.kpis.total_pedidos,
    top_5_produtos: summary.top_products.map((p) => ({
      nome: p.product_name,
      receita: formatBRL(p.revenue),
      quantidade: p.quantity,
    })),
    vendas_por_dia_semana: summary.weekday_distribution.map((d) => ({
      dia: d.weekday_name,
      receita: formatBRL(d.revenue),
      pedidos: d.orders,
    })),
  };

  const prompt = `Você é um analista de negócios especializado em pequenos negócios brasileiros.
Analise os seguintes dados de vendas e forneça insights acionáveis.

Dados resumidos:
${JSON.stringify(dadosResumidos, null, 2)}

Escreva um parágrafo de 4 a 6 frases cobrindo:
1. Tendência geral de faturamento no período
2. O produto principal e seu impacto
3. Distribuição de vendas ao longo da semana (dias fortes vs fracos)
4. Uma recomendação prática e específica para aumentar vendas

Responda em português brasileiro, de forma direta e profissional.`;

  try {
    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const analysisText = completion.choices[0]?.message?.content || '';
    const tokensInput = completion.usage?.prompt_tokens ?? null;
    const tokensOutput = completion.usage?.completion_tokens ?? null;

    // Salvar no cache
    db.insert(aiAnalyses)
      .values({
        userId,
        dataHash,
        promptUsed: prompt,
        analysisText,
        modelUsed: env.OPENAI_MODEL,
        tokensInput,
        tokensOutput,
      })
      .run();

    const saved = db
      .select()
      .from(aiAnalyses)
      .where(and(eq(aiAnalyses.userId, userId), eq(aiAnalyses.dataHash, dataHash)))
      .get();

    return {
      analysis: analysisText,
      cached: false,
      model: env.OPENAI_MODEL,
      tokens: { input: tokensInput, output: tokensOutput },
      generated_at: saved?.createdAt || new Date().toISOString(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    throw new ExternalApiError(`Erro na API OpenAI: ${message}`);
  }
}

/** Histórico de análises */
export function getHistory(userId: string, limit: number) {
  return db
    .select({
      id: aiAnalyses.id,
      analysis: aiAnalyses.analysisText,
      model: aiAnalyses.modelUsed,
      tokens_input: aiAnalyses.tokensInput,
      tokens_output: aiAnalyses.tokensOutput,
      created_at: aiAnalyses.createdAt,
    })
    .from(aiAnalyses)
    .where(eq(aiAnalyses.userId, userId))
    .orderBy(desc(aiAnalyses.createdAt))
    .limit(limit)
    .all()
    .map((r) => ({
      id: r.id,
      analysis: r.analysis,
      model: r.model,
      tokens: { input: r.tokens_input, output: r.tokens_output },
      created_at: r.created_at,
    }));
}
