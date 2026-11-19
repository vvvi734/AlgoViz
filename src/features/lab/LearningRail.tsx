import { buildFrameInsight, type FrameChange } from '../../domain/lessons/frameInsight';
import {
  countStepFrames,
  findFrameForStep,
  stepIndexForEvent,
} from '../../domain/lessons/sync';
import type { Lesson, LessonLang } from '../../domain/lessons/types';
import { localizeTraceMessage } from '../../domain/lessons/localizeMessage';
import type { TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';
import { CallStackPanel } from './CallStackPanel';
import { VariableWatch } from './VariableWatch';
import { VisualGuide } from './VisualGuide';

function changeText(changes: readonly FrameChange[], lang: LessonLang): string {
  const sep = lang === 'zh' ? '；' : '; ';
  const colon = lang === 'zh' ? '：' : ': ';
  return changes
    .slice(0, 3)
    .map((change) => {
      const value =
        change.before !== undefined && change.after !== undefined
          ? `${change.before} → ${change.after}`
          : change.after ?? change.detail ?? '';
      return value ? `${change.label}${colon}${value}` : change.label;
    })
    .join(sep);
}

/**
 * UX-SIMPLIFY-02 learning rail.
 *
 * Top: real state (variables, optional call stack, optional special-symbol
 * legend). Bottom: one operation title and one sentence. Both halves read the
 * current trace event; there is no second playhead or cached variable state.
 */
export function LearningRail({
  algorithmId,
  lesson,
  events,
  index,
  currentEvent,
  selectedFrameId,
  onSelectFrame,
  onSeek,
  originName,
  hasExample,
  onUseExample,
}: {
  algorithmId: string;
  lesson: Lesson | undefined;
  events: readonly TraceEvent[];
  index: number;
  currentEvent: TraceEvent | undefined;
  selectedFrameId: string | null;
  onSelectFrame: (frameId: string | null) => void;
  onSeek: (index: number) => void;
  originName?: string;
  hasExample?: boolean;
  onUseExample?: () => void;
}) {
  const { t, lang } = useI18n();
  const activeIndex = stepIndexForEvent(lesson, currentEvent);
  const activeStep = activeIndex >= 0 ? lesson?.steps[activeIndex] : undefined;
  const previousEvent = index > 0 ? events[index - 1] : undefined;
  const insight = buildFrameInsight(lesson, currentEvent, previousEvent, lang);
  const rawMessage = currentEvent?.message ?? '';
  const message = localizeTraceMessage(rawMessage, lang);
  const frameLabel = currentEvent
    ? t('workspaceFrame')
        .replace('{current}', String(currentEvent.step + 1))
        .replace('{total}', String(events.length))
    : t('workspaceNotRun');
  const stageLabel = activeStep
    ? t('lessonStageOf')
        .replace('{current}', String(activeIndex + 1))
        .replace('{total}', String(lesson?.steps.length ?? 0))
    : null;
  const actionCandidate =
    insight?.action ||
    activeStep?.title[lang] ||
    (currentEvent ? t('currentStepUnlinked') : t('currentStepEmpty'));
  const action = actionCandidate === rawMessage ? message : actionCandidate;
  const whyCandidate = insight?.why || (activeStep ? activeStep.explanation[lang] : null);
  const why = whyCandidate === rawMessage ? message : whyCandidate;
  const changes = insight?.changes ?? [];
  const hasCallStack = Boolean(currentEvent?.callStack?.length);

  return (
    <section className="panel pad learning-rail" data-testid="lesson-panel" data-variant="rail">
      <section className="rail-key-state" data-testid="key-state">
        <div className="rail-section-head">
          <div>
            <div className="rail-kicker">{t('railKeyStateKicker')}</div>
            <h2>{t('railKeyStateTitle')}</h2>
            {lesson ? (
              <h3 className="rail-lesson-name" data-testid="lesson-title">{lesson.title[lang]}</h3>
            ) : (
              <p className="rail-lesson-empty" data-testid="lesson-no-lesson">{t('railNoCourse')}</p>
            )}
            {originName ? (
              <p className="rail-lesson-origin" data-testid="lesson-origin">
                {t('packOrigin').replace('{pack}', originName)}
              </p>
            ) : null}
            {hasExample && onUseExample ? (
              <button
                type="button"
                className="btn ghost rail-example-button"
                data-testid="lesson-use-example"
                onClick={onUseExample}
              >
                {t('lessonUseExample')}
              </button>
            ) : null}
          </div>
          <span className="tag" data-testid="lesson-frame">{frameLabel}</span>
        </div>

        <VariableWatch
          event={currentEvent}
          selectedFrameId={selectedFrameId}
          relatedText={`${message} ${why ?? ''}`}
        />
        {hasCallStack ? (
          <CallStackPanel
            event={currentEvent}
            selectedFrameId={selectedFrameId}
            onSelectFrame={onSelectFrame}
          />
        ) : null}
        <VisualGuide algorithmId={algorithmId} />
      </section>

      <section className="rail-operation" data-testid="current-step">
        <div className="rail-operation-head">
          <div>
            <div className="rail-kicker">{t('railCurrentOperation')}</div>
            {stageLabel ? <span className="rail-stage">{stageLabel}</span> : null}
          </div>
        </div>

        {lesson && lesson.steps.length > 0 ? (
          <div className="rail-stage-jumps" data-testid="rail-stage-jumps" aria-label={t('railJumpStage')}>
            {lesson.steps.map((step, stepIndex) => {
              const frames = countStepFrames(events, step.stepId);
              return (
                <button
                  key={step.stepId}
                  type="button"
                  className="rail-stage-jump-button"
                  data-testid={`lesson-step-${step.stepId}`}
                  data-active={stepIndex === activeIndex ? 'true' : 'false'}
                  data-frame-count={frames}
                  aria-label={step.title[lang]}
                  title={step.title[lang]}
                  disabled={frames === 0}
                  onClick={() => {
                    const target = findFrameForStep(events, step.stepId, index);
                    if (target != null) onSeek(target);
                  }}
                >
                  {String(stepIndex + 1).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        ) : null}

        <div
          className="rail-operation-content"
          data-testid={activeStep ? 'lesson-active-step' : 'lesson-unlinked'}
          data-step-id={activeStep?.stepId}
        >
          <h2 className="rail-operation-title" data-testid="current-step-title">{action}</h2>
          <p className="rail-operation-text" data-testid="current-step-message">
            {message || t('lessonRunHint')}
          </p>
          {changes.length > 0 ? (
            <p className="rail-operation-change" data-testid="current-step-changes">
              {changeText(changes, lang)}
            </p>
          ) : null}
          {why ? (
            <details className="rail-why">
              <summary>{t('lessonWhy')}</summary>
              <p data-testid="lesson-explanation">{why}</p>
            </details>
          ) : null}
        </div>
      </section>
    </section>
  );
}
