import { useState } from 'react';
import type { ViewName } from './types';
import { TopBar } from '../components/TopBar';
import { NavTabs } from '../components/NavTabs';
import { LabView } from '../features/lab/LabView';
import { useLabController } from '../features/lab/useLabController';
import { PracticeView } from '../features/practice/PracticeView';
import { usePracticeController } from '../features/practice/usePracticeController';
import { CustomImportView } from '../features/ai/CustomImportView';
import { ApiSettingsModal } from '../features/ai/ApiSettingsModal';
import { AI_API_STORAGE_KEY, DEFAULT_AI_API, type GeneratedAlgorithm } from '../runtime/ai/client';
import { safeGet, safeSet } from '../runtime/storage';
import { useI18n } from '../i18n/I18nProvider';

export function App() {
  const { t } = useI18n();
  const [view, setView] = useState<ViewName>('learn');
  const [apiUrl, setApiUrl] = useState(() => safeGet(AI_API_STORAGE_KEY) || DEFAULT_AI_API);
  const [apiOpen, setApiOpen] = useState(false);
  const lab = useLabController();
  const practice = usePracticeController();

  const saveApiUrl = (url: string) => {
    setApiUrl(url);
    safeSet(AI_API_STORAGE_KEY, url);
  };

  const localDemo = (algorithmId: string) => lab.selectAlgo(algorithmId);

  const importAlgorithm = (generated: GeneratedAlgorithm) => lab.loadCustom(generated);

  return (
    <div className="app">
      <TopBar onOpenApi={() => setApiOpen(true)} />
      <NavTabs view={view} onChange={setView} />

      <div className={view === 'learn' ? '' : 'hidden'}>
        <LabView lab={lab} apiUrl={apiUrl} />
      </div>
      <div className={view === 'practice' ? '' : 'hidden'}>
        <PracticeView controller={practice} apiUrl={apiUrl} />
      </div>
      <div className={view === 'custom' ? '' : 'hidden'}>
        <CustomImportView
          apiUrl={apiUrl}
          onImport={importAlgorithm}
          onLocalDemo={localDemo}
          onGoToLab={() => setView('learn')}
        />
      </div>

      {apiOpen && <ApiSettingsModal apiUrl={apiUrl} onSave={saveApiUrl} onClose={() => setApiOpen(false)} />}
      <footer className="footer">{t('footer')}</footer>
    </div>
  );
}
