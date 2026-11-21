import type { LocalizedText } from '../../lessons/types';
import type {
  FlowEdge,
  FlowEdgeKind,
  FlowEndTone,
  FlowNode,
  FlowNodeKind,
  FlowSection,
} from '../flowTypes';

/** Local tuple shorthand: every authored string must arrive in both languages. */
export type BilingualPair = readonly [zh: string, en: string];

export const flowText = ([zh, en]: BilingualPair): LocalizedText => ({ zh, en });

export function flowNode(
  id: string,
  kind: FlowNodeKind,
  row: number,
  lane: -1 | 0 | 1,
  label: BilingualPair,
  detail?: BilingualPair,
): FlowNode {
  return {
    id,
    kind,
    row,
    lane,
    label: flowText(label),
    ...(detail ? { detail: flowText(detail) } : {}),
  };
}

export function flowEdge(
  from: string,
  to: string,
  kind: FlowEdgeKind = 'next',
  label?: BilingualPair,
  back = false,
): FlowEdge {
  return {
    from,
    to,
    kind,
    ...(label ? { label: flowText(label) } : {}),
    ...(back ? { back: true } : {}),
  };
}

/** A repeated edge; the caller supplies the loop wording shown beside the gutter. */
export function loopEdge(
  from: string,
  to: string,
  label: BilingualPair,
  kind: FlowEdgeKind = 'next',
): FlowEdge {
  return flowEdge(from, to, kind, label, true);
}

export function flowEnd(
  id: string,
  row: number,
  lane: -1 | 0 | 1,
  tone: FlowEndTone,
  label: BilingualPair,
  detail?: BilingualPair,
): FlowNode {
  return { ...flowNode(id, 'end', row, lane, label, detail), tone };
}

export function flowSection(
  id: string,
  title: BilingualPair,
  summary: BilingualPair,
  nodes: readonly FlowNode[],
  edges: readonly FlowEdge[],
): FlowSection {
  return {
    id,
    title: flowText(title),
    summary: flowText(summary),
    nodes,
    edges,
  };
}
