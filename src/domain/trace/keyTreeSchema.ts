/**
 * TEXTBOOK-09: validated character trie (key-tree) snapshots.
 *
 * A sentinel root has an empty character. Every other node owns exactly one
 * lower-case character; sibling characters are unique. `terminal` is the only
 * thing that distinguishes a stored word from a mere prefix. The dictionary is
 * rebuilt from the actual terminal paths and must match the snapshot.
 */
import { z } from 'zod';

const NODE_ID = z.string().min(1).max(80);
export const KEY_TREE_MAX_WORDS = 8;
export const KEY_TREE_MAX_WORD_LENGTH = 8;
export const KEY_TREE_MAX_NODES = 96;

export const KEY_TREE_MODES = ['find', 'insert'] as const;
export type KeyTreeMode = (typeof KEY_TREE_MODES)[number];

export const KEY_TREE_OPERATIONS = [
  'init', 'compare', 'create', 'terminal', 'found', 'not-found', 'duplicate', 'done',
] as const;
export type KeyTreeOperation = (typeof KEY_TREE_OPERATIONS)[number];

export const KEY_TREE_RESULTS = ['found', 'not-found', 'inserted', 'duplicate'] as const;
export type KeyTreeResult = (typeof KEY_TREE_RESULTS)[number];

export const keyTreeNodeSchema = z.object({
  id: NODE_ID,
  char: z.string().max(1),
  parentId: NODE_ID.nullable(),
  terminal: z.boolean(),
  children: z.array(NODE_ID).max(26),
});
export type KeyTreeNode = z.infer<typeof keyTreeNodeSchema>;

