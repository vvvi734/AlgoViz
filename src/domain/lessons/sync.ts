/**
 * Pure helpers joining teaching steps to real trace frames.
 *
 * These are intentionally free of React and of the schema's validation logic:
 * `Lesson Step` (what a teacher explains) and `Trace Event` (what Python
 * actually did) are different concepts. One step may match many events, so a
 * step is never derived from `event.step` — only from the `lessonStepId` the
 * runner recorded while executing.
 */
import type { TraceEvent } from '../trace/schema';
import type { Lesson, LessonStep } from './types';

/** The step id a real frame claimed, or `undefined` when it claimed none. */
export function lessonStepIdOf(event: TraceEvent | undefined): string | undefined {
  const id = event?.lessonStepId;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

/**
 * Resolve a step id against the course. Returns `null` for ids the course does
 * not define (stale packs, hand-written drafts), so callers can fall back to an
 * "unlinked" state instead of crashing.
 */
export function resolveStep(lesson: Lesson | undefined, stepId: string | undefined): LessonStep | null {
  if (!lesson || !stepId) return null;
  return lesson.steps.find((step) => step.stepId === stepId) ?? null;
}

/** Index of the step the current frame belongs to, or `-1`. */
export function stepIndexForEvent(lesson: Lesson | undefined, event: TraceEvent | undefined): number {
  const stepId = lessonStepIdOf(event);
  if (!lesson || !stepId) return -1;
  return lesson.steps.findIndex((step) => step.stepId === stepId);
}

/** How many real frames belong to a step (0 means "this run never showed it"). */
export function countStepFrames(events: readonly TraceEvent[], stepId: string): number {
  let count = 0;
  for (const event of events) if (lessonStepIdOf(event) === stepId) count += 1;
  return count;
}

/**
 * Where should clicking a step land?
 *
 * Deterministic rule (documented in the panel):
 *  1. the next frame AFTER the current one that belongs to this step;
 *  2. otherwise the FIRST frame of this step (wrap-to-start, no fake frames);
 *  3. otherwise `null` — the panel disables the jump and says the current run
 *     has no such frame.
 *
 * `fromIndex` may be out of range (an empty trace); the function never throws
 * and never invents an index.
 */
export function findFrameForStep(
  events: readonly TraceEvent[],
  stepId: string,
  fromIndex: number,
): number | null {
  if (!stepId || events.length === 0) return null;
  const start = Number.isFinite(fromIndex) ? Math.max(-1, Math.floor(fromIndex)) : -1;
  for (let i = start + 1; i < events.length; i += 1) {
    if (lessonStepIdOf(events[i]) === stepId) return i;
  }
  for (let i = 0; i < events.length; i += 1) {
    if (lessonStepIdOf(events[i]) === stepId) return i;
  }
  return null;
}

/** Total frames in the run that carry no usable lesson link. */
export function countUnlinkedFrames(events: readonly TraceEvent[]): number {
  return events.reduce((total, event) => (lessonStepIdOf(event) ? total : total + 1), 0);
}
