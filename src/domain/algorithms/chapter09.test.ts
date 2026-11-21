import { describe, expect, it } from 'vitest';
import rawBlock from '../../test/fixtures/chapter09-block-search-frames.json';
import rawBplus from '../../test/fixtures/chapter09-bplus-tree-frames.json';
import rawKey from '../../test/fixtures/chapter09-key-tree-frames.json';
import rawBtree from '../../test/fixtures/chapter09-btree-delete-frames.json';
import { structureSchema, btreeSnapshotSchema, type BtreeSnapshot } from '../trace/schema';
import {
  blockSearchSnapshotSchema,
  type BlockSearchSnapshot,
} from '../trace/blockSearchSchema';
import { bplusSnapshotSchema, type BplusTreeSnapshot } from '../trace/bplusSchema';
import { keyTreeSnapshotSchema, type KeyTreeSnapshot } from '../trace/keyTreeSchema';
import { buildBlockSearchModel } from '../visualization/blockSearchModel';
import { buildBplusModel } from '../visualization/bplusModel';
import { buildKeyTreeModel } from '../visualization/keyTreeModel';
import { buildBTreeModel } from '../visualization/btreeModel';
import {
  BLOCK_SEARCH_ALGORITHM,
  BPLUS_TREE_ALGORITHM,
  KEY_TREE_ALGORITHM,
  buildSearchInput,
  emptySearchDraft,
  randomSearchDraft,
  searchDraftFromInput,
  SEARCH_RANDOM_SCENARIOS,
} from './searchInput';
import {
  BLOCK_SEARCH_PRESETS,
  BLOCK_SEARCH_DEFAULT_INPUT,
  blockSearchCommandFromInput,
} from './blockSearchExamples';
import { BPLUS_TREE_PRESETS, BPLUS_TREE_DEFAULT_INPUT } from './bplusExamples';
import { KEY_TREE_PRESETS, KEY_TREE_DEFAULT_INPUT } from './keyTreeExamples';
import { BTREE_PRESETS } from './btreeExamples';

interface FixtureFrame {
  structure: unknown;
  lessonStepId: string | null;
}

interface FixtureCase {
  input: unknown;
  frames: FixtureFrame[];
}

type Fixtures = Record<string, FixtureCase>;

const blockFixtures = rawBlock as Fixtures;
const bplusFixtures = rawBplus as Fixtures;
const keyFixtures = rawKey as Fixtures;
const btreeFixtures = rawBtree as Fixtures;

function framesOf<T>(
  entry: FixtureCase,
  schema: { safeParse: (value: unknown) => { success: boolean; data?: T; error?: unknown } },
  label: string,
): T[] {
  return entry.frames.map((frame, index) => {
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, `${label}[${index}] union: ${JSON.stringify(union.error)}`).toBe(true);
    const parsed = schema.safeParse(frame.structure);
    expect(parsed.success, `${label}[${index}]: ${JSON.stringify(parsed.error)}`).toBe(true);
    return parsed.data as T;
  });
}

function blockSnapshots(name: string): BlockSearchSnapshot[] {
  return framesOf<BlockSearchSnapshot>(
    blockFixtures[name]!,
    blockSearchSnapshotSchema,
    `block/${name}`,
  );
}

function bplusSnapshots(name: string): BplusTreeSnapshot[] {
  return framesOf<BplusTreeSnapshot>(
    bplusFixtures[name]!,
    bplusSnapshotSchema,
    `bplus/${name}`,
  );
}

function keySnapshots(name: string): KeyTreeSnapshot[] {
  return framesOf<KeyTreeSnapshot>(keyFixtures[name]!, keyTreeSnapshotSchema, `key/${name}`);
}

function btreeSnapshots(name: string): BtreeSnapshot[] {
  return framesOf<BtreeSnapshot>(btreeFixtures[name]!, btreeSnapshotSchema, `btree/${name}`);
}

