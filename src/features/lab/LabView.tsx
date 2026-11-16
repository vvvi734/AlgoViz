import { useEffect, useState } from 'react';
import { AlgorithmSidebar } from './AlgorithmSidebar';
import { VisualStage } from './VisualStage';
import { Timeline } from './Timeline';
import { CodeEditorPanel } from './CodeEditorPanel';
import { ConceptPanel } from './ConceptPanel';
import { SyncPanel } from './SyncPanel';
import { CallStackPanel } from './CallStackPanel';
import { AiMentor } from './AiMentor';
import type { LabController } from './useLabController';
import { useI18n } from '../../i18n/I18nProvider';
import { useTheme } from '../../theme/ThemeProvider';

export function LabView({ lab, apiUrl }: { lab: LabController; apiUrl: string }) {
  const { t, pick } = useI18n();
  const { resolved } = useTheme();
  const entry = lab.catalog[lab.currentAlgo];
  const currentEvent = lab.events[lab.playback.index];
  // Highlight the line only when the draft still matches the executed snapshot;
  // a stale trace must never map its line numbers onto newly-edited code.
  const highlightLine = !lab.traceStale && currentEvent?.sourceLocation?.line
    ? currentEvent.sourceLocation.line
    : null;
  const noLocationHint = !lab.traceStale && lab.events.length > 0 && currentEvent != null && !currentEvent.sourceLocation;

  // Frame selection for the call-stack panel. Kept here (not in the panel) so
  // the variables watch and the call stack agree on a single selection, but it
  // never drives the timeline — that still uses the single `currentEvent`.
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  // A new run (fresh `events` array) resets the selection.
  useEffect(() => setSelectedFrameId(null), [lab.events]);
  // Scrubbing to a step whose stack no longer contains the selected frame falls
  // back to the active frame.
  useEffect(() => {
    if (selectedFrameId == null) return;
    const stack = currentEvent?.callStack;
    if (!stack || !stack.some((frame) => frame.frameId === selectedFrameId)) {
      setSelectedFrameId(null);
    }
  }, [currentEvent, selectedFrameId]);

  // Only render the call-stack panel for traces that actually carry one.
  const hasCallStack = lab.events.some((event) => !!event.callStack?.length);

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
        {hasCallStack && (
          <CallStackPanel
            event={currentEvent}
            selectedFrameId={selectedFrameId}
            onSelectFrame={setSelectedFrameId}
          />
        )}
        <SyncPanel
          event={currentEvent}
          source={lab.source}
          stale={lab.traceStale}
          selectedFrameId={selectedFrameId}
        />
        <CodeEditorPanel
          codeLang={lab.codeLang}
          engineText={lab.engineText}
          code={lab.editorCode}
          inputJson={lab.inputJson}
          status={lab.status}
          highlightLine={highlightLine}
          noLocationHint={noLocationHint}
          diagnostics={lab.diagnostics}
          draftStatus={lab.draftStatus}
          theme={resolved}
          onCodeLangChange={lab.setCodeLang}
          onCodeChange={lab.editCode}
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
