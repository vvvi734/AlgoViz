import {
  countStepFrames,
  findFrameForStep,
  stepIndexForEvent,
} from '../../domain/lessons/sync';
import { buildFrameInsight } from '../../domain/lessons/frameInsight';
import type { Lesson } from '../../domain/lessons/types';
import { localizeTraceMessage } from '../../domain/lessons/localizeMessage';
import type { TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';
import { CallStackPanel } from './CallStackPanel';
import { VariableWatch } from './VariableWatch';
import { VisualGuide } from './VisualGuide';

/** Keep one sentence; the player/timeline owns the longer frame story. */
function oneSentence(value: string): string {
  const trimmed = value.trim();
  // A dot inside `previous.next` or `3.14` is not a sentence boundary: English
  // terminators only count when followed by whitespace or the end of the text.
  const match = trimmed.match(/^(.+?(?:[。！？]|[.!?](?=\s|$)))/)?.[1];
  return (match ?? trimmed).trim();
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
  const previousEvent = index > 0 ? events[index - 1] : undefined;
  const insight = currentEvent
    ? buildFrameInsight(lesson, currentEvent, previousEvent, lang)
    : null;
  const actionCandidate =
    insight?.action ?? activeStep?.title[lang] ?? (currentEvent ? oneSentence(message) : t('currentStepEmpty'));
  const action = actionCandidate === rawMessage ? message : actionCandidate;
  const currentNodeId =
    currentEvent?.structure?.kind === 'binary-tree'
      ? currentEvent.structure.currentNodeId
      : null;
  const baseDetail =
    oneSentence(message) || oneSentence(activeStep?.explanation[lang] ?? '') || t('lessonRunHint');
  const detail =
    currentNodeId && !baseDetail.includes(currentNodeId)
      ? `${baseDetail} ${currentNodeId}`
      : baseDetail;
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
          relatedText={`${message} ${detail}`}
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
            {detail}
          </p>
        </div>
      </section>
    </section>
  );
}
