import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AlgorithmSidebar } from './AlgorithmSidebar';
import { VisualStage } from './VisualStage';
import { TreeTraversalPicker } from './TreeTraversalPicker';
import { BstPicker } from './BstPicker';
import { AvlPicker } from './AvlPicker';
import { BTreePicker } from './BTreePicker';
import { SearchPresetPickers } from './SearchPickers';
import { blockSearchPresetFromInput } from '../../domain/algorithms/blockSearchExamples';
import { bplusTreePresetFromInput } from '../../domain/algorithms/bplusExamples';
import { keyTreePresetFromInput } from '../../domain/algorithms/keyTreeExamples';
import { HeapPicker } from './HeapPicker';
import { HuffmanPicker } from './HuffmanPicker';
import { SequentialListPicker } from './SequentialListPicker';
import { sequentialListPresetFromInput } from '../../domain/algorithms/sequentialListExamples';
import { Timeline } from './Timeline';
import { CodeDock } from './CodeDock';
import { LearningRail } from './LearningRail';
import { ReferenceCodePanel } from './ReferenceCodePanel';
import { useSvgTextFloor } from './useSvgTextFloor';
import { usePlaybackKeyboard } from './usePlaybackKeyboard';
import { useFullscreenView } from './useFullscreenView';
import { FullscreenWorkspace } from './FullscreenWorkspace';
import { AlgorithmGuide, ALGORITHM_GUIDE_ID } from './AlgorithmGuide';
import { useAlgorithmGuidePreferences } from './useAlgorithmGuidePreferences';
import { buildAlgorithmGuide } from '../../domain/guides/buildGuide';
import { WorkspaceTabs } from './WorkspaceTabs';
import { useSidebarPreferences } from './useSidebarPreferences';
import { resetScrollToTop } from '../../app/viewport';
import {
  buildTextbookNavigation,
  findConceptPath,
  findTextbookPath,
  textbookTitle,
} from '../../domain/algorithms/textbook';
import { ConceptView } from '../concepts/ConceptView';
import { CONCEPT_PAGES, conceptById } from '../../domain/concepts/catalog';
import type { LabController } from './useLabController';
import type { LessonCatalog } from '../../domain/lessons/catalog';
import { stepIndexForEvent } from '../../domain/lessons/sync';
import { bstPresetFromInput } from '../../domain/algorithms/bstExamples';
import { avlPresetFromInput } from '../../domain/algorithms/avlExamples';
import { btreePresetFromInput } from '../../domain/algorithms/btreeExamples';
import { heapPresetFromInput } from '../../domain/algorithms/heapExamples';
import { huffmanPresetFromInput } from '../../domain/algorithms/huffmanExamples';
import { useI18n } from '../../i18n/I18nProvider';
import { algorithmNameZh, algorithmShortNameZh } from '../../i18n/terminology';
import { groupLabel } from '../../domain/algorithms/examples';
import type { ReferenceLanguage } from '../../domain/reference-code/registry';

/**
 * Stage 7A learning workspace, re-laid out by UI-02 and refined by
 * CORE-REFINE-01.
 *
 * Information architecture:
 *  1. primary: sidebar → [animation + playback | learning rail]; the compact
 *     run bar sits below both columns and never hides its actions;
 *  2. the rail owns current operation, variables and the optional call stack;
 *  3. the reference-code panel owns only read-only C / C++ / Python code;
 *  4. a concept entry replaces the animation workspace with a static lesson,
 *     never an empty player.
 *
 * The workspace never owns execution state. It reads the one LabController
 * (`currentEvent`, trace, playback) and only keeps presentational state.
 */
