import { useMemo } from 'react';
import type { AlgorithmCatalog } from '../../domain/algorithms/types';
import {
  buildTextbookNavigation,
  findTextbookPath,
  textbookTitle,
  TEXTBOOK_REFERENCE,
  type TextbookChapterView,
  type TextbookTopicView,
} from '../../domain/algorithms/textbook';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * UX-03 — textbook directory.
 *
 * Three levels, authored in `domain/algorithms/textbook.ts`:
 *   chapter (nine 《大话数据结构》 chapters + extension chapter)
 *   topic   (knowledge point)
 *   algorithm (existing registry entry)
 *
 * Chapters and topics are independent disclosures; each can be open or closed
 * without disturbing another. The directory owns no execution state: selecting
 * an algorithm just calls the existing lab selector, and playback/trace stay
 * untouched. Current-path expansion is a preference concern, handled by
 * `useSidebarPreferences`, not by this component.
 */
export function AlgorithmSidebar({
  catalog,
  currentAlgo,
  onSelect,
  collapsed,
  onToggleCollapsed,
  isChapterOpen,
  onToggleChapter,
  onOpenChapter,
  isTopicOpen,
  onToggleTopic,
}: {
  catalog: AlgorithmCatalog;
  currentAlgo: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isChapterOpen: (chapterId: string) => boolean;
  onToggleChapter: (chapterId: string) => void;
  onOpenChapter: (chapterId: string) => void;
  isTopicOpen: (topicId: string) => boolean;
  onToggleTopic: (topicId: string) => void;
}) {
  const { lang, pick, t } = useI18n();
  const chapters = useMemo(() => buildTextbookNavigation(catalog), [catalog]);
  const currentPath = useMemo(() => findTextbookPath(chapters, currentAlgo), [chapters, currentAlgo]);
  const currentEntry = catalog[currentAlgo];
  const currentTopicId = currentPath?.topicId ?? null;
  const directoryLabel = t('textbookDirectory');

  const chapterNumber = (chapter: TextbookChapterView): string =>
    chapter.extension ? '✦' : String(chapter.number).padStart(2, '0');

  const chapterAria = (chapter: TextbookChapterView): string =>
    chapter.extension
      ? textbookTitle(chapter.title, lang)
      : `${t('textbookChapterNumber').replace('{number}', String(chapter.number))} · ${textbookTitle(chapter.title, lang)}`;

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
                onOpenChapter(chapter.id);
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

      <div
        className="textbook-source"
        title={`${TEXTBOOK_REFERENCE.author}《${TEXTBOOK_REFERENCE.title.zh}》${TEXTBOOK_REFERENCE.edition.zh}`}
      >
        {t('textbookReference')}
      </div>

      <nav className="sidebar-groups textbook-nav" aria-label={directoryLabel}>
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
                ) : (
                  <span className="textbook-pending" aria-hidden="true">{t('textbookPending')}</span>
                )}
                <span className="textbook-chapter-chevron" aria-hidden="true">›</span>
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
                      open={isTopicOpen(topic.id)}
                      holdsCurrent={topic.id === currentTopicId}
                      onToggle={() => onToggleTopic(topic.id)}
                      onSelect={onSelect}
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

function TextbookTopicRow({
  chapterId,
  topic,
  catalog,
  currentAlgo,
  open,
  holdsCurrent,
  onToggle,
  onSelect,
}: {
  chapterId: string;
  topic: TextbookTopicView;
  catalog: AlgorithmCatalog;
  currentAlgo: string;
  open: boolean;
  holdsCurrent: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}) {
  const { lang, pick, t } = useI18n();
  const title = textbookTitle(topic.title, lang);

  if (topic.planned && topic.algorithms.length === 0) {
    return (
      <div
        className="textbook-topic is-planned"
        data-topic={topic.id}
        data-testid={`topic-${topic.id}`}
        aria-disabled="true"
      >
        <span className="textbook-topic-rail" aria-hidden="true" />
        <span className="textbook-topic-name">{title}</span>
        <span className="textbook-pending">{t('textbookPending')}</span>
      </div>
    );
  }

  return (
    <section className="textbook-topic" data-topic={topic.id}>
      <button
        type="button"
        className="textbook-topic-head"
        aria-expanded={open}
        aria-controls={`topic-${topic.id}-body`}
        aria-label={title}
        data-testid={`topic-${topic.id}`}
        data-has-current={holdsCurrent ? 'true' : 'false'}
        onClick={onToggle}
      >
        <span className="textbook-topic-chevron" aria-hidden="true">›</span>
        <span className="textbook-topic-name">{title}</span>
        {topic.extension && (
          <span className="textbook-extension" aria-hidden="true">{t('textbookExtension')}</span>
        )}
        {holdsCurrent && <span className="textbook-current-dot" aria-hidden="true" />}
        <span className="textbook-count" aria-hidden="true">
          {topic.algorithms.length}
        </span>
      </button>

      <div
        className="textbook-topic-body"
        id={`topic-${topic.id}-body`}
        data-open={open ? 'true' : 'false'}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="textbook-topic-body-inner">
          {topic.algorithms.map((algorithm) => {
            const entry = catalog[algorithm.id];
            if (!entry) return null;
            const active = algorithm.id === currentAlgo;
            return (
              <button
                key={algorithm.id}
                type="button"
                className={`alg-item ${active ? 'active' : ''}`}
                onClick={() => onSelect(algorithm.id)}
                data-testid={`algo-${algorithm.id}`}
                data-chapter={chapterId}
                data-topic={topic.id}
                aria-current={active ? 'true' : undefined}
              >
                <span className="alg-icon">{entry.icon}</span>
                <span className="alg-name">{pick(entry.name)}</span>
                {algorithm.extension && (
                  <span className="textbook-extension" aria-hidden="true">{t('textbookExtension')}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
