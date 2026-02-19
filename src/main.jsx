import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { globalCSS } from './styles';
import Dashboard from './Dashboard';

// Inject global styles
const styleEl = document.createElement('style');
styleEl.textContent = globalCSS;
document.head.appendChild(styleEl);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>,
);
