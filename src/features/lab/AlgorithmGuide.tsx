import { useId, useState } from 'react';
import type { AlgorithmGuideContent } from '../../domain/guides/types';
import { useI18n } from '../../i18n/I18nProvider';
import { GuideDiagram } from './GuideDiagram';

export const ALGORITHM_GUIDE_ID = 'algorithm-guide';

/**
 * UX-01B top-of-lab guide.
 *
 * Three reading layers only: one-line framing + core idea, a compact 3–5 stage
 * flow, and a memory line. Everything else lives behind an explicit disclosure
 * so the real animation below can still reach the first screen. The panel owns
 * no trace, playhead or algorithm state; its only actions fold the guide or
 * disclose reference material.
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
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
  const hasStages = guide.stages.length > 0;
  const hasSteps = guide.steps.length > 0;
  const hasPrerequisites = guide.prerequisites[lang].length > 0;
  const hasConditions = guide.conditions[lang].length > 0;
  const hasPitfalls = guide.pitfalls[lang].length > 0;
  const hasDetails =
    hasSteps || hasPrerequisites || hasConditions || hasPitfalls || !!guide.complexity;

  return (
    <article
      className={`panel algorithm-guide guide-v2${detailsOpen ? ' is-details-open' : ''}`}
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
        <CatalogGuide
          guide={guide}
          algorithmName={algorithmName}
          onStart={onStart}
        />
      ) : (
        <>
          <header className="guide-hero">
            <div className="guide-hero-head">
              <div className="guide-kicker" data-testid="guide-title">
                <span className="guide-kicker-dot" aria-hidden="true" />
                {t('guideOneLine')} · {algorithmName}
              </div>
              <h2 className="guide-problem" data-testid="guide-problem">
                {localized(guide.problem)}
              </h2>
            </div>

            <div className="guide-hero-grid">
              <section className="guide-core" aria-label={t('guideCoreTitle')}>
                <div className="guide-overline">{t('guideCoreTitle')}</div>
                {guide.coreHeadline ? (
                  <h3 className="guide-core-headline" data-testid="guide-core-headline">
                    {localized(guide.coreHeadline)}
                  </h3>
                ) : null}
                {guide.coreIdea ? (
                  <p className="guide-core-text" data-testid="guide-core">
                    {localized(guide.coreIdea)}
                  </p>
                ) : null}
              </section>
              {guide.diagram ? (
                <div className="guide-intuition">
                  <GuideDiagram kind={guide.diagram} />
                </div>
              ) : null}
            </div>
          </header>

          <section className="guide-flow" aria-labelledby={`${detailsId}-flow`}>
            <div className="guide-flow-head">
              <h3 id={`${detailsId}-flow`} className="guide-section-title">
                {t('guideFlowTitle')}
              </h3>
              <span className="guide-flow-count" data-testid="guide-flow-count">
                {t('guideStageCount').replace('{count}', String(guide.stages.length))}
              </span>
            </div>
            {hasStages ? (
              <ol className="guide-stage-list" data-testid="guide-stage-list">
                {guide.stages.map((stage, index) => (
                  <li key={`${guide.algorithmId}-stage-${index}`} className="guide-stage">
                    <span className="guide-stage-index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="guide-stage-copy">
                      <h4>{stage.title[lang]}</h4>
                      <p>{stage.summary[lang]}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="guide-flow-fallback" data-testid="guide-flow-fallback">
                {t('guideFlowFallback').replace('{count}', String(guide.steps.length))}
              </div>
            )}
          </section>

          <div className="guide-bottom">
            {guide.memoryHook ? (
              <div className="guide-memory" data-testid="guide-memory">
                <span className="guide-memory-label">{t('guideMemoryTitle')}</span>
                <p>{localized(guide.memoryHook)}</p>
              </div>
            ) : null}
            <div className="guide-actions">
              {hasDetails ? (
                <button
                  type="button"
                  className="btn ghost guide-details-toggle"
                  data-testid="guide-details-toggle"
                  aria-expanded={detailsOpen}
                  aria-controls={detailsOpen ? detailsId : undefined}
                  onClick={() => setDetailsOpen((open) => !open)}
                >
                  {detailsOpen ? t('guideDetailsClose') : t('guideDetailsOpen')}
                  <span aria-hidden="true">{detailsOpen ? '▴' : '▾'}</span>
                </button>
              ) : null}
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

          {detailsOpen && hasDetails ? (
            <section
              className="guide-details"
              id={detailsId}
              data-testid="guide-details"
              aria-label={t('guideDetailsTitle')}
            >
              {hasSteps ? (
                <div className="guide-detail-section">
                  <div className="guide-detail-head">
                    <span className="guide-detail-number">A</span>
                    <h3>{t('guideStepsTitle')}</h3>
                  </div>
                  <ol className="guide-step-list">
                    {guide.steps.map((step, index) => (
                      <li key={`${guide.algorithmId}-guide-step-${index}`}>
                        <span className="guide-step-index" aria-hidden="true">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h4>{step.title[lang]}</h4>
                          <p>{step.body[lang]}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <div className="guide-detail-grid">
                {hasPrerequisites ? (
                  <section className="guide-detail-section">
                    <div className="guide-detail-head">
                      <span className="guide-detail-number">B</span>
                      <h3>{t('guidePrerequisitesTitle')}</h3>
                    </div>
                    <ul className="guide-bullets">
                      {guide.prerequisites[lang].map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {guide.complexity ? (
                  <section className="guide-detail-section">
                    <div className="guide-detail-head">
                      <span className="guide-detail-number">C</span>
                      <h3>{t('guideComplexityTitle')}</h3>
                    </div>
                    <div className="guide-complexity-chips">
                      <span>
                        <b>{t('guideTime')}</b>
                        {guide.complexity.time}
                      </span>
                      <span>
                        <b>{t('guideSpace')}</b>
                        {guide.complexity.space}
                      </span>
                    </div>
                    {guide.complexity.note[lang] ? (
                      <p className="guide-muted">{guide.complexity.note[lang]}</p>
                    ) : null}
                    {hasConditions ? (
                      <div className="guide-conditions">
                        <h4>{t('guideConditionsTitle')}</h4>
                        <ul className="guide-bullets">
                          {guide.conditions[lang].map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {hasPitfalls ? (
                  <section className="guide-detail-section">
                    <div className="guide-detail-head">
                      <span className="guide-detail-number">D</span>
                      <h3>{t('guideMistakesTitle')}</h3>
                    </div>
                    <ul className="guide-bullets">
                      {guide.pitfalls[lang].map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>

              <footer className="guide-foot">
                <span data-testid="guide-source">{sourceLabel}</span>
                <span>{t('guideFootHint')}</span>
              </footer>
            </section>
          ) : null}
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
              {guide.complexity?.time ?? '—'}
            </span>
            <span>
              <b>{t('guideSpace')}</b>
              {guide.complexity?.space ?? '—'}
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
