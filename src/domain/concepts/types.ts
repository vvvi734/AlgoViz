/** Bilingual tuple: [Chinese, English]. */
export type Bilingual = readonly [string, string];

export type ConceptDiagramKind =
  | 'classification'
  | 'complexity'
  | 'cases'
  | 'adt'
  | 'storage'
  | 'tree'
  | 'graph'
  | 'graph-storage'
  | 'sorting'
  | 'string'
  | 'array'
  | 'matrix-compression'
  | 'sparse-matrix'
  | 'b-tree'
  | 'b-plus-tree'
  | 'asl-decision-tree'
  | 'block-search'
  | 'circular-queue'
  | 'stack-queue-storage';

export interface ConceptDefinition {
  term: Bilingual;
  text: Bilingual;
}

export interface ConceptSection {
  title: Bilingual;
  body: Bilingual;
  points?: readonly Bilingual[];
  formula?: string;
}

export interface ConceptComparison {
  title: Bilingual;
  columns: readonly Bilingual[];
  rows: readonly (readonly Bilingual[])[];
}

/** A static, exam-friendly knowledge page. It owns no trace or player state. */
export interface ConceptPage {
  id: string;
  topicId: string;
  title: Bilingual;
  chapter: Bilingual;
  summary: Bilingual;
  diagram: ConceptDiagramKind;
  definitions: readonly ConceptDefinition[];
  sections: readonly ConceptSection[];
  comparison?: ConceptComparison;
  takeaway: Bilingual;
}
