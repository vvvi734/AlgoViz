import type {
  AdvancedLinkedListOperation,
  AdvancedLinkedListSnapshot,
  DoublyLinkedListSnapshot,
  LinkedSnapshotPhase,
} from '../trace/schema';

/**
 * Pure model for the L1A pointer canvases. Node identity and pointer values are
 * copied from the validated snapshot; layout is the only thing added here.
 *
 * The chain is walked from `headId` using the real `nextId` values. A doubly
 * list stops at `null`; a circular list stops when it returns to head, so a
 * cycle can never make this builder loop forever.
 */
export type AdvancedLinkedNodeRole = 'head' | 'tail' | 'both' | 'member';

export interface AdvancedLinkedNodeModel {
  id: string;
  value: unknown;
  index: number;
  role: AdvancedLinkedNodeRole;
  active: boolean;
  changed: boolean;
  detached: boolean;
  prevId: string | null;
  nextId: string | null;
  /** Present only for the doubly-linked variant. */
  hasPrev: boolean;
}

export interface AdvancedLinkedEdgeModel {
  id: string;
  fromId: string;
  toId: string;
  field: 'prev' | 'next';
  changed: boolean;
  /** A tail.next -> head return edge, drawn differently from a normal next edge. */
  circular: boolean;
  selfLoop: boolean;
}

export interface AdvancedLinkedListVisualModel {
  kind: 'doubly-linked-list' | 'circular-linked-list';
  operation: AdvancedLinkedListOperation;
  phase: LinkedSnapshotPhase;
  headId: string | null;
  tailId: string | null;
  nodes: AdvancedLinkedNodeModel[];
  detachedNodes: AdvancedLinkedNodeModel[];
  edges: AdvancedLinkedEdgeModel[];
  change?: {
    nodeId: string;
    field: 'prev' | 'next';
    beforeId: string | null;
    afterId: string | null;
  };
  targetId?: string;
  searchValue?: unknown;
  found?: boolean;
  empty: boolean;
  single: boolean;
}

export function buildAdvancedLinkedListModel(
  snapshot: AdvancedLinkedListSnapshot,
): AdvancedLinkedListVisualModel {
  const isDoubly = snapshot.kind === 'doubly-linked-list';
  const byId = new Map(snapshot.nodes.map((node) => [node.id, node]));

  // Walk the real next references. The seen guard is a defensive stop for an
  // intermediate frame; the schema already rejects a completed cycle in a
  // doubly list and a broken return in a circular list.
  const chain: Array<(typeof snapshot.nodes)[number]> = [];
  const seen = new Set<string>();
  let current = snapshot.headId;
  while (current !== null && !seen.has(current) && chain.length < snapshot.nodes.length) {
    const node = byId.get(current);
    if (!node) break;
    seen.add(current);
    chain.push(node);
    if (!isDoubly && node.nextId === snapshot.headId) break;
    current = node.nextId;
  }

  const nodes: AdvancedLinkedNodeModel[] = chain.map((node, index) => {
    const role: AdvancedLinkedNodeRole =
      chain.length === 1 && (snapshot.headId === node.id || snapshot.tailId === node.id)
        ? 'both'
        : snapshot.headId === node.id
          ? 'head'
          : snapshot.tailId === node.id
            ? 'tail'
            : 'member';
    return {
      id: node.id,
      value: node.value,
      index,
      role,
      active: snapshot.targetId === node.id,
      changed: snapshot.change?.nodeId === node.id,
      detached: false,
      prevId: 'prevId' in node ? (node.prevId as string | null) : null,
      nextId: node.nextId,
      hasPrev: 'prevId' in node,
    };
  });

  const detachedNodes: AdvancedLinkedNodeModel[] = snapshot.nodes
    .filter((node) => !seen.has(node.id))
    .map((node, index) => ({
      id: node.id,
      value: node.value,
      index,
      role: 'member',
      active: snapshot.targetId === node.id,
      changed: snapshot.change?.nodeId === node.id,
      detached: true,
      prevId: 'prevId' in node ? (node.prevId as string | null) : null,
      nextId: node.nextId,
      hasPrev: 'prevId' in node,
    }));

  const indexById = new Map(nodes.map((node, index) => [node.id, index]));
  const edges: AdvancedLinkedEdgeModel[] = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const from = nodes[index];
    if (from.nextId !== null) {
      const toIndex = indexById.get(from.nextId);
      if (!isDoubly && index === nodes.length - 1 && from.nextId === snapshot.headId) {
        edges.push({
          id: `${from.id}->${nodes[0].id}:circular`,
          fromId: from.id,
          toId: nodes[0].id,
          field: 'next',
          changed: snapshot.change?.nodeId === from.id && snapshot.change.field === 'next',
          circular: true,
          selfLoop: nodes.length === 1,
        });
      } else if (toIndex === index + 1) {
        edges.push({
          id: `${from.id}->${nodes[toIndex].id}:next`,
          fromId: from.id,
          toId: nodes[toIndex].id,
          field: 'next',
          changed: snapshot.change?.nodeId === from.id && snapshot.change.field === 'next',
          circular: false,
          selfLoop: false,
        });
      }
    }
    if (isDoubly && from.prevId !== null) {
      const toIndex = indexById.get(from.prevId);
      if (toIndex === index - 1) {
        edges.push({
          id: `${from.id}->${nodes[toIndex].id}:prev`,
          fromId: from.id,
          toId: nodes[toIndex].id,
          field: 'prev',
          changed: snapshot.change?.nodeId === from.id && snapshot.change.field === 'prev',
          circular: false,
          selfLoop: false,
        });
      }
    }
  }

  return {
    kind: snapshot.kind,
    operation: snapshot.operation,
    phase: snapshot.phase,
    headId: snapshot.headId,
    tailId: snapshot.tailId,
    nodes,
    detachedNodes,
    edges,
    change: snapshot.change,
    targetId: snapshot.targetId,
    searchValue: snapshot.searchValue,
    found: snapshot.found,
    empty: nodes.length === 0,
    single: nodes.length === 1,
  };
}

/** Narrowing helper kept next to the model so tests do not need a cast. */
export function isDoublyModel(model: AdvancedLinkedListVisualModel): boolean {
  return (model.kind as DoublyLinkedListSnapshot['kind']) === 'doubly-linked-list';
}
