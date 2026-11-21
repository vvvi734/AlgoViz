import { z } from 'zod';
import {
  GL_MAX_DEPTH,
  GL_MAX_NODES,
  formatGeneralizedList,
  generalizedListDepth,
  generalizedListEquivalent,
  parseGeneralizedList,
  type GeneralizedListNode,
} from '../generalizedList';

export const GL_MODES = ['depth', 'copy'] as const;
export type GlMode = (typeof GL_MODES)[number];

export const GL_DEPTH_OPERATIONS = [
  'init',
  'enter',
  'atom-return',
  'empty-return',
  'return',
  'done',
] as const;
export const GL_COPY_OPERATIONS = [
  'init',
  'enter',
  'alloc-list',
  'copy-atom',
  'copy-empty',
  'inspect',
  'return',
  'done',
] as const;
export const GL_OPERATIONS = [
  'init',
  'enter',
  'atom-return',
  'empty-return',
  'return',
  'alloc-list',
  'copy-atom',
  'copy-empty',
  'inspect',
  'done',
] as const;
export type GlOperation = (typeof GL_OPERATIONS)[number];

export interface GeneralizedListNodeSnapshot {
  id: string;
  kind: 'atom' | 'list';
  atom: string | null;
  /** 复制树节点对应的原节点 id；原树固定为 null。 */
  sourceId: string | null;
  children: GeneralizedListNodeSnapshot[];
}

export interface GeneralizedListDepthEntry {
  id: string;
  depth: number;
}

export interface GeneralizedListSnapshot {
  kind: 'generalized-list';
  mode: GlMode;
  operation: GlOperation;
  expression: string;
  original: GeneralizedListNodeSnapshot;
  copy: GeneralizedListNodeSnapshot | null;
  activeId: string | null;
  parentId: string | null;
  copyId: string | null;
  parentCopyId: string | null;
  depthLevel: number;
  maxChildDepth: number | null;
  currentDepth: number | null;
  depths: GeneralizedListDepthEntry[];
  resultDepth: number | null;
  copiedCount: number;
  totalNodes: number;
  resultExpression: string | null;
}

const nodeSchema: z.ZodType<GeneralizedListNodeSnapshot> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(48),
    kind: z.enum(['atom', 'list']),
    atom: z.string().min(1).max(8).nullable(),
    sourceId: z.string().min(1).max(48).nullable(),
    children: z.array(nodeSchema).max(GL_MAX_NODES),
  }),
);

const depthEntrySchema = z.object({
  id: z.string().min(1).max(48),
  depth: z.number().int().min(0).max(GL_MAX_DEPTH + 1),
});

const allowedOperations: Record<GlMode, readonly GlOperation[]> = {
  depth: GL_DEPTH_OPERATIONS,
  copy: GL_COPY_OPERATIONS,
};

function walkSnapshot(node: GeneralizedListNodeSnapshot): GeneralizedListNodeSnapshot[] {
  return [node, ...node.children.flatMap(walkSnapshot)];
}

function findSnapshot(
  node: GeneralizedListNodeSnapshot | null,
  id: string,
): GeneralizedListNodeSnapshot | null {
  if (!node) return null;
  if (node.id === id) return node;
  for (const child of node.children) {
    const hit = findSnapshot(child, id);
    if (hit) return hit;
  }
  return null;
}

function validateShape(
  node: GeneralizedListNodeSnapshot,
  expectedSourceId: string | null,
  path: (string | number)[],
  ctx: z.RefinementCtx,
): void {
  const issue = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
  if (node.sourceId !== expectedSourceId) {
    issue(`sourceId must be ${expectedSourceId === null ? 'null' : expectedSourceId}`);
  }
  if (node.kind === 'atom') {
    if (node.atom === null || node.children.length > 0) {
      issue('an atom must carry a value and have no children');
    }
  } else if (node.atom !== null) {
    issue('a list node must not carry an atom value');
  }
  for (const [index, child] of node.children.entries()) {
    validateShape(child, expectedSourceId, [...path, 'children', index], ctx);
  }
}

