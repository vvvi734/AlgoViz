import { useId, useState } from 'react';
import { countStepFrames, findFrameForStep, lessonStepIdOf, stepIndexForEvent } from '../../domain/lessons/sync';
import type { Lesson } from '../../domain/lessons/types';
import type { TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * Stage-3B teaching panel.
 *
 * It renders course DATA (never hard-coded copy) and reads the SAME
 * `currentEvent` the timeline, Monaco, variables and call stack read. The
 * highlight is `event.lessonStepId` only — an event that recorded no step shows
 * an explicit "unlinked" state instead of a guessed one.
 */
export function LessonPanel({
  lesson,
  events,
  index,
  currentEvent,
  onSeek,
  originName,
  hasExample,
  onUseExample,
}: {
  lesson: Lesson | undefined;
  events: readonly TraceEvent[];
  index: number;
  currentEvent: TraceEvent | undefined;
  onSeek: (index: number) => void;
  /** Stage 4: set when the course was installed from a `.algopack`. */
  originName?: string;
  hasExample?: boolean;
  onUseExample?: () => void;
}) {
  const { t, lang } = useI18n();
  const [openOverview, setOpenOverview] = useState(true);
  const detailsId = useId();

  if (!lesson) {
    return (
      <section className="panel pad" data-testid="lesson-panel">
        <div className="sectionhead"><h2>{t('lessonPanel')}</h2><span>▤</span></div>
        <div className="empty smalltext" data-testid="lesson-no-lesson">{t('lessonNotAvailable')}</div>
      </section>
    );
  }

  const activeIndex = stepIndexForEvent(lesson, currentEvent);
  const activeStep = activeIndex >= 0 ? lesson.steps[activeIndex] : null;
  const eventStepId = lessonStepIdOf(currentEvent);
  // A recorded id the course does not define: report it, never crash, never
  // pretend it belongs somewhere.
  const unknownStepId = eventStepId && !activeStep ? eventStepId : null;

  return (
    <section className="panel pad lessonpanel" data-testid="lesson-panel">
      <div className="sectionhead">
        <div>
          <div className="eyebrow">{t('lessonEyebrow')}</div>
          <h2 data-testid="lesson-title">{lesson.title[lang]}</h2>
        </div>
        <span className="tag" data-testid="lesson-version">v{lesson.contentVersion}</span>
      </div>

      <p className="lesson-oneliner" data-testid="lesson-oneliner">{lesson.oneLiner[lang]}</p>

      {originName && (
        <p className="muted smalltext lesson-origin" data-testid="lesson-origin">
          {t('packOrigin').replace('{pack}', originName)}
        </p>
      )}

      {hasExample && onUseExample && (
        <div className="lesson-example">
          <button
            type="button"
            className="btn small"
            data-testid="lesson-use-example"
            onClick={onUseExample}
          >
            {t('lessonUseExample')}
          </button>
        </div>
      )}

      <div className="lesson-meta">
        <div className="stat"><b>{lesson.complexity.time}</b><span>{t('timeCost')}</span></div>
        <div className="stat"><b>{lesson.complexity.space}</b><span>{t('spaceCost')}</span></div>
      </div>

      <button
        type="button"
        className="lesson-toggle"
        aria-expanded={openOverview}
        aria-controls={detailsId}
        onClick={() => setOpenOverview((open) => !open)}
      >
        {openOverview ? '▾' : '▸'} {t('lessonOverview')}
      </button>
      <div id={detailsId} hidden={!openOverview} className="lesson-overview" data-testid="lesson-overview">
        <p>{lesson.overview[lang]}</p>
        <p><b>{t('lessonIntuition')}</b> {lesson.intuition[lang]}</p>
        <p className="muted smalltext">{lesson.complexity.note[lang]}</p>
        <div className="lesson-chiprow">
          <span className="muted smalltext">{t('lessonPrerequisites')}</span>
          {lesson.prerequisites[lang].map((item) => (
            <span key={item} className="chip">{item}</span>
          ))}
        </div>
      </div>

      <h3 className="lesson-subhead">{t('lessonSteps')}</h3>
      <p className="muted smalltext lesson-hint">{t('lessonStepsHint')}</p>
      <ol className="lessonsteps" data-testid="lesson-steps">
        {lesson.steps.map((step, stepIndex) => {
          const frames = countStepFrames(events, step.stepId);
          const target = frames > 0 ? findFrameForStep(events, step.stepId, index) : null;
          const active = activeStep?.stepId === step.stepId;
          return (
            <li key={step.stepId}>
              <button
                type="button"
                className={`lessonstep${active ? ' active' : ''}`}
                data-testid={`lesson-step-${step.stepId}`}
                data-active={active ? 'true' : 'false'}
                disabled={target == null}
                aria-current={active ? 'step' : undefined}
                title={target == null ? t('lessonStepNoFrames') : undefined}
                onClick={() => {
                  if (target != null) onSeek(target);
                }}
              >
                <span className="lessonstep-num">{stepIndex + 1}</span>
                <span className="lessonstep-body">
                  <span className="lessonstep-title">{step.title[lang]}</span>
                  <span className="lessonstep-text">{step.explanation[lang]}</span>
                  {step.tip && <span className="lessonstep-tip">💡 {step.tip[lang]}</span>}
                </span>
                <span className="lessonstep-count" aria-label={t('lessonStepFrames')}>{frames}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <h3 className="lesson-subhead">{t('lessonCurrent')}</h3>
      <div className="lesson-current" data-testid="lesson-current">
        {activeStep ? (
          <div className="lesson-stage" data-testid="lesson-active-step" data-step-id={activeStep.stepId}>
            <span className="tag green">{t('lessonCurrentStage')}</span> {activeStep.title[lang]}
          </div>
        ) : (
          <div className="muted smalltext" data-testid="lesson-unlinked">
            {unknownStepId
              ? t('lessonUnknownStep').replace('{id}', unknownStepId)
              : t('lessonNoStepLink')}
          </div>
        )}
        <div className="lesson-message smalltext" data-testid="lesson-message">
          <b>{t('stepExplanation')}:</b> {currentEvent?.message || t('noMessage')}
        </div>
        {currentEvent?.variables?.length ? (
          <div className="lesson-vars smalltext" data-testid="lesson-vars">
            {currentEvent.variables.map((variable) => (
              <span key={variable.name} className="chip">
                {variable.name} = {formatValue(variable.value)}
              </span>
            ))}
          </div>
        ) : (
          <div className="muted smalltext">{t('noVariables')}</div>
        )}
      </div>

      <details className="lesson-mistakes" data-testid="lesson-mistakes">
        <summary>{t('lessonMistakes')}</summary>
        <ul>
          {lesson.commonMistakes[lang].map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>
    </section>
  );
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    const text = JSON.stringify(value);
    return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  } catch {
    return String(value);
  }
}
