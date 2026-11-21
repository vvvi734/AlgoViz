/**
 * INPUT-05: structured inputs for the four tree courses that already have real
 * Python traces. The UI only chooses values; every accepted draft becomes the
 * exact object the existing BST / AVL / B-tree / traversal programs consume.
 */
import type { TreeMode } from './treeTraversalExamples';

export const TREE_GUIDED_INPUT_ALGORITHMS = ['inorder', 'threaded-inorder', 'bst', 'avl', 'btree'] as const;
export type TreeGuidedInputAlgorithm = (typeof TREE_GUIDED_INPUT_ALGORITHMS)[number];

export const TREE_INPUT_LIMITS = {
  MAX_NODES: 15,
  MAX_LEVEL_SLOTS: 31,
  MAX_BST_NODES: 15,
  MAX_AVL_NODES: 15,
  MAX_BTREE_KEYS: 12,
  VALUE_ABS_MAX: 1_000_000,
} as const;

export interface TreeInputFields {
  /** Traversal level-order tokens, or a BST/AVL/B-tree insertion sequence. */
  values: string;
  target: string;
  command: string;
  mode: string;
}

export interface TreeInputError {
  key: string;
  max?: number;
}

export type TreeBuildResult =
  | { ok: true; input: unknown }
  | { ok: false; error: TreeInputError };

export interface TreeRandomScenario {
  id: string;
  label: [zh: string, en: string];
}

export const TREE_RANDOM_SCENARIOS: Record<
  TreeGuidedInputAlgorithm,
  readonly TreeRandomScenario[]
> = {
  inorder: [
    { id: 'ordinary', label: ['普通二叉树', 'Ordinary tree'] },
    { id: 'left', label: ['左偏树', 'Left-skewed tree'] },
    { id: 'right', label: ['右偏树', 'Right-skewed tree'] },
    { id: 'balanced', label: ['相对平衡树', 'Balanced tree'] },
  ],
  'threaded-inorder': [
    { id: 'ordinary', label: ['普通二叉树', 'Ordinary tree'] },
    { id: 'left', label: ['左偏树', 'Left-skewed tree'] },
    { id: 'right', label: ['右偏树', 'Right-skewed tree'] },
    { id: 'balanced', label: ['相对平衡树', 'Balanced tree'] },
  ],
  bst: [
    { id: 'insert', label: ['普通插入', 'Ordinary insert'] },
    { id: 'find-hit', label: ['查找成功', 'Successful lookup'] },
    { id: 'find-miss', label: ['查找失败', 'Failed lookup'] },
    { id: 'delete-leaf', label: ['删除叶子', 'Delete leaf'] },
    { id: 'delete-one', label: ['删除单孩子节点', 'Delete one-child node'] },
    { id: 'delete-two', label: ['删除双孩子节点', 'Delete two-child node'] },
  ],
  avl: [
    { id: 'll', label: ['LL 旋转', 'LL rotation'] },
    { id: 'rr', label: ['RR 旋转', 'RR rotation'] },
    { id: 'lr', label: ['LR 旋转', 'LR rotation'] },
    { id: 'rl', label: ['RL 旋转', 'RL rotation'] },
    { id: 'balanced', label: ['无需旋转', 'No rotation'] },
  ],
  btree: [
    { id: 'insert-leaf', label: ['普通叶子插入', 'Ordinary leaf insert'] },
    { id: 'split-child', label: ['子节点分裂', 'Child split'] },
    { id: 'split-root', label: ['根节点分裂', 'Root split'] },
    { id: 'find-hit', label: ['查找成功', 'Successful lookup'] },
    { id: 'find-miss', label: ['查找失败', 'Failed lookup'] },
    { id: 'delete-leaf', label: ['删除叶子关键字', 'Delete a leaf key'] },
    { id: 'delete-borrow', label: ['删除并借位', 'Delete with borrow'] },
    { id: 'delete-merge', label: ['删除并合并', 'Delete with merge'] },
    { id: 'delete-root-shrink', label: ['删除并收缩根', 'Delete and shrink root'] },
  ],
};

export const TREE_TRAVERSAL_MODES: readonly { id: TreeMode; label: string }[] = [
  { id: 'preorder', label: 'treeModePreorder' },
  { id: 'inorder', label: 'treeModeInorder' },
  { id: 'postorder', label: 'treeModePostorder' },
  { id: 'levelorder', label: 'treeModeLevelorder' },
];

