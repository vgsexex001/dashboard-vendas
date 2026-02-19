import { useRef } from 'react';
import { theme, cardStyle, buttonStyle } from './styles';
import { DEMO_CSV } from './dataUtils';

export default function InputScreen({ onGenerate }) {
  const fileInputRef = useRef(null);

  const handleSubmit = () => {
    const textarea = document.getElementById('csv-input');
    const text = textarea?.value?.trim();
    if (!text) {
      alert('Cole dados CSV antes de gerar o dashboard.');
      return;
    }
    onGenerate(text);
  };

  const handleLoadDemo = () => {
    const textarea = document.getElementById('csv-input');
    if (textarea) textarea.value = DEMO_CSV;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const textarea = document.getElementById('csv-input');
      if (textarea) textarea.value = evt.target.result;
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          ...cardStyle,
          maxWidth: '700px',
          width: '100%',
          animation: 'fadeSlideUp 0.5s ease both',
        }}
      >
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '8px' }}>
          Dashboard de Vendas
        </h1>
        <p style={{ color: theme.colors.textMuted, marginBottom: '24px', fontSize: '15px' }}>
          Cole seus dados de vendas em CSV ou faça upload de um arquivo.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <textarea
          id="csv-input"
          placeholder={`data,produto,valor\n05/02/2026,Camiseta Básica,59.90\n05/02/2026,Caneca Personalizada,34.90`}
          style={{
            width: '100%',
            height: '260px',
            background: theme.colors.bg,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radiusSm,
            padding: '16px',
            fontFamily: theme.fonts.mono,
            fontSize: '13px',
            lineHeight: '1.6',
            resize: 'vertical',
            outline: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              ...buttonStyle,
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textMuted,
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = theme.colors.green;
              e.target.style.color = theme.colors.green;
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = theme.colors.border;
              e.target.style.color = theme.colors.textMuted;
            }}
          >
            Upload CSV
          </button>
          <button
            onClick={handleLoadDemo}
            style={{
              ...buttonStyle,
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textMuted,
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
            Carregar Exemplo
          </button>
          <button
            onClick={handleSubmit}
            style={{
              ...buttonStyle,
              background: `linear-gradient(135deg, ${theme.colors.cyan}, ${theme.colors.cyanDark})`,
              color: '#0a0e17',
            }}
            onMouseEnter={(e) => { e.target.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
          >
            Gerar Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
