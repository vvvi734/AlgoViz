/**
 * UX-01 algorithm guide content.
 *
 * This is presentation DATA derived from existing courses, not a second
 * lesson/player system. A guide never owns a playhead and never invents
 * execution state: curated guides add beginner-oriented framing, while all
 * other algorithms reuse their real Lesson content. When neither a curated
 * guide nor a Lesson exists, only catalog-confirmed text and complexity are
 * shown.
 */
import type { LocalizedList, LocalizedText, LessonComplexity } from '../lessons/types';

export type GuideDiagramKind = 'dijkstra' | 'kahn' | 'kosaraju';

export type GuideSource = 'curated' | 'lesson' | 'catalog' | 'none';

/** One real algorithmic step, phrased for a first-time learner. */
export interface GuideStep {
  title: LocalizedText;
  body: LocalizedText;
}

/**
 * A 3–5 card overview of the algorithm's real phases. These are authored
 * summaries, not a replacement for `steps`: the detailed steps remain the
 * source of truth and stay available in the expandable section.
 */
export interface GuideStage {
  title: LocalizedText;
  summary: LocalizedText;
}

export interface AlgorithmGuideContent {
  algorithmId: string;
  problem: LocalizedText | null;
  /** The one line a beginner should remember from the core idea. */
  coreHeadline: LocalizedText | null;
  coreIdea: LocalizedText | null;
  stages: GuideStage[];
  steps: GuideStep[];
  prerequisites: LocalizedList;
  conditions: LocalizedList;
  complexity: LessonComplexity | null;
  pitfalls: LocalizedList;
  memoryHook: LocalizedText | null;
  diagram?: GuideDiagramKind;
  source: GuideSource;
  lessonTitle?: LocalizedText;
}

/** Authoring shape for the three curated guides. */
export type CuratedGuide = Pick<
  AlgorithmGuideContent,
  'problem' | 'coreHeadline' | 'coreIdea' | 'stages' | 'steps' | 'conditions' | 'memoryHook' | 'diagram'
>;

export const EMPTY_LOCALIZED_LIST: LocalizedList = { zh: [], en: [] };
