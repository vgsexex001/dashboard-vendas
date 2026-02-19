import { theme, cardStyle } from './styles';

export default function KPICard({ titulo, valor, subtitulo, cor, icone, delay = 0 }) {
  return (
    <div
      className="hoverable"
      style={{
        ...cardStyle,
        borderTop: `3px solid ${cor}`,
        animation: 'fadeSlideUp 0.5s ease both',
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '22px' }}>{icone}</span>
        <span style={{ color: theme.colors.textMuted, fontSize: '14px', fontWeight: 500 }}>
          {titulo}
        </span>
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          fontFamily: theme.fonts.mono,
          color: cor,
          marginBottom: '6px',
        }}
      >
        {valor}
      </div>
      {subtitulo && (
        <div style={{ color: theme.colors.textDim, fontSize: '13px' }}>{subtitulo}</div>
      )}
    </div>
  );
}