export function LabView({
  lab,
  lessons,
  initialConceptId = null,
}: {
  lab: LabController;
  lessons: LessonCatalog;
  /** Concept shown on first paint; `null` keeps the legacy algorithm workspace. */
  initialConceptId?: string | null;
}) {
  const { t, pick, lang } = useI18n();
  const entry = lab.catalog[lab.currentAlgo];
  const currentAlgorithmName = entry
    ? algorithmNameZh(lab.currentAlgo, pick(entry.name), lang)
    : lab.currentAlgo;
  const currentAlgorithmShortName = entry
    ? algorithmShortNameZh(lab.currentAlgo, pick(entry.name), lang)
    : lab.currentAlgo;
  const [conceptId, setConceptId] = useState<string | null>(initialConceptId);
  const concept = conceptById(conceptId);
  // conceptById returns undefined on algorithm routes, so truthiness is the
  // real "no player on this page" test; only a resolved concept lesson disables it.
  usePlaybackKeyboard(lab.playback, !concept);
  const fullscreen = useFullscreenView();
  const fullscreenButtonRef = useRef<HTMLButtonElement | null>(null);
  const currentEvent = lab.events[lab.playback.index];
  const actualTreeTraversal =
    currentEvent?.structure?.kind === 'binary-tree' ? currentEvent.structure.traversal : null;
  const showTreePicker = lab.currentAlgo === 'inorder' && lab.codeLang === 'python';
  const showBstPicker = lab.currentAlgo === 'bst' && lab.codeLang === 'python';
  const showAvlPicker = lab.currentAlgo === 'avl' && lab.codeLang === 'python';
  const showBTreePicker = lab.currentAlgo === 'btree' && lab.codeLang === 'python';
  const showBlockSearchPicker = lab.currentAlgo === 'block-search' && lab.codeLang === 'python';
  const showBplusPicker = lab.currentAlgo === 'bplus-tree' && lab.codeLang === 'python';
  const showKeyTreePicker = lab.currentAlgo === 'key-tree' && lab.codeLang === 'python';
  const activeSearchPicker = showBlockSearchPicker
    ? 'block'
    : showBplusPicker
      ? 'bplus'
      : showKeyTreePicker
        ? 'key'
        : null;
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
  const actualBTreePreset =
    currentEvent?.structure?.kind === 'btree'
      ? btreePresetFromInput({ preset: currentEvent.structure.preset })
      : null;
  const actualBlockSearchPreset =
    currentEvent?.structure?.kind === 'block-search'
      ? blockSearchPresetFromInput({ preset: currentEvent.structure.preset })
      : null;
  const actualBplusPreset =
    currentEvent?.structure?.kind === 'bplus-tree'
      ? bplusTreePresetFromInput({ preset: currentEvent.structure.preset })
      : null;
  const actualKeyTreePreset =
    currentEvent?.structure?.kind === 'key-tree'
      ? keyTreePresetFromInput({ preset: currentEvent.structure.preset })
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
  // UI-01/UX-03: a reader entering or reloading the textbook sees the directory
  // panel open, but only the twelve chapter headings. Persisted chapter/topic
  // expansion is ignored for that fresh session until the learner navigates.
  const sidebar = useSidebarPreferences(conceptPath ?? textbookPath, {
    initialCollapsed: initialConceptId !== null ? false : undefined,
    initialFirstLevelOnly: initialConceptId !== null,
  });
  // UX-01: folding is a per-algorithm presentation preference. It is derived
  // from the current algorithm and never stored in the LabController.
  const algorithmGuide = useAlgorithmGuidePreferences(lab.currentAlgo);
  const guideToggleRef = useRef<HTMLButtonElement | null>(null);
  const guideReturnFocusRef = useRef(false);
  // Reference-code language lives above the collapsible panel: closing it
  // unmounts Monaco, but reopening on the same course must keep the choice.
  const [referenceLanguage, setReferenceLanguage] = useState<ReferenceLanguage>('c');
  // A course is a fresh reading session. Keeping this key out of the playback
  // state means language/theme changes never rewind a running trace, while an
  // actual algorithm/concept switch always starts at frame 0 and at the top.
  const navigationKey = concept ? `concept:${concept.id}` : `algorithm:${lab.currentAlgo}`;
  const previousNavigationKey = useRef(navigationKey);
  const restartPlayback = lab.playback.restart;
  useEffect(() => {
    if (previousNavigationKey.current === navigationKey) return;
    previousNavigationKey.current = navigationKey;
    setSelectedFrameId(null);
    restartPlayback();
    resetScrollToTop();
  }, [navigationKey, restartPlayback]);

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

  // UX-COLLAPSE-01: the shortcut inside a long guide folds it and returns the
  // reader to the existing header control. The layout effect runs before paint
  // so the page does not first clamp to the shrunken document end.
  const collapseGuideFromPanel = () => {
    if (!algorithmGuide.isOpen) return;
    guideReturnFocusRef.current = true;
    algorithmGuide.toggle();
  };

  useLayoutEffect(() => {
    if (!guideReturnFocusRef.current) return;
    guideReturnFocusRef.current = false;
    const toggle = guideToggleRef.current;
    if (!toggle) return;
    if (typeof toggle.scrollIntoView === 'function') {
      toggle.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
    toggle.focus({ preventScroll: true });
  }, [algorithmGuide.isOpen]);

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
          onOpenChapterTree={sidebar.openChapterTree}
          isTopicOpen={sidebar.isTopicOpen}
          onToggleTopic={sidebar.toggleTopic}
          onExpandAll={sidebar.expandAll}
          onCollapseAll={sidebar.collapseAll}
        />
      </div>

      <div className="lab-main">
        <header className={`lab-head panel${concept ? ' concept-head' : ''}`}>
          <div className="lab-head-main">
            <div>
              <div className="eyebrow">{concept ? t('conceptKicker') : t('interactive')}</div>
              {concept ? null : <h1 data-testid="lab-title">{currentAlgorithmName}</h1>}
            </div>
            {concept ? null : (
              <span className="tag green">
                {entry?.group
                  ? lang === 'zh'
                    ? groupLabel(entry.group, lang)
                    : entry.group.toUpperCase()
                  : ''}
              </span>
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
            {!concept ? (
              <button
                ref={guideToggleRef}
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
            ) : null}
            <select
              className="mobile-algo-select"
              aria-label={t('algorithmDirectory')}
              value={concept ? `concept:${concept.id}` : lab.currentAlgo}
              data-testid="mobile-algo-select"
              onChange={(change) => {
                const value = change.target.value;
                if (value.startsWith('concept:')) {
                  setConceptId(value.slice('concept:'.length));
                  return;
                }
                selectAlgorithm(value);
              }}
            >
              {textbookNav.map((chapter) => (
                <optgroup
                  key={chapter.id}
                  label={`${chapter.extension ? '' : `${chapter.number}. `}${textbookTitle(chapter.title, lang)}`}
                >
                  {chapter.topics.flatMap((topic) =>
                    [
                      ...topic.algorithms,
                      ...topic.children.flatMap((child) => child.algorithms),
                    ].map((algorithm) => {
                      const item = lab.catalog[algorithm.id];
                      return item ? (
                        <option key={algorithm.id} value={algorithm.id}>
                          {algorithmShortNameZh(algorithm.id, pick(item.name), lang)}
                        </option>
                      ) : null;
                    }),
                  )}
                </optgroup>
              ))}
              <optgroup label={t('conceptKicker')}>
                {CONCEPT_PAGES.map((page) => (
                  <option key={page.id} value={`concept:${page.id}`}>
                    {page.title[lang === 'zh' ? 0 : 1]}
                  </option>
                ))}
              </optgroup>
            </select>
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
            algorithmName={currentAlgorithmShortName}
            onStart={startFromGuide}
            onCollapse={collapseGuideFromPanel}
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
              <div className="stage-head-actions">
                {showGraphStepPeek && activeStep ? (
                  <div className="stage-step-peek" data-testid="stage-step-peek">
                    <span className="stage-step-peek-label">{t('currentStep')}</span>
                    <span className="stage-step-peek-text">{activeStep.title[lang]}</span>
                  </div>
                ) : null}
                {lab.traceStale && <span className="tag orange" data-testid="sync-stale">{t('traceStaleShort')}</span>}
                <button
                  ref={fullscreenButtonRef}
                  type="button"
                  className="btn small stage-fullscreen-btn"
                  aria-label={t('fullscreenView')}
                  aria-haspopup="dialog"
                  title={t('fullscreenView')}
                  data-testid="fullscreen-open-btn"
                  disabled={!currentEvent || lab.events.length === 0}
                  onClick={fullscreen.openView}
                >
                  <span className="stage-fullscreen-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
                      <path
                        d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="stage-fullscreen-label">{t('fullscreenView')}</span>
                </button>
              </div>
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
            <VisualStage
              event={currentEvent}
              events={lab.events}
              index={lab.playback.index}
              algorithmId={lab.currentAlgo}
            />
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
            {showBTreePicker ? (
              <BTreePicker
                inputJson={lab.inputJson}
                actualPreset={actualBTreePreset}
                onSelect={lab.selectBTreePreset}
              />
            ) : null}
            {activeSearchPicker ? (
              <SearchPresetPickers
                activePicker={activeSearchPicker}
                inputJson={lab.inputJson}
                blockActual={showBlockSearchPicker ? actualBlockSearchPreset : null}
                bplusActual={showBplusPicker ? actualBplusPreset : null}
                keyActual={showKeyTreePicker ? actualKeyTreePreset : null}
                onSelectBlock={lab.selectBlockSearchPreset}
                onSelectBplus={lab.selectBplusPreset}
                onSelectKey={lab.selectKeyTreePreset}
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
            algorithmName={currentAlgorithmShortName}
            language={referenceLanguage}
            onLanguageChange={setReferenceLanguage}
          />
        </WorkspaceTabs>

        {fullscreen.open ? (
          <FullscreenWorkspace
            event={currentEvent}
            events={lab.events}
            playback={lab.playback}
            algorithmId={lab.currentAlgo}
            algorithmName={currentAlgorithmShortName}
            mode={fullscreen.mode}
            onClose={fullscreen.close}
            returnFocusRef={fullscreenButtonRef}
          />
        ) : null}
          </>
        )}
      </div>
    </div>
  );
}
