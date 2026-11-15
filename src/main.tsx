import '@fontsource-variable/instrument-sans';
import '@fontsource/martian-mono/400.css';
import '@fontsource/martian-mono/500.css';
import './styles/tokens.css';
import './styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { getLang, keepTranslated } from './i18n/translate';

const root = document.getElementById('root')!;
if (getLang() === 'tr') {
  document.documentElement.lang = 'tr';
  keepTranslated(root);
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
