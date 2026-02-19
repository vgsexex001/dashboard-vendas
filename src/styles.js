export const theme = {
  colors: {
    bg: '#0a0e17',
    card: '#111827',
    cardHover: '#1a2332',
    border: '#1e293b',
    borderLight: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    textDim: '#64748b',
    cyan: '#22d3ee',
    cyanDark: '#0891b2',
    green: '#34d399',
    greenDark: '#059669',
    amber: '#fbbf24',
    amberDark: '#d97706',
    rose: '#fb7185',
    roseDark: '#e11d48',
    violet: '#a78bfa',
    violetDark: '#7c3aed',
  },
  fonts: {
    body: "'DM Sans', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  radius: '12px',
  radiusSm: '8px',
};

export const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  width: 100%;
}

body {
  font-family: ${theme.fonts.body};
  background: ${theme.colors.bg};
  color: ${theme.colors.text};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hoverable {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: ${theme.colors.bg};
}

::-webkit-scrollbar-thumb {
  background: ${theme.colors.border};
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: ${theme.colors.borderLight};
}
`;

export const cardStyle = {
  background: theme.colors.card,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius,
  padding: '24px',
};

export const buttonStyle = {
  padding: '12px 28px',
  border: 'none',
  borderRadius: theme.radiusSm,
  fontFamily: theme.fonts.body,
  fontWeight: 600,
  fontSize: '15px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};
