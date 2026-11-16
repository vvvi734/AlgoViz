/**
 * Course-query tools: `list_lessons`, `get_lesson`, `get_lesson_step`.
 *
 * All three read the shared Lesson data (built-in + packs on disk). None of them
 * invents content: a lesson that does not exist is an error, not a stub.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Lesson } from '../../../../src/domain/lessons/types';
import type { McpConfig } from '../config';
import { findCourse, loadCourseIndex, type CourseEntry } from '../catalog';
import { jsonResult, REALITY_NOTE, toolError } from './result';

const localeSchema = z.enum(['zh', 'en']);
type Locale = z.infer<typeof localeSchema>;

function sourceOf(entry: CourseEntry) {
  if (entry.origin.kind === 'builtin') return { kind: 'builtin' as const };
  return {
    kind: 'pack' as const,
    packId: entry.origin.packId,
    ...(entry.origin.version ? { version: entry.origin.version } : {}),
    ...(entry.pack ? { file: entry.pack.file, name: entry.pack.name } : {}),
  };
}

function summary(entry: CourseEntry, locale: Locale) {
  const lesson = entry.lesson;
  return {
    lessonId: lesson.lessonId,
    algorithmId: lesson.algorithmId,
    title: lesson.title[locale],
    oneLiner: lesson.oneLiner[locale],
    contentVersion: lesson.contentVersion,
    stepCount: lesson.steps.length,
    stepIds: lesson.steps.map((step) => step.stepId),
    source: sourceOf(entry),
  };
}

function detail(entry: CourseEntry, locale: Locale) {
  const lesson = entry.lesson;
  return {
    lessonId: lesson.lessonId,
    algorithmId: lesson.algorithmId,
    contentVersion: lesson.contentVersion,
    locale,
    source: sourceOf(entry),
    title: lesson.title[locale],
    oneLiner: lesson.oneLiner[locale],
    overview: lesson.overview[locale],
    intuition: lesson.intuition[locale],
    prerequisites: lesson.prerequisites[locale],
    complexity: {
      time: lesson.complexity.time,
      space: lesson.complexity.space,
      note: lesson.complexity.note[locale],
    },
    steps: lesson.steps.map((step, index) => ({
      index,
      stepId: step.stepId,
      title: step.title[locale],
      explanation: step.explanation[locale],
      ...(step.tip ? { tip: step.tip[locale] } : {}),
    })),
    commonMistakes: lesson.commonMistakes[locale],
  };
}

function matches(lesson: Lesson, query: string): boolean {
  const haystack = [
    lesson.lessonId,
    lesson.algorithmId,
    lesson.title.zh,
    lesson.title.en,
    lesson.oneLiner.zh,
    lesson.oneLiner.en,
    lesson.overview.zh,
    lesson.overview.en,
    ...lesson.prerequisites.zh,
    ...lesson.prerequisites.en,
    ...lesson.steps.map((step) => `${step.title.zh} ${step.title.en}`),
  ]
    .join('\n')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function registerLessonTools(server: McpServer, config: McpConfig): void {
  server.registerTool(
    'list_lessons',
    {
      title: 'List AlgoLens courses',
      description:
        'List AlgoLens teaching courses (built-in plus packs found in the configured pack directory). ' +
        'Use it to find a lessonId before calling get_lesson. Browser-installed packs are NOT visible here.',
      inputSchema: {
        locale: localeSchema.optional().describe('Language for titles and summaries (default zh).'),
        query: z.string().min(1).max(120).optional().describe('Case-insensitive substring filter.'),
        source: z
          .enum(['all', 'builtin', 'pack'])
          .optional()
          .describe('Restrict to built-in courses or pack courses (default all).'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      const locale: Locale = args.locale ?? 'zh';
      const index = loadCourseIndex(config.packDir?.path ?? null);
      const wanted = args.source ?? 'all';
      const query = args.query?.trim();
      const entries = index.entries.filter(
        (entry) =>
          (wanted === 'all' || entry.origin.kind === wanted) && (!query || matches(entry.lesson, query)),
      );
      return jsonResult({
        ok: true,
        locale,
        count: entries.length,
        lessons: entries.map((entry) => summary(entry, locale)),
        sourceScope: {
          packDirectory: config.packDir
            ? { configured: true, path: config.packDir.path, origin: config.packDir.source }
            : { configured: false },
          browserIndexedDbVisible: false,
        },
        ...(index.packDirIssue ? { packDirectoryIssue: index.packDirIssue } : {}),
        ...(index.skipped.length ? { skippedPacks: index.skipped } : {}),
        note: REALITY_NOTE,
      });
    },
  );

  server.registerTool(
    'get_lesson',
    {
      title: 'Get an AlgoLens course',
      description:
        'Return the full teaching content of one course: overview, core idea, prerequisites, complexity, ' +
        'teaching steps (with stable stepIds) and common mistakes. Read-only.',
      inputSchema: {
        lessonId: z.string().min(1).max(80).describe('Course id from list_lessons.'),
        locale: localeSchema.optional().describe('Language for the returned text (default zh).'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      const index = loadCourseIndex(config.packDir?.path ?? null);
      const entry = findCourse(index, args.lessonId);
      if (!entry) {
        return toolError(
          'lesson-unknown',
          `No course with lessonId "${args.lessonId}". Call list_lessons to see what exists.`,
          { availableLessonIds: index.entries.map((item) => item.lesson.lessonId) },
        );
      }
      const locale: Locale = args.locale ?? 'zh';
      return jsonResult({
        ok: true,
        ...detail(entry, locale),
        availableLocales: ['zh', 'en'],
        note: REALITY_NOTE,
      });
    },
  );

  server.registerTool(
    'get_lesson_step',
    {
      title: 'Get one teaching step',
      description:
        'Return a single teaching stage (title, explanation, tip) by its stable stepId. ' +
        'Step ids are language-independent, so the same id works for zh and en.',
      inputSchema: {
        lessonId: z.string().min(1).max(80),
        stepId: z.string().min(1).max(64),
        locale: localeSchema.optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      const index = loadCourseIndex(config.packDir?.path ?? null);
      const entry = findCourse(index, args.lessonId);
      if (!entry) {
        return toolError('lesson-unknown', `No course with lessonId "${args.lessonId}".`, {
          availableLessonIds: index.entries.map((item) => item.lesson.lessonId),
        });
      }
      const stepIndex = entry.lesson.steps.findIndex((step) => step.stepId === args.stepId);
      if (stepIndex < 0) {
        return toolError(
          'step-unknown',
          `Course "${args.lessonId}" has no step "${args.stepId}".`,
          { availableStepIds: entry.lesson.steps.map((step) => step.stepId) },
        );
      }
      const step = entry.lesson.steps[stepIndex];
      const locale: Locale = args.locale ?? 'zh';
      return jsonResult({
        ok: true,
        lessonId: entry.lesson.lessonId,
        algorithmId: entry.lesson.algorithmId,
        locale,
        stepId: step.stepId,
        index: stepIndex,
        totalSteps: entry.lesson.steps.length,
        title: step.title[locale],
        explanation: step.explanation[locale],
        ...(step.tip ? { tip: step.tip[locale] } : {}),
      });
    },
  );
}
