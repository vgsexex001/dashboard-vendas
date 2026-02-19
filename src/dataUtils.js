export const DEMO_CSV = `data,produto,valor
05/02/2026,Camiseta Básica,59.90
05/02/2026,Caneca Personalizada,34.90
05/02/2026,Adesivo Pack,12.90
06/02/2026,Camiseta Básica,59.90
06/02/2026,Boné Bordado,79.90
06/02/2026,Caneca Personalizada,34.90
06/02/2026,Poster A3,29.90
07/02/2026,Camiseta Básica,59.90
07/02/2026,Camiseta Básica,59.90
07/02/2026,Ecobag,24.90
08/02/2026,Boné Bordado,79.90
08/02/2026,Caneca Personalizada,34.90
08/02/2026,Poster A3,29.90
08/02/2026,Camiseta Básica,59.90
09/02/2026,Ecobag,24.90
09/02/2026,Adesivo Pack,12.90
09/02/2026,Camiseta Básica,59.90
10/02/2026,Caneca Personalizada,34.90
10/02/2026,Boné Bordado,79.90
10/02/2026,Camiseta Básica,59.90
11/02/2026,Poster A3,29.90
11/02/2026,Camiseta Básica,59.90
11/02/2026,Caneca Personalizada,34.90
12/02/2026,Boné Bordado,79.90
12/02/2026,Ecobag,24.90
12/02/2026,Camiseta Básica,59.90
13/02/2026,Camiseta Básica,59.90
13/02/2026,Caneca Personalizada,34.90
13/02/2026,Adesivo Pack,12.90
14/02/2026,Camiseta Básica,59.90
14/02/2026,Boné Bordado,79.90
14/02/2026,Poster A3,29.90
14/02/2026,Caneca Personalizada,34.90
15/02/2026,Camiseta Básica,59.90
15/02/2026,Ecobag,24.90
16/02/2026,Caneca Personalizada,34.90
16/02/2026,Camiseta Básica,59.90
16/02/2026,Boné Bordado,79.90
17/02/2026,Adesivo Pack,12.90
17/02/2026,Camiseta Básica,59.90
17/02/2026,Poster A3,29.90`;

export function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { records: [], ignored: 0 };

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headerLine = lines[0].toLowerCase();
  const hasHeader = headerLine.includes('data') || headerLine.includes('date') || headerLine.includes('produto') || headerLine.includes('product');

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const records = [];
  let ignored = 0;

  for (const line of dataLines) {
    const parts = line.split(delimiter).map(p => p.trim());
    if (parts.length < 3) { ignored++; continue; }

    const [rawDate, produto, rawValor] = parts;

    // Normalize date: DD/MM/YYYY → YYYY-MM-DD
    let date = rawDate;
    const brDate = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brDate) {
      date = `${brDate[3]}-${brDate[2].padStart(2, '0')}-${brDate[1].padStart(2, '0')}`;
    }

    // Validate date
    const parsed = new Date(date + 'T00:00:00');
    if (isNaN(parsed.getTime())) { ignored++; continue; }

    // Parse value: handle both 29.90 and 29,90
    const valor = parseFloat(rawValor.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) { ignored++; continue; }

    records.push({ date, produto: produto, valor, dateObj: parsed });
  }

  return { records, ignored };
}

export function calculateMetrics(records) {
  const faturamento = records.reduce((sum, r) => sum + r.valor, 0);
  const pedidos = records.length;
  const ticketMedio = pedidos > 0 ? faturamento / pedidos : 0;

  // Produto mais vendido by count
  const contagem = {};
  records.forEach(r => {
    contagem[r.produto] = (contagem[r.produto] || 0) + 1;
  });
  const produtoTop = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];

  return {
    faturamento,
    ticketMedio,
    pedidos,
    produtoTop: produtoTop ? { nome: produtoTop[0], quantidade: produtoTop[1] } : null,
  };
}

export function revenueByDay(records) {
  const byDay = {};
  records.forEach(r => {
    byDay[r.date] = (byDay[r.date] || 0) + r.valor;
  });

  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, valor]) => {
      const [, m, d] = date.split('-');
      return { dia: `${d}/${m}`, valor: Math.round(valor * 100) / 100 };
    });
}

export function topProducts(records, limit = 5) {
  const byProduct = {};
  records.forEach(r => {
    byProduct[r.produto] = (byProduct[r.produto] || 0) + r.valor;
  });

  return Object.entries(byProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([nome, receita]) => ({ nome, receita: Math.round(receita * 100) / 100 }));
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function weekdayDistribution(records) {
  const byDay = {};
  DIAS_SEMANA.forEach(d => { byDay[d] = 0; });

  records.forEach(r => {
    const day = DIAS_SEMANA[r.dateObj.getDay()];
    byDay[day] += r.valor;
  });

  return DIAS_SEMANA
    .map(dia => ({ dia, valor: Math.round(byDay[dia] * 100) / 100 }))
    .filter(d => d.valor > 0);
}

export function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
