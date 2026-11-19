import { useState } from 'react';
import type { ViewName } from './types';
import { TopBar } from '../components/TopBar';
import { NavTabs } from '../components/NavTabs';
import { LabView } from '../features/lab/LabView';
import { useLabController } from '../features/lab/useLabController';
import { PracticeView } from '../features/practice/PracticeView';
import { usePracticeController } from '../features/practice/usePracticeController';
import { builtinLessonCatalog } from '../domain/lessons/catalog';
import { useI18n } from '../i18n/I18nProvider';

export function App() {
  const { t } = useI18n();
  const [view, setView] = useState<ViewName>('learn');
  const lab = useLabController();
  const practice = usePracticeController();

  return (
    <div className="app" data-view={view}>
      <TopBar />
      <NavTabs view={view} onChange={setView} />

      <div className={view === 'learn' ? 'app-view app-view-learn' : 'hidden'}>
        <LabView lab={lab} lessons={builtinLessonCatalog} />
      </div>
      <div className={view === 'practice' ? '' : 'hidden'}>
        <PracticeView controller={practice} />
      </div>

      <footer className="footer">{t('footer')}</footer>
    </div>
  );
}
