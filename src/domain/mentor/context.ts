/**
 * Build the exact context sent to the Gateway from the *real* lab state.
 *
 * Pure function: no React, no fetching. The caller must pass the frame under
 * the playback cursor (`lab.events[lab.playback.index]`), never a guessed one.
 */
import type { Lesson } from '../lessons/types';
import type { TraceEvent } from '../trace/schema';
import { MENTOR_LIMITS, type MentorContext } from './schema';

export interface BuildMentorContextArgs {
  algorithmId: string;
  lesson?: Lesson | null;
  event: TraceEvent;
  totalEvents: number;
  locale: 'zh' | 'en';
  traceStale: boolean;
  /** Only pass this when the user explicitly ticked "include my code". */
  source?: string | null;
}

export function buildMentorContext(args: BuildMentorContextArgs): MentorContext {
  if (args.totalEvents < 1) throw new Error('A mentor context needs at least one real frame');
  if (args.event.step >= args.totalEvents) throw new Error('The selected frame is outside the trace');

  const lesson = args.lesson && args.lesson.algorithmId === args.algorithmId ? args.lesson : null;
  const step = lesson?.steps.find((candidate) => candidate.stepId === args.event.lessonStepId);

  const context: MentorContext = {
    algorithmId: args.algorithmId,
    locale: args.locale,
    stepIndex: args.event.step,
    totalEvents: args.totalEvents,
    event: args.event,
    traceStale: args.traceStale,
  };

  if (lesson) {
    context.lessonId = lesson.lessonId;
    context.lessonTitle = lesson.title[args.locale].slice(0, MENTOR_LIMITS.titleChars);
    if (step) {
      context.lessonStepId = step.stepId;
      context.lessonStepTitle = step.title[args.locale].slice(0, MENTOR_LIMITS.titleChars);
      context.lessonStepExplanation = step.explanation[args.locale].slice(0, MENTOR_LIMITS.stepExplanationChars);
    }
  }

  const source = args.source?.trim();
  if (source && source.length <= MENTOR_LIMITS.sourceChars) {
    context.source = source;
  }

  return context;
}

/** Human-readable summary of what will be sent, shown before a cloud request. */
export function describeMentorContext(context: MentorContext, locale: 'zh' | 'en'): string[] {
  const lines: string[] = [];
  if (locale === 'zh') {
    lines.push(`算法：${context.algorithmId}`);
    lines.push(`真实帧：${context.stepIndex + 1}/${context.totalEvents}`);
    lines.push(`变量：${(context.event.variables ?? []).map((item) => item.name).join(', ') || '无'}`);
    lines.push(`调用栈：${(context.event.callStack ?? []).map((frame) => frame.name).join(' → ') || '无'}`);
    if (context.lessonStepId) lines.push(`教学阶段：${context.lessonStepId}`);
    if (context.traceStale) lines.push('代码已修改：当前帧来自上一次运行。');
    if (context.source) lines.push('包含你选择发送的 Python 源码。');
  } else {
    lines.push(`Algorithm: ${context.algorithmId}`);
    lines.push(`Real frame: ${context.stepIndex + 1}/${context.totalEvents}`);
    lines.push(`Variables: ${(context.event.variables ?? []).map((item) => item.name).join(', ') || 'none'}`);
    lines.push(`Call stack: ${(context.event.callStack ?? []).map((frame) => frame.name).join(' → ') || 'none'}`);
    if (context.lessonStepId) lines.push(`Teaching stage: ${context.lessonStepId}`);
    if (context.traceStale) lines.push('Code edited: this frame belongs to the previous run.');
    if (context.source) lines.push('Includes the Python source you chose to send.');
  }
  return lines;
}
