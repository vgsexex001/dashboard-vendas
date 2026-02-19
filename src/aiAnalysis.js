export async function generateAnalysis(summaryData, apiKey) {
  if (!apiKey) {
    throw new Error('API key não fornecida. Insira sua chave da API OpenAI.');
  }

  const dados_resumidos = {
    periodo: summaryData.periodo,
    faturamento_total: summaryData.faturamento,
    ticket_medio: summaryData.ticketMedio,
    total_pedidos: summaryData.pedidos,
    top_5_produtos: summaryData.topProducts,
    vendas_por_dia_semana: summaryData.weekdayData,
  };

  const prompt = `Você é um analista de negócios especializado em pequenos negócios brasileiros.
Analise os seguintes dados de vendas e forneça insights acionáveis.

Dados resumidos:
${JSON.stringify(dados_resumidos, null, 2)}

Escreva um parágrafo de 4 a 6 frases cobrindo:
1. Tendência geral de faturamento no período
2. O produto principal e seu impacto
3. Distribuição de vendas ao longo da semana (dias fortes vs fracos)
4. Uma recomendação prática e específica para aumentar vendas

Responda em português brasileiro, de forma direta e profissional.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Chave de API inválida. Verifique sua API key da OpenAI.');
    }
    if (response.status === 429) {
      throw new Error('Limite de requisições atingido. Aguarde um momento e tente novamente.');
    }
    const errorText = await response.text().catch(() => '');
    throw new Error(`Erro na API (${response.status}): ${errorText || 'Tente novamente.'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
