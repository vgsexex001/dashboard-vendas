import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { theme, cardStyle } from './styles';
import { formatCurrency } from './dataUtils';

const COLORS = [
  theme.colors.cyan, theme.colors.green, theme.colors.amber,
  theme.colors.rose, theme.colors.violet, '#f472b6', '#38bdf8',
];

function ChartCard({ title, children, delay = 0, style = {} }) {
  return (
    <div
      style={{
        ...cardStyle,
        animation: 'fadeSlideUp 0.5s ease both',
        animationDelay: `${delay}ms`,
        ...style,
      }}
    >
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: theme.colors.textMuted }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: theme.colors.card,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: theme.radiusSm,
        padding: '10px 14px',
        fontSize: '13px',
      }}
    >
      <div style={{ color: theme.colors.textMuted, marginBottom: '4px' }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color, fontFamily: theme.fonts.mono, fontWeight: 600 }}>
          {formatCurrency(entry.value)}
        </div>
      ))}
    </div>
  );
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const displayName = name.length > 5 ? name.slice(0, 3) + '.' : name;

  return (
    <text
      x={x}
      y={y}
      fill={theme.colors.textMuted}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {displayName} {(percent * 100).toFixed(0)}%
    </text>
  );
}

export function RevenueAreaChart({ data }) {
  return (
    <ChartCard title="Faturamento por Dia" delay={300} style={{ gridColumn: 'span 2' }}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.colors.cyan} stopOpacity={0.3} />
              <stop offset="100%" stopColor={theme.colors.cyan} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
          <XAxis
            dataKey="dia"
            stroke={theme.colors.textDim}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            stroke={theme.colors.textDim}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `R$${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="valor"
            stroke={theme.colors.cyan}
            strokeWidth={2}
            fill="url(#gradCyan)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProductsBarChart({ data }) {
  return (
    <ChartCard title="Top 5 Produtos (Receita)" delay={450}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} horizontal={false} />
          <XAxis
            type="number"
            stroke={theme.colors.textDim}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `R$${v}`}
          />
          <YAxis
            type="category"
            dataKey="nome"
            stroke={theme.colors.textDim}
            tick={{ fontSize: 12 }}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="receita" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function WeekdayPieChart({ data }) {
  return (
    <ChartCard title="Distribuição por Dia da Semana" delay={600}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="valor"
            nameKey="dia"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            label={PieLabel}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
