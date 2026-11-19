import type { AlgorithmGuideContent } from '../../domain/guides/types';
import { localizeComplexity } from '../../domain/lessons/localizeMessage';
import { useI18n } from '../../i18n/I18nProvider';
import { GuideDiagram } from './GuideDiagram';

export const ALGORITHM_GUIDE_ID = 'algorithm-guide';

/**
 * Algorithm review sheet.
 *
 * Five blocks, one screen: intro, formal definition + plain-language reading,
 * complexity/conditions, a horizontal abstract flow, and 1–3 mistakes plus a
 * memory hook. The Trace's frame captions and per-step examples are deliberately
 * absent: the player below owns frame-level explanation.
 */
export function AlgorithmGuide({
  guide,
  algorithmName,
  onStart,
}: {
  guide: AlgorithmGuideContent;
  algorithmName: string;
  onStart: () => void;
}) {
  const { t, lang } = useI18n();
  const localized = (value: { zh: string; en: string } | null | undefined) =>
    value ? value[lang] : '';
  const conditions = guide.conditions[lang];
  const pitfalls = guide.pitfalls[lang].slice(0, 3);
  const flowTitle = guide.flowKind === 'operations' ? t('guideOperationsTitle') : t('guideFlowTitle');

  return (
    <article
      className="panel algorithm-guide guide-sheet"
      id={ALGORITHM_GUIDE_ID}
      data-testid="algorithm-guide"
      data-source={guide.source}
      data-algorithm-id={guide.algorithmId}
    >
      {guide.source === 'none' ? (
        <div className="guide-empty" data-testid="guide-empty">
          <div className="guide-kicker" data-testid="guide-title">
            {algorithmName} · {t('guideTitleSuffix')}
          </div>
          <p>{t('guideEmptyBody')}</p>
        </div>
      ) : guide.source === 'catalog' ? (
        <CatalogGuide guide={guide} algorithmName={algorithmName} onStart={onStart} />
      ) : (
        <>
          <header className="guide-sheet-head">
            <div className="guide-sheet-heading">
              <div className="guide-kicker" data-testid="guide-title">
                <span className="guide-kicker-dot" aria-hidden="true" />
                {t('guideReviewKicker')} · {algorithmName}
              </div>
              <div className="guide-section-label">{t('guideIntroTitle')}</div>
              <p className="guide-intro" data-testid="guide-intro">
                {localized(guide.intro) || t('guideEmptyBody')}
              </p>
            </div>
            {guide.diagram ? (
              <div className="guide-diagram" aria-hidden="true">
                <GuideDiagram kind={guide.diagram} />
              </div>
            ) : null}
          </header>

          <div className="guide-definition-grid" data-testid="guide-definition-block">
            <section className="guide-definition" aria-labelledby="guide-definition-title">
              <h3 id="guide-definition-title">{t('guideDefinitionTitle')}</h3>
              <p data-testid="guide-definition">{localized(guide.definition)}</p>
            </section>
            <section className="guide-definition guide-plain" aria-labelledby="guide-plain-title">
              <h3 id="guide-plain-title">{t('guidePlainTitle')}</h3>
              <p data-testid="guide-plain">{localized(guide.plain)}</p>
            </section>
          </div>

          <div className="guide-facts" data-testid="guide-facts">
            <div className="guide-section-head">
              <h3>{t('guideComplexityTitle')}</h3>
            </div>
            <div className="guide-meta-row">
              <div className="guide-complexity-chips" data-testid="guide-complexity">
                <span>
                  <b>{t('guideTime')}</b>
                  {guide.complexity ? localizeComplexity(guide.complexity.time, lang) : '—'}
                </span>
                <span>
                  <b>{t('guideSpace')}</b>
                  {guide.complexity ? localizeComplexity(guide.complexity.space, lang) : '—'}
                </span>
              </div>
              {conditions.length > 0 ? (
                <div className="guide-conditions" data-testid="guide-conditions">
                  <b>{t('guideConditionsTitle')}</b>
                  <ul>
                    {conditions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <section className="guide-flow-section" aria-labelledby="guide-flow-title">
            <div className="guide-section-head">
              <h3 id="guide-flow-title" data-testid="guide-flow-title">
                {flowTitle}
              </h3>
              {guide.flowKind === 'operations' ? (
                <span className="guide-flow-kind" data-testid="guide-flow-kind">
                  {t('guideOperationsHint')}
                </span>
              ) : null}
            </div>
            {guide.stages.length > 0 ? (
              <ol className="guide-flow-row" data-testid="guide-stage-list">
                {guide.stages.map((stage, index) => (
                  <li className="guide-flow-step" key={`${guide.algorithmId}-flow-${index}`}>
                    <span className="guide-flow-index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="guide-flow-main">
                      <span className="guide-flow-title">{stage.title[lang]}</span>
                      {stage.summary ? (
                        <span className="guide-flow-note">{stage.summary[lang]}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="guide-flow-pending" data-testid="guide-flow-pending">
                {t('guideFlowPending')}
              </p>
            )}
          </section>

          <section className="guide-pitfalls-section" aria-labelledby="guide-pitfalls-title">
            <h3 id="guide-pitfalls-title">{t('guideMistakesTitle')}</h3>
            {pitfalls.length > 0 ? (
              <ul className="guide-pitfall-list" data-testid="guide-pitfalls">
                {pitfalls.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="guide-muted">{t('guideNoMistakes')}</p>
            )}
            {guide.memoryHook ? (
              <p className="guide-memory" data-testid="guide-memory">
                <b>{t('guideMemoryTitle')}</b>
                <span>{localized(guide.memoryHook)}</span>
              </p>
            ) : null}
          </section>

          <footer className="guide-actions">
            <button
              type="button"
              className="btn primary guide-start"
              data-testid="guide-start"
              onClick={onStart}
            >
              {t('guideStartAnimation')}
              <span aria-hidden="true">→</span>
            </button>
          </footer>
        </>
      )}
    </article>
  );
}

function CatalogGuide({
  guide,
  algorithmName,
  onStart,
}: {
  guide: AlgorithmGuideContent;
  algorithmName: string;
  onStart: () => void;
}) {
  const { t, lang } = useI18n();
  return (
    <>
      <header className="guide-catalog-hero">
        <div className="guide-kicker" data-testid="guide-title">
          <span className="guide-kicker-dot" aria-hidden="true" />
          {t('guideOneLine')} · {algorithmName}
        </div>
        <h2 className="guide-problem" data-testid="guide-problem">
          {guide.definition ? guide.definition[lang] : t('guideEmptyBody')}
        </h2>
        <div className="guide-meta-row">
          <div className="guide-complexity-chips" data-testid="guide-complexity">
            <span>
              <b>{t('guideTime')}</b>
              {guide.complexity ? localizeComplexity(guide.complexity.time, lang) : '—'}
            </span>
            <span>
              <b>{t('guideSpace')}</b>
              {guide.complexity ? localizeComplexity(guide.complexity.space, lang) : '—'}
            </span>
          </div>
          <div className="guide-flow-pending" data-testid="guide-no-steps">
            {t('guideNoSteps')}
          </div>
        </div>
        <p className="guide-catalog-note" data-testid="guide-catalog-note">
          {t('guideCatalogBody')}
        </p>
      </header>
      <footer className="guide-actions">
        <button
          type="button"
          className="btn primary guide-start"
          data-testid="guide-start"
          onClick={onStart}
        >
          {t('guideStartAnimation')}
          <span aria-hidden="true">→</span>
        </button>
      </footer>
    </>
  );
}
