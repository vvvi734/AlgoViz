import { useEffect, useState, type ReactNode } from 'react';
import { AlgorithmSidebar } from './AlgorithmSidebar';
import { VisualStage } from './VisualStage';
import { TreeTraversalPicker } from './TreeTraversalPicker';
import { Timeline } from './Timeline';
import { CodeDock } from './CodeDock';
import { SyncPanel } from './SyncPanel';
import { CallStackPanel } from './CallStackPanel';
import { LessonPanel } from './LessonPanel';
import { SessionPanel } from './SessionPanel';
import { WorkspaceTabs, type WorkspaceTabId } from './WorkspaceTabs';
import { useSidebarPreferences } from './useSidebarPreferences';
import type { SessionTransferController } from './useSessionTransfer';
import { AiMentor } from './AiMentor';
import type { LabController } from './useLabController';
import type { LessonCatalog } from '../../domain/lessons/catalog';
import type { LocalizedLabel, PackExample } from '../../domain/packs/types';
import { stepIndexForEvent } from '../../domain/lessons/sync';
import { useI18n } from '../../i18n/I18nProvider';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Stage 7A learning workspace, re-laid out by UI-02.
 *
 * Information architecture:
 *  1. primary: sidebar → [animation + playback | synchronized explanation rail];
 *     the code editor is a full-width, collapsed-by-default dock below both columns
 *     (UI-03);
 *  2. secondary: variables/call stack, AI mentor and session/tool panels in the
 *     on-demand tab strip;
 *  3. the lesson rail and the animation read the SAME `currentEvent` and
 *     `playback.index`; the rail never owns a second playhead.
 *
 * The workspace never owns execution state. It reads the one LabController
 * (`currentEvent`, trace, playback) and only keeps presentational tab state.
 */
