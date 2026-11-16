import { useEffect, useState, type ReactNode } from 'react';
import { AlgorithmSidebar } from './AlgorithmSidebar';
import { VisualStage } from './VisualStage';
import { Timeline } from './Timeline';
import { CodeEditorPanel } from './CodeEditorPanel';
import { SyncPanel } from './SyncPanel';
import { CallStackPanel } from './CallStackPanel';
import { LessonPanel } from './LessonPanel';
import { SessionPanel } from './SessionPanel';
import { WorkspaceTabs, type WorkspaceTabId } from './WorkspaceTabs';
import type { SessionTransferController } from './useSessionTransfer';
import { AiMentor } from './AiMentor';
import type { LabController } from './useLabController';
import type { LessonCatalog } from '../../domain/lessons/catalog';
import type { LocalizedLabel, PackExample } from '../../domain/packs/types';
import { stepIndexForEvent, lessonStepIdOf } from '../../domain/lessons/sync';
import { useI18n } from '../../i18n/I18nProvider';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Stage 7A learning workspace.
 *
 * Information architecture:
 *  1. primary: sidebar → animation → current trace step → timeline, with
 *     Monaco beside the animation on wide screens;
 *  2. secondary: variables/call stack, teaching course, full course copy;
 *  3. auxiliary: AI mentor and session/tool panels, mounted but only shown
 *     inside on-demand tabs.
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
  const highlightLine = !lab.traceStale && currentEvent?.sourceLocation?.line
    ? currentEvent.sourceLocation.line
    : null;
  const noLocationHint = !lab.traceStale && lab.events.length > 0 && currentEvent != null && !currentEvent.sourceLocation;

  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [tab, setTab] = useState<WorkspaceTabId>('lesson');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
  const eventStepId = lessonStepIdOf(currentEvent);

  const tabLabels: Record<WorkspaceTabId, string> = {
    lesson: t('workspaceTeaching'),
    state: t('workspaceState'),
    mentor: t('workspaceMentor'),
    tools: t('workspaceTools'),
  };

  const tabs = {
    lesson: (
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
        compact
      />
    ),
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
    <div className={`lab-shell${sidebarCollapsed ? ' nav-collapsed' : ''}`} data-testid="learn-view">
      <div className="lab-sidebar-wrap">
        <AlgorithmSidebar
          catalog={lab.catalog}
          groups={lab.groups}
          currentAlgo={lab.currentAlgo}
          onSelect={lab.selectAlgo}
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
            <button
              type="button"
              className="btn btn-ghost sidebar-toggle"
              aria-expanded={!sidebarCollapsed}
              data-testid="sidebar-toggle"
              onClick={() => setSidebarCollapsed((value) => !value)}
            >
              {sidebarCollapsed ? t('showDirectory') : t('hideDirectory')}
            </button>
          </div>
        </header>

        <div className="lab-primary">
          <section className="panel pad stage-panel">
            <div className="sectionhead stage-head">
              <div>
                <div className="eyebrow">{t('visualization')}</div>
                <h2>{t('algorithmStage')}</h2>
              </div>
              {lab.traceStale && <span className="tag orange">{t('traceStaleShort')}</span>}
            </div>
            <VisualStage event={currentEvent} />
            <section className="current-step stage-current-step" data-testid="current-step">
              <div className="current-step-main">
                <span className="tag tag-active">{t('currentStep')}</span>
                <div className="current-step-copy">
                  <strong data-testid="current-step-title">
                    {activeStep ? activeStep.title[lang] : currentEvent ? t('currentStepUnlinked') : t('currentStepEmpty')}
                  </strong>
                  {currentEvent?.message && (
                    <span className="current-step-message" data-testid="current-step-message">{currentEvent.message}</span>
                  )}
                  {activeStep?.tip && <span className="current-step-tip">💡 {activeStep.tip[lang]}</span>}
                  {eventStepId && !activeStep && (
                    <span className="current-step-tip">{t('lessonUnknownStep').replace('{id}', eventStepId)}</span>
                  )}
                </div>
              </div>
              {currentEvent?.variables?.length ? (
                <div className="current-vars" aria-label={t('variablesWatch')}>
                  {currentEvent.variables.map((variable) => (
                    <span className="current-var" key={variable.name}>
                      <b>{variable.name}</b>
                      <code>{formatCompact(variable.value)}</code>
                    </span>
                  ))}
                </div>
              ) : null}
            </section>
            <Timeline events={lab.events} playback={lab.playback} />
          </section>

          <div className="code-panel">
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
        </div>

        <WorkspaceTabs active={tab} onChange={setTab} labels={tabLabels} panels={tabs} />
      </div>
    </div>
  );
}

function formatCompact(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  try {
    const text = JSON.stringify(value);
    return text.length > 48 ? `${text.slice(0, 48)}…` : text;
  } catch {
    return String(value);
  }
}
