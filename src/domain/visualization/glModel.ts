import type {
  GeneralizedListSnapshot,
  GeneralizedListNodeSnapshot,
} from '../trace/generalizedListSchema';

const ATOM_WIDTH = 40;
const LIST_WIDTH = 54;
const NODE_HEIGHT = 34;
const X_GAP = 18;
const LEVEL_GAP = 72;
const PADDING = 24;

export interface GlVisualNode {
  id: string;
  kind: 'atom' | 'list';
  atom: string | null;
  sourceId: string | null;
  empty: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  tone: 'normal' | 'active' | 'parent' | 'done' | 'copied';
  depth: number | null;
}

export interface GlTreeLayout {
  width: number;
  height: number;
  nodes: GlVisualNode[];
  edges: Array<{ from: string; to: string }>;
}

export interface GlDepthRow {
  id: string;
  kind: 'atom' | 'list';
  atom: string | null;
  depth: number;
  active: boolean;
}

export interface GeneralizedListVisualModel {
  kind: 'generalized-list';
  mode: 'depth' | 'copy';
  operation: GeneralizedListSnapshot['operation'];
  expression: string;
  activeId: string | null;
  parentId: string | null;
  copyId: string | null;
  parentCopyId: string | null;
  depthLevel: number;
  maxChildDepth: number | null;
  currentDepth: number | null;
  resultDepth: number | null;
  copiedCount: number;
  totalNodes: number;
  resultExpression: string | null;
  original: GlTreeLayout;
  copy: GlTreeLayout | null;
  depthRows: GlDepthRow[];
}

function nodeWidth(node: GeneralizedListNodeSnapshot): number {
  if (node.kind === 'atom') return ATOM_WIDTH;
  if (node.children.length === 0) return LIST_WIDTH;
  return Math.max(LIST_WIDTH, node.children.reduce((sum, child) => sum + nodeWidth(child), 0) +
    X_GAP * (node.children.length - 1));
}

function layoutTree(
  root: GeneralizedListNodeSnapshot,
  options: {
    activeId: string | null;
    parentId: string | null;
    depthById: Map<string, number>;
    copy: boolean;
  },
): GlTreeLayout {
  interface Planned {
    node: GeneralizedListNodeSnapshot;
    x: number;
    y: number;
    width: number;
  }
  const planned: Planned[] = [];
  const edges: Array<{ from: string; to: string }> = [];

  const place = (node: GeneralizedListNodeSnapshot, left: number, level: number): number => {
    const width = nodeWidth(node);
    const x = left + width / 2;
    const y = PADDING + level * LEVEL_GAP;
    planned.push({ node, x, y, width });
    if (node.children.length > 0) {
      const childrenWidth = node.children.reduce((sum, child) => sum + nodeWidth(child), 0) +
        X_GAP * (node.children.length - 1);
      let childLeft = left + (width - childrenWidth) / 2;
      for (const child of node.children) {
        edges.push({ from: node.id, to: child.id });
        place(child, childLeft, level + 1);
        childLeft += nodeWidth(child) + X_GAP;
      }
    }
    return width;
  };

  const width = place(root, PADDING, 0);
  const maxLevel = planned.reduce((max, item) => Math.max(max, (item.y - PADDING) / LEVEL_GAP), 0);
  const nodes: GlVisualNode[] = planned.map(({ node, x, y, width: nodeBoxWidth }) => {
    let tone: GlVisualNode['tone'] = options.copy ? 'copied' : 'normal';
    if (node.id === options.activeId) tone = 'active';
    else if (node.id === options.parentId) tone = 'parent';
    else if (options.depthById.has(node.id)) tone = 'done';
    return {
      id: node.id,
      kind: node.kind,
      atom: node.atom,
      sourceId: node.sourceId,
      empty: node.kind === 'list' && node.children.length === 0,
      x,
      y,
      width: nodeBoxWidth,
      height: NODE_HEIGHT,
      tone,
      depth: options.depthById.get(node.id) ?? null,
    };
  });

  return {
    width: Math.max(360, width + PADDING * 2),
    height: Math.max(240, (maxLevel + 1) * LEVEL_GAP + PADDING * 2 + 16),
    nodes,
    edges,
  };
}

/**
 * 把经过 Schema 校验的快照转成可直接绘制的纯模型。
 * 深度账本按原树先序排列，画布只负责几何，不重新解释递归。
 */
export function buildGeneralizedListModel(snapshot: GeneralizedListSnapshot): GeneralizedListVisualModel {
  const depthById = new Map(snapshot.depths.map((entry) => [entry.id, entry.depth]));
  const original = layoutTree(snapshot.original, {
    activeId: snapshot.activeId,
    parentId: snapshot.parentId,
    depthById,
    copy: false,
  });
  const copy = snapshot.copy
    ? layoutTree(snapshot.copy, {
        activeId: snapshot.operation === 'done' ? null : snapshot.copyId,
        parentId: snapshot.operation === 'done' ? null : snapshot.parentCopyId,
        depthById: new Map(),
        copy: true,
      })
    : null;

  const depthRows: GlDepthRow[] = [];
  const collect = (node: GeneralizedListNodeSnapshot): void => {
    const depth = depthById.get(node.id);
    if (depth !== undefined) {
      depthRows.push({
        id: node.id,
        kind: node.kind,
        atom: node.atom,
        depth,
        active: node.id === snapshot.activeId,
      });
    }
    node.children.forEach(collect);
  };
  collect(snapshot.original);

  return {
    kind: 'generalized-list',
    mode: snapshot.mode,
    operation: snapshot.operation,
    expression: snapshot.expression,
    activeId: snapshot.activeId,
    parentId: snapshot.parentId,
    copyId: snapshot.copyId,
    parentCopyId: snapshot.parentCopyId,
    depthLevel: snapshot.depthLevel,
    maxChildDepth: snapshot.maxChildDepth,
    currentDepth: snapshot.currentDepth,
    resultDepth: snapshot.resultDepth,
    copiedCount: snapshot.copiedCount,
    totalNodes: snapshot.totalNodes,
    resultExpression: snapshot.resultExpression,
    original,
    copy,
    depthRows,
  };
}
