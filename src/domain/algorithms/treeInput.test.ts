import { describe, expect, it } from 'vitest';
import {
  TREE_GUIDED_INPUT_ALGORITHMS,
  TREE_INPUT_LIMITS,
  TREE_RANDOM_SCENARIOS,
  buildTreeInput,
  randomTreeDraft,
  treeDraftFromInput,
  type TreeGuidedInputAlgorithm,
  type TreeInputFields,
} from './treeInput';

function fields(overrides: Partial<TreeInputFields> = {}): TreeInputFields {
  return { values: '', target: '', command: '', mode: 'inorder', ...overrides };
}

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function buildOk(id: TreeGuidedInputAlgorithm, value: TreeInputFields): Record<string, unknown> {
  const result = buildTreeInput(id, value);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.key);
  return result.input as Record<string, unknown>;
}

interface BstNode {
  value: number;
  left: BstNode | null;
  right: BstNode | null;
}

function insert(root: BstNode | null, value: number): BstNode {
  if (!root) return { value, left: null, right: null };
  if (value < root.value) root.left = insert(root.left, value);
  else root.right = insert(root.right, value);
  return root;
}

function childrenOf(sequence: number[], target: number): number {
  let root: BstNode | null = null;
  for (const value of sequence) root = insert(root, value);
  const find = (node: BstNode | null): BstNode | null => {
    if (!node) return null;
    if (target === node.value) return node;
    return find(target < node.value ? node.left : node.right);
  };
  const node = find(root);
  if (!node) throw new Error(`target ${target} is missing`);
  return Number(node.left !== null) + Number(node.right !== null);
}

describe('INPUT-05 traversal input', () => {
  it('builds a level-order tree with null slots and preserves all four modes', () => {
    for (const mode of ['preorder', 'inorder', 'postorder', 'levelorder'] as const) {
      expect(buildOk('inorder', fields({ values: '4, 2, 6, null, 3', mode }))).toEqual({
        mode,
        tree: [4, 2, 6, null, 3],
      });
    }
    expect(buildOk('inorder', fields({ values: '[4 2 6 null 3]' }))).toEqual({
      mode: 'inorder',
      tree: [4, 2, 6, null, 3],
    });
    expect(buildOk('inorder', fields({ values: '4, 2, 6, 3', mode: 'levelorder' }))).toEqual({
      mode: 'levelorder',
      tree: [4, 2, 6, 3],
    });
  });

  it('rejects ambiguous, orphaned and oversized level-order trees', () => {
    expect(buildTreeInput('inorder', fields({ values: 'null, 1' }))).toEqual({
      ok: false,
      error: { key: 'treeErrorEmpty' },
    });
    expect(buildTreeInput('inorder', fields({ values: '1, null, 2, 3' }))).toEqual({
      ok: false,
      error: { key: 'treeErrorParent' },
    });
    expect(buildTreeInput('inorder', fields({ values: '1, 2, 2' }))).toEqual({
      ok: false,
      error: { key: 'treeErrorDuplicate' },
    });
    expect(buildTreeInput('inorder', fields({ values: '1, 2, x' }))).toEqual({
      ok: false,
      error: { key: 'treeErrorInteger' },
    });
    expect(buildTreeInput('inorder', fields({ values: '', mode: 'inorder' }))).toEqual({
      ok: false,
      error: { key: 'treeErrorEmpty' },
    });
    expect(buildTreeInput('inorder', fields({ values: '1', mode: 'bogus' }))).toEqual({
      ok: false,
      error: { key: 'treeErrorMode' },
    });

    const sixteen = Array.from({ length: 16 }, (_, index) => index + 1).join(', ');
    expect(buildTreeInput('inorder', fields({ values: sixteen }))).toEqual({
      ok: false,
      error: { key: 'treeErrorSize', max: TREE_INPUT_LIMITS.MAX_NODES },
    });
    const tooManySlots = Array.from({ length: 32 }, (_, index) =>
      index % 2 === 0 ? String(index + 1) : 'null',
    ).join(', ');
    expect(buildTreeInput('inorder', fields({ values: tooManySlots }))).toEqual({
      ok: false,
      error: { key: 'treeErrorSlots', max: TREE_INPUT_LIMITS.MAX_LEVEL_SLOTS },
    });
  });

  it('round-trips official and custom tree objects into editable tokens', () => {
    expect(treeDraftFromInput('inorder', { mode: 'postorder', tree: [4, 2, 6, null, 3] })).toEqual({
      values: '4, 2, 6, null, 3',
      target: '',
      command: '',
      mode: 'postorder',
    });
    expect(treeDraftFromInput('inorder', [4, 2, 6])).toMatchObject({
      values: '4, 2, 6',
      mode: 'inorder',
    });
  });

  it('keeps ordinary, left-skewed, right-skewed and balanced random trees structurally distinct', () => {
    const scenarios = TREE_RANDOM_SCENARIOS.inorder.map((scenario) => scenario.id);
    expect(scenarios).toEqual(['ordinary', 'left', 'right', 'balanced']);

    for (let seed = 1; seed <= 8; seed += 1) {
      const shapes: string[] = [];
      const counts: number[] = [];
      for (const scenario of scenarios) {
        const generated = randomTreeDraft('inorder', scenario, seeded(seed));
        const input = buildTreeInput('inorder', generated);
        expect(input.ok).toBe(true);
        if (!input.ok) throw new Error(input.error.key);
        const tree = (input.input as { tree: Array<number | null> }).tree;
        shapes.push(tree.join(','));
        counts.push(tree.filter((value) => value !== null).length);
        expect(tree.length).toBeLessThanOrEqual(TREE_INPUT_LIMITS.MAX_LEVEL_SLOTS);
      }
      expect(new Set(shapes).size).toBe(4);
      expect(counts[0]).toBe(6);
      expect(counts[1]).toBe(4);
      expect(counts[2]).toBe(4);
      expect(counts[3]).toBe(7);
    }
  });
});

