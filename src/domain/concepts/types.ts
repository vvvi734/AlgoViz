/** Bilingual tuple: [Chinese, English]. */
export type Bilingual = readonly [string, string];

export type ConceptDiagramKind =
  | 'algorithm-properties'
  | 'classification'
  | 'complexity'
  | 'cases'
  | 'adt'
  | 'storage'
  | 'tree'
  | 'graph'
  | 'graph-storage'
  | 'graph-adjacency-matrix'
  | 'graph-adjacency-list'
  | 'graph-orthogonal-list'
  | 'graph-adjacency-multilist'
  | 'graph-storage-comparison'
  | 'articulation-basics'
  | 'sorting'
  | 'string'
  | 'string-index'
  | 'array'
  | 'array-memory'
  | 'sequential-capacity'
  | 'matrix-compression'
  | 'sparse-matrix'
  | 'generalized-list'
  | 'generalized-list-storage'
  | 'multivariate-polynomial'
  | 'b-tree'
  | 'b-plus-tree'
  | 'asl-decision-tree'
  | 'block-search'
  | 'search-basics'
  | 'static-tree-table'
  | 'hashing-basics'
  | 'search-comparison'
  | 'circular-queue'
  | 'stack-queue-storage'
  | 'static-linked-list'
  | 'stack-recursion'
  | 'string-storage'
  | 'tree-storage'
  | 'forest-conversion'
  | 'threaded-binary-tree'
  | 'dynamic-storage'
  | 'boundary-tag-method'
  | 'storage-compaction'
  | 'external-sort'
  | 'external-runs'
  | 'external-comparison'
  | 'file-basics'
  | 'sequential-file'
  | 'indexed-file'
  | 'isam-vsam'
  | 'hashed-file'
  | 'multi-table-file'
  | 'inverted-file'
  | 'file-comparison';

export interface ConceptDefinition {
  term: Bilingual;
  text: Bilingual;
}

export interface ConceptSection {
  title: Bilingual;
  body: Bilingual;
  points?: readonly Bilingual[];
  formula?: string;
  /** Optional English rendering for a formula whose labels are prose. */
  formulaEn?: string;
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
