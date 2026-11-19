import { useId, useState } from 'react';
import { buildFrameInsight, type FrameChange } from '../../domain/lessons/frameInsight';
import { countStepFrames, findFrameForStep, lessonStepIdOf, stepIndexForEvent } from '../../domain/lessons/sync';
import type { Lesson } from '../../domain/lessons/types';
import type { TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * UX-02 compact teaching rail.
 *
 * The default reading order is four things and only four things:
 *   1. what is happening now (stage + frame + operation title);
 *   2. why it happens;
 *   3. what really changed in the recorded trace;
 *   4. one short memory hook, when the course/frame has one.
 *
 * Every old piece of course data (overview, complexity, prerequisites,
 * mistakes, raw message, variables and the full step list) still exists, but it
 * lives behind two explicit disclosures. The step list keeps the original
 * `findFrameForStep` jump behaviour; it is not a second player or a second step
 * counter. `currentEvent.lessonStepId` remains the only sync key.
 */
export function LessonPanel({
  lesson,
  events,
  index,
  currentEvent,
  onSeek,
  compact = false,
  variant = 'panel',
}: {
  lesson: Lesson | undefined;
  events: readonly TraceEvent[];
  index: number;
  currentEvent: TraceEvent | undefined;
  onSeek: (index: number) => void;
  /** Stage 7A: compress course copy so it never dominates the learning view. */
  compact?: boolean;
  /** UI-02: put the active frame and its explanation at the top of the rail. */
  variant?: 'panel' | 'rail';
}) {
  const { t, lang } = useI18n();
  const isRail = variant === 'rail';
  const [openOverview, setOpenOverview] = useState(false);
  const [openSteps, setOpenSteps] = useState(false);
  const detailsId = useId();
  const stepsId = useId();

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
  const unknownStepId = eventStepId && !activeStep ? eventStepId : null;
  const frameLabel = currentEvent
    ? t('workspaceFrame')
        .replace('{current}', String(currentEvent.step + 1))
        .replace('{total}', String(events.length))
    : t('workspaceNotRun');
  const previousEvent = index > 0 ? events[index - 1] : undefined;
  const insight = buildFrameInsight(lesson, currentEvent, previousEvent, lang);
  const stageLabel = activeStep
    ? t('lessonStageOf')
        .replace('{current}', String(activeIndex + 1))
        .replace('{total}', String(lesson.steps.length))
    : null;

  const action = insight?.action || activeStep?.title[lang] || (currentEvent ? t('currentStepUnlinked') : t('currentStepEmpty'));
  const why = insight?.why || (activeStep ? activeStep.explanation[lang] : currentEvent ? t('lessonNoStepLink') : t('lessonRunHint'));
  const changes = insight?.changes ?? [];
  const memory = insight?.memory ?? null;

  return (
    <section
      className={`panel pad lessonpanel lessonpanel-compact${compact ? ' is-compact' : ''}${isRail ? ' is-rail' : ''}`}
      data-testid="lesson-panel"
      data-variant={variant}
    >
      <div className="sectionhead lesson-head lesson-head-compact">
        <div className="lesson-head-main">
          <div className="eyebrow">{t('lessonEyebrow')}</div>
          <h2 data-testid="lesson-title">{lesson.title[lang]}</h2>
        </div>
        <div className="lesson-head-tags">
          <span className="tag" data-testid="lesson-version">v{lesson.contentVersion}</span>
        </div>
      </div>

      <section className="lesson-focus" data-testid="current-step">
        <div className="lesson-focus-head">
          <span className="lesson-focus-kicker">{t('lessonWhatNow')}</span>
          <div className="lesson-focus-context">
            {stageLabel && (
              <span className="lesson-stage-pill" data-testid="lesson-focus-stage">{stageLabel}</span>
            )}
            <span className="tag lesson-frame-tag" data-testid="lesson-frame">{frameLabel}</span>
          </div>
        </div>

        {activeStep ? (
          <div className="lesson-stage" data-testid="lesson-active-step" data-step-id={activeStep.stepId}>
            <h3 className="lesson-focus-title" data-testid="current-step-title">{action}</h3>

            <div className="lesson-focus-block">
              <div className="lesson-block-label">{t('lessonWhy')}</div>
              <p className="lesson-focus-explanation" data-testid="lesson-explanation">{why}</p>
            </div>

            <div className="lesson-focus-block">
              <div className="lesson-block-label">{t('lessonChanges')}</div>
              <ChangeList changes={changes} />
            </div>

            {memory && (
              <div className="lesson-memory" data-testid="current-step-tip">
                <span className="lesson-memory-label">{t('lessonMemory')}</span>
                <span>{memory}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="lesson-unlinked" data-testid="lesson-unlinked">
            <h3 className="lesson-focus-title" data-testid="current-step-title">{action}</h3>
            <div className="lesson-focus-block">
              <div className="lesson-block-label">{t('lessonWhy')}</div>
              <p className="lesson-focus-explanation" data-testid="lesson-explanation">
                {unknownStepId
                  ? t('lessonUnknownStep').replace('{id}', unknownStepId)
                  : currentEvent
                    ? t('lessonNoStepLink')
                    : t('lessonRunHint')}
              </p>
            </div>
            {currentEvent && (
              <div className="lesson-focus-block">
                <div className="lesson-block-label">{t('lessonChanges')}</div>
                <ChangeList changes={changes} />
              </div>
            )}
          </div>
        )}
      </section>

      <div className="lesson-tools">
        <button
          type="button"
          className="lesson-disclosure"
          aria-expanded={openOverview}
          aria-controls={detailsId}
          data-testid="lesson-details-toggle"
          onClick={() => setOpenOverview((open) => !open)}
        >
          <span className="lesson-disclosure-icon">{openOverview ? '▾' : '▸'}</span>
          {t('lessonDetails')}
          <span className="lesson-disclosure-hint">{t('lessonDetailsHint')}</span>
        </button>
        <button
          type="button"
          className="lesson-disclosure"
          aria-expanded={openSteps}
          aria-controls={stepsId}
          data-testid="lesson-steps-toggle"
          onClick={() => setOpenSteps((open) => !open)}
        >
          <span className="lesson-disclosure-icon">{openSteps ? '▾' : '▸'}</span>
          {t('lessonStepsNav')}
          <span className="lesson-disclosure-count">{lesson.steps.length}</span>
        </button>
      </div>

      <div
        id={detailsId}
        hidden={!openOverview}
        className="lesson-overview lesson-detail-panel"
        data-testid="lesson-overview"
      >
        <p className="lesson-oneliner" data-testid="lesson-oneliner">{lesson.oneLiner[lang]}</p>
        <p>{lesson.overview[lang]}</p>
        <p><b>{t('lessonIntuition')}</b> {lesson.intuition[lang]}</p>
        <div className="lesson-meta lesson-meta-compact" data-testid="lesson-meta">
          <div className="stat"><b>{lesson.complexity.time}</b><span>{t('timeCost')}</span></div>
          <div className="stat"><b>{lesson.complexity.space}</b><span>{t('spaceCost')}</span></div>
        </div>
        <p className="muted smalltext">{lesson.complexity.note[lang]}</p>
        <div className="lesson-chiprow">
          <span className="muted smalltext">{t('lessonPrerequisites')}</span>
          {lesson.prerequisites[lang].map((item) => (
            <span key={item} className="chip">{item}</span>
          ))}
        </div>
        <details className="lesson-mistakes" data-testid="lesson-mistakes">
          <summary>{t('lessonMistakes')}</summary>
          <ul>
            {lesson.commonMistakes[lang].map((item) => <li key={item}>{item}</li>)}
          </ul>
        </details>

        <div className="lesson-tech" data-testid="lesson-tech">
          <div className="lesson-tech-title">{t('lessonFrameRecord')}</div>
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
          ) : (
            <div className="muted smalltext" data-testid="lesson-vars">{t('noVariables')}</div>
          )}
        </div>
      </div>

      <div id={stepsId} hidden={!openSteps} className="lesson-steps-panel">
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
                  </span>
                  <span className="lessonstep-count" aria-label={t('lessonStepFrames')}>{frames}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function ChangeList({ changes }: { changes: readonly FrameChange[] }) {
  if (changes.length === 0) {
    return <div className="lesson-change-empty muted smalltext">—</div>;
  }
  return (
    <div className="lesson-change-list" data-testid="current-step-changes">
      {changes.map((change, itemIndex) => (
        <div
          key={`${change.label}-${itemIndex}`}
          className="lesson-change"
          data-tone={change.tone}
        >
          <span className="lesson-change-label">{change.label}</span>
          {change.before !== undefined && (
            <>
              <span className="lesson-change-before">{change.before}</span>
              <span className="lesson-change-arrow" aria-hidden>→</span>
            </>
          )}
          {change.after !== undefined && <span className="lesson-change-after">{change.after}</span>}
          {change.detail !== undefined && <span className="lesson-change-detail">{change.detail}</span>}
        </div>
      ))}
    </div>
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
