import { useId } from 'react';
import type { AlgorithmGuideContent } from '../../domain/guides/types';
import { useI18n } from '../../i18n/I18nProvider';
import { GuideDiagram } from './GuideDiagram';

export const ALGORITHM_GUIDE_ID = 'algorithm-guide';

/**
 * UX-01 top-of-lab algorithm guide.
 *
 * The guide is pure presentation: it receives already-derived content and a
 * collapse callback, and owns no trace, playback or algorithm state. The
 * expanded panel deliberately has no controls that could seek or rerun a
 * trace; its only action is to fold itself back into the title bar.
 */
export function AlgorithmGuide({
  guide,
  algorithmName,
  onCollapse,
}: {
  guide: AlgorithmGuideContent;
  algorithmName: string;
  onCollapse: () => void;
}) {
  const { t, lang } = useI18n();
  const titleId = useId();
  const hasSteps = guide.steps.length > 0;
  const hasPrerequisites = guide.prerequisites[lang].length > 0;
  const hasConditions = guide.conditions[lang].length > 0;
  const hasPitfalls = guide.pitfalls[lang].length > 0;
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

  return (
    <article
      className="panel algorithm-guide"
      id={ALGORITHM_GUIDE_ID}
      aria-labelledby={titleId}
      data-testid="algorithm-guide"
      data-source={guide.source}
      data-algorithm-id={guide.algorithmId}
    >
      <header className="guide-head">
        <div className="guide-head-copy">
          <div className="eyebrow">{t('guideEyebrow')}</div>
          <h2 id={titleId} data-testid="guide-title">
            {algorithmName} · {t('guideTitleSuffix')}
          </h2>
          <p>{t('guideIntro')}</p>
        </div>
        <button type="button" className="guide-collapse" onClick={onCollapse} data-testid="guide-collapse">
          <span aria-hidden="true">↑</span>
          {t('guideCollapse')}
        </button>
      </header>

      {guide.source === 'none' ? (
        <div className="guide-empty" data-testid="guide-empty">
          {t('guideEmptyBody')}
        </div>
      ) : (
        <>
          <div className="guide-top-grid">
            <div className="guide-foundation">
              <section className="guide-card guide-problem">
                <SectionLabel index="01" title={t('guideProblemTitle')} />
                <p data-testid="guide-problem">{localized(guide.problem)}</p>
              </section>

              {guide.coreIdea ? (
                <section className="guide-card guide-core">
                  <SectionLabel index="02" title={t('guideCoreTitle')} />
                  <p data-testid="guide-core">{localized(guide.coreIdea)}</p>
                  <GuideDiagram kind={guide.diagram} />
                </section>
              ) : null}
            </div>

            <section className={`guide-card guide-steps${hasSteps ? '' : ' is-empty'}`}>
              <SectionLabel index="03" title={t('guideStepsTitle')} />
              {hasSteps ? (
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
              ) : (
                <div className="guide-safe-empty" data-testid="guide-no-steps">
                  {t('guideNoSteps')}
                </div>
              )}
            </section>
          </div>

          {guide.source !== 'catalog' ? (
            <div className="guide-support-grid">
              <section className="guide-card guide-prerequisites">
                <SectionLabel index="04" title={t('guidePrerequisitesTitle')} />
                {hasPrerequisites ? (
                  <ul className="guide-bullets">
                    {guide.prerequisites[lang].map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : (
                  <p className="guide-muted">{t('guideNoPrerequisites')}</p>
                )}
              </section>

              <section className="guide-card guide-complexity">
                <SectionLabel index="05" title={t('guideComplexityTitle')} />
                <div className="guide-complexity-chips">
                  <span><b>{t('guideTime')}</b>{guide.complexity?.time ?? '—'}</span>
                  <span><b>{t('guideSpace')}</b>{guide.complexity?.space ?? '—'}</span>
                </div>
                {guide.complexity?.note[lang] ? (
                  <p className="guide-muted">{guide.complexity.note[lang]}</p>
                ) : null}
                {hasConditions ? (
                  <div className="guide-conditions">
                    <h4>{t('guideConditionsTitle')}</h4>
                    <ul className="guide-bullets">
                      {guide.conditions[lang].map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                ) : null}
              </section>

              <section className="guide-card guide-mistakes">
                <SectionLabel index="06" title={t('guideMistakesTitle')} />
                {hasPitfalls ? (
                  <ul className="guide-bullets">
                    {guide.pitfalls[lang].map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : (
                  <p className="guide-muted">{t('guideNoMistakes')}</p>
                )}
                {guide.memoryHook ? (
                  <div className="guide-memory" data-testid="guide-memory">
                    <span>{t('guideMemoryTitle')}</span>
                    <p>{localized(guide.memoryHook)}</p>
                  </div>
                ) : null}
              </section>
            </div>
          ) : (
            <div className="guide-catalog-note" data-testid="guide-catalog-note">
              {t('guideCatalogBody')}
            </div>
          )}

          <footer className="guide-foot">
            <span data-testid="guide-source">{sourceLabel}</span>
            <span>{t('guideFootHint')}</span>
          </footer>
        </>
      )}
    </article>
  );
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="guide-section-label">
      <span aria-hidden="true">{index}</span>
      <h3>{title}</h3>
    </div>
  );
}
