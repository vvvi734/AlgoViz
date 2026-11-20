import { useEffect, useMemo, useRef, useState } from 'react';
import { AlgorithmSidebar } from './AlgorithmSidebar';
import { VisualStage } from './VisualStage';
import { TreeTraversalPicker } from './TreeTraversalPicker';
import { BstPicker } from './BstPicker';
import { AvlPicker } from './AvlPicker';
import { HeapPicker } from './HeapPicker';
import { HuffmanPicker } from './HuffmanPicker';
import { SequentialListPicker } from './SequentialListPicker';
import { sequentialListPresetFromInput } from '../../domain/algorithms/sequentialListExamples';
import { Timeline } from './Timeline';
import { CodeDock } from './CodeDock';
import { LearningRail } from './LearningRail';
import { ReferenceCodePanel } from './ReferenceCodePanel';
import { useSvgTextFloor } from './useSvgTextFloor';
import { AlgorithmGuide, ALGORITHM_GUIDE_ID } from './AlgorithmGuide';
import { useAlgorithmGuidePreferences } from './useAlgorithmGuidePreferences';
import { buildAlgorithmGuide } from '../../domain/guides/buildGuide';
import { WorkspaceTabs } from './WorkspaceTabs';
import { useSidebarPreferences } from './useSidebarPreferences';
import {
  buildTextbookNavigation,
  findConceptPath,
  findTextbookPath,
  textbookTitle,
} from '../../domain/algorithms/textbook';
import { ConceptView } from '../concepts/ConceptView';
import { conceptById } from '../../domain/concepts/catalog';
import type { LabController } from './useLabController';
import type { LessonCatalog } from '../../domain/lessons/catalog';
import { stepIndexForEvent } from '../../domain/lessons/sync';
import { bstPresetFromInput } from '../../domain/algorithms/bstExamples';
import { avlPresetFromInput } from '../../domain/algorithms/avlExamples';
import { heapPresetFromInput } from '../../domain/algorithms/heapExamples';
import { huffmanPresetFromInput } from '../../domain/algorithms/huffmanExamples';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * Stage 7A learning workspace, re-laid out by UI-02 and refined by
 * CORE-REFINE-01.
 *
 * Information architecture:
 *  1. primary: sidebar → [animation + playback | learning rail]; the compact
 *     run bar sits below both columns and never hides its actions;
 *  2. the rail owns current operation, variables and the optional call stack;
 *  3. the advanced panel owns only read-only C / C++ / Python reference code;
 *  4. a concept entry replaces the animation workspace with a static lesson,
 *     never an empty player.
 *
 * The workspace never owns execution state. It reads the one LabController
 * (`currentEvent`, trace, playback) and only keeps presentational state.
 */