function bplusLeafChain(snapshot: BplusTreeSnapshot): string[] {
  const leaves = snapshot.nodes.filter((node) => node.leaf);
  const chain: string[] = [];
  let cursor: string | null = snapshot.leafOrder[0] ?? null;
  const seen = new Set<string>();
  while (cursor !== null) {
    expect(seen.has(cursor), 'leaf chain must not cycle').toBe(false);
    seen.add(cursor);
    chain.push(cursor);
    const node = leaves.find((entry) => entry.id === cursor);
    expect(node, `missing leaf ${cursor}`).toBeTruthy();
    cursor = node!.next;
  }
  expect(chain.length).toBe(leaves.length);
  return chain;
}

describe('TEXTBOOK-09 block search traces', () => {
  it('partitions the original order without regrouping and validates every frame', () => {
    for (const name of Object.keys(blockFixtures)) {
      const snapshots = blockSnapshots(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      for (const snapshot of snapshots) {
        expect(snapshot.kind).toBe('block-search');
        const joined = snapshot.blocks.flatMap((block) => block.values);
        expect(joined).toEqual(snapshot.data);
        expect(snapshot.indexEntries.map((entry) => entry.max)).toEqual(
          snapshot.blocks.map((block) => block.max),
        );
      }
    }
  });

  it('keeps two distinct comparison stages and cumulative counters', () => {
    const hit = blockSnapshots('hit-middle');
    const indexFrames = hit.filter((snapshot) => snapshot.phase === 'index');
    const blockFrames = hit.filter((snapshot) => snapshot.phase === 'block');
    expect(indexFrames.length).toBeGreaterThanOrEqual(2);
    expect(blockFrames.length).toBeGreaterThanOrEqual(4);
    expect(indexFrames.every((snapshot) => snapshot.blockComparisons === 0)).toBe(true);
    const done = hit.at(-1)!;
    expect(done.result).toBe('found');
    expect(done.indexComparisons).toBe(2);
    expect(done.blockComparisons).toBe(4);
    const beforeDone = hit.at(-2)!;
    expect(beforeDone.operation).toBe('found');
    expect(beforeDone.phase).toBe('done');

    const miss = blockSnapshots('miss-between');
    expect(miss.at(-1)!.result).toBe('not-found');
    expect(miss.at(-2)!.blockComparisons).toBe(4);

    const allMiss = blockSnapshots('miss-all');
    expect(allMiss.filter((snapshot) => snapshot.phase === 'block')).toHaveLength(0);
    expect(allMiss.at(-1)!.result).toBe('not-found');
  });

  it('finds the selected real block and visualizes every row', () => {
    const snapshots = blockSnapshots('hit-last-block');
    const selected = snapshots.find((snapshot) => snapshot.operation === 'index-select')!;
    expect(selected.currentBlock).toBe(2);
    expect(selected.compareValue).toBe(94);
    const model = buildBlockSearchModel(snapshots.at(-2)!);
    expect(model.rows).toHaveLength(snapshots.at(-2)!.blocks.length);
    expect(model.rows[2]!.selected).toBe(true);
    expect(model.rows[2]!.cells.some((cell) => cell.matched)).toBe(true);
    expect(model.indexComparisons).toBe(3);
    expect(model.blockComparisons).toBe(1);
  });

  it('classifies every official preset and default input', () => {
    for (const preset of BLOCK_SEARCH_PRESETS) {
      expect(blockSearchCommandFromInput(preset)).toEqual({
        data: [...preset.data],
        blockSize: preset.blockSize,
        target: preset.target,
      });
    }
    expect(blockSearchCommandFromInput(BLOCK_SEARCH_DEFAULT_INPUT)).toEqual({
      data: [22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69],
      blockSize: 4,
      target: 38,
    });
    expect(blockSearchCommandFromInput({ data: 'oops' }).data).toEqual([]);
  });
});

describe('TEXTBOOK-09 B+ tree traces', () => {
  it('keeps records only in leaves and every internal key equal to its right subtree minimum', () => {
    for (const name of Object.keys(bplusFixtures)) {
      const snapshots = bplusSnapshots(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      for (const snapshot of snapshots) {
        const leaves = snapshot.nodes.filter((node) => node.leaf);
        const internals = snapshot.nodes.filter((node) => !node.leaf);
        expect(leaves.length).toBeGreaterThanOrEqual(2);
        expect(leaves.every((node) => node.keys.length >= 2 && node.keys.length <= 3)).toBe(true);
        expect(internals.every((node) => node.keys.length >= 1 && node.keys.length <= 3)).toBe(true);
        const chain = bplusLeafChain(snapshot);
        expect(chain).toEqual(snapshot.leafOrder);
        expect(snapshot.leafOrder.map((id) => leaves.find((node) => node.id === id)!.id)).toHaveLength(
          leaves.length,
        );
      }
    }
  });

  it('reaches a leaf for hit and miss point searches', () => {
    const hit = bplusSnapshots('find-hit');
    expect(hit.at(-1)!.result).toBe('found');
    expect(hit.at(-2)!.operation).toBe('found');
    expect(hit.at(-2)!.currentNodeId).toBeTruthy();
    const model = buildBplusModel(hit.at(-2)!);
    expect(model.leafLinks).toHaveLength(snapshotLeafCount(hit.at(-2)!) - 1);
    expect(model.nodes.find((node) => node.id === hit.at(-2)!.currentNodeId)?.active).toBe(true);

    const miss = bplusSnapshots('find-miss');
    expect(miss.at(-1)!.result).toBe('not-found');
    expect(miss.at(-2)!.currentNodeId).toBeTruthy();
    expect(miss.at(-2)!.operation).toBe('not-found');
  });

  it('distinguishes no-split insertion, leaf split, and root split', () => {
    const plain = bplusSnapshots('insert-leaf');
    expect(plain.at(-1)!.result).toBe('inserted');
    expect(plain.some((snapshot) => snapshot.operation === 'split-leaf')).toBe(false);

    const leafSplit = bplusSnapshots('insert-leaf-split');
    const split = leafSplit.find((snapshot) => snapshot.operation === 'split-leaf')!;
    expect(split.split?.promotedKey).toBe(60);
    expect(split.split?.rootChanged).toBe(false);
    expect(leafSplit.at(-1)!.result).toBe('inserted');

    const rootSplit = bplusSnapshots('insert-root-split');
    expect(rootSplit.some((snapshot) => snapshot.operation === 'new-root')).toBe(true);
    expect(rootSplit.at(-1)!.nodes.length).toBeGreaterThan(1);
    expect(rootSplit.at(-1)!.leafOrder.length).toBeGreaterThanOrEqual(4);
  });

  it('collects a contiguous leaf-chain range and stops at the upper bound', () => {
    const range = bplusSnapshots('range-query');
    const scans = range.filter((snapshot) => snapshot.operation === 'range-scan');
    expect(scans.length).toBeGreaterThanOrEqual(3);
    expect(range.at(-1)!.result).toBe('range');
    expect(range.at(-1)!.rangeKeys).toEqual([20, 25, 30]);
    const last = range.at(-2)!;
    expect(last.operation).toBe('range-end');
    expect(last.rangeKeys).toEqual([20, 25, 30]);
    const ordered = range
      .filter((snapshot) => snapshot.operation === 'range-scan')
      .flatMap((snapshot, index, all) => {
        const before = index === 0 ? [] : all[index - 1]!.rangeKeys;
        return snapshot.rangeKeys.slice(before.length);
      });
    expect(ordered).toEqual([20, 25, 30]);
    const model = buildBplusModel(last);
    expect(model.rangeKeys).toEqual([20, 25, 30]);
    expect(model.leafLinks.length).toBe(snapshotLeafCount(last) - 1);
  });

  it('registers all official B+ presets with their operation', () => {
    for (const preset of BPLUS_TREE_PRESETS) {
      expect(['find', 'insert', 'range']).toContain(preset.operation);
    }
    expect(BPLUS_TREE_DEFAULT_INPUT).toBeTruthy();
  });
});

function snapshotLeafCount(snapshot: BplusTreeSnapshot): number {
  return snapshot.nodes.filter((node) => node.leaf).length;
}

describe('TEXTBOOK-09 key-tree traces', () => {
  it('shares prefixes and only marks a complete word as terminal', () => {
    for (const name of Object.keys(keyFixtures)) {
      const snapshots = keySnapshots(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      for (const snapshot of snapshots) {
        expect(snapshot.nodes.filter((node) => node.parentId === null)).toHaveLength(1);
        const terminals = snapshot.nodes.filter((node) => node.terminal).length;
        expect(snapshot.dictionary.length).toBe(terminals);
      }
    }
    const shared = keySnapshots('shared-prefix-hit');
    expect(shared.at(-2)!.matchedLength).toBe(4);
    expect(shared.at(-2)!.terminalNodeId).toBe(shared.at(-2)!.currentNodeId);
    const model = buildKeyTreeModel(shared.at(-2)!);
    expect(model.nodes.filter((node) => node.terminal)).toHaveLength(6);
    expect(model.edges.length).toBe(shared.at(-2)!.nodes.length - 1);
  });

  it('rejects prefixes and missing branches as non-words', () => {
    const prefix = keySnapshots('prefix-is-not-word');
    expect(prefix.at(-1)!.result).toBe('not-found');
    expect(prefix.at(-2)!.matchedLength).toBe(2);
    expect(prefix.at(-2)!.terminalNodeId).toBeNull();

    const branch = keySnapshots('missing-branch');
    expect(branch.at(-1)!.result).toBe('not-found');
    expect(branch.at(-2)!.compareChar).toBe('o');
  });

  it('creates only missing suffixes and records terminal insertion', () => {
    const cargo = keySnapshots('insert-shared');
    expect(cargo.at(-1)!.dictionary).toContain('cargo');
    expect(cargo.at(-2)!.operation).toBe('terminal');
    expect(cargo.some((snapshot) => snapshot.createdNodeId !== null)).toBe(true);
    expect(cargo.at(-2)!.terminalNodeId).toBeTruthy();
    expect(cargo.at(-1)!.result).toBe('inserted');

    const prefixInsert = keySnapshots('insert-prefix');
    expect(prefixInsert.at(-2)!.operation).toBe('terminal');
    expect(prefixInsert.at(-2)!.pathIds).toHaveLength(3);
  });

  it('exposes every configured preset and default input', () => {
    for (const preset of KEY_TREE_PRESETS) {
      expect(['find', 'insert']).toContain(preset.operation);
      expect(preset.words).toHaveLength(6);
    }
    expect(KEY_TREE_DEFAULT_INPUT).toBeTruthy();
  });
});

describe('TEXTBOOK-09 B-tree deletion traces', () => {
  it('parses all delete paths and never changes a missing-key tree', () => {
    for (const name of Object.keys(btreeFixtures)) {
      const snapshots = btreeSnapshots(name);
      expect(snapshots[0]!.command).toBe('delete');
      expect(snapshots[0]!.operation).toBe('init');
      expect(['deleted', 'not-found']).toContain(snapshots.at(-1)!.result);
    }
    const missing = btreeSnapshots('delete-missing');
    expect(missing.at(-1)!.result).toBe('not-found');
    const canon = (snapshot: BtreeSnapshot) =>
      snapshot.nodes
        .map((node) => ({ id: node.id, keys: node.keys, children: node.children }))
        .sort((left, right) => left.id.localeCompare(right.id));
    expect(canon(missing.at(-1)!).map((node) => node.keys)).toEqual(
      canon(missing[0]!).map((node) => node.keys),
    );
  });

  it('covers leaf deletion, internal replacement, borrowing, merging and root shrink', () => {
    const actions = [
      ...btreeSnapshots('delete-borrow').map((snapshot) => snapshot.deleteInfo?.action),
      ...btreeSnapshots('delete-merge').map((snapshot) => snapshot.deleteInfo?.action),
      ...btreeSnapshots('delete-root-shrink').map((snapshot) => snapshot.deleteInfo?.action),
      ...btreeSnapshots('delete-internal-replace').map((snapshot) => snapshot.deleteInfo?.action),
    ];
    expect(actions).toContain('borrow-left');
    expect(actions).toContain('merge');
    expect(actions).toContain('root-shrink');
    expect(actions).toContain('replace');

    const shrink = btreeSnapshots('delete-root-shrink');
    const shrinkFrame = shrink.find((snapshot) => snapshot.operation === 'root-shrink')!;
    expect(shrinkFrame.deleteInfo?.rootChanged).toBe(true);
    const done = shrink.at(-1)!;
    expect(done.result).toBe('deleted');
    expect(done.nodes.some((node) => node.keys.length === 0 && node.id === done.rootId)).toBe(false);
  });

  it('removes the target key and keeps the model structurally readable', () => {
    const plain = btreeSnapshots('delete-leaf-plain');
    const done = plain.at(-1)!;
    expect(done.targetValue).toBe(60);
    expect(done.nodes.some((node) => node.keys.includes(60))).toBe(false);
    const model = buildBTreeModel(plain.at(-2)!);
    expect(model.nodes.length).toBe(plain.at(-2)!.nodes.length);
    expect(model.deleteAffectedIds.length).toBeGreaterThan(0);

    for (const preset of BTREE_PRESETS.filter((entry) => entry.command === 'delete')) {
      expect(preset.tree.length).toBeGreaterThanOrEqual(7);
    }
  });
});

describe('TEXTBOOK-09 search input parser', () => {
  it('preserves the block partition instead of sorting records', () => {
    const draft = { ...emptySearchDraft(BLOCK_SEARCH_ALGORITHM), values: '1, 4, 5, 9, 10, 12', blockSize: '2', target: '10' };
    const result = buildSearchInput(BLOCK_SEARCH_ALGORITHM, draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input).toMatchObject({ preset: null, data: [1, 4, 5, 9, 10, 12], blockSize: 2, target: 10 });

    const invalid = buildSearchInput(BLOCK_SEARCH_ALGORITHM, {
      ...draft,
      values: '10, 12, 3, 4',
    });
    expect(invalid.ok).toBe(false);
  });

  it('validates B+ ranges and trie words', () => {
    const bplus = buildSearchInput(BPLUS_TREE_ALGORITHM, {
      ...emptySearchDraft(BPLUS_TREE_ALGORITHM),
      values: '5, 10, 15, 20',
      mode: 'range',
      target: '18',
      end: '12',
    });
    expect(bplus.ok).toBe(false);

    const key = buildSearchInput(KEY_TREE_ALGORITHM, {
      ...emptySearchDraft(KEY_TREE_ALGORITHM),
      values: 'car, Car',
      target: 'car',
    });
    expect(key.ok).toBe(false);

    const duplicate = buildSearchInput(KEY_TREE_ALGORITHM, {
      ...emptySearchDraft(KEY_TREE_ALGORITHM),
      values: 'car, car',
    });
    expect(duplicate.ok).toBe(false);
  });

  it('generates deterministic random drafts for every scenario and parses them back', () => {
    let seed = 123456789;
    const random = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    for (const algorithm of [BLOCK_SEARCH_ALGORITHM, BPLUS_TREE_ALGORITHM, KEY_TREE_ALGORITHM] as const) {
      for (const scenario of SEARCH_RANDOM_SCENARIOS[algorithm]) {
        const draft = randomSearchDraft(algorithm, scenario.id, random);
        expect(draft, `${algorithm}/${scenario.id}`).toBeTruthy();
        const built = buildSearchInput(algorithm, draft!);
        expect(built.ok, `${algorithm}/${scenario.id}`).toBe(true);
      }
    }
    expect(searchDraftFromInput(BLOCK_SEARCH_ALGORITHM, BLOCK_SEARCH_DEFAULT_INPUT).target).toBe('38');
  });
});
