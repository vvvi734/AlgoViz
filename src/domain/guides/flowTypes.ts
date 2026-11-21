/**
 * Declarative algorithm flow graphs.
 *
 * The graph owns *logical* placement only: a row is a vertical step in the
 * reading direction and a lane is a local left/main/right branch. Pixel
 * coordinates are computed by the renderer, so authoring a new algorithm never
 * requires hand-placed SVG points.
 *
 * Back edges are explicit (`back: true`) and must point at an earlier or
 * equal row. The renderer routes them through a gutter, making repeated
 * execution visible without pretending the flow is a straight line.
 */
import type { LocalizedText } from '../lessons/types';

export type FlowNodeKind =
  | 'start'
  | 'end'
  | 'operation'
  | 'decision'
  | 'subflow'
  | 'call'
  | 'subreturn';

/** A normal, failed or neutral exit. */
export type FlowEndTone = 'success' | 'failure' | 'neutral';

export type FlowEdgeKind = 'next' | 'yes' | 'no' | 'call' | 'return';

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  label: LocalizedText;
  detail?: LocalizedText;
  /** Vertical position in the reading direction; lower rows come later. */
  row: number;
  /** Local horizontal placement: -1 left, 0 main, 1 right. */
  lane: -1 | 0 | 1;
  /** Only for `end` nodes. */
  tone?: FlowEndTone;
}

export interface FlowEdge {
  from: string;
  to: string;
  kind: FlowEdgeKind;
  /** Explicit repeated-execution edge; it must point to an earlier/equal row. */
  back?: boolean;
  /** Optional explicit branch/back-edge wording; yes/no defaults are supplied by the renderer. */
  label?: LocalizedText;
}

export interface FlowSection {
  id: string;
  title: LocalizedText;
  summary?: LocalizedText;
  nodes: readonly FlowNode[];
  edges: readonly FlowEdge[];
}

export interface AlgorithmFlow {
  algorithmId: string;
  sections: readonly FlowSection[];
}
