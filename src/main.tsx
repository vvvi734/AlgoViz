import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ThemeProvider } from './theme/ThemeProvider';
import { I18nProvider } from './i18n/I18nProvider';
import './styles/tokens.css';
import './styles/app.css';
import './styles/stage7a.css';
import './styles/stage7b.css';
import './styles/stage7c.css';
import './styles/stage7d.css';
import './styles/stage7e.css';
import './styles/stage7f.css';
import './styles/ui02.css';
import './styles/ui03.css';
import './styles/g1.css';
import './styles/g2.css';
import './styles/g3.css';
import './styles/g4.css';
import './styles/t1.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <ThemeProvider>
    <I18nProvider>
      <App />
    </I18nProvider>
  </ThemeProvider>,
);
