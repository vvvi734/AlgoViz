/**
 * T4: pure Huffman visual model.
 *
 * One snapshot produces all three coordinated regions: the forest/tree drawing,
 * the real heapq queue and the growing code table. Nothing here re-runs Huffman
 * or guesses a "nice" tree; every flag is derived from the Python snapshot.
 */
import type { HuffmanCodeRow, HuffmanNode, HuffmanOperation, HuffmanSnapshot } from '../trace/schema';
import {
  layoutHuffmanForest,
  type HuffmanLayoutEdge,
  type HuffmanNodeRole,
} from './huffmanLayout';

export type HuffmanPhase = 'build' | 'encode' | 'done';
export type HuffmanFocus = 'queue' | 'tree' | 'codes';

export interface HuffmanVisualNode {
  id: string;
  symbol: string | null;
  weight: number;
  order: number;
  x: number;
  y: number;
  depth: number;
  role: HuffmanNodeRole;
  root: boolean;
  leaf: boolean;
  picked: boolean;
  created: boolean;
  active: boolean;
  onPath: boolean;
  encoded: boolean;
  code: string | null;
}

export interface HuffmanVisualEdge extends HuffmanLayoutEdge {
  onPath: boolean;
  picked: boolean;
  active: boolean;
}

export interface HuffmanQueueEntry {
  nodeId: string;
  symbol: string | null;
  weight: number;
  order: number;
  rank: number;
  inQueue: boolean;
  picked: boolean;
  created: boolean;
  heapIndex: number | null;
}

export interface HuffmanCodeTableRow extends HuffmanCodeRow {
  active: boolean;
}

export interface HuffmanVisualModel {
  kind: 'huffman';
  operation: HuffmanOperation;
  preset: string;
  phase: HuffmanPhase;
  focus: HuffmanFocus;
  empty: boolean;
  result: 'encoded' | 'empty' | null;
  nodes: HuffmanVisualNode[];
  edges: HuffmanVisualEdge[];
  roots: string[];
  rootId: string | null;
  activeNodeId: string | null;
  pathIds: string[];
  prefix: string;
  pickedIds: string[];
  createdId: string | null;
  createdEntry: HuffmanQueueEntry | null;
  // The real heapq array order is retained for tests; the panel sorts by
  // actual priority for reading, and labels every row with its heap position.
  queueIds: string[];
  queueEntries: HuffmanQueueEntry[];
  pickedEntries: HuffmanQueueEntry[];
  codes: HuffmanCodeTableRow[];
  leafCount: number;
  totalWeight: number;
  wpl: number | null;
  totalBits: number | null;
  fixedBitsPerChar: number | null;
  fixedBits: number | null;
  savingsPercent: number | null;
  singleSymbol: boolean;
  layoutWidth: number;
  layoutHeight: number;
  label: string;
}

export const HUFFMAN_OPERATION_LABELS: Record<HuffmanOperation, { zh: string; en: string }> = {
  init: { zh: '初始化 · 独立叶子', en: 'Initialise · independent leaves' },
  'merge-select': { zh: '取出 · 两个最小权值', en: 'Pop · two smallest weights' },
  'merge-create': { zh: '合并 · 新建父节点', en: 'Merge · create parent' },
  'merge-requeue': { zh: '回队 · 新父重新入堆', en: 'Requeue · parent returns to heap' },
  'build-done': { zh: '建树完成', en: 'Tree complete' },
  'encode-start': { zh: '编码 · 从根出发', en: 'Encode · start at root' },
  'encode-left': { zh: '编码 · 走左分支 0', en: 'Encode · take left 0' },
  'encode-right': { zh: '编码 · 走右分支 1', en: 'Encode · take right 1' },
  'encode-leaf': { zh: '编码 · 到达叶子', en: 'Encode · leaf reached' },
  done: { zh: '完成 · 编码表', en: 'Done · code table' },
};

const PHASE: Record<HuffmanOperation, HuffmanPhase> = {
  init: 'build',
  'merge-select': 'build',
  'merge-create': 'build',
  'merge-requeue': 'build',
  'build-done': 'build',
  'encode-start': 'encode',
  'encode-left': 'encode',
  'encode-right': 'encode',
  'encode-leaf': 'encode',
  done: 'done',
};

const FOCUS: Record<HuffmanOperation, HuffmanFocus> = {
  init: 'queue',
  'merge-select': 'queue',
  'merge-create': 'tree',
  'merge-requeue': 'queue',
  'build-done': 'tree',
  'encode-start': 'tree',
  'encode-left': 'tree',
  'encode-right': 'tree',
  'encode-leaf': 'codes',
  done: 'codes',
};

function priority(node: Pick<HuffmanNode, 'weight' | 'order'>): [number, number] {
  return [node.weight, node.order];
}

function rootsOf(nodes: readonly HuffmanNode[]): HuffmanNode[] {
  const childIds = new Set<string>();
  for (const node of nodes) {
    if (node.leftId) childIds.add(node.leftId);
    if (node.rightId) childIds.add(node.rightId);
  }
  return nodes
    .filter((node) => !childIds.has(node.id))
    .sort((a, b) => a.weight - b.weight || a.order - b.order);
}

