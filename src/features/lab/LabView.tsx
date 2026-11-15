import { AlgorithmSidebar } from './AlgorithmSidebar';
import { VisualStage } from './VisualStage';
import { Timeline } from './Timeline';
import { CodeEditorPanel } from './CodeEditorPanel';
import { ConceptPanel } from './ConceptPanel';
import { AiMentor } from './AiMentor';
import type { LabController } from './useLabController';
import { useI18n } from '../../i18n/I18nProvider';

export function LabView({ lab, apiUrl }: { lab: LabController; apiUrl: string }) {
  const { t, pick } = useI18n();
  const entry = lab.catalog[lab.currentAlgo];
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
          <VisualStage frame={lab.frames[lab.playback.index]} />
          <Timeline frames={lab.frames} playback={lab.playback} />
        </section>
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
          frames={lab.frames}
          index={lab.playback.index}
          onSeek={lab.playback.seek}
        />
        <AiMentor
          apiUrl={apiUrl}
          algorithmName={entry ? pick(entry.name) : ''}
          currentFrameMessage={lab.frames[lab.playback.index]?.message}
          code={lab.editorCode}
        />
      </aside>
    </div>
  );
}
