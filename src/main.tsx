import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ThemeProvider } from './theme/ThemeProvider';
import { I18nProvider } from './i18n/I18nProvider';
import './styles/tokens.css';
import './styles/app.css';
import './styles/stage7a.css';
import './styles/stage7b.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <ThemeProvider>
    <I18nProvider>
      <App />
    </I18nProvider>
  </ThemeProvider>,
);