export function buildHuffmanModel(
  snapshot: HuffmanSnapshot,
  emptyLabel: string,
): HuffmanVisualModel | null {
  const nodes = snapshot.nodes;
  if (nodes.length === 0 && snapshot.operation !== 'init' && snapshot.operation !== 'done') {
    return null;
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (byId.size !== nodes.length) return null;
  const roots = rootsOf(nodes);
  const rootSet = new Set(roots.map((node) => node.id));
  const layout = layoutHuffmanForest(nodes, roots.map((node) => node.id));
  if (nodes.length > 0 && layout.nodes.length !== nodes.length) return null;

  const layoutById = new Map(layout.nodes.map((node) => [node.id, node]));
  const codeByNode = new Map(snapshot.codes.map((row) => [row.nodeId, row]));
  const pathSet = new Set(snapshot.pathIds);
  const pathEdges = new Set<string>();
  for (let index = 1; index < snapshot.pathIds.length; index += 1) {
    pathEdges.add(`${snapshot.pathIds[index - 1]}->${snapshot.pathIds[index]}`);
  }

  const visualNodes: HuffmanVisualNode[] = [];
  for (const node of nodes) {
    const pos = layoutById.get(node.id);
    if (!pos) return null;
    visualNodes.push({
      id: node.id,
      symbol: node.symbol,
      weight: node.weight,
      order: node.order,
      x: pos.x,
      y: pos.y,
      depth: pos.depth,
      role: pos.role,
      root: rootSet.has(node.id),
      leaf: node.leftId === null,
      picked: snapshot.pickedIds?.includes(node.id) ?? false,
      created: snapshot.createdId === node.id,
      active: snapshot.activeNodeId === node.id,
      onPath: pathSet.has(node.id),
      encoded: codeByNode.has(node.id),
      code: codeByNode.get(node.id)?.code ?? null,
    });
  }

  const visualEdges: HuffmanVisualEdge[] = layout.edges.map((edge) => {
    const active = edge.toId === snapshot.activeNodeId;
    return {
      ...edge,
      onPath: pathEdges.has(`${edge.fromId}->${edge.toId}`),
      picked: snapshot.pickedIds?.includes(edge.toId) ?? false,
      active,
    };
  });

  const queueIds = snapshot.queueIds;
  const queueSet = new Set(queueIds);
  const actualHeapIndex = new Map(queueIds.map((id, index) => [id, index]));
  const queueEntries = [...queueIds]
    .map((id) => byId.get(id))
    .filter((node): node is HuffmanNode => Boolean(node))
    .sort((a, b) => {
      const pa = priority(a);
      const pb = priority(b);
      return pa[0] - pb[0] || pa[1] - pb[1];
    })
    .map((node, index) => ({
      nodeId: node.id,
      symbol: node.symbol,
      weight: node.weight,
      order: node.order,
      rank: index + 1,
      inQueue: true,
      picked: false,
      created: snapshot.createdId === node.id,
      heapIndex: actualHeapIndex.get(node.id) ?? null,
    }));

  const pickedEntries: HuffmanQueueEntry[] = (snapshot.pickedIds ?? [])
    .filter((id) => !queueSet.has(id) && byId.has(id))
    .map((id) => {
      const node = byId.get(id)!;
      return {
        nodeId: node.id,
        symbol: node.symbol,
        weight: node.weight,
        order: node.order,
        rank: 0,
        inQueue: false,
        picked: true,
        created: snapshot.createdId === node.id,
        heapIndex: actualHeapIndex.get(id) ?? null,
      };
    });

  const createdNode = snapshot.createdId ? byId.get(snapshot.createdId) : undefined;
  const createdEntry: HuffmanQueueEntry | null =
    createdNode && !queueSet.has(createdNode.id)
      ? {
          nodeId: createdNode.id,
          symbol: createdNode.symbol,
          weight: createdNode.weight,
          order: createdNode.order,
          rank: 0,
          inQueue: false,
          picked: false,
          created: true,
          heapIndex: null,
        }
      : null;

  const codes: HuffmanCodeTableRow[] = snapshot.codes.map((row) => ({
    ...row,
    active: row.nodeId === snapshot.activeNodeId,
  }));

  const metrics = snapshot.metrics;
  const leafCount = metrics?.leafCount ?? nodes.filter((node) => node.leftId === null).length;
  const totalWeight = metrics?.totalWeight ?? nodes
    .filter((node) => node.leftId === null)
    .reduce((sum, node) => sum + node.weight, 0);
  const fixedBits = metrics?.fixedBits ?? null;
  const totalBits = metrics?.totalBits ?? null;
  const savingsPercent =
    fixedBits !== null && totalBits !== null && fixedBits > 0
      ? Math.round(((fixedBits - totalBits) / fixedBits) * 1000) / 10
      : null;

  return {
    kind: 'huffman',
    operation: snapshot.operation,
    preset: snapshot.preset,
    phase: PHASE[snapshot.operation],
    focus: FOCUS[snapshot.operation],
    empty: nodes.length === 0,
    result: snapshot.result,
    nodes: visualNodes,
    edges: visualEdges,
    roots: roots.map((node) => node.id),
    rootId: roots.length === 1 ? roots[0]!.id : null,
    activeNodeId: snapshot.activeNodeId,
    pathIds: snapshot.pathIds,
    prefix: snapshot.prefix,
    pickedIds: snapshot.pickedIds ?? [],
    createdId: snapshot.createdId,
    createdEntry,
    queueIds: [...queueIds],
    queueEntries,
    pickedEntries,
    codes,
    leafCount,
    totalWeight,
    wpl: metrics?.wpl ?? null,
    totalBits,
    fixedBitsPerChar: metrics?.fixedBitsPerChar ?? null,
    fixedBits,
    savingsPercent,
    singleSymbol: leavesOf(nodes).length === 1,
    layoutWidth: layout.width,
    layoutHeight: layout.height,
    label: nodes.length === 0 ? emptyLabel : HUFFMAN_OPERATION_LABELS[snapshot.operation]?.zh ?? snapshot.operation,
  };
}

function leavesOf(nodes: readonly HuffmanNode[]): HuffmanNode[] {
  return nodes.filter((node) => node.leftId === null);
}
