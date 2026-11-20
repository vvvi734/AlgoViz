import { describe, expect, it } from 'vitest';
import {
  TREE_DEFAULT_INPUT,
  TREE_PYTHON,
  TREE_DEFAULT_TREE,
  treeModeFromInput,
  treeValuesFromInput,
  withTreeMode,
} from './treeTraversalExamples';

describe('Stage 7D Python binary-tree teaching source', () => {
  it('uses real TreeNode objects and real left/right references', () => {
    expect(TREE_PYTHON).toContain('class TreeNode:');
    expect(TREE_PYTHON).toContain('self.left = None');
    expect(TREE_PYTHON).toContain('self.right = None');
    expect(TREE_PYTHON).toContain('node.left = by_index[left_index]');
    expect(TREE_PYTHON).toContain('node.right = by_index[right_index]');
    expect(TREE_PYTHON).toContain('leftId');
    expect(TREE_PYTHON).toContain('rightId');
    expect(TREE_PYTHON).not.toContain('id(node)');
  });

  it('runs the three recursive traversals through one tracked function', () => {
    expect(TREE_PYTHON).toContain('@tracked(enter_hook=tree_enter, return_hook=tree_return)');
    expect(TREE_PYTHON).toContain('def traverse(node):');
    expect(TREE_PYTHON).toContain('traverse(node.left)');
    expect(TREE_PYTHON).toContain('traverse(node.right)');
    expect(TREE_PYTHON).toContain('if MODE == "preorder":');
    expect(TREE_PYTHON).toContain('if MODE == "inorder":');
    expect(TREE_PYTHON).toContain('if MODE == "postorder":');
    expect(TREE_PYTHON).toContain('structure=tree_payload(operation, node)');
    expect(TREE_PYTHON).toContain('lesson_step=order_step');
    expect(TREE_PYTHON).toContain('lesson_step="done"');
  });

  it('adds a real FIFO queue path for level order', () => {
    expect(TREE_PYTHON).toContain('if MODE == "levelorder":');
    expect(TREE_PYTHON).toContain('def level_order():');
    expect(TREE_PYTHON).toContain('QUEUE.append(ROOT)');
    expect(TREE_PYTHON).toContain('node = QUEUE.pop(0)');
    expect(TREE_PYTHON).toContain('QUEUE.append(node.left)');
    expect(TREE_PYTHON).toContain('QUEUE.append(node.right)');
    expect(TREE_PYTHON).toContain('"queueIds": [node.node_id for node in QUEUE]');
    expect(TREE_PYTHON).toContain('"level-init")');
    expect(TREE_PYTHON).toContain('"level-process")');
  });

  it('keeps the recursion path and visit order from real Python execution', () => {
    expect(TREE_PYTHON).toContain('PATH.append(node)');
    expect(TREE_PYTHON).toContain('PATH.pop()');
    expect(TREE_PYTHON).toContain('VISITED.append(node)');
    expect(TREE_PYTHON).toContain('"visitedIds": [node.node_id for node in VISITED]');
    expect(TREE_PYTHON).toContain('"pathIds": [node.node_id for node in PATH]');
  });

  it('accepts the legacy array and the explicit mode object', () => {
    expect(treeModeFromInput(TREE_DEFAULT_INPUT)).toBe('inorder');
    expect(treeValuesFromInput(TREE_DEFAULT_INPUT)).toEqual(TREE_DEFAULT_TREE);
    expect(treeModeFromInput({ mode: 'preorder', tree: [4, 2, 6] })).toBe('preorder');
    expect(treeModeFromInput({ mode: 'levelorder', tree: [4, 2, 6] })).toBe('levelorder');
    expect(treeModeFromInput({ mode: 'bad', tree: [4] })).toBe('inorder');
    expect(treeModeFromInput('nonsense')).toBe('inorder');
    expect(withTreeMode([4, 2, 6], 'postorder')).toEqual({ mode: 'postorder', tree: [4, 2, 6] });
    expect(withTreeMode([4, 2, 6], 'levelorder')).toEqual({ mode: 'levelorder', tree: [4, 2, 6] });
    expect(withTreeMode({ mode: 'inorder', tree: [4, 2] }, 'preorder')).toEqual({
      mode: 'preorder',
      tree: [4, 2],
    });
  });
});
