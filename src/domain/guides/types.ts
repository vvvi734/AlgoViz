/**
 * Algorithm guide content — a compact, exam-oriented review sheet.
 *
 * The guide is presentation data derived from a real course, never a playhead
 * and never a second Trace. Every formal course authors its own abstract flow
 * from the algorithm's principles; frame-by-frame Trace messages must not be
 * concatenated into the overview.
 */
import type { LocalizedList, LocalizedText, LessonComplexity } from '../lessons/types';

export type GuideDiagramKind = 'dijkstra' | 'kahn' | 'kosaraju';
export type GuideFlowKind = 'algorithm' | 'operations';
export type GuideSource = 'curated' | 'lesson' | 'catalog' | 'none';

/** One abstract phase, not one Trace frame. */
export interface GuideStage {
  title: LocalizedText;
  /** Optional single sentence; most stages need no prose at all. */
  summary?: LocalizedText;
}

export interface AlgorithmGuideContent {
  algorithmId: string;
  /** Why the algorithm/structure exists: problem, limitation, improvement. */
  intro: LocalizedText | null;
  /** Formal CS definition. */
  definition: LocalizedText | null;
  /** One or two plain-language sentences that do not repeat the definition. */
  plain: LocalizedText | null;
  /** Whether the horizontal row describes an algorithm flow or core operations. */
  flowKind: GuideFlowKind | null;
  stages: GuideStage[];
  conditions: LocalizedList;
  complexity: LessonComplexity | null;
  /** At most three genuinely important mistakes. */
  pitfalls: LocalizedList;
  memoryHook: LocalizedText | null;
  diagram?: GuideDiagramKind;
  source: GuideSource;
  lessonTitle?: LocalizedText;
}

/** Authoring shape for one formal course. */
export interface CourseGuide {
  intro: LocalizedText;
  definition: LocalizedText;
  flowKind: GuideFlowKind;
  stages: GuideStage[];
  conditions: LocalizedList;
  diagram?: GuideDiagramKind;
}

export const EMPTY_LOCALIZED_LIST: LocalizedList = { zh: [], en: [] };
