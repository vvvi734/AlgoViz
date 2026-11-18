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

export interface AlgorithmGuideContent {
  algorithmId: string;
  problem: LocalizedText | null;
  coreIdea: LocalizedText | null;
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
  'problem' | 'coreIdea' | 'steps' | 'conditions' | 'memoryHook' | 'diagram'
>;

export const EMPTY_LOCALIZED_LIST: LocalizedList = { zh: [], en: [] };
