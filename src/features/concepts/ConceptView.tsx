import { useI18n } from '../../i18n/I18nProvider';
import type { Bilingual, ConceptPage } from '../../domain/concepts/types';
import { ConceptDiagram } from './ConceptDiagram';
import '../../styles/concepts.css';

/**
 * Static concept lesson. It deliberately contains no VisualStage, Timeline,
 * run button or code editor: the knowledge itself is the page.
 */
export function ConceptView({ concept }: { concept: ConceptPage }) {
  const { t, lang } = useI18n();
  const tr = (value: Bilingual) => value[lang === 'zh' ? 0 : 1];

  return (
    <article
      className="concept-page panel"
      data-testid="concept-page"
      data-concept-id={concept.id}
    >
      <header className="concept-hero">
        <span className="concept-kicker">{tr(concept.chapter)}</span>
        <h1 data-testid="concept-title">{tr(concept.title)}</h1>
        <p className="concept-lede">{tr(concept.summary)}</p>
        <span className="tag">{t('conceptKicker')}</span>
      </header>

      <section className="concept-visual" aria-labelledby="concept-diagram-title">
        <div className="concept-section-head">
          <h2 id="concept-diagram-title">{t('conceptDiagram')}</h2>
          <span className="concept-section-note">{t('conceptDiagramNote')}</span>
        </div>
        <div className="concept-diagram-frame" data-testid="concept-diagram">
          <ConceptDiagram kind={concept.diagram} lang={lang} />
        </div>
      </section>

      <section className="concept-definitions" aria-labelledby="concept-definitions-title">
        <div className="concept-section-head">
          <h2 id="concept-definitions-title">{t('conceptDefinition')}</h2>
        </div>
        <dl className="concept-term-list" data-testid="concept-definition">
          {concept.definitions.map((item) => (
            <div className="concept-term" key={tr(item.term)}>
              <dt>{tr(item.term)}</dt>
              <dd>{tr(item.text)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="concept-grid">
        {concept.sections.map((section) => (
          <section className="concept-section" key={tr(section.title)}>
            <h2>{tr(section.title)}</h2>
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
                <code>{section.formula}</code>
              </div>
            ) : null}
          </section>
        ))}
      </div>

      {concept.comparison ? (
        <section className="concept-comparison" aria-labelledby="concept-comparison-title" data-testid="concept-comparison">
          <div className="concept-section-head">
            <h2 id="concept-comparison-title">{t('conceptComparison')}</h2>
          </div>
          <div className="concept-table-wrap">
            <table>
              <caption>{tr(concept.comparison.title)}</caption>
              <thead>
                <tr>
                  {concept.comparison.columns.map((column) => (
                    <th key={tr(column)} scope="col">{tr(column)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {concept.comparison.rows.map((row) => (
                  <tr key={row.map(tr).join('|')}>
                    {row.map((cell, index) =>
                      index === 0 ? (
                        <th key={tr(cell)} scope="row">{tr(cell)}</th>
                      ) : (
                        <td key={tr(cell)}>{tr(cell)}</td>
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
