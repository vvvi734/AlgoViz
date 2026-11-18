import { useId, useState } from 'react';
import { countStepFrames, findFrameForStep, lessonStepIdOf, stepIndexForEvent } from '../../domain/lessons/sync';
import type { Lesson } from '../../domain/lessons/types';
import type { TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * Stage-3B teaching panel, reused by UI-02 as the right-hand explanation rail.
 *
 * It renders course DATA (never hard-coded copy) and reads the SAME
 * `currentEvent` the timeline, Monaco, variables and call stack read. The
 * highlight is `event.lessonStepId` only — an event that recorded no step shows
 * an explicit "unlinked" state instead of a guessed one.
 *
 * The `rail` variant promotes the current step above the course map so a
 * learner never has to hunt for the explanation while the animation plays. It
 * is a presentation variant of this one component, not a second lesson system.
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
  compact = false,
  variant = 'panel',
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
  /** Stage 7A: compress course copy so it never dominates the learning view. */
  compact?: boolean;
  /** UI-02: put the active frame and its explanation at the top of the rail. */
  variant?: 'panel' | 'rail';
}) {
  const { t, lang } = useI18n();
  const isRail = variant === 'rail';
  const [openOverview, setOpenOverview] = useState(!compact && !isRail);
  const detailsId = useId();

  if (!lesson) {
    return (
      <section className="panel pad lessonpanel" data-testid="lesson-panel" data-variant={variant}>
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
  const frameLabel = currentEvent
    ? t('workspaceFrame')
        .replace('{current}', String(currentEvent.step + 1))
        .replace('{total}', String(events.length))
    : t('workspaceNotRun');

  return (
    <section
      className={`panel pad lessonpanel${compact ? ' is-compact' : ''}${isRail ? ' is-rail' : ''}`}
      data-testid="lesson-panel"
      data-variant={variant}
    >
      <div className="sectionhead lesson-head">
        <div>
          <div className="eyebrow">{t('lessonEyebrow')}</div>
          <h2 data-testid="lesson-title">{lesson.title[lang]}</h2>
        </div>
        <div className="lesson-head-tags">
          <span className="tag lesson-frame-tag" data-testid="lesson-frame">{frameLabel}</span>
          <span className="tag" data-testid="lesson-version">v{lesson.contentVersion}</span>
        </div>
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

      {isRail && (
        <section className="lesson-focus" data-testid="current-step">
          <div className="lesson-focus-head">
            <span className="tag tag-active">{t('lessonCurrent')}</span>
            {activeStep && (
              <span className="lesson-focus-stage" data-testid="lesson-focus-stage">
                {activeIndex + 1} / {lesson.steps.length}
              </span>
            )}
          </div>
          {activeStep ? (
            <div className="lesson-stage" data-testid="lesson-active-step" data-step-id={activeStep.stepId}>
              <h3 className="lesson-focus-title" data-testid="current-step-title">
                {activeStep.title[lang]}
              </h3>
              <p className="lesson-focus-explanation" data-testid="lesson-explanation">
                {activeStep.explanation[lang]}
              </p>
              {activeStep.tip && (
                <p className="lesson-focus-tip" data-testid="current-step-tip">💡 {activeStep.tip[lang]}</p>
              )}
            </div>
          ) : (
            <div className="lesson-unlinked" data-testid="lesson-unlinked">
              <h3 className="lesson-focus-title" data-testid="current-step-title">
                {currentEvent ? t('currentStepUnlinked') : t('currentStepEmpty')}
              </h3>
              <div className="muted smalltext">
                {unknownStepId
                  ? t('lessonUnknownStep').replace('{id}', unknownStepId)
                  : t('lessonNoStepLink')}
              </div>
            </div>
          )}
          <div className="lesson-message smalltext" data-testid="lesson-message">
            <b>{t('stepExplanation')}:</b>{' '}
            <span data-testid="current-step-message">{currentEvent?.message || t('noMessage')}</span>
          </div>
          {currentEvent?.variables?.length ? (
            <div className="lesson-vars smalltext" data-testid="lesson-vars" aria-label={t('variablesWatch')}>
              {currentEvent.variables.map((variable) => (
                <span key={variable.name} className="chip">
                  {variable.name} = {formatValue(variable.value)}
                </span>
              ))}
            </div>
          ) : null}
        </section>
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
      <ol className={`lessonsteps${isRail ? ' is-rail-list' : ''}`} data-testid="lesson-steps">
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
                  {!compact && !isRail && <span className="lessonstep-text">{step.explanation[lang]}</span>}
                  {!compact && !isRail && step.tip && <span className="lessonstep-tip">💡 {step.tip[lang]}</span>}
                </span>
                <span className="lessonstep-count" aria-label={t('lessonStepFrames')}>{frames}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {!isRail && (
        <>
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
        </>
      )}

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
