import type { AlgorithmGuideContent } from '../../domain/guides/types';
import { localizeComplexity } from '../../domain/lessons/localizeMessage';
import { useI18n } from '../../i18n/I18nProvider';
import { GuideDiagram } from './GuideDiagram';

export const ALGORITHM_GUIDE_ID = 'algorithm-guide';

/**
 * UX-SIMPLIFY-02 review sheet.
 *
 * Four blocks only: core idea, complete flow, complexity/conditions, common
 * mistakes and memory. Detailed course prose remains in the lesson data for
 * compatibility and tests, but the default learning page never repeats it.
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
  const sourceLabel =
    guide.source === 'curated'
      ? t('guideSourceCurated')
      : guide.source === 'lesson' && guide.lessonTitle
        ? t('guideSourceLesson').replace('{title}', guide.lessonTitle[lang])
        : guide.source === 'catalog'
          ? t('guideSourceCatalog')
          : t('guideSourceNone');
  const conditions = guide.conditions[lang].slice(0, 4);
  const pitfalls = guide.pitfalls[lang].slice(0, 3);

  return (
    <article
      className="panel algorithm-guide review-guide guide-v2"
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
          <header className="review-head">
            <div className="review-heading">
              <div className="guide-kicker" data-testid="guide-title">
                <span className="guide-kicker-dot" aria-hidden="true" />
                {t('guideReviewKicker')} · {algorithmName}
              </div>
              <div className="guide-overline">{t('guideCoreTitle')}</div>
              {guide.coreHeadline ? (
                <h2 className="guide-core-headline" data-testid="guide-core-headline">
                  {localized(guide.coreHeadline)}
                </h2>
              ) : null}
              <p className="guide-core-text" data-testid="guide-core">
                {localized(guide.coreIdea) || localized(guide.problem) || t('guideEmptyBody')}
              </p>
              <div className="review-source" data-testid="guide-source">
                {sourceLabel}
              </div>
            </div>
            {guide.diagram ? (
              <div className="review-diagram" aria-hidden="true">
                <GuideDiagram kind={guide.diagram} />
              </div>
            ) : null}
          </header>

          <div className="review-grid">
            <section className="review-flow" aria-labelledby="guide-flow-title">
              <div className="review-section-head">
                <h3 id="guide-flow-title">{t('guideFlowTitle')}</h3>
                <span className="review-count" data-testid="guide-flow-count">
                  {t('guideFlowCount').replace('{count}', String(guide.stages.length))}
                </span>
              </div>
              <ol className="review-flow-list" data-testid="guide-stage-list">
                {guide.stages.map((stage, index) => (
                  <li key={`${guide.algorithmId}-flow-${index}`}>
                    <span className="review-flow-index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h4>{stage.title[lang]}</h4>
                      <p>{stage.summary[lang]}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="review-side">
              <section className="review-facts" aria-labelledby="guide-facts-title">
                <div className="review-section-head">
                  <h3 id="guide-facts-title">{t('guideComplexityTitle')}</h3>
                </div>
                <dl className="review-complexity">
                  <div>
                    <dt>{t('guideTime')}</dt>
                    <dd>{guide.complexity ? localizeComplexity(guide.complexity.time, lang) : '—'}</dd>
                  </div>
                  <div>
                    <dt>{t('guideSpace')}</dt>
                    <dd>{guide.complexity ? localizeComplexity(guide.complexity.space, lang) : '—'}</dd>
                  </div>
                </dl>
                {conditions.length > 0 ? (
                  <ul className="review-list review-conditions">
                    {conditions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>

              <section className="review-pitfalls" aria-labelledby="guide-pitfalls-title">
                <div className="review-section-head">
                  <h3 id="guide-pitfalls-title">{t('guideMistakesTitle')}</h3>
                </div>
                {pitfalls.length > 0 ? (
                  <ul className="review-list">
                    {pitfalls.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="review-muted">{t('guideNoMistakes')}</p>
                )}
                {guide.memoryHook ? (
                  <p className="review-memory" data-testid="guide-memory">
                    <b>{t('guideMemoryTitle')}</b>
                    <span>{localized(guide.memoryHook)}</span>
                  </p>
                ) : null}
              </section>
            </div>
          </div>

          <div className="review-actions">
            <button
              type="button"
              className="btn primary guide-start"
              data-testid="guide-start"
              onClick={onStart}
            >
              {t('guideStartAnimation')}
              <span aria-hidden="true">→</span>
            </button>
          </div>
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
      <header className="guide-hero guide-catalog-hero">
        <div className="guide-hero-head">
          <div className="guide-kicker" data-testid="guide-title">
            <span className="guide-kicker-dot" aria-hidden="true" />
            {t('guideOneLine')} · {algorithmName}
          </div>
          <h2 className="guide-problem" data-testid="guide-problem">
            {guide.problem ? guide.problem[lang] : t('guideEmptyBody')}
          </h2>
        </div>
        <div className="guide-catalog-strip">
          <div className="guide-complexity-chips">
            <span>
              <b>{t('guideTime')}</b>
              {guide.complexity ? localizeComplexity(guide.complexity.time, lang) : '—'}
            </span>
            <span>
              <b>{t('guideSpace')}</b>
              {guide.complexity ? localizeComplexity(guide.complexity.space, lang) : '—'}
            </span>
          </div>
          <div className="guide-flow-fallback" data-testid="guide-no-steps">
            {t('guideNoSteps')}
          </div>
          <div className="guide-catalog-note" data-testid="guide-catalog-note">
            {t('guideCatalogBody')}
          </div>
        </div>
      </header>
      <div className="guide-bottom">
        <div className="guide-actions">
          <button
            type="button"
            className="btn primary guide-start"
            data-testid="guide-start"
            onClick={onStart}
          >
            {t('guideStartAnimation')}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </>
  );
}