describe('INPUT-05 BST input', () => {
  it('builds real insert / find / delete commands from a unique initial sequence', () => {
    expect(buildOk('bst', fields({ values: '50, 30, 70, 20', target: '30', command: 'delete' }))).toEqual(
      { preset: null, operation: 'delete', tree: [50, 30, 70, 20], target: 30 },
    );
    expect(buildOk('bst', fields({ values: '50, 30, 70', target: '55', command: 'insert' }))).toEqual({
      preset: null,
      operation: 'insert',
      tree: [50, 30, 70],
      target: 55,
    });
    expect(buildOk('bst', fields({ values: '50, 30, 70', target: '30', command: 'find' }))).toEqual({
      preset: null,
      operation: 'find',
      tree: [50, 30, 70],
      target: 30,
    });
  });

  it('rejects duplicate initial keys and invalid targets before Python runs', () => {
    expect(buildTreeInput('bst', fields({ values: '50, 30, 50', target: '30', command: 'find' }))).toEqual({
      ok: false,
      error: { key: 'treeErrorDuplicate' },
    });
    expect(buildTreeInput('bst', fields({ values: '50, 30', target: '3.5', command: 'find' }))).toEqual({
      ok: false,
      error: { key: 'treeErrorTarget' },
    });
    expect(buildTreeInput('bst', fields({ values: '', target: '3', command: 'find' }))).toEqual({
      ok: false,
      error: { key: 'treeErrorSequence' },
    });
  });

  it('generates valid targets for all six scenarios, including the three delete child counts', () => {
    const scenarios = TREE_RANDOM_SCENARIOS.bst.map((scenario) => scenario.id);
    expect(scenarios).toEqual(['insert', 'find-hit', 'find-miss', 'delete-leaf', 'delete-one', 'delete-two']);

    for (const scenario of scenarios) {
      for (let seed = 1; seed <= 12; seed += 1) {
        const generated = randomTreeDraft('bst', scenario, seeded(seed));
        const input = buildOk('bst', generated);
        const sequence = input.tree as number[];
        const target = input.target as number;
        expect(new Set(sequence).size).toBe(sequence.length);
        expect(sequence.length).toBeGreaterThan(0);
        expect(sequence.length).toBeLessThanOrEqual(TREE_INPUT_LIMITS.MAX_BST_NODES);
        if (scenario === 'find-hit') expect(sequence).toContain(target);
        if (scenario === 'find-miss') expect(sequence).not.toContain(target);
        if (scenario === 'delete-leaf') expect(childrenOf(sequence, target)).toBe(0);
        if (scenario === 'delete-one') expect(childrenOf(sequence, target)).toBe(1);
        if (scenario === 'delete-two') expect(childrenOf(sequence, target)).toBe(2);
        if (scenario === 'insert') expect(sequence).not.toContain(target);
      }
    }
  });

  it('round-trips every official BST preset without losing the command or target', () => {
    expect(treeDraftFromInput('bst', { preset: 'delete-two', operation: 'delete', tree: [50, 30, 70], target: 50 })).toEqual({
      values: '50, 30, 70',
      target: '50',
      command: 'delete',
      mode: '',
    });
  });
});

