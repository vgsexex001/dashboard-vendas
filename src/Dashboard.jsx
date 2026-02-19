import { useState, useCallback } from 'react';
import { theme, cardStyle, buttonStyle } from './styles';
import { formatCurrency } from './dataUtils';
import * as api from './api';
import AuthScreen from './AuthScreen';
import InputScreen from './InputScreen';
import KPICard from './KPICard';
import { RevenueAreaChart, ProductsBarChart, WeekdayPieChart } from './Charts';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('input'); // input | dashboard
  const [dashData, setDashData] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  // Redirect to login if session expires
  api.setAuthCallback(() => {
    setUser(null);
    setView('input');
  });

  const handleAuth = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setView('input');
    setDashData(null);
    setUploadResult(null);
    setAnalysis('');
  };

  const triggerAnalysis = useCallback(async (dateFrom, dateTo, force = false) => {
    setAnalysisLoading(true);
    setAnalysisError('');
    try {
      const result = await api.analyzeAI(dateFrom, dateTo, force);
      setAnalysis(result.analysis);
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  const handleGenerate = async (csvText) => {
    setError('');
    setWarning('');
    setAnalysis('');
    setAnalysisError('');

    try {
      // Upload CSV to backend
      const result = await api.uploadCSV(csvText);
      setUploadResult(result);

      if (result.records_rejected > 0) {
        setWarning(`${result.records_rejected} linha(s) ignorada(s) por formato inválido.`);
      }

      // Fetch analytics summary — detect date range from uploaded data
      // Use a wide range to capture all uploaded data
      const summary = await api.getSummary('2000-01-01', '2099-12-31');
      setDashData(summary);
      setView('dashboard');

      // Trigger AI analysis
      triggerAnalysis('2000-01-01', '2099-12-31');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = () => {
    setView('input');
    setDashData(null);
    setUploadResult(null);
    setAnalysis('');
    setAnalysisError('');
    setError('');
    setWarning('');
  };

  const handleReanalyze = () => {
    triggerAnalysis('2000-01-01', '2099-12-31', true);
  };

  // Auth gate
  if (!user) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  if (view === 'input') {
    return (
      <div>
        <div style={{
          position: 'fixed',
          top: '16px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10,
        }}>
          <span style={{ color: theme.colors.textDim, fontSize: '13px' }}>{user.email}</span>
          <button
            onClick={handleLogout}
            style={{
              ...buttonStyle,
              fontSize: '12px',
              padding: '6px 14px',
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textMuted,
            }}
          >
            Sair
          </button>
        </div>
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

  const kpis = dashData?.kpis;
  const dailyRevenue = dashData?.daily_revenue?.map((d) => ({
    dia: d.date.split('-').reverse().slice(0, 2).join('/'),
    valor: d.revenue,
  })) || [];
  const topProducts = dashData?.top_products?.map((p) => ({
    nome: p.product_name,
    receita: p.revenue,
  })) || [];
  const weekdayData = dashData?.weekday_distribution?.map((d) => ({
    dia: d.weekday_name,
    valor: d.revenue,
  })) || [];

  return (
    <div style={{ minHeight: '100vh', padding: '24px 32px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        animation: 'fadeSlideUp 0.4s ease both',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Dashboard de Vendas</h1>
          {warning && (
            <div style={{ color: theme.colors.amber, fontSize: '13px', marginTop: '6px' }}>
              {warning}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: theme.colors.textDim, fontSize: '13px' }}>{user.email}</span>
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
          <button
            onClick={handleLogout}
            style={{
              ...buttonStyle,
              fontSize: '13px',
              padding: '10px 16px',
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textMuted,
            }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}>
          <KPICard
            titulo="Faturamento Total"
            valor={formatCurrency(kpis.faturamento_total)}
            subtitulo={`${kpis.total_pedidos} vendas no período`}
            cor={theme.colors.cyan}
            icone="💰"
            delay={100}
          />
          <KPICard
            titulo="Ticket Médio"
            valor={formatCurrency(kpis.ticket_medio)}
            subtitulo="por venda"
            cor={theme.colors.green}
            icone="📊"
            delay={150}
          />
          <KPICard
            titulo="Total de Pedidos"
            valor={kpis.total_pedidos}
            subtitulo="vendas registradas"
            cor={theme.colors.amber}
            icone="📦"
            delay={200}
          />
          <KPICard
            titulo="Mais Vendido"
            valor={kpis.produto_mais_vendido?.nome || '-'}
            subtitulo={kpis.produto_mais_vendido ? `${kpis.produto_mais_vendido.quantidade} unidades` : ''}
            cor={theme.colors.violet}
            icone="⭐"
            delay={250}
          />
        </div>
      )}

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '20px',
        marginBottom: '28px',
      }}>
        <RevenueAreaChart data={dailyRevenue} />
        <ProductsBarChart data={topProducts} />
        <WeekdayPieChart data={weekdayData} />
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
        </div>

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

        {!analysis && !analysisLoading && !analysisError && (
          <p style={{ color: theme.colors.textDim, fontSize: '14px' }}>
            Clique em "Reanalisar" para gerar insights com IA.
          </p>
        )}
      </div>
    </div>
  );
}