function validateNodeShape(
  node: GeneralizedListNodeSnapshot,
  path: (string | number)[],
  ctx: z.RefinementCtx,
): void {
  const issue = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
  if (node.kind === 'atom') {
    if (node.atom === null || node.children.length > 0) {
      issue('an atom must carry a value and have no children');
    }
  } else if (node.atom !== null) {
    issue('a list node must not carry an atom value');
  }
  for (const [index, child] of node.children.entries()) {
    validateNodeShape(child, [...path, 'children', index], ctx);
  }
}

function partialCopyMatchesSource(
  copyNode: GeneralizedListNodeSnapshot,
  sourceNode: GeneralizedListNodeSnapshot,
): boolean {
  if (copyNode.sourceId !== sourceNode.id) return false;
  if (copyNode.kind !== sourceNode.kind) return false;
  if (sourceNode.kind === 'atom') return copyNode.atom === sourceNode.atom;
  if (copyNode.children.length > sourceNode.children.length) return false;
  return copyNode.children.every((child, index) =>
    partialCopyMatchesSource(child, sourceNode.children[index]!),
  );
}

export const generalizedListSnapshotSchema = z
  .object({
    kind: z.literal('generalized-list'),
    mode: z.enum(GL_MODES),
    operation: z.enum(GL_OPERATIONS),
    expression: z.string().min(1).max(80),
    original: nodeSchema,
    copy: nodeSchema.nullable(),
    activeId: z.string().min(1).max(48).nullable(),
    parentId: z.string().min(1).max(48).nullable(),
    copyId: z.string().min(1).max(48).nullable(),
    parentCopyId: z.string().min(1).max(48).nullable(),
    depthLevel: z.number().int().min(0).max(GL_MAX_DEPTH),
    maxChildDepth: z.number().int().min(0).max(GL_MAX_DEPTH).nullable(),
    currentDepth: z.number().int().min(0).max(GL_MAX_DEPTH + 1).nullable(),
    depths: z.array(depthEntrySchema).max(GL_MAX_NODES),
    resultDepth: z.number().int().min(0).max(GL_MAX_DEPTH + 1).nullable(),
    copiedCount: z.number().int().min(0).max(GL_MAX_NODES),
    totalNodes: z.number().int().min(1).max(GL_MAX_NODES),
    resultExpression: z.string().min(1).max(80).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    if (!allowedOperations[snapshot.mode].includes(snapshot.operation)) {
      issue(['operation'], `${snapshot.operation} is not a ${snapshot.mode} operation`);
    }

    const parsed = parseGeneralizedList(snapshot.expression);
    if (!parsed.ok) {
      issue(['expression'], `expression is invalid: ${parsed.error}`);
    } else if (formatGeneralizedList(snapshot.original) !== parsed.expression) {
      issue(['original'], 'original tree must be exactly the parsed expression');
    }

    const originalNodes = walkSnapshot(snapshot.original);
    if (originalNodes.length !== snapshot.totalNodes) {
      issue(['totalNodes'], 'totalNodes must equal the number of original nodes');
    }
    const originalIds = new Set<string>();
    for (const node of originalNodes) {
      if (originalIds.has(node.id)) issue(['original'], `duplicate original id ${node.id}`);
      originalIds.add(node.id);
      validateShape(node, null, ['original'], ctx);
    }

    const copyNodes = snapshot.copy ? walkSnapshot(snapshot.copy) : [];
    const copyIds = new Set<string>();
    for (const node of copyNodes) {
      if (copyIds.has(node.id)) issue(['copy'], `duplicate copy id ${node.id}`);
      copyIds.add(node.id);
      if (node.sourceId === null || !originalIds.has(node.sourceId)) {
        issue(['copy'], `copy node ${node.id} must reference an original node`);
      }
      validateNodeShape(node, ['copy'], ctx);
    }
    if (snapshot.copy && !partialCopyMatchesSource(snapshot.copy, snapshot.original)) {
      issue(['copy'], 'copy tree must match the source structure as a prefix');
    }
    if (snapshot.copiedCount !== copyNodes.length) {
      issue(['copiedCount'], 'copiedCount must equal the number of allocated copy nodes');
    }

    const active = snapshot.activeId ? findSnapshot(snapshot.original, snapshot.activeId) : null;
    if (snapshot.activeId !== null && !active) issue(['activeId'], 'activeId must exist in original');
    const parent = snapshot.parentId ? findSnapshot(snapshot.original, snapshot.parentId) : null;
    if (snapshot.parentId !== null && !parent) issue(['parentId'], 'parentId must exist in original');
    if (parent && active && !parent.children.some((child) => child.id === active.id)) {
      issue(['parentId'], 'parentId must contain activeId as a direct child');
    }
    const copyNode = snapshot.copyId ? findSnapshot(snapshot.copy, snapshot.copyId) : null;
    if (snapshot.copyId !== null && !copyNode) issue(['copyId'], 'copyId must exist in copy tree');
    const parentCopy = snapshot.parentCopyId
      ? findSnapshot(snapshot.copy, snapshot.parentCopyId)
      : null;
    if (snapshot.parentCopyId !== null && !parentCopy) {
      issue(['parentCopyId'], 'parentCopyId must exist in copy tree');
    }
    if (
      parentCopy &&
      copyNode &&
      snapshot.operation !== 'inspect' &&
      !parentCopy.children.some((child) => child.id === copyNode.id)
    ) {
      issue(['parentCopyId'], 'parentCopyId must contain copyId as a direct child');
    }
    if (snapshot.operation === 'inspect' && snapshot.copyId !== snapshot.parentCopyId) {
      issue(['copyId'], 'inspect must focus the destination copy list itself');
    }

    if (snapshot.operation === 'init') {
      if (snapshot.activeId !== null || snapshot.parentId !== null || snapshot.copy !== null) {
        issue(['operation'], 'init must not focus a node or contain a copy');
      }
      if (snapshot.depths.length > 0 || snapshot.resultDepth !== null || snapshot.copyId !== null) {
        issue(['operation'], 'init must start with empty results');
      }
      if (snapshot.copiedCount !== 0 || snapshot.resultExpression !== null) {
        issue(['operation'], 'init must not report copied nodes');
      }
    }

    if (snapshot.mode === 'copy') {
      if (snapshot.depths.length > 0 || snapshot.resultDepth !== null) {
        issue(['mode'], 'copy mode must not report depth results');
      }
      if (snapshot.currentDepth !== null || snapshot.maxChildDepth !== null) {
        issue(['mode'], 'copy mode must not report depth arithmetic');
      }
    } else {
      if (snapshot.copy !== null || snapshot.copyId !== null || snapshot.parentCopyId !== null) {
        issue(['mode'], 'depth mode must not contain a copy tree');
      }
      if (snapshot.copiedCount !== 0 || snapshot.resultExpression !== null) {
        issue(['mode'], 'depth mode must not report copy results');
      }
    }

    const depthIds = new Map<string, number>();
    for (const entry of snapshot.depths) {
      if (!originalIds.has(entry.id)) issue(['depths'], `unknown depth id ${entry.id}`);
      if (depthIds.has(entry.id)) issue(['depths'], `duplicate depth id ${entry.id}`);
      depthIds.set(entry.id, entry.depth);
    }

    if (snapshot.operation === 'atom-return') {
      if (!active || active.kind !== 'atom') issue(['operation'], 'atom-return needs an active atom');
      if (depthIds.get(snapshot.activeId!) !== 0) issue(['depths'], 'atom-return must record depth 0');
      if (snapshot.currentDepth !== 0) issue(['currentDepth'], 'atom-return must return 0');
    }
    if (snapshot.operation === 'empty-return') {
      if (!active || active.kind !== 'list' || active.children.length > 0) {
        issue(['operation'], 'empty-return needs an active empty list');
      }
      if (depthIds.get(snapshot.activeId!) !== 1) issue(['depths'], 'empty-return must record depth 1');
      if (snapshot.currentDepth !== 1) issue(['currentDepth'], 'empty-return must return 1');
    }
    if (snapshot.operation === 'return' && snapshot.mode === 'depth') {
      if (!active || active.kind !== 'list' || active.children.length === 0) {
        issue(['operation'], 'return needs a non-empty active list');
      }
      if (snapshot.currentDepth === null || snapshot.maxChildDepth === null) {
        issue(['currentDepth'], 'return must report child-max and current depth');
      } else if (snapshot.currentDepth !== snapshot.maxChildDepth + 1) {
        issue(['currentDepth'], 'list depth must be maxChildDepth + 1');
      }
      if (active && snapshot.currentDepth !== null) {
        const childDepths = active.children.map((child) => depthIds.get(child.id));
        if (childDepths.some((value) => value === undefined)) {
          issue(['depths'], 'all children must have a resolved depth before a list returns');
        } else if (Math.max(...(childDepths as number[])) !== snapshot.maxChildDepth) {
          issue(['maxChildDepth'], 'maxChildDepth must equal the largest child depth');
        }
        if (depthIds.get(active.id) !== snapshot.currentDepth) {
          issue(['depths'], 'return must record the active list depth');
        }
      }
    }

    if (snapshot.mode === 'depth' && snapshot.operation === 'done') {
      if (snapshot.resultDepth !== generalizedListDepth(snapshot.original)) {
        issue(['resultDepth'], 'done must report the root depth');
      }
      for (const node of originalNodes) {
        const expected = generalizedListDepth(node);
        if (depthIds.get(node.id) !== expected) {
          issue(['depths'], `done must record depth ${expected} for ${node.id}`);
        }
      }
    }

    if (snapshot.operation === 'alloc-list') {
      if (!active || active.kind !== 'list' || !copyNode || copyNode.kind !== 'list') {
        issue(['operation'], 'alloc-list needs an active list and a copied list node');
      }
      if (copyNode && copyNode.children.length !== 0) {
        issue(['copy'], 'alloc-list must allocate an empty list node');
      }
    }
    if (snapshot.operation === 'copy-atom') {
      if (!active || active.kind !== 'atom' || !copyNode || copyNode.kind !== 'atom') {
        issue(['operation'], 'copy-atom needs an active atom and a copied atom');
      }
    }
    if (snapshot.operation === 'copy-empty') {
      if (!active || active.kind !== 'list' || active.children.length > 0) {
        issue(['operation'], 'copy-empty needs an active empty list');
      }
      if (!copyNode || copyNode.kind !== 'list' || copyNode.children.length > 0) {
        issue(['copy'], 'copy-empty must create an empty list node');
      }
    }
    if (snapshot.mode === 'copy' && snapshot.operation === 'done') {
      if (!snapshot.copy) issue(['copy'], 'done must contain the finished copy');
      if (snapshot.copiedCount !== originalNodes.length) {
        issue(['copiedCount'], 'done must copy every original node');
      }
      if (snapshot.copy && !generalizedListEquivalent(snapshot.copy, snapshot.original)) {
        issue(['copy'], 'done copy must be structurally equivalent to the original');
      }
      if (snapshot.copy && snapshot.resultExpression !== formatGeneralizedList(snapshot.copy)) {
        issue(['resultExpression'], 'resultExpression must describe the copied tree');
      }
    }
  });

export type GeneralizedListSnapshotType = z.infer<typeof generalizedListSnapshotSchema>;

/** 供测试和可视化模型使用：把 Schema 节点转成共享树类型。 */
export function snapshotToGeneralizedList(node: GeneralizedListNodeSnapshot): GeneralizedListNode {
  return {
    id: node.id,
    kind: node.kind,
    atom: node.atom,
    children: node.children.map(snapshotToGeneralizedList),
  };
}
