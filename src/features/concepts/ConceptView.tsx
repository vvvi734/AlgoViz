import { useI18n } from '../../i18n/I18nProvider';
import type { Bilingual, ConceptPage } from '../../domain/concepts/types';
import { ConceptDiagram } from './ConceptDiagram';
import { SearchConceptDiagram } from './SearchConceptDiagrams';
import { QueueConceptDiagram } from './QueueConceptDiagrams';
import { TreeConceptDiagram } from './TreeConceptDiagrams';
import { ExternalSortConceptDiagram } from './ExternalSortConceptDiagrams';
import '../../styles/concepts.css';

/**
 * Static concept lesson. It deliberately contains no VisualStage, Timeline,
 * run button or code editor: the knowledge itself is the page.
 *
 * The visual order is an editorial reading order, not a dashboard:
 * title + goal → core diagram → key concepts → comparison → takeaway.
 */
export function ConceptView({ concept }: { concept: ConceptPage }) {
  const { t, lang } = useI18n();
  const tr = (value: Bilingual) => value[lang === 'zh' ? 0 : 1];
  const comparison = concept.comparison;

  return (
    <article
      className="concept-page"
      data-testid="concept-page"
      data-concept-id={concept.id}
    >
      <header className="concept-hero">
        <span className="concept-kicker">{tr(concept.chapter)}</span>
        <h1 data-testid="concept-title">{tr(concept.title)}</h1>
        <div className="concept-goal" data-testid="concept-goal">
          <span className="concept-goal-label">{t('conceptGoal')}</span>
          <p className="concept-lede">{tr(concept.summary)}</p>
        </div>
      </header>

      <section className="concept-visual" aria-labelledby="concept-diagram-title">
        <div className="concept-section-head">
          <h2 id="concept-diagram-title">{t('conceptDiagram')}</h2>
          <span className="concept-section-note">
            {t('conceptDiagramNote')}
            <span className="concept-swipe-hint"> · {t('conceptDiagramSwipe')}</span>
          </span>
        </div>
        <div className="concept-diagram-frame" data-testid="concept-diagram">
          {concept.diagram === 'asl-decision-tree' || concept.diagram === 'block-search' ? (
            <SearchConceptDiagram kind={concept.diagram} lang={lang} />
          ) : concept.diagram === 'external-sort' ||
            concept.diagram === 'external-runs' ||
            concept.diagram === 'external-comparison' ? (
            <ExternalSortConceptDiagram kind={concept.diagram} lang={lang} />
          ) : concept.diagram === 'circular-queue' || concept.diagram === 'stack-queue-storage' ? (
            <QueueConceptDiagram kind={concept.diagram} lang={lang} />
          ) : concept.diagram === 'tree-storage' ||
            concept.diagram === 'forest-conversion' ||
            concept.diagram === 'threaded-binary-tree' ? (
            <TreeConceptDiagram kind={concept.diagram} lang={lang} />
          ) : (
            <ConceptDiagram kind={concept.diagram} lang={lang} />
          )}
        </div>
      </section>

      <section className="concept-concepts" aria-labelledby="concept-concepts-title" data-testid="concept-key-concepts">
        <div className="concept-section-head concept-major-head">
          <h2 id="concept-concepts-title">{t('conceptKeyConcepts')}</h2>
        </div>
        <h3 className="concept-definitions-title">{t('conceptDefinition')}</h3>
        <dl className="concept-term-list" data-testid="concept-definition">
          {concept.definitions.map((item) => (
            <div className="concept-term" key={tr(item.term)}>
              <dt>{tr(item.term)}</dt>
              <dd>{tr(item.text)}</dd>
            </div>
          ))}
        </dl>

        <div className="concept-sections" data-testid="concept-section-list">
          {concept.sections.map((section, index) => (
            <section className="concept-section" key={tr(section.title)}>
              <div className="concept-section-title">
                <span className="concept-section-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{tr(section.title)}</h3>
              </div>
              <p>{tr(section.body)}</p>
              {section.points?.length ? (
                <ul>
                  {section.points.map((point) => (
                    <li key={tr(point)}>{tr(point)}</li>
                  ))}
                </ul>
              ) : null}
              {section.formula ? (
                <div className="concept-formula" aria-label={t('conceptFormula')}>
                  <code>{lang === 'en' && section.formulaEn ? section.formulaEn : section.formula}</code>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </section>

      {comparison ? (
        <section className="concept-comparison" aria-labelledby="concept-comparison-title" data-testid="concept-comparison">
          <div className="concept-section-head concept-major-head">
            <h2 id="concept-comparison-title">{t('conceptComparison')}</h2>
            <span className="concept-section-note concept-table-swipe-hint">{t('conceptTableSwipe')}</span>
          </div>
          <div className="concept-table-wrap">
            <table>
              <caption>{tr(comparison.title)}</caption>
              <thead>
                <tr>
                  {comparison.columns.map((column, index) => (
                    <th key={`column-${index}`} scope="col">{tr(column)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    {row.map((cell, index) =>
                      index === 0 ? (
                        <th key={`${rowIndex}-head`} scope="row">{tr(cell)}</th>
                      ) : (
                        <td key={`${rowIndex}-${index}`}>{tr(cell)}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <footer className="concept-takeaway" data-testid="concept-takeaway">
        <span className="concept-takeaway-label">{t('conceptTakeaway')}</span>
        <p>{tr(concept.takeaway)}</p>
      </footer>
    </article>
  );
}
