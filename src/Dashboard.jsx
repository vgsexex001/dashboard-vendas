import { useState } from 'react';
import { theme, cardStyle, buttonStyle } from './styles';
import { parseCSV, calculateMetrics, revenueByDay, topProducts, weekdayDistribution, formatCurrency } from './dataUtils';
import { generateAnalysis } from './aiAnalysis';
import InputScreen from './InputScreen';
import KPICard from './KPICard';
import { RevenueAreaChart, ProductsBarChart, WeekdayPieChart } from './Charts';

export default function Dashboard() {
  const [view, setView] = useState('input');
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState({});
  const [analysis, setAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const triggerAnalysis = async (data) => {
    const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    if (!key) return;

    setAnalysisLoading(true);
    setAnalysisError('');
    try {
      const result = await generateAnalysis(data, key);
      setAnalysis(result);
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleGenerate = (csvText) => {
    setError('');
    setWarning('');
    setAnalysis('');
    setAnalysisError('');

    const { records: parsed, ignored } = parseCSV(csvText);

    if (parsed.length === 0) {
      setError('Nenhuma linha válida encontrada. Verifique o formato: data,produto,valor');
      return;
    }

    if (ignored > 0) {
      setWarning(`${ignored} linha(s) ignorada(s) por formato inválido.`);
    }

    const m = calculateMetrics(parsed);
    const revenue = revenueByDay(parsed);
    const top = topProducts(parsed);
    const weekday = weekdayDistribution(parsed);

    setRecords(parsed);
    setMetrics(m);
    setChartData({ revenue, top, weekday });
    setView('dashboard');

    // Build summary for AI
    const dates = parsed.map(r => r.date).sort();
    const summaryData = {
      periodo: `${formatDate(dates[0])} a ${formatDate(dates[dates.length - 1])}`,
      faturamento: formatCurrency(m.faturamento),
      ticketMedio: formatCurrency(m.ticketMedio),
      pedidos: m.pedidos,
      topProducts: top.map(p => ({ nome: p.nome, receita: formatCurrency(p.receita) })),
      weekdayData: weekday.map(d => ({ dia: d.dia, valor: formatCurrency(d.valor) })),
    };

    triggerAnalysis(summaryData);
  };

  const handleReset = () => {
    setView('input');
    setRecords([]);
    setMetrics(null);
    setChartData({});
    setAnalysis('');
    setAnalysisError('');
    setError('');
    setWarning('');
  };

  const handleReanalyze = () => {
    if (!records.length || !metrics) return;
    const dates = records.map(r => r.date).sort();
    const top = topProducts(records);
    const weekday = weekdayDistribution(records);
    const summaryData = {
      periodo: `${formatDate(dates[0])} a ${formatDate(dates[dates.length - 1])}`,
      faturamento: formatCurrency(metrics.faturamento),
      ticketMedio: formatCurrency(metrics.ticketMedio),
      pedidos: metrics.pedidos,
      topProducts: top.map(p => ({ nome: p.nome, receita: formatCurrency(p.receita) })),
      weekdayData: weekday.map(d => ({ dia: d.dia, valor: formatCurrency(d.valor) })),
    };
    triggerAnalysis(summaryData);
  };

  if (view === 'input') {
    return (
      <div>
        <InputScreen onGenerate={handleGenerate} />
        {error && (
          <div style={{
            textAlign: 'center',
            color: theme.colors.rose,
            padding: '12px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px 32px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        animation: 'fadeSlideUp 0.4s ease both',
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Dashboard de Vendas</h1>
          {warning && (
            <div style={{ color: theme.colors.amber, fontSize: '13px', marginTop: '6px' }}>
              {warning}
            </div>
          )}
        </div>
        <button
          onClick={handleReset}
          style={{
            ...buttonStyle,
            background: 'transparent',
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.textMuted,
            fontSize: '14px',
            padding: '10px 20px',
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = theme.colors.cyan;
            e.target.style.color = theme.colors.cyan;
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = theme.colors.border;
            e.target.style.color = theme.colors.textMuted;
          }}
        >
          Novos Dados
        </button>
      </div>

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '28px',
      }}>
        <KPICard
          titulo="Faturamento Total"
          valor={formatCurrency(metrics.faturamento)}
          subtitulo={`${metrics.pedidos} vendas no período`}
          cor={theme.colors.cyan}
          icone="💰"
          delay={100}
        />
        <KPICard
          titulo="Ticket Médio"
          valor={formatCurrency(metrics.ticketMedio)}
          subtitulo="por venda"
          cor={theme.colors.green}
          icone="📊"
          delay={150}
        />
        <KPICard
          titulo="Total de Pedidos"
          valor={metrics.pedidos}
          subtitulo="vendas registradas"
          cor={theme.colors.amber}
          icone="📦"
          delay={200}
        />
        <KPICard
          titulo="Mais Vendido"
          valor={metrics.produtoTop?.nome || '-'}
          subtitulo={metrics.produtoTop ? `${metrics.produtoTop.quantidade} unidades` : ''}
          cor={theme.colors.violet}
          icone="⭐"
          delay={250}
        />
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '20px',
        marginBottom: '28px',
      }}>
        <RevenueAreaChart data={chartData.revenue} />
        <ProductsBarChart data={chartData.top} />
        <WeekdayPieChart data={chartData.weekday} />
      </div>

      {/* AI Analysis */}
      <div style={{
        ...cardStyle,
        animation: 'fadeSlideUp 0.5s ease both',
        animationDelay: '700ms',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: theme.colors.textMuted }}>
            Análise por IA
          </h3>
          {(apiKey || import.meta.env.VITE_OPENAI_API_KEY) && (
            <button
              onClick={handleReanalyze}
              disabled={analysisLoading}
              style={{
                ...buttonStyle,
                fontSize: '13px',
                padding: '8px 16px',
                background: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textMuted,
                opacity: analysisLoading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!analysisLoading) {
                  e.target.style.borderColor = theme.colors.violet;
                  e.target.style.color = theme.colors.violet;
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = theme.colors.border;
                e.target.style.color = theme.colors.textMuted;
              }}
            >
              Reanalisar
            </button>
          )}
        </div>

        {!apiKey && !import.meta.env.VITE_OPENAI_API_KEY && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: theme.colors.textDim, fontSize: '13px', marginBottom: '10px' }}>
              Insira sua API key da OpenAI para habilitar análise por IA. O dashboard funciona normalmente sem ela.
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radiusSm,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.mono,
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleReanalyze}
                style={{
                  ...buttonStyle,
                  fontSize: '13px',
                  padding: '10px 16px',
                  background: `linear-gradient(135deg, ${theme.colors.violet}, ${theme.colors.violetDark})`,
                  color: '#fff',
                }}
              >
                Analisar
              </button>
            </div>
          </div>
        )}

        {analysisLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: theme.colors.textMuted }}>
            <div style={{
              width: '18px',
              height: '18px',
              border: `2px solid ${theme.colors.border}`,
              borderTopColor: theme.colors.violet,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: '14px' }}>Gerando análise...</span>
          </div>
        )}

        {analysisError && (
          <div style={{
            color: theme.colors.rose,
            fontSize: '14px',
            padding: '12px',
            background: 'rgba(251,113,133,0.08)',
            borderRadius: theme.radiusSm,
          }}>
            {analysisError}
            <button
              onClick={handleReanalyze}
              style={{
                marginLeft: '12px',
                background: 'none',
                border: 'none',
                color: theme.colors.cyan,
                cursor: 'pointer',
                fontFamily: theme.fonts.body,
                fontSize: '14px',
                textDecoration: 'underline',
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {analysis && !analysisLoading && (
          <p style={{
            color: theme.colors.text,
            fontSize: '15px',
            lineHeight: '1.7',
          }}>
            {analysis}
          </p>
        )}

        {!analysis && !analysisLoading && !analysisError && apiKey && (
          <p style={{ color: theme.colors.textDim, fontSize: '14px' }}>
            Clique em "Reanalisar" para gerar insights com IA.
          </p>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
