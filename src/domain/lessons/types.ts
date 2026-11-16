/**
 * Lesson content types — Stage 3B.
 *
 * Teaching content is DATA, not UI: nothing here imports React, the Python
 * worker or the trace schema. That keeps courses portable (a future `.algopack`
 * can ship exactly this shape) and lets the lab render any lesson generically.
 *
 * Bilingual rule: every human-readable string exists in BOTH `zh` and `en`.
 * `stepId` is NOT localised — it is the stable join key between a lesson step
 * and a real trace event (`TraceEvent.lessonStepId`), so switching the UI
 * language must never change which step is highlighted.
 */
export type LessonLang = 'zh' | 'en';

export interface LocalizedText {
  zh: string;
  en: string;
}

/** A per-language list (prerequisites, common mistakes). */
export interface LocalizedList {
  zh: string[];
  en: string[];
}

/** One teaching stage. `stepId` is stable across languages and content versions. */
export interface LessonStep {
  stepId: string;
  title: LocalizedText;
  explanation: LocalizedText;
  /** Optional learning hint, shown next to the explanation. */
  tip?: LocalizedText;
}

export interface LessonComplexity {
  /** Big-O strings, identical in both languages (notation is universal). */
  time: string;
  space: string;
  /** Plain-language explanation of the complexity. */
  note: LocalizedText;
}

export interface Lesson {
  /** Globally unique course id, e.g. `bubble-sort-basics`. */
  lessonId: string;
  /** Links the course to an algorithm in the lab catalog. */
  algorithmId: string;
  /** Content revision, independent from the app version. */
  contentVersion: string;
  title: LocalizedText;
  /** One sentence: what problem does it solve. */
  oneLiner: LocalizedText;
  /** Fit-for-purpose paragraph. */
  overview: LocalizedText;
  /** Core idea, in plain language. */
  intuition: LocalizedText;
  prerequisites: LocalizedList;
  complexity: LessonComplexity;
  steps: LessonStep[];
  commonMistakes: LocalizedList;
}

/** Result of validating a lesson set (used by tests and the registry). */
export interface LessonValidationResult {
  ok: boolean;
  errors: string[];
}
