import {
  linkedListSnapshotSchema,
  type LinkedListSnapshot,
} from '../trace/schema';

/**
 * Stage 7C pure model for a singly linked list.
 *
 * The Python Trace records Node identities (`n1`, `n2`, ...), their `nextId`
 * references and the HEAD id. This layer derives the visible main chain by
 * following `headId -> nextId`; it never uses the `nodes` array order or the
 * displayed values as identity. Nodes that are not reachable from HEAD are kept
 * separately so a just-created node or a just-detached node stays visible.
 */
export type LinkedListNodeStatus = 'linked' | 'temporary' | 'detached';
export type LinkedListNodeRole = 'head' | 'tail' | 'both' | 'member';

export interface LinkedListNodeVisual {
  id: string;
  value: unknown;
  nextId: string | null;
  index: number;
  role: LinkedListNodeRole;
  active: boolean;
  changed: boolean;
  reachable: boolean;
  status: LinkedListNodeStatus;
}

export interface LinkedListEdgeVisual {
  fromId: string;
  toId: string;
  changed: boolean;
  active: boolean;
}

export interface LinkedListChangeVisual {
  nodeId: string;
  beforeNextId: string | null;
  afterNextId: string | null;
}

export interface LinkedListVisualModel {
  kind: 'linked-list';
  operation: LinkedListSnapshot['operation'];
  headId: string | null;
  /** Main chain in HEAD -> NULL order. */
  nodes: LinkedListNodeVisual[];
  /** Unreachable Node objects, preserved in the order Python registered them. */
  detachedNodes: LinkedListNodeVisual[];
  edges: LinkedListEdgeVisual[];
  change?: LinkedListChangeVisual;
  empty: boolean;
  label: string;
}

/**
 * Model-boundary validation. Adapter and schema already reject malformed
 * payloads, but model tests and imported packs may call this directly. The
 * schema also rejects cycles, so the chain walk below is finite.
 */
export function isRenderableLinkedList(value: unknown): value is LinkedListSnapshot {
  return linkedListSnapshotSchema.safeParse(value).success;
}

function statusFor(
  snapshot: LinkedListSnapshot,
  id: string,
  reachable: boolean,
): LinkedListNodeStatus {
  if (reachable) return 'linked';
  if (
    snapshot.targetId === id &&
    (snapshot.operation === 'create' || snapshot.operation === 'set-next')
  ) {
    return 'temporary';
  }
  return 'detached';
}

function roleFor(index: number, length: number): LinkedListNodeRole {
  if (length === 1) return 'both';
  if (index === 0) return 'head';
  if (index === length - 1) return 'tail';
  return 'member';
}

function toVisual(
  snapshot: LinkedListSnapshot,
  node: LinkedListSnapshot['nodes'][number],
  index: number,
  length: number,
  reachable: boolean,
): LinkedListNodeVisual {
  return {
    id: node.id,
    value: node.value,
    nextId: node.nextId,
    index,
    role: roleFor(index, length),
    active:
      snapshot.targetId === node.id &&
      (snapshot.operation === 'visit' ||
        snapshot.operation === 'create' ||
        snapshot.operation === 'detach'),
    changed: snapshot.change?.nodeId === node.id,
    reachable,
    status: statusFor(snapshot, node.id, reachable),
  };
}

export function buildLinkedListModel(
  snapshot: unknown,
  emptyLabel: string,
): LinkedListVisualModel | null {
  const parsed = linkedListSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) return null;
  const value = parsed.data;

  const byId = new Map(value.nodes.map((node) => [node.id, node]));
  const chain: LinkedListSnapshot['nodes'] = [];
  const seen = new Set<string>();
  let currentId = value.headId;
  while (currentId !== null && !seen.has(currentId)) {
    const node = byId.get(currentId);
    if (!node) break;
    seen.add(currentId);
    chain.push(node);
    currentId = node.nextId;
  }

  const nodes = chain.map((node, index) =>
    toVisual(value, node, index, chain.length, true),
  );
  const detachedNodes = value.nodes
    .filter((node) => !seen.has(node.id))
    .map((node) => toVisual(value, node, -1, 0, false));

  const edges: LinkedListEdgeVisual[] = [];
  for (let index = 0; index < chain.length - 1; index += 1) {
    const from = chain[index];
    const to = chain[index + 1];
    if (from.nextId !== to.id) continue;
    edges.push({
      fromId: from.id,
      toId: to.id,
      changed: value.change?.nodeId === from.id,
      active: value.change?.nodeId === from.id,
    });
  }

  return {
    kind: 'linked-list',
    operation: value.operation,
    headId: value.headId,
    nodes,
    detachedNodes,
    edges,
    ...(value.change
      ? {
          change: {
            nodeId: value.change.nodeId,
            beforeNextId: value.change.beforeNextId,
            afterNextId: value.change.afterNextId,
          },
        }
      : {}),
    empty: nodes.length === 0 && detachedNodes.length === 0,
    label: emptyLabel,
  };
}
