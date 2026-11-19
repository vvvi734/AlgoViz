import type { AlgorithmEntry } from '../algorithms/types';
import type { Lesson, LocalizedList, LocalizedText } from '../lessons/types';
import { COURSE_GUIDES } from './courseGuides';
import {
  EMPTY_LOCALIZED_LIST,
  type AlgorithmGuideContent,
  type GuideStage,
} from './types';

function firstSentences(text: LocalizedText, limit = 2, maxChars = 240): LocalizedText {
  const take = (value: string) => {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    const sentences = normalized.match(/[^。！？.!?]+[。！？.!?]?/g) ?? [normalized];
    const picked = sentences.slice(0, limit).join('').trim();
    return picked.length > maxChars ? `${picked.slice(0, maxChars).trimEnd()}…` : picked;
  };
  return { zh: take(text.zh), en: take(text.en) };
}

function emptyList(): LocalizedList {
  return { zh: [...EMPTY_LOCALIZED_LIST.zh], en: [...EMPTY_LOCALIZED_LIST.en] };
}

function catalogProblem(entry: AlgorithmEntry): LocalizedText | null {
  const zh = entry.desc[0] ?? '';
  const en = entry.desc[1] ?? zh;
  if (!zh && !en) return null;
  return { zh: zh || en, en: en || zh };
}

// A review sheet keeps only algorithm-level mistakes. Implementation details
// that only make sense for one Python teaching harness are filtered out, while
// the full course still keeps its complete commonMistakes list.
const IMPLEMENTATION_SPECIFIC = /Python|RecursionError|IndexError|deque|heapq|dict|stack\[-1\]|range\(/;

function teachingPitfalls(lesson: Lesson): LocalizedList {
  const pairs = lesson.commonMistakes.zh.map((zh, index) => ({
    zh,
    en: lesson.commonMistakes.en[index] ?? zh,
  }));
  const filtered = pairs.filter((pair) => !IMPLEMENTATION_SPECIFIC.test(pair.zh));
  const chosen = (filtered.length > 0 ? filtered : pairs).slice(0, 3);
  return {
    zh: chosen.map((pair) => pair.zh),
    en: chosen.map((pair) => pair.en),
  };
}

function memoryHook(lesson: Lesson): LocalizedText | null {
  const tip = lesson.steps[lesson.steps.length - 1]?.tip;
  return tip?.zh && tip.en ? tip : null;
}

function courseStages(algorithmId: string): GuideStage[] {
  return COURSE_GUIDES[algorithmId]?.stages ?? [];
}

/**
 * Resolve one review guide.
 *
 * Formal built-in courses take their authored intro/definition/flow/conditions
 * from `COURSE_GUIDES`; the course still supplies complexity and the long
 * mistake list. Pack-provided lessons without an authored flow never get a
 * fabricated stage list — the UI shows that the horizontal flow is pending.
 */
export function buildAlgorithmGuide(
  algorithmId: string,
  lesson: Lesson | null | undefined,
  entry?: AlgorithmEntry | null,
): AlgorithmGuideContent {
  const authored = COURSE_GUIDES[algorithmId];

  if (authored && lesson) {
    return {
      algorithmId,
      intro: authored.intro,
      definition: authored.definition,
      plain: firstSentences(lesson.intuition, 2, 260),
      flowKind: authored.flowKind,
      stages: courseStages(algorithmId),
      conditions: authored.conditions,
      complexity: lesson.complexity,
      pitfalls: teachingPitfalls(lesson),
      memoryHook: memoryHook(lesson),
      diagram: authored.diagram,
      source: 'curated',
      lessonTitle: lesson.title,
    };
  }

  if (lesson) {
    return {
      algorithmId,
      intro: firstSentences(lesson.overview, 2, 260),
      definition: lesson.oneLiner,
      plain: firstSentences(lesson.intuition, 2, 260),
      flowKind: null,
      stages: [],
      conditions: emptyList(),
      complexity: lesson.complexity,
      pitfalls: teachingPitfalls(lesson),
      memoryHook: memoryHook(lesson),
      source: 'lesson',
      lessonTitle: lesson.title,
    };
  }

  if (entry) {
    const problem = catalogProblem(entry);
    return {
      algorithmId,
      intro: problem,
      definition: problem,
      plain: null,
      flowKind: null,
      stages: [],
      conditions: emptyList(),
      complexity: {
        time: entry.time,
        space: entry.space,
        note: {
          zh: '这部分只展示算法目录中已确认的简介与复杂度。完整导学尚未提供，因此不推测流程。',
          en: 'This section shows only the catalog-confirmed summary and complexity. The full guide is not available yet, so no flow is guessed.',
        },
      },
      pitfalls: emptyList(),
      memoryHook: null,
      source: 'catalog',
    };
  }

  return {
    algorithmId,
    intro: null,
    definition: null,
    plain: null,
    flowKind: null,
    stages: [],
    conditions: emptyList(),
    complexity: null,
    pitfalls: emptyList(),
    memoryHook: null,
    source: 'none',
  };
}