export function LabView({
  lab,
  lessons,
  packOrigin,
  courseExample,
  session,
}: {
  lab: LabController;
  /** Built-in + installed-pack courses; never a hard-coded singleton. */
  lessons: LessonCatalog;
  /** Name of the pack the current course came from, if any. */
  packOrigin?: LocalizedLabel;
  /** The current course's Python example (lazy text from an installed pack). */
  courseExample?: PackExample;
  /** Stage 5A: Agent session import + current-context export. */
  session: SessionTransferController;
}) {
  const { t, pick, lang } = useI18n();
  const { resolved } = useTheme();
  const entry = lab.catalog[lab.currentAlgo];
  const currentEvent = lab.events[lab.playback.index];
  const actualTreeTraversal =
    currentEvent?.structure?.kind === 'binary-tree' ? currentEvent.structure.traversal : null;
  const showTreePicker = lab.currentAlgo === 'inorder' && lab.codeLang === 'python';
  const showGraphStepPeek =
    lab.currentAlgo === 'bfs' || lab.currentAlgo === 'dfs' || lab.currentAlgo === 'dijkstra';
  const highlightLine = !lab.traceStale && currentEvent?.sourceLocation?.line
    ? currentEvent.sourceLocation.line
    : null;
  const noLocationHint = !lab.traceStale && lab.events.length > 0 && currentEvent != null && !currentEvent.sourceLocation;

  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [tab, setTab] = useState<WorkspaceTabId>('state');
  // UI-01: the directory's folded/collapsed layout is a persisted presentation
  // preference. It never owns the algorithm, the trace or the playhead.
  const sidebar = useSidebarPreferences();

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

  const hasCallStack = lab.events.some((event) => !!event.callStack?.length);
  const lesson = lessons.byAlgorithm(lab.currentAlgo);
  const activeStepIndex = lesson ? stepIndexForEvent(lesson, currentEvent) : -1;
  const activeStep = activeStepIndex >= 0 ? lesson?.steps[activeStepIndex] : undefined;

  const tabLabels: Record<WorkspaceTabId, string> = {
    state: t('workspaceState'),
    mentor: t('workspaceMentor'),
    tools: t('workspaceTools'),
  };

  const tabs = {
    state: (
      <div className="state-stack">
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
          showSource={false}
        />
      </div>
    ),
    mentor: (
      <AiMentor
        algorithmId={lab.currentAlgo}
        algorithmName={entry ? pick(entry.name) : lab.currentAlgo}
        lesson={lesson}
        event={currentEvent}
        events={lab.events}
        stepIndex={lab.playback.index}
        traceStale={lab.traceStale}
        code={lab.editorCode}
      />
    ),
    tools: (
      <div className="tools-stack">
        <SessionPanel session={session} lessons={lessons} />
        <section className="panel pad tools-note">
          <div className="sectionhead">
            <h2>{t('toolsMoreTitle')}</h2>
          </div>
          <p className="muted smalltext">{t('toolsMoreBody')}</p>
        </section>
      </div>
    ),
  } satisfies Record<WorkspaceTabId, ReactNode>;

  return (
    <div className={`lab-shell${sidebar.collapsed ? ' nav-collapsed' : ''}`} data-testid="learn-view">
      <div className="lab-sidebar-wrap">
        <AlgorithmSidebar
          catalog={lab.catalog}
          groups={lab.groups}
          currentAlgo={lab.currentAlgo}
          onSelect={lab.selectAlgo}
          collapsed={sidebar.collapsed}
          onToggleCollapsed={sidebar.toggleCollapsed}
          isGroupOpen={sidebar.isGroupOpen}
          onToggleGroup={sidebar.toggleGroup}
          onOpenGroup={sidebar.openGroup}
        />
      </div>

      <div className="lab-main">
        <header className="lab-head panel">
          <div className="lab-head-main">
            <div>
              <div className="eyebrow">{t('interactive')}</div>
              <h1 data-testid="lab-title">{entry ? pick(entry.name) : t('customName')}</h1>
            </div>
            <span className="tag green">{(entry?.group ?? 'custom').toUpperCase()}</span>
            <span className={`tag ${currentEvent ? 'tag-active' : ''}`} data-testid="lab-frame-status">
              {currentEvent
                ? t('workspaceFrame').replace('{current}', String(currentEvent.step + 1)).replace('{total}', String(lab.events.length))
                : t('workspaceNotRun')}
            </span>
          </div>
          <div className="lab-head-actions">
            <select
              className="mobile-algo-select"
              aria-label={t('algorithmDirectory')}
              value={lab.currentAlgo}
              data-testid="mobile-algo-select"
              onChange={(change) => lab.selectAlgo(change.target.value)}
            >
              {Object.entries(lab.catalog).map(([id, item]) => (
                <option key={id} value={id}>
                  {pick(item.name)}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="lab-primary ui02-workbench" data-testid="lab-workbench">
          <section className="panel pad stage-panel">
            <div className="sectionhead stage-head">
              <div>
                <div className="eyebrow">{t('visualization')}</div>
                <h2>{t('algorithmStage')}</h2>
              </div>
              {showGraphStepPeek && activeStep ? (
                <div className="stage-step-peek" data-testid="stage-step-peek">
                  <span className="stage-step-peek-label">{t('currentStep')}</span>
                  <span className="stage-step-peek-text">{activeStep.title[lang]}</span>
                </div>
              ) : null}
              {lab.traceStale && <span className="tag orange">{t('traceStaleShort')}</span>}
            </div>
            <VisualStage event={currentEvent} />
            {showTreePicker ? (
              <TreeTraversalPicker
                inputJson={lab.inputJson}
                actualTraversal={actualTreeTraversal}
                onSelect={lab.selectTreeMode}
              />
            ) : null}
            <Timeline events={lab.events} playback={lab.playback} />
          </section>

          <aside className="lab-explanation" data-testid="explanation-rail" aria-label={t('lessonPanel')}>
            <LessonPanel
              lesson={lesson}
              events={lab.events}
              index={lab.playback.index}
              currentEvent={currentEvent}
              onSeek={lab.playback.seek}
              originName={packOrigin ? packOrigin[lang] : undefined}
              hasExample={Boolean(courseExample)}
              onUseExample={
                courseExample
                  ? () => lab.applyCourseExample(courseExample.code, courseExample.input)
                  : undefined
              }
              variant="rail"
            />
          </aside>
        </div>

        <CodeDock
          lab={lab}
          highlightLine={highlightLine}
          noLocationHint={noLocationHint}
          theme={resolved}
        />

        <WorkspaceTabs active={tab} onChange={setTab} labels={tabLabels} panels={tabs} />
      </div>
    </div>
  );
}
