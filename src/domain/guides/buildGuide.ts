import type { AlgorithmEntry } from '../algorithms/types';
import type { Lesson, LocalizedText } from '../lessons/types';
import { CURATED_GUIDES } from './algorithmGuides';
import {
  EMPTY_LOCALIZED_LIST,
  type AlgorithmGuideContent,
  type GuideStage,
  type GuideStep,
} from './types';

/** Some course step titles carry their own circled ordinal; the guide adds one. */
function stripLeadingOrdinal(text: string): string {
  return text.replace(/^[\u2460-\u2473]\s*/, '').trim();
}

function firstSentence(text: LocalizedText): LocalizedText {
  const take = (value: string) => {
    const trimmed = value.trim();
    const sentence = trimmed.match(/^(.+?[。！？.!?])(?:\s|$)/)?.[1] ?? trimmed;
    return sentence;
  };
  return { zh: take(text.zh), en: take(text.en) };
}

function lessonSteps(lesson: Lesson): GuideStep[] {
  return lesson.steps.map((step) => ({
    title: {
      zh: stripLeadingOrdinal(step.title.zh),
      en: stripLeadingOrdinal(step.title.en),
    },
    body: step.explanation,
  }));
}

/**
 * A small course only gets a stage strip when its real steps are already
 * phase-sized (3–5). Longer courses keep all steps in the expandable details
 * instead of pretending that an arbitrary grouping is their phase structure.
 */
function lessonStages(lesson: Lesson): GuideStage[] {
  if (lesson.steps.length < 3 || lesson.steps.length > 5) return [];
  return lesson.steps.map((step) => ({
    title: {
      zh: stripLeadingOrdinal(step.title.zh),
      en: stripLeadingOrdinal(step.title.en),
    },
    summary: firstSentence(step.explanation),
  }));
}

function emptyList() {
  return { zh: [...EMPTY_LOCALIZED_LIST.zh], en: [...EMPTY_LOCALIZED_LIST.en] };
}

function catalogProblem(entry: AlgorithmEntry) {
  const zh = entry.desc[0] ?? '';
  const en = entry.desc[1] ?? zh;
  if (!zh && !en) return null;
  return { zh: zh || en, en: en || zh };
}

/**
 * Resolve the guide for one algorithm.
 *
 * Precedence is deliberate:
 * 1. curated copy for the three UX-01 reference algorithms;
 * 2. the registered course's own overview, intuition, steps and mistakes;
 * 3. metadata-only fallback (never invented steps);
 * 4. an empty guide for a custom algorithm with no metadata.
 *
 * A guide can be rendered for a pack-provided algorithm too: it is passed the
 * same Lesson object the rest of the lab already uses, so no second content
 * store is introduced.
 */
export function buildAlgorithmGuide(
  algorithmId: string,
  lesson: Lesson | null | undefined,
  entry?: AlgorithmEntry | null,
): AlgorithmGuideContent {
  const curated = CURATED_GUIDES[algorithmId];

  if (curated) {
    return {
      algorithmId,
      ...curated,
      prerequisites: lesson?.prerequisites ?? emptyList(),
      complexity:
        lesson?.complexity ??
        (entry
          ? {
              time: entry.time,
              space: entry.space,
              note: {
                zh: '复杂度取自算法目录；完整教学说明以课程为准。',
                en: 'Complexity comes from the algorithm catalog; the course remains the source for fuller teaching notes.',
              },
            }
          : null),
      pitfalls: lesson?.commonMistakes ?? emptyList(),
      source: 'curated',
      lessonTitle: lesson?.title,
    };
  }

  if (lesson) {
    return {
      algorithmId,
      problem: lesson.oneLiner,
      coreHeadline: null,
      coreIdea: lesson.intuition,
      stages: lessonStages(lesson),
      steps: lessonSteps(lesson),
      prerequisites: lesson.prerequisites,
      conditions: emptyList(),
      complexity: lesson.complexity,
      pitfalls: lesson.commonMistakes,
      memoryHook: lesson.steps[lesson.steps.length - 1]?.tip ?? null,
      source: 'lesson',
      lessonTitle: lesson.title,
    };
  }

  if (entry) {
    return {
      algorithmId,
      problem: catalogProblem(entry),
      coreHeadline: null,
      coreIdea: null,
      stages: [],
      steps: [],
      prerequisites: emptyList(),
      conditions: emptyList(),
      complexity: {
        time: entry.time,
        space: entry.space,
        note: {
          zh: '这部分只展示算法目录中已确认的简介与复杂度。结构化执行步骤尚未提供，因此不做推测。',
          en: 'This section shows only the catalog-confirmed summary and complexity. Structured execution steps are not available yet, so none are guessed.',
        },
      },
      pitfalls: emptyList(),
      memoryHook: null,
      source: 'catalog',
    };
  }

  return {
    algorithmId,
    problem: null,
    coreHeadline: null,
    coreIdea: null,
    stages: [],
    steps: [],
    prerequisites: emptyList(),
    conditions: emptyList(),
    complexity: null,
    pitfalls: emptyList(),
    memoryHook: null,
    source: 'none',
  };
}