export const keyTreeSnapshotSchema = z
  .object({
    kind: z.literal('key-tree'),
    preset: z.string().max(200).nullable(),
    operation: z.enum(KEY_TREE_OPERATIONS),
    mode: z.enum(KEY_TREE_MODES),
    target: z.string().max(KEY_TREE_MAX_WORD_LENGTH),
    rootId: NODE_ID,
    nodes: z.array(keyTreeNodeSchema).min(1).max(KEY_TREE_MAX_NODES),
    dictionary: z.array(z.string().min(1).max(KEY_TREE_MAX_WORD_LENGTH)).max(KEY_TREE_MAX_WORDS),
    pathIds: z.array(NODE_ID).max(KEY_TREE_MAX_WORD_LENGTH + 1),
    currentNodeId: NODE_ID.nullable(),
    compareChar: z.string().max(1).nullable(),
    matchedLength: z.number().int().min(0).max(KEY_TREE_MAX_WORD_LENGTH),
    createdNodeId: NODE_ID.nullable(),
    terminalNodeId: NODE_ID.nullable(),
    result: z.enum(KEY_TREE_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const byId = new Map<string, KeyTreeNode>();
    snapshot.nodes.forEach((node, index) => {
      if (byId.has(node.id)) add(['nodes', index, 'id'], `duplicate key-tree node id "${node.id}"`);
      byId.set(node.id, node);
      if (node.char !== '' && !/^[a-z]$/.test(node.char)) {
        add(['nodes', index, 'char'], 'key-tree characters must be lower-case ASCII letters');
      }
    });
    snapshot.nodes.forEach((node, index) => {
      const chars = new Set<string>();
      node.children.forEach((child) => {
        const childNode = byId.get(child);
        if (!childNode) {
          add(['nodes', index, 'children'], `child "${child}" is not attached`);
          return;
        }
        if (chars.has(childNode.char)) {
          add(['nodes', index, 'children'], `duplicate outgoing character "${childNode.char}"`);
        }
        chars.add(childNode.char);
      });
    });

    const root = byId.get(snapshot.rootId);
    if (!root) {
      add(['rootId'], 'rootId must refer to a real node');
      return;
    }
    if (root.char !== '' || root.parentId !== null) {
      add(['rootId'], 'the key-tree sentinel root has an empty character and no parent');
    }
    const roots = snapshot.nodes.filter((node) => node.parentId === null);
    if (roots.length !== 1) add(['nodes'], 'the key tree needs exactly one root');

    const childOccurrences = new Map<string, number>();
    snapshot.nodes.forEach((node, index) => {
      if (node.parentId !== null) {
        if (!byId.has(node.parentId)) add(['nodes', index, 'parentId'], `parent "${node.parentId}" is not attached`);
        const parent = byId.get(node.parentId);
        if (parent && !parent.children.includes(node.id)) {
          add(['nodes', index, 'parentId'], 'parent child list must contain this node');
        }
      }
      if (node.id !== snapshot.rootId && node.parentId === null) {
        add(['nodes', index], 'only the sentinel root may have no parent');
      }
      for (const child of node.children) {
        childOccurrences.set(child, (childOccurrences.get(child) ?? 0) + 1);
      }
    });
    for (const [id, count] of childOccurrences) {
      if (count > 1) add(['nodes'], `node "${id}" has multiple parents`);
    }

    const seen = new Set<string>();
    const stack = [snapshot.rootId];
    while (stack.length) {
      const id = stack.pop() as string;
      if (seen.has(id)) {
        add(['nodes'], 'cycle in key-tree child links');
        break;
      }
      seen.add(id);
      const node = byId.get(id);
      if (!node) continue;
      for (const child of node.children) stack.push(child);
    }
    snapshot.nodes.forEach((node) => {
      if (!seen.has(node.id)) add(['nodes'], `key-tree node "${node.id}" is unreachable`);
    });

    // Every node path must spell a lower-case prefix and terminal nodes define
    // the exact dictionary. More than one terminal root is illegal.
    const terminalWords: string[] = [];
    const walk = (id: string, prefix: string, depth: number): void => {
      if (depth > KEY_TREE_MAX_WORD_LENGTH) {
        add(['nodes'], 'a key-tree word is too deep');
        return;
      }
      const node = byId.get(id);
      if (!node) return;
      if (node.terminal) {
        if (depth === 0) add(['nodes', id, 'terminal'], 'the sentinel root cannot be a word');
        else terminalWords.push(prefix);
      }
      for (const child of node.children) {
        const childNode = byId.get(child);
        if (childNode) walk(child, prefix + childNode.char, depth + 1);
      }
    };
    walk(snapshot.rootId, '', 0);
    const sortedDictionary = [...snapshot.dictionary].sort();
    const sortedTerminals = [...terminalWords].sort();
    if (JSON.stringify(sortedDictionary) !== JSON.stringify(sortedTerminals)) {
      add(['dictionary'], 'dictionary must equal the terminal paths of the real tree');
    }
    if (new Set(snapshot.dictionary).size !== snapshot.dictionary.length) {
      add(['dictionary'], 'dictionary words must be unique');
    }
    if (snapshot.dictionary.some((word) => word.length > KEY_TREE_MAX_WORD_LENGTH)) {
      add(['dictionary'], 'dictionary word is too long');
    }

    if (snapshot.pathIds[0] !== snapshot.rootId) add(['pathIds', 0], 'path must start at the sentinel root');
    let prefix = '';
    snapshot.pathIds.forEach((id, index) => {
      const node = byId.get(id);
      if (!node) {
        add(['pathIds', index], `path node "${id}" is not attached`);
        return;
      }
      if (index > 0) {
        const parent = byId.get(snapshot.pathIds[index - 1]);
        if (!parent || !parent.children.includes(id)) add(['pathIds', index], 'path must follow child links');
        prefix += node.char;
      }
    });
    if (snapshot.matchedLength !== snapshot.pathIds.length - 1) {
      add(['matchedLength'], 'matchedLength equals the number of non-root path nodes');
    }
    if (snapshot.matchedLength > snapshot.target.length) {
      add(['matchedLength'], 'matched prefix cannot exceed the target');
    }
    if (prefix !== snapshot.target.slice(0, snapshot.matchedLength)) {
      add(['pathIds'], 'path characters must spell the matched target prefix');
    }
    if (snapshot.currentNodeId === null) {
      if (snapshot.pathIds.length > 0) add(['pathIds'], 'a frame without a current node has an empty path');
    } else {
      if (!byId.has(snapshot.currentNodeId)) add(['currentNodeId'], 'current node is not attached');
      if (snapshot.pathIds[snapshot.pathIds.length - 1] !== snapshot.currentNodeId) {
        add(['pathIds'], 'path must end at the current node');
      }
    }

    if (snapshot.compareChar !== null) {
      if (!/^[a-z]$/.test(snapshot.compareChar)) add(['compareChar'], 'compared character must be a lower-case letter');
      const charIndex = snapshot.operation === 'create'
        ? snapshot.matchedLength - 1
        : snapshot.matchedLength;
      if (snapshot.compareChar !== snapshot.target[charIndex]) {
        add(['compareChar'], 'the compared character must be the next target character');
      }
    }
    if (snapshot.createdNodeId !== null) {
      if (!byId.has(snapshot.createdNodeId)) add(['createdNodeId'], 'created node is not attached');
      if (snapshot.currentNodeId !== snapshot.createdNodeId) add(['createdNodeId'], 'create ends at the new node');
      const created = byId.get(snapshot.createdNodeId);
      if (created && snapshot.compareChar !== null && created.char !== snapshot.compareChar) {
        add(['createdNodeId'], 'created node must carry the compared character');
      }
    }
    if (snapshot.terminalNodeId !== null) {
      const terminal = byId.get(snapshot.terminalNodeId);
      if (!terminal || !terminal.terminal) add(['terminalNodeId'], 'terminal marker must name a terminal node');
      if (snapshot.currentNodeId !== snapshot.terminalNodeId) {
        add(['terminalNodeId'], 'terminal frame ends at the terminal node');
      }
      if (terminal && snapshot.matchedLength === snapshot.target.length) {
        const pathWord = snapshot.pathIds
          .slice(1)
          .map((id) => byId.get(id)?.char ?? '')
          .join('');
        if (pathWord !== snapshot.target) add(['terminalNodeId'], 'terminal path must spell the target');
      }
    }

    if (snapshot.mode === 'find' && ['create', 'terminal', 'inserted'].includes(snapshot.operation)) {
      add(['operation'], `${snapshot.operation} is not a find operation`);
    }
    if (snapshot.mode === 'insert' && ['found', 'not-found'].includes(snapshot.operation)) {
      add(['operation'], `${snapshot.operation} is not an insert operation`);
    }
    if (snapshot.operation === 'init') {
      if (snapshot.result !== null) add(['result'], 'init has no result');
      if (snapshot.compareChar !== null || snapshot.createdNodeId !== null || snapshot.terminalNodeId !== null) {
        add(['compareChar'], 'init has no character operation');
      }
      if (snapshot.currentNodeId !== snapshot.rootId || snapshot.matchedLength !== 0) {
        add(['currentNodeId'], 'init starts at the sentinel root');
      }
    }
    if (snapshot.operation === 'compare') {
      if (snapshot.compareChar === null) add(['compareChar'], 'compare needs a character');
      if (snapshot.result !== null) add(['result'], 'compare is not terminal');
      if (snapshot.createdNodeId !== null || snapshot.terminalNodeId !== null) {
        add(['createdNodeId'], 'compare creates and marks nothing');
      }
    }
    if (snapshot.operation === 'create') {
      if (snapshot.createdNodeId === null) add(['createdNodeId'], 'create must name the new node');
      if (snapshot.result !== null) add(['result'], 'create is not terminal');
      if (snapshot.terminalNodeId !== null) add(['terminalNodeId'], 'create does not mark a word');
    }
    if (snapshot.operation === 'terminal') {
      const terminal = snapshot.terminalNodeId === null ? undefined : byId.get(snapshot.terminalNodeId);
      if (!terminal || !terminal.terminal) add(['terminalNodeId'], 'terminal operation needs a terminal node');
      if (snapshot.matchedLength !== snapshot.target.length) add(['matchedLength'], 'insertion marks the full target path');
      if (snapshot.result !== 'inserted') add(['result'], 'terminal records insertion');
    }
    if (snapshot.operation === 'duplicate') {
      if (snapshot.result !== 'duplicate') add(['result'], 'duplicate records rejection');
      const terminal = snapshot.terminalNodeId === null ? undefined : byId.get(snapshot.terminalNodeId);
      if (!terminal || !terminal.terminal) add(['terminalNodeId'], 'duplicate target must already be terminal');
    }
    if (snapshot.operation === 'found') {
      if (snapshot.result !== 'found') add(['result'], 'found records success');
      if (snapshot.matchedLength !== snapshot.target.length) add(['matchedLength'], 'a hit consumes the whole target');
      const terminal = snapshot.terminalNodeId === null ? undefined : byId.get(snapshot.terminalNodeId);
      if (!terminal || !terminal.terminal) add(['terminalNodeId'], 'found requires a terminal marker');
    }
    if (snapshot.operation === 'not-found') {
      if (snapshot.result !== 'not-found') add(['result'], 'not-found records failure');
      if (snapshot.matchedLength > snapshot.target.length) add(['matchedLength'], 'matched prefix cannot exceed target');
    }
    if (snapshot.operation === 'done') {
      if (snapshot.result === null) add(['result'], 'done reports a result');
    }

    if (snapshot.mode === 'find' && snapshot.operation === 'done' && !['found', 'not-found'].includes(snapshot.result ?? '')) {
      add(['result'], 'find must finish found or not-found');
    }
    if (snapshot.mode === 'insert' && snapshot.operation === 'done' && !['inserted', 'duplicate'].includes(snapshot.result ?? '')) {
      add(['result'], 'insert must finish inserted or duplicate');
    }
  });

export type KeyTreeSnapshot = z.infer<typeof keyTreeSnapshotSchema>;
