import { AlgorithmSidebar } from './AlgorithmSidebar';
import { VisualStage } from './VisualStage';
import { Timeline } from './Timeline';
import { CodeEditorPanel } from './CodeEditorPanel';
import { ConceptPanel } from './ConceptPanel';
import { SyncPanel } from './SyncPanel';
import { AiMentor } from './AiMentor';
import type { LabController } from './useLabController';
import { useI18n } from '../../i18n/I18nProvider';

export function LabView({ lab, apiUrl }: { lab: LabController; apiUrl: string }) {
  const { t, pick } = useI18n();
  const entry = lab.catalog[lab.currentAlgo];
  const currentEvent = lab.events[lab.playback.index];
  return (
    <div className="workspace" data-testid="learn-view">
      <AlgorithmSidebar
        catalog={lab.catalog}
        groups={lab.groups}
        currentAlgo={lab.currentAlgo}
        onSelect={lab.selectAlgo}
      />
      <div className="maincol">
        <section className="panel pad">
          <div className="sectionhead">
            <div>
              <div className="eyebrow">{t('interactive')}</div>
              <h2 data-testid="lab-title">{entry ? pick(entry.name) : t('customName')}</h2>
            </div>
            <span className="tag green">{(entry?.group ?? 'custom').toUpperCase()}</span>
          </div>
          <VisualStage event={currentEvent} />
          <Timeline events={lab.events} playback={lab.playback} />
        </section>
        <SyncPanel event={currentEvent} source={lab.source} stale={lab.traceStale} />
        <CodeEditorPanel
          codeLang={lab.codeLang}
          engineText={lab.engineText}
          code={lab.editorCode}
          inputJson={lab.inputJson}
          status={lab.status}
          onCodeLangChange={lab.setCodeLang}
          onCodeChange={lab.setEditorCode}
          onInputChange={lab.setInputJson}
          onRun={lab.runVisualization}
          onRestore={lab.restorePreset}
          onRandom={lab.randomizeInput}
        />
      </div>
      <aside className="rightcol">
        <ConceptPanel
          entry={entry}
          events={lab.events}
          index={lab.playback.index}
          onSeek={lab.playback.seek}
        />
        <AiMentor
          apiUrl={apiUrl}
          algorithmName={entry ? pick(entry.name) : ''}
          currentFrameMessage={currentEvent?.message}
          code={lab.editorCode}
        />
      </aside>
    </div>
  );
}