export function LabView({
  lab,
  lessons,
}: {
  lab: LabController;
  lessons: LessonCatalog;
}) {
  const { t, pick, lang } = useI18n();
  const entry = lab.catalog[lab.currentAlgo];
  const [conceptId, setConceptId] = useState<string | null>(null);
  const concept = conceptById(conceptId);
  const currentEvent = lab.events[lab.playback.index];
  const actualTreeTraversal =
    currentEvent?.structure?.kind === 'binary-tree' ? currentEvent.structure.traversal : null;
  const showTreePicker = lab.currentAlgo === 'inorder' && lab.codeLang === 'python';
  const showBstPicker = lab.currentAlgo === 'bst' && lab.codeLang === 'python';
  const showAvlPicker = lab.currentAlgo === 'avl' && lab.codeLang === 'python';
  const showHeapPicker = lab.currentAlgo === 'heap' && lab.codeLang === 'python';
  const showHuffmanPicker = lab.currentAlgo === 'huffman' && lab.codeLang === 'python';
  const showSequentialListPicker = lab.currentAlgo === 'seqlist' && lab.codeLang === 'python';
  const actualBstPreset =
    currentEvent?.structure?.kind === 'bst'
      ? bstPresetFromInput({ preset: currentEvent.structure.preset })
      : null;
  const actualAvlPreset =
    currentEvent?.structure?.kind === 'avl'
      ? avlPresetFromInput({ preset: currentEvent.structure.preset })
      : null;
  const actualHeapPreset =
    currentEvent?.structure?.kind === 'max-heap'
      ? heapPresetFromInput({ preset: currentEvent.structure.preset })
      : null;
  const actualHuffmanPreset =
    currentEvent?.structure?.kind === 'huffman'
      ? huffmanPresetFromInput({ preset: currentEvent.structure.preset })
      : null;
  const actualSequentialListPreset =
    currentEvent?.structure?.kind === 'sequential-list'
      ? sequentialListPresetFromInput({ preset: currentEvent.structure.preset })
      : null;
  const showGraphStepPeek =
    lab.currentAlgo === 'bfs' || lab.currentAlgo === 'dfs' || lab.currentAlgo === 'dijkstra' ||
    lab.currentAlgo === 'floyd-warshall' ||
    lab.currentAlgo === 'bellman-ford' ||
    lab.currentAlgo === 'prim' ||
    lab.currentAlgo === 'kruskal' ||
    lab.currentAlgo === 'topological' ||
    lab.currentAlgo === 'critical-path' ||
    lab.currentAlgo === 'components';

  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const workbenchRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  useSvgTextFloor(shellRef);
  // UX-03: the directory is the authored textbook tree composed with the live
  // registry. It remains presentation-only; `currentAlgo` owns algorithm state.
  const textbookNav = useMemo(() => buildTextbookNavigation(lab.catalog), [lab.catalog]);
  const textbookPath = useMemo(
    () => findTextbookPath(textbookNav, lab.currentAlgo),
    [textbookNav, lab.currentAlgo],
  );
  const conceptPath = useMemo(
    () => (concept ? findConceptPath(textbookNav, concept.id) : null),
    [concept, textbookNav],
  );
  // UI-01/UX-03: the directory's folded/collapsed layout is a persisted
  // presentation preference. It never owns the algorithm, the trace or the playhead.
  const sidebar = useSidebarPreferences(conceptPath ?? textbookPath);
  // UX-01: folding is a per-algorithm presentation preference. It is derived
  // from the current algorithm and never stored in the LabController.
  const algorithmGuide = useAlgorithmGuidePreferences(lab.currentAlgo);

  // UX-04: "start animation" only folds the guide and brings the existing
  // workbench/playback into view. It never seeks, reruns Python or owns a
  // second playhead.
  const startFromGuide = () => {
    if (!algorithmGuide.isOpen) return;
    algorithmGuide.toggle();
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        workbenchRef.current?.scrollIntoView({
          block: 'nearest',
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
        document
          .querySelector<HTMLButtonElement>('[data-testid="play-btn"]')
          ?.focus({ preventScroll: true });
      });
    });
  };

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

  const lesson = lessons.byAlgorithm(lab.currentAlgo);
  const algorithmGuideContent = buildAlgorithmGuide(lab.currentAlgo, lesson, entry);
  const activeStepIndex = lesson ? stepIndexForEvent(lesson, currentEvent) : -1;
  const activeStep = activeStepIndex >= 0 ? lesson?.steps[activeStepIndex] : undefined;
  const conceptTitle = concept ? concept.title[lang === 'zh' ? 0 : 1] : null;

  const selectAlgorithm = (id: string) => {
    setConceptId(null);
    lab.selectAlgo(id);
  };

  return (
    <div
      ref={shellRef}
      className={`lab-shell${sidebar.collapsed ? ' nav-collapsed' : ''}${algorithmGuide.isOpen && !concept ? ' guide-open' : ''}${lab.currentAlgo === 'scc' ? ' scc-focus' : ''}${concept ? ' concept-focus' : ''}`}
      data-testid="learn-view"
    >
      <div className="lab-sidebar-wrap">
        <AlgorithmSidebar
          catalog={lab.catalog}
          currentAlgo={concept ? '' : lab.currentAlgo}
          currentConceptId={concept?.id ?? null}
          onSelect={selectAlgorithm}
          onSelectConcept={setConceptId}
          collapsed={sidebar.collapsed}
          onToggleCollapsed={sidebar.toggleCollapsed}
          isChapterOpen={sidebar.isChapterOpen}
          onToggleChapter={sidebar.toggleChapter}
          onOpenChapter={sidebar.openChapter}
          isTopicOpen={sidebar.isTopicOpen}
          onToggleTopic={sidebar.toggleTopic}
          onExpandAll={sidebar.expandAll}
          onCollapseAll={sidebar.collapseAll}
        />
      </div>

      <div className="lab-main">
        <header className="lab-head panel">
          <div className="lab-head-main">
            <div>
              <div className="eyebrow">{concept ? t('conceptKicker') : t('interactive')}</div>
              <h1 data-testid="lab-title">
                {conceptTitle ?? (entry ? pick(entry.name) : lab.currentAlgo)}
              </h1>
            </div>
            {concept ? (
              <span className="tag tag-active">{t('conceptKicker')}</span>
            ) : (
              <span className="tag green">{(entry?.group ?? '').toUpperCase()}</span>
            )}
            {!concept ? (
              <span className={`tag ${currentEvent ? 'tag-active' : ''}`} data-testid="lab-frame-status">
                {currentEvent
                  ? t('workspaceFrame').replace('{current}', String(currentEvent.step + 1)).replace('{total}', String(lab.events.length))
                  : t('workspaceNotRun')}
              </span>
            ) : null}
          </div>
          <div className="lab-head-actions">
            {concept ? (
              <button
                type="button"
                className="btn small"
                data-testid="concept-back"
                onClick={() => setConceptId(null)}
              >
                {t('conceptBackToLab')}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="guide-toggle"
                  data-testid="guide-toggle"
                  aria-expanded={algorithmGuide.isOpen}
                  aria-controls={algorithmGuide.isOpen ? ALGORITHM_GUIDE_ID : undefined}
                  aria-label={algorithmGuide.isOpen ? t('guideCollapse') : t('guideExpand')}
                  onClick={algorithmGuide.toggle}
                >
                  <span className="guide-toggle-mark" aria-hidden="true">▤</span>
                  {algorithmGuide.isOpen ? t('guideCollapse') : t('guideExpand')}
                  <span className="guide-toggle-chevron" aria-hidden="true">
                    {algorithmGuide.isOpen ? '▲' : '▼'}
                  </span>
                </button>
                <select
                  className="mobile-algo-select"
                  aria-label={t('algorithmDirectory')}
                  value={lab.currentAlgo}
                  data-testid="mobile-algo-select"
                  onChange={(change) => selectAlgorithm(change.target.value)}
                >
                  {textbookNav.map((chapter) => (
                    <optgroup
                      key={chapter.id}
                      label={`${chapter.extension ? '' : `${chapter.number}. `}${textbookTitle(chapter.title, lang)}`}
                    >
                      {chapter.topics.flatMap((topic) =>
                        topic.algorithms.map((algorithm) => {
                          const item = lab.catalog[algorithm.id];
                          return item ? (
                            <option key={algorithm.id} value={algorithm.id}>
                              {pick(item.name)}
                            </option>
                          ) : null;
                        }),
                      )}
                    </optgroup>
                  ))}
                </select>
              </>
            )}
          </div>
        </header>

        {concept ? (
          <ConceptView concept={concept} />
        ) : (
          <>

        {algorithmGuide.isOpen ? (
          <AlgorithmGuide
            key={algorithmGuideContent.algorithmId}
            guide={algorithmGuideContent}
            algorithmName={entry ? pick(entry.name) : lab.currentAlgo}
            onStart={startFromGuide}
          />
        ) : null}

        <div
          className="lab-primary ui02-workbench"
          data-testid="lab-workbench"
          ref={workbenchRef}
          tabIndex={-1}
        >
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
              {lab.traceStale && <span className="tag orange" data-testid="sync-stale">{t('traceStaleShort')}</span>}
            </div>
            {showTreePicker ? (
              <div className="stage-control-strip" data-testid="tree-control-strip">
                <TreeTraversalPicker
                  inputJson={lab.inputJson}
                  actualTraversal={actualTreeTraversal}
                  onSelect={lab.selectTreeMode}
                />
              </div>
            ) : null}
            {showHuffmanPicker ? (
              <div className="stage-control-strip" data-testid="huffman-control-strip">
                <HuffmanPicker
                  inputJson={lab.inputJson}
                  actualPreset={actualHuffmanPreset}
                  onSelect={lab.selectHuffmanPreset}
                />
              </div>
            ) : null}
            <VisualStage event={currentEvent} />
            {showBstPicker ? (
              <BstPicker
                inputJson={lab.inputJson}
                actualPreset={actualBstPreset}
                onSelect={lab.selectBstPreset}
              />
            ) : null}
            {showAvlPicker ? (
              <AvlPicker
                inputJson={lab.inputJson}
                actualPreset={actualAvlPreset}
                onSelect={lab.selectAvlPreset}
              />
            ) : null}
            {showHeapPicker ? (
              <HeapPicker
                inputJson={lab.inputJson}
                actualPreset={actualHeapPreset}
                onSelect={lab.selectHeapPreset}
              />
            ) : null}
            {showSequentialListPicker ? (
              <SequentialListPicker
                inputJson={lab.inputJson}
                actualPreset={actualSequentialListPreset}
                onSelect={lab.selectSequentialListPreset}
              />
            ) : null}
            <Timeline events={lab.events} playback={lab.playback} />
          </section>

          <aside className="lab-explanation" data-testid="explanation-rail" aria-label={t('lessonPanel')}>
            <LearningRail
              algorithmId={lab.currentAlgo}
              lesson={lesson}
              events={lab.events}
              index={lab.playback.index}
              currentEvent={currentEvent}
              selectedFrameId={selectedFrameId}
              onSelectFrame={setSelectedFrameId}
              onSeek={lab.playback.seek}
            />
          </aside>
        </div>

        <CodeDock lab={lab} />

        <WorkspaceTabs>
          <ReferenceCodePanel
            algorithmId={lab.currentAlgo}
            algorithmName={entry ? pick(entry.name) : lab.currentAlgo}
          />
        </WorkspaceTabs>
          </>
        )}
      </div>
    </div>
  );
}
