import { useEffect, useMemo, useRef } from 'react';
import type { AlgorithmCatalog } from '../../domain/algorithms/types';
import {
  buildTextbookNavigation,
  findConceptPath,
  findTextbookPath,
  textbookTitle,
  type TextbookChapterView,
  type TextbookSubtopicView,
  type TextbookTopicView,
} from '../../domain/algorithms/textbook';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * UX-03 → UX-03B — textbook directory.
 *
 * Chapter order is authored in `domain/algorithms/textbook.ts`. A topic with one
 * shipped algorithm renders as one direct row (no duplicate topic/algorithm
 * click); a topic with several algorithms keeps its disclosure. Concepts and
 * planned algorithms are static, explicitly non-runnable rows.
 *
 * The directory owns no execution state: selecting an algorithm just calls the
 * existing lab selector, and playback/trace stay untouched. Current-path
 * expansion is a preference concern, handled by `useSidebarPreferences`, not by
 * this component.
 */
export function AlgorithmSidebar({
  catalog,
  currentAlgo,
  currentConceptId,
  onSelect,
  onSelectConcept,
  collapsed,
  onToggleCollapsed,
  isChapterOpen,
  onToggleChapter,
  onOpenChapterTree,
  isTopicOpen,
  onToggleTopic,
  onExpandAll,
  onCollapseAll,
}: {
  catalog: AlgorithmCatalog;
  currentAlgo: string;
  currentConceptId?: string | null;
  onSelect: (id: string) => void;
  onSelectConcept?: (conceptId: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isChapterOpen: (chapterId: string) => boolean;
  onToggleChapter: (chapterId: string) => void;
  onOpenChapterTree: (chapterId: string, topicIds: readonly string[]) => void;
  isTopicOpen: (topicId: string) => boolean;
  onToggleTopic: (topicId: string) => void;
  onExpandAll: (chapterIds: readonly string[], topicIds: readonly string[]) => void;
  onCollapseAll: () => void;
}) {
  const { lang, pick, t } = useI18n();
  const chapters = useMemo(() => buildTextbookNavigation(catalog), [catalog]);
  const currentPath = useMemo(
    () => (currentConceptId
      ? findConceptPath(chapters, currentConceptId)
      : findTextbookPath(chapters, currentAlgo)),
    [chapters, currentAlgo, currentConceptId],
  );
  const currentEntry = catalog[currentAlgo];
  const currentTopicId = currentPath?.topicId ?? null;
  const directoryLabel = t('textbookDirectory');
  const navRef = useRef<HTMLElement | null>(null);
  const pendingRailChapter = useRef<string | null>(null);
  const expandableTopicIds = chapters.flatMap((chapter) =>
    chapter.topics.filter((topic) => topic.kind === 'group').map((topic) => topic.id),
  );

  const chapterNumber = (chapter: TextbookChapterView): string =>
    chapter.extension ? '✦' : String(chapter.number).padStart(2, '0');

  const chapterAria = (chapter: TextbookChapterView): string =>
    chapter.extension
      ? textbookTitle(chapter.title, lang)
      : `${t('textbookChapterNumber').replace('{number}', String(chapter.number))} · ${textbookTitle(chapter.title, lang)}`;

  const anyChapterOpen = chapters.some((chapter) => isChapterOpen(chapter.id));

  // Collapsed rail shortcut: re-expand the directory, then scroll only the
  // directory list to the chosen chapter. The page itself and the selected
  // course stay untouched.
  useEffect(() => {
    if (collapsed || !pendingRailChapter.current) return;
    const nav = navRef.current;
    const target = nav?.querySelector<HTMLElement>(
      `[data-chapter="${pendingRailChapter.current}"]`,
    );
    if (!nav || !target) return;
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Chapter/topic bodies animate from 0fr to 1fr. Measure after that 200 ms
    // transition, otherwise the browser clamps scrollTop to the pre-expansion
    // content height and the chosen chapter stops halfway down the viewport.
    const timer = window.setTimeout(() => {
      pendingRailChapter.current = null;
      const top = Math.max(
        0,
        target.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop,
      );
      if (typeof nav.scrollTo === 'function') {
        nav.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      } else {
        nav.scrollTop = top;
      }
    }, 240);
    return () => window.clearTimeout(timer);
  }, [collapsed, chapters]);

  if (collapsed) {
    return (
      <aside
        className="panel pad sidebar sidebar-rail"
        id="algorithm-directory"
        aria-label={directoryLabel}
        data-testid="sidebar"
        data-collapsed="true"
      >
        <button
          type="button"
          className="rail-expand"
          onClick={onToggleCollapsed}
          aria-expanded={false}
          aria-controls="algorithm-directory"
          aria-label={t('expandDirectory')}
          title={t('expandDirectory')}
          data-testid="sidebar-expand"
        >
          <span aria-hidden="true">»</span>
        </button>

        <div className="rail-chapters" role="group" aria-label={directoryLabel}>
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              className="rail-chapter"
              data-testid={`rail-chapter-${chapter.id}`}
              data-has-current={chapter.id === currentPath?.chapterId ? 'true' : 'false'}
              aria-label={chapterAria(chapter)}
              title={chapterAria(chapter)}
              onClick={() => {
                const topicIds = chapter.topics
                  .filter((topic) => topic.kind === 'group')
                  .map((topic) => topic.id);
                pendingRailChapter.current = chapter.id;
                onOpenChapterTree(chapter.id, topicIds);
                onToggleCollapsed();
              }}
            >
              <span aria-hidden="true">{chapterNumber(chapter)}</span>
            </button>
          ))}
        </div>

        {currentEntry && (
          <button
            type="button"
            className="rail-current"
            onClick={onToggleCollapsed}
            aria-label={pick(currentEntry.name)}
            title={pick(currentEntry.name)}
            data-testid="rail-current"
          >
            <span aria-hidden="true">{currentEntry.icon}</span>
          </button>
        )}
      </aside>
    );
  }

  return (
    <aside
      className="panel pad sidebar textbook-sidebar"
      id="algorithm-directory"
      aria-label={directoryLabel}
      data-testid="sidebar"
      data-collapsed="false"
    >
      <div className="sidebar-head">
        <div className="sidebar-head-row">
          <span className="sidebar-title">{directoryLabel}</span>
          <button
            type="button"
            className="sidebar-collapse"
            onClick={onToggleCollapsed}
            aria-expanded
            aria-controls="algorithm-directory"
            aria-label={t('hideDirectory')}
            title={t('hideDirectory')}
            data-testid="sidebar-collapse"
          >
            <span aria-hidden="true">«</span>
          </button>
        </div>

        <div className="sidebar-actions" role="group" aria-label={t('textbookExpandActions')}>
          <button
            type="button"
            className="sidebar-action sidebar-action-toggle"
            data-testid="sidebar-toggle-all"
            data-expanded={anyChapterOpen ? 'true' : 'false'}
            aria-label={anyChapterOpen ? t('textbookCollapseAll') : t('textbookExpandAll')}
            title={anyChapterOpen ? t('textbookCollapseAll') : t('textbookExpandAll')}
            onClick={() => {
              if (anyChapterOpen) {
                onCollapseAll();
                return;
              }
              onExpandAll(chapters.map((chapter) => chapter.id), expandableTopicIds);
            }}
          >
            <span className="sidebar-action-mark" aria-hidden="true">{anyChapterOpen ? '⌃' : '⌄'}</span>
            {anyChapterOpen ? t('textbookCollapseAll') : t('textbookExpandAll')}
          </button>
        </div>
      </div>

      <nav ref={navRef} className="sidebar-groups textbook-nav" aria-label={directoryLabel}>
        {chapters.map((chapter) => {
          const open = isChapterOpen(chapter.id);
          const holdsCurrent = chapter.id === currentPath?.chapterId;
          return (
            <section className="textbook-chapter" key={chapter.id} data-chapter={chapter.id}>
              <button
                type="button"
                className="textbook-chapter-head"
                aria-expanded={open}
                aria-controls={`chapter-${chapter.id}-body`}
                aria-label={chapterAria(chapter)}
                data-testid={`chapter-${chapter.id}`}
                data-has-current={holdsCurrent ? 'true' : 'false'}
                onClick={() => onToggleChapter(chapter.id)}
              >
                <span className="textbook-chapter-number" aria-hidden="true">
                  {chapterNumber(chapter)}
                </span>
                <span className="textbook-chapter-name">{textbookTitle(chapter.title, lang)}</span>
                {holdsCurrent && <span className="textbook-current-dot" aria-hidden="true" />}
                {chapter.algorithmCount > 0 ? (
                  <span className="textbook-count" aria-hidden="true">{chapter.algorithmCount}</span>
                ) : chapter.topics.some((topic) => topic.category !== 'pending') ? null : (
                  <span className="textbook-pending" aria-hidden="true">{t('textbookPending')}</span>
                )}
              </button>

              <div
                className="textbook-chapter-body"
                id={`chapter-${chapter.id}-body`}
                data-open={open ? 'true' : 'false'}
                aria-hidden={!open}
                inert={!open}
              >
                <div className="textbook-chapter-body-inner">
                  {chapter.topics.map((topic) => (
                    <TextbookTopicRow
                      key={topic.id}
                      chapterId={chapter.id}
                      topic={topic}
                      catalog={catalog}
                      currentAlgo={currentAlgo}
                      currentConceptId={currentConceptId}
                      open={isTopicOpen(topic.id)}
                      holdsCurrent={topic.id === currentTopicId}
                      onToggle={() => onToggleTopic(topic.id)}
                      onSelect={onSelect}
                      onSelectConcept={onSelectConcept}
                    />
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}

function TextbookCategoryMark({ category }: { category: TextbookTopicView['category'] }) {
  return (
    <span className="textbook-category-slot" aria-hidden="true">
      {category === 'theory' || category === 'visual' ? (
        <span className={`textbook-category is-${category}`}>
          {category === 'theory' ? '▤' : '▶'}
        </span>
      ) : null}
    </span>
  );
}

function TextbookTopicRow({
  chapterId,
  topic,
  catalog,
  currentAlgo,
  currentConceptId,
  open,
  holdsCurrent,
  onToggle,
  onSelect,
  onSelectConcept,
}: {
  chapterId: string;
  topic: TextbookTopicView;
  catalog: AlgorithmCatalog;
  currentAlgo: string;
  currentConceptId?: string | null;
  open: boolean;
  holdsCurrent: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onSelectConcept?: (conceptId: string) => void;
}) {
  const { lang, pick, t } = useI18n();
  const title = textbookTitle(topic.title, lang);
  const categoryLong = topic.category === 'theory' ? t('textbookTheoryLong') : t('textbookVisualLong');

  if (topic.kind === 'concept' || topic.kind === 'planned') {
    const conceptId = topic.conceptId;
    const hasLesson = topic.kind === 'concept' && conceptId && onSelectConcept;
    const active = hasLesson && currentConceptId === conceptId;
    const accessibleStatus = hasLesson
      ? categoryLong
      : topic.kind === 'concept'
        ? t('textbookConceptPending')
        : t('textbookPending');

    if (!hasLesson) {
      return (
        <div
          className={`textbook-topic is-${topic.kind}`}
          data-topic={topic.id}
          data-kind={topic.kind}
          data-category={topic.category}
          data-testid={`topic-${topic.id}`}
          aria-disabled="true"
          aria-label={`${title} · ${accessibleStatus}`}
          title={`${title} · ${accessibleStatus}`}
        >
          <TextbookCategoryMark category={topic.category} />
          <span className="textbook-topic-name">{title}</span>
          <span className="textbook-kind-status">{t('textbookPending')}</span>
        </div>
      );
    }

    return (
      <button
        type="button"
        className={`textbook-topic is-concept is-link${active ? ' active' : ''}`}
        data-topic={topic.id}
        data-kind="concept"
        data-category={topic.category}
        data-concept-id={conceptId}
        data-testid={`topic-${topic.id}`}
        aria-current={active ? 'true' : undefined}
        aria-label={`${title} · ${accessibleStatus}`}
        title={`${title} · ${accessibleStatus}`}
        onClick={() => onSelectConcept(conceptId)}
      >
        <TextbookCategoryMark category={topic.category} />
        <span className="textbook-topic-copy">
          <span className="textbook-topic-name">{title}</span>
        </span>
        {active && <span className="textbook-current-dot" aria-hidden="true" />}
      </button>
    );
  }

  if (topic.kind === 'algorithm') {
    const algorithm = topic.algorithms[0];
    const entry = algorithm ? catalog[algorithm.id] : undefined;
    if (!algorithm || !entry) return null;
    const algorithmName = pick(entry.name);
    const active = algorithm.id === currentAlgo;
    return (
      <section
        className="textbook-topic is-direct"
        data-topic={topic.id}
        data-kind="algorithm"
        data-category={topic.category}
        data-direct="true"
        data-has-current={holdsCurrent ? 'true' : 'false'}
        data-testid={`topic-${topic.id}`}
      >
        <button
          type="button"
          className={`alg-item textbook-direct-item${active ? ' active' : ''}`}
          onClick={() => onSelect(algorithm.id)}
          data-testid={`algo-${algorithm.id}`}
          data-chapter={chapterId}
          data-topic={topic.id}
          data-kind="algorithm"
          data-category={topic.category}
          data-direct="true"
          aria-current={active ? 'true' : undefined}
          aria-label={`${title} · ${algorithmName} · ${categoryLong}`}
          title={algorithmName}
        >
          <TextbookCategoryMark category={topic.category} />
          <span className="textbook-direct-copy">
            <span className="textbook-direct-title">{title}</span>
          </span>
          {algorithm.extension && (
            <span className="textbook-extension" aria-hidden="true">{t('textbookExtension')}</span>
          )}
          {active && <span className="textbook-current-dot" aria-hidden="true" />}
        </button>
      </section>
    );
  }

  return (
    <section
      className="textbook-topic is-group"
      data-topic={topic.id}
      data-kind="group"
      data-category={topic.category}
      data-has-current={holdsCurrent ? 'true' : 'false'}
    >
      <button
        type="button"
        className="textbook-topic-head"
        aria-expanded={open}
        aria-controls={`topic-${topic.id}-body`}
        aria-label={`${title} · ${categoryLong}`}
        data-testid={`topic-${topic.id}`}
        data-kind="group"
        data-category={topic.category}
        data-has-current={holdsCurrent ? 'true' : 'false'}
        onClick={onToggle}
      >
        <TextbookCategoryMark category={topic.category} />
        <span className="textbook-topic-copy">
          <span className="textbook-topic-name">{title}</span>
        </span>
        {topic.extension && (
          <span className="textbook-extension" aria-hidden="true">{t('textbookExtension')}</span>
        )}
        {holdsCurrent && <span className="textbook-current-dot" aria-hidden="true" />}
        <span className="textbook-count" aria-hidden="true">
          {topic.children.length || topic.algorithms.length}
        </span>
        {topic.children.length > 0 && (
          <span className="textbook-topic-chevron" aria-hidden="true">›</span>
        )}
      </button>

      <div
        className="textbook-topic-body"
        id={`topic-${topic.id}-body`}
        data-open={open ? 'true' : 'false'}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="textbook-topic-body-inner">
          {topic.children.length > 0
            ? topic.children.map((child) => (
                <TextbookSubtopicRow
                  key={child.id}
                  chapterId={chapterId}
                  parentTopicId={topic.id}
                  subtopic={child}
                  catalog={catalog}
                  currentAlgo={currentAlgo}
                  currentConceptId={currentConceptId}
                  holdsCurrent={child.conceptId === currentConceptId ||
                    child.algorithms.some((algorithm) => algorithm.id === currentAlgo)}
                  onSelect={onSelect}
                  onSelectConcept={onSelectConcept}
                />
              ))
            : topic.algorithms.map((algorithm) => {
                const entry = catalog[algorithm.id];
                if (!entry) return null;
                return (
                  <AlgorithmLeafRow
                    key={algorithm.id}
                    chapterId={chapterId}
                    parentTopicId={topic.id}
                    topicId={algorithm.id}
                    algorithm={algorithm}
                    catalog={catalog}
                    active={algorithm.id === currentAlgo}
                    onSelect={onSelect}
                  />
                );
              })}
        </div>
      </div>
    </section>
  );
}

function TextbookSubtopicRow({
  chapterId,
  parentTopicId,
  subtopic,
  catalog,
  currentAlgo,
  currentConceptId,
  holdsCurrent,
  onSelect,
  onSelectConcept,
}: {
  chapterId: string;
  parentTopicId: string;
  subtopic: TextbookSubtopicView;
  catalog: AlgorithmCatalog;
  currentAlgo: string;
  currentConceptId?: string | null;
  holdsCurrent: boolean;
  onSelect: (id: string) => void;
  onSelectConcept?: (conceptId: string) => void;
}) {
  const { lang, t } = useI18n();
  const title = textbookTitle(subtopic.title, lang);

  if (subtopic.kind === 'concept') {
    const conceptId = subtopic.conceptId;
    const selectConcept = conceptId && onSelectConcept
      ? () => onSelectConcept(conceptId)
      : null;
    const active = Boolean(conceptId && currentConceptId === conceptId);
    if (!selectConcept) {
      return (
        <div
          className="textbook-subtopic is-concept"
          data-topic={subtopic.id}
          data-parent-topic={parentTopicId}
          data-kind="concept"
          data-category="pending"
          data-testid={`topic-${subtopic.id}`}
          aria-disabled="true"
        >
          <TextbookCategoryMark category="pending" />
          <span className="textbook-topic-name">{title}</span>
          <span className="textbook-kind-status">{t('textbookPending')}</span>
        </div>
      );
    }
    return (
      <button
        type="button"
        className={`textbook-subtopic is-concept is-link${active ? ' active' : ''}`}
        data-topic={subtopic.id}
        data-parent-topic={parentTopicId}
        data-kind="concept"
        data-category="theory"
        data-concept-id={conceptId}
        data-testid={`topic-${subtopic.id}`}
        aria-current={active ? 'true' : undefined}
        aria-label={`${title} · ${t('textbookTheoryLong')}`}
        onClick={selectConcept}
      >
        <TextbookCategoryMark category="theory" />
        <span className="textbook-subtopic-name">{title}</span>
        {active && <span className="textbook-current-dot" aria-hidden="true" />}
      </button>
    );
  }

  if (subtopic.kind === 'planned') {
    return (
      <div
        className="textbook-subtopic is-planned"
        data-topic={subtopic.id}
        data-parent-topic={parentTopicId}
        data-kind="planned"
        data-category="pending"
        data-testid={`topic-${subtopic.id}`}
        aria-disabled="true"
      >
        <TextbookCategoryMark category="pending" />
        <span className="textbook-topic-name">{title}</span>
        <span className="textbook-kind-status">{t('textbookPending')}</span>
      </div>
    );
  }

  const algorithm = subtopic.algorithms[0];
  if (!algorithm) return null;
  return (
    <div
      className="textbook-subtopic is-algorithm"
      data-topic={subtopic.id}
      data-parent-topic={parentTopicId}
      data-kind="algorithm"
      data-category="visual"
      data-testid={`topic-${subtopic.id}`}
      data-has-current={holdsCurrent ? 'true' : 'false'}
    >
      <AlgorithmLeafRow
        chapterId={chapterId}
        parentTopicId={parentTopicId}
        topicId={subtopic.id}
        algorithm={algorithm}
        catalog={catalog}
        active={algorithm.id === currentAlgo}
        onSelect={onSelect}
      />
    </div>
  );
}

function AlgorithmLeafRow({
  chapterId,
  parentTopicId,
  topicId,
  algorithm,
  catalog,
  active,
  onSelect,
}: {
  chapterId: string;
  parentTopicId: string;
  topicId: string;
  algorithm: TextbookSubtopicView['algorithms'][number];
  catalog: AlgorithmCatalog;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const { pick, t } = useI18n();
  const entry = catalog[algorithm.id];
  if (!entry) return null;
  return (
    <button
      type="button"
      className={`alg-item textbook-algorithm-item${active ? ' active' : ''}`}
      onClick={() => onSelect(algorithm.id)}
      data-testid={`algo-${algorithm.id}`}
      data-chapter={chapterId}
      data-topic={parentTopicId}
      data-leaf-topic={topicId}
      data-kind="algorithm"
      data-category="visual"
      aria-current={active ? 'true' : undefined}
      aria-label={`${pick(entry.name)} · ${t('textbookVisualLong')}`}
    >
      <TextbookCategoryMark category="visual" />
      <span className="alg-name">{pick(entry.name)}</span>
      {algorithm.extension && (
        <span className="textbook-extension" aria-hidden="true">{t('textbookExtension')}</span>
      )}
    </button>
  );
}