describe('INPUT-05 AVL input', () => {
  it('drives all four rotations plus a no-rotation insert through real insertion sequences', () => {
    const scenarios = TREE_RANDOM_SCENARIOS.avl.map((scenario) => scenario.id);
    expect(scenarios).toEqual(['ll', 'rr', 'lr', 'rl', 'balanced']);
    const firstTargets: Record<string, number> = {};
    for (const scenario of scenarios) {
      for (let seed = 1; seed <= 8; seed += 1) {
        const generated = randomTreeDraft('avl', scenario, seeded(seed));
        const input = buildOk('avl', generated);
        const sequence = input.tree as number[];
        const target = input.target as number;
        expect(input.operation).toBe('insert');
        expect(input.preset).toBeNull();
        expect(new Set(sequence).size).toBe(sequence.length);
        expect(sequence).not.toContain(target);
        expect(sequence.length).toBeLessThanOrEqual(TREE_INPUT_LIMITS.MAX_AVL_NODES);
        if (seed === 1) firstTargets[scenario] = target;
      }
    }
    expect(Object.keys(firstTargets)).toHaveLength(5);
  });

  it('rejects an already-present AVL insert target instead of silently ignoring it', () => {
    expect(buildTreeInput('avl', fields({ values: '30, 20, 40, 10', target: '20', command: 'insert' }))).toEqual({
      ok: false,
      error: { key: 'treeErrorTargetExists' },
    });
  });

  it('never emits a delete command for AVL custom input', () => {
    expect(buildOk('avl', fields({ values: '30, 20, 40', target: '10', command: 'delete' }))).toMatchObject({
      operation: 'insert',
      tree: [30, 20, 40],
      target: 10,
    });
  });
});

describe('INPUT-05 order-4 B-tree input', () => {
  it('covers ordinary leaf insert, child split, root split and both find outcomes', () => {
    const scenarios = TREE_RANDOM_SCENARIOS.btree.map((scenario) => scenario.id);
    expect(scenarios).toEqual([
      'insert-leaf',
      'split-child',
      'split-root',
      'find-hit',
      'find-miss',
      'delete-leaf',
      'delete-borrow',
      'delete-merge',
      'delete-root-shrink',
    ]);

    for (const scenario of scenarios) {
      for (let seed = 1; seed <= 10; seed += 1) {
        const generated = randomTreeDraft('btree', scenario, seeded(seed));
        const input = buildOk('btree', generated);
        const sequence = input.tree as number[];
        const target = input.target as number;
        expect(new Set(sequence).size).toBe(sequence.length);
        expect(sequence.length).toBeGreaterThan(0);
        expect(sequence.length).toBeLessThanOrEqual(TREE_INPUT_LIMITS.MAX_BTREE_KEYS);
        expect(input.operation).toBe(
          scenario.startsWith('find')
            ? 'find'
            : scenario.startsWith('delete')
              ? 'delete'
              : 'insert',
        );
        if (scenario.startsWith('delete')) expect(sequence).toContain(target);
        if (scenario === 'find-hit') expect(sequence).toContain(target);
        if (scenario === 'find-miss') expect(sequence).not.toContain(target);
        if (scenario === 'split-child') expect(sequence).not.toContain(target);
        if (scenario === 'split-root') {
          expect(sequence).toHaveLength(3);
          expect(sequence).not.toContain(target);
        }
        if (scenario === 'insert-leaf') expect(sequence).not.toContain(target);
      }
    }
  });

  it('rejects duplicate B-tree keys and caps the sequence at the readable limit', () => {
    expect(buildTreeInput('btree', fields({ values: '10, 20, 10', target: '30', command: 'insert' }))).toEqual({
      ok: false,
      error: { key: 'treeErrorDuplicate' },
    });
    const tooMany = Array.from({ length: TREE_INPUT_LIMITS.MAX_BTREE_KEYS + 1 }, (_, index) =>
      String(10 + index),
    ).join(', ');
    expect(buildTreeInput('btree', fields({ values: tooMany, target: '99', command: 'insert' }))).toEqual({
      ok: false,
      error: { key: 'treeErrorSequenceSize', max: TREE_INPUT_LIMITS.MAX_BTREE_KEYS },
    });
  });

  it('round-trips official B-tree presets including the preset id', () => {
    expect(treeDraftFromInput('btree', { preset: 'split-root', operation: 'insert', tree: [10, 20, 30], target: 40 })).toEqual({
      values: '10, 20, 30',
      target: '40',
      command: 'insert',
      mode: '',
    });
  });

  it('declares every guided tree algorithm in one exported list', () => {
    expect(TREE_GUIDED_INPUT_ALGORITHMS).toEqual(['inorder', 'threaded-inorder', 'bst', 'avl', 'btree']);
  });
});