export const TREE_COMMANDS: Record<TreeGuidedInputAlgorithm, readonly string[]> = {
  inorder: [],
  'threaded-inorder': [],
  bst: ['find', 'insert', 'delete'],
  avl: ['insert'],
  btree: ['find', 'insert', 'delete'],
};

export function treeDraftFromInput(
  id: TreeGuidedInputAlgorithm,
  input: unknown,
): TreeInputFields {
  if (id === 'inorder' || id === 'threaded-inorder') {
    const tree = Array.isArray(input)
      ? input
      : isRecord(input) && Array.isArray(input.tree)
        ? input.tree
        : [];
    return {
      values: formatTreeTokens(tree),
      target: '',
      command: '',
      mode: id === 'threaded-inorder' ? 'inorder' : modeFromInput(input),
    };
  }
  const record = isRecord(input) ? input : {};
  return {
    values: formatIntegers(record.tree),
    target: describeNumber(record.target),
    command: treeCommandFromInput(id, record.operation),
    mode: '',
  };
}

export function buildTreeInput(id: TreeGuidedInputAlgorithm, fields: TreeInputFields): TreeBuildResult {
  if (id === 'inorder' || id === 'threaded-inorder') {
    const mode = id === 'threaded-inorder' ? 'inorder' : normalizeMode(fields.mode);
    if (!mode) return { ok: false, error: { key: 'treeErrorMode' } };
    const parsed = parseTreeTokens(fields.values);
    if (!parsed.ok) return parsed;
    return { ok: true, input: { mode, tree: parsed.tree } };
  }

  const parsed = parseIntegerSequence(fields.values, maxValuesFor(id));
  if (!parsed.ok) return parsed;
  if (hasDuplicates(parsed.values)) {
    return { ok: false, error: { key: 'treeErrorDuplicate' } };
  }
  const targets = parseTarget(fields.target);
  if (!targets.ok) return targets;
  const command = treeCommandFromInput(id, fields.command);
  if (id === 'avl') {
    if (parsed.values.includes(targets.target)) {
      return { ok: false, error: { key: 'treeErrorTargetExists' } };
    }
    return {
      ok: true,
      input: { preset: null, operation: 'insert', tree: parsed.values, target: targets.target },
    };
  }
  return {
    ok: true,
    input: {
      preset: null,
      operation: id === 'bst' ? command : command === 'insert' ? 'insert' : 'find',
      tree: parsed.values,
      target: targets.target,
    },
  };
}

export function randomTreeDraft(
  id: TreeGuidedInputAlgorithm,
  scenario: string,
  random: () => number = Math.random,
): TreeInputFields {
  if (id === 'inorder' || id === 'threaded-inorder') return randomTraversalDraft(scenario, random);
  if (id === 'bst') return randomBstDraft(scenario, random);
  if (id === 'avl') return randomAvlDraft(scenario, random);
  return randomBtreeDraft(scenario, random);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function randInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function describeNumber(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function formatIntegers(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value
    .filter((item): item is number => typeof item === 'number' && Number.isSafeInteger(item))
    .join(', ');
}

function formatTreeTokens(value: unknown[]): string {
  return value
    .map((item) => (item === null ? 'null' : describeNumber(item)))
    .filter(Boolean)
    .join(', ');
}

function modeFromInput(input: unknown): TreeMode {
  if (!isRecord(input)) return 'inorder';
  const mode = input.mode;
  return typeof mode === 'string' && isTreeMode(mode) ? mode : 'inorder';
}

function isTreeMode(value: string): value is TreeMode {
  return value === 'preorder' || value === 'inorder' || value === 'postorder' || value === 'levelorder';
}

function normalizeMode(value: string): TreeMode | null {
  return isTreeMode(value) ? value : null;
}

function treeCommandFromInput(id: TreeGuidedInputAlgorithm, value: unknown): string {
  const allowed = TREE_COMMANDS[id];
  if (typeof value === 'string' && allowed.includes(value)) return value;
  return allowed[0] ?? 'find';
}

function maxValuesFor(id: TreeGuidedInputAlgorithm): number {
  if (id === 'btree') return TREE_INPUT_LIMITS.MAX_BTREE_KEYS;
  if (id === 'bst') return TREE_INPUT_LIMITS.MAX_BST_NODES;
  return TREE_INPUT_LIMITS.MAX_AVL_NODES;
}

function parseIntegerSequence(
  raw: string,
  max: number,
): { ok: true; values: number[] } | { ok: false; error: TreeInputError } {
  const source = raw.trim().replace(/^\[\s*/u, '').replace(/\s*\]$/u, '');
  if (source === '') return { ok: false, error: { key: 'treeErrorSequence' } };
  const tokens = source.split(/[,\s，]+/u).filter(Boolean);
  if (tokens.length === 0) return { ok: false, error: { key: 'treeErrorSequence' } };
  if (tokens.length > max) return { ok: false, error: { key: 'treeErrorSequenceSize', max } };
  const values: number[] = [];
  for (const token of tokens) {
    const value = parseIntegerToken(token);
    if (value === null) return { ok: false, error: { key: 'treeErrorInteger' } };
    values.push(value);
  }
  return { ok: true, values };
}

function parseTreeTokens(
  raw: string,
): { ok: true; tree: Array<number | null> } | { ok: false; error: TreeInputError } {
  const source = raw.trim().replace(/^\[\s*/u, '').replace(/\s*\]$/u, '');
  if (source === '') return { ok: false, error: { key: 'treeErrorEmpty' } };
  const tokens = source.split(/[,\s，]+/u).filter(Boolean);
  if (tokens.length === 0) return { ok: false, error: { key: 'treeErrorEmpty' } };
  if (tokens.length > TREE_INPUT_LIMITS.MAX_LEVEL_SLOTS) {
    return { ok: false, error: { key: 'treeErrorSlots', max: TREE_INPUT_LIMITS.MAX_LEVEL_SLOTS } };
  }

  const tree: Array<number | null> = [];
  for (const token of tokens) {
    const lower = token.toLocaleLowerCase();
    if (lower === 'null' || lower === 'none') {
      tree.push(null);
      continue;
    }
    const value = parseIntegerToken(token);
    if (value === null) return { ok: false, error: { key: 'treeErrorInteger' } };
    tree.push(value);
  }
  while (tree.length > 0 && tree[tree.length - 1] === null) tree.pop();

  if (tree.length === 0 || tree[0] === null) {
    return { ok: false, error: { key: 'treeErrorEmpty' } };
  }
  for (let index = 1; index < tree.length; index += 1) {
    if (tree[index] === null) continue;
    const parent = Math.floor((index - 1) / 2);
    if (tree[parent] === null) {
      return { ok: false, error: { key: 'treeErrorParent' } };
    }
  }

  const nodes = tree.filter((value): value is number => value !== null);
  if (nodes.length > TREE_INPUT_LIMITS.MAX_NODES) {
    return { ok: false, error: { key: 'treeErrorSize', max: TREE_INPUT_LIMITS.MAX_NODES } };
  }
  if (hasDuplicates(nodes)) return { ok: false, error: { key: 'treeErrorDuplicate' } };
  return { ok: true, tree };
}

function parseIntegerToken(token: string): number | null {
  if (!/^[+-]?\d+$/u.test(token)) return null;
  const value = Number(token);
  if (!Number.isSafeInteger(value) || Math.abs(value) > TREE_INPUT_LIMITS.VALUE_ABS_MAX) return null;
  return value;
}

function parseTarget(raw: string): { ok: true; target: number } | { ok: false; error: TreeInputError } {
  const value = parseIntegerToken(raw.trim());
  return value === null
    ? { ok: false, error: { key: 'treeErrorTarget' } }
    : { ok: true, target: value };
}

function hasDuplicates(values: number[]): boolean {
  return new Set(values).size !== values.length;
}

function shift(values: readonly number[], offset: number): number[] {
  return values.map((value) => value + offset);
}

function randomDistinct(random: () => number, count: number): number[] {
  const pool = new Set<number>();
  while (pool.size < count) pool.add(randInt(random, -9, 28));
  return [...pool];
}

function randomTraversalDraft(scenario: string, random: () => number): TreeInputFields {
  const values = randomDistinct(random, 7);
  if (scenario === 'left') {
    return {
      values: [values[0], values[1], null, values[2], null, null, null, values[3]]
        .map((value) => (value === null ? 'null' : String(value)))
        .join(', '),
      target: '',
      command: '',
      mode: 'inorder',
    };
  }
  if (scenario === 'right') {
    const right = [values[0], null, values[1], null, null, null, values[2]];
    while (right.length < 15) right.push(null);
    right[14] = values[3];
    return {
      values: right.map((value) => (value === null ? 'null' : String(value))).join(', '),
      target: '',
      command: '',
      mode: 'inorder',
    };
  }
  if (scenario === 'balanced') {
    return {
      values: [values[0], values[1], values[2], values[3], values[4], values[5], values[6]].join(', '),
      target: '',
      command: '',
      mode: 'inorder',
    };
  }
  return {
    values: [values[0], values[1], values[2], values[3], null, values[4], values[5]]
      .map((value) => (value === null ? 'null' : String(value)))
      .join(', '),
    target: '',
    command: '',
    mode: 'inorder',
  };
}

function randomBstDraft(scenario: string, random: () => number): TreeInputFields {
  const offset = randInt(random, 0, 4);
  const complete = shift([50, 30, 70, 20, 40, 60, 80], offset);
  if (scenario === 'find-hit') {
    return { values: complete.join(', '), target: String(40 + offset), command: 'find', mode: '' };
  }
  if (scenario === 'find-miss') {
    return { values: complete.join(', '), target: String(55 + offset), command: 'find', mode: '' };
  }
  if (scenario === 'delete-leaf') {
    return { values: complete.join(', '), target: String(20 + offset), command: 'delete', mode: '' };
  }
  if (scenario === 'delete-one') {
    return {
      values: shift([50, 30, 70, 20], offset).join(', '),
      target: String(30 + offset),
      command: 'delete',
      mode: '',
    };
  }
  if (scenario === 'delete-two') {
    return { values: complete.join(', '), target: String(50 + offset), command: 'delete', mode: '' };
  }
  return { values: complete.join(', '), target: String(55 + offset), command: 'insert', mode: '' };
}

function randomAvlDraft(scenario: string, random: () => number): TreeInputFields {
  const offset = randInt(random, 0, 4);
  if (scenario === 'rr') {
    return {
      values: shift([30, 20, 40, 50], offset).join(', '),
      target: String(60 + offset),
      command: 'insert',
      mode: '',
    };
  }
  if (scenario === 'lr') {
    return {
      values: shift([50, 30, 70, 20, 40, 60, 80, 10, 25], offset).join(', '),
      target: String(27 + offset),
      command: 'insert',
      mode: '',
    };
  }
  if (scenario === 'rl') {
    return {
      values: shift([50, 30, 70, 80, 60], offset).join(', '),
      target: String(55 + offset),
      command: 'insert',
      mode: '',
    };
  }
  if (scenario === 'balanced') {
    return {
      values: shift([30, 20, 40, 10, 25, 35], offset).join(', '),
      target: String(28 + offset),
      command: 'insert',
      mode: '',
    };
  }
  return {
    values: shift([30, 20, 40, 10], offset).join(', '),
    target: String(5 + offset),
    command: 'insert',
    mode: '',
  };
}

function randomBtreeDraft(scenario: string, random: () => number): TreeInputFields {
  const offset = randInt(random, 0, 4);
  const complete = shift([10, 20, 30, 40, 50, 60, 70], offset);
  if (scenario === 'find-hit') {
    return { values: complete.join(', '), target: String(30 + offset), command: 'find', mode: '' };
  }
  if (scenario === 'find-miss') {
    return { values: complete.join(', '), target: String(35 + offset), command: 'find', mode: '' };
  }
  if (scenario === 'delete-leaf') {
    return { values: complete.join(', '), target: String(60 + offset), command: 'delete', mode: '' };
  }
  if (scenario === 'delete-borrow') {
    return {
      values: shift([27, 5, 16, 6, 36, 28, 4, 37], offset).join(', '),
      target: String(27 + offset),
      command: 'delete',
      mode: '',
    };
  }
  if (scenario === 'delete-merge') {
    return {
      values: shift([45, 16, 6, 37, 20, 34, 32, 22], offset).join(', '),
      target: String(45 + offset),
      command: 'delete',
      mode: '',
    };
  }
  if (scenario === 'delete-root-shrink') {
    return {
      values: shift([17, 2, 34, 30, 21, 23, 29, 27, 49], offset).join(', '),
      target: String(17 + offset),
      command: 'delete',
      mode: '',
    };
  }
  if (scenario === 'split-child') {
    return { values: complete.join(', '), target: String(80 + offset), command: 'insert', mode: '' };
  }
  if (scenario === 'split-root') {
    return {
      values: shift([10, 20, 30], offset).join(', '),
      target: String(40 + offset),
      command: 'insert',
      mode: '',
    };
  }
  return { values: complete.join(', '), target: String(35 + offset), command: 'insert', mode: '' };
}
