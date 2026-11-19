import { describe, expect, it } from 'vitest';
import rawDefault from '../../test/fixtures/huffman-default-frames.json';
import rawEdge from '../../test/fixtures/huffman-edge-frames.json';
import {
  huffmanSnapshotSchema,
  structureSchema,
  type HuffmanCodeRow,
  type HuffmanSnapshot,
} from './schema';
import { layoutHuffmanForest } from '../visualization/huffmanLayout';
import { buildHuffmanModel } from '../visualization/huffmanModel';

type Frame = { structure: HuffmanSnapshot };
const defaults = rawDefault as unknown as Record<string, Frame[]>;
const edges = rawEdge as unknown as Record<string, Frame[]>;

function parse(frames: Frame[]): HuffmanSnapshot[] {
  return frames.map((frame) => {
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, JSON.stringify(union.error?.issues)).toBe(true);
    const typed = huffmanSnapshotSchema.safeParse(frame.structure);
    expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
    return frame.structure;
  });
}

function snapshot(name: string): HuffmanSnapshot[] {
  return parse((defaults[name] ?? edges[name])!);
}

function rootsOf(snapshotValue: HuffmanSnapshot) {
  const children = new Set<string>();
  for (const node of snapshotValue.nodes) {
    if (node.leftId) children.add(node.leftId);
    if (node.rightId) children.add(node.rightId);
  }
  return snapshotValue.nodes.filter((node) => !children.has(node.id));
}

function leavesOf(snapshotValue: HuffmanSnapshot) {
  return snapshotValue.nodes.filter((node) => node.leftId === null);
}

function isPrefixFree(codes: HuffmanCodeRow[]): boolean {
  for (const short of codes) {
    for (const long of codes) {
      if (short.nodeId !== long.nodeId && long.code.startsWith(short.code)) return false;
    }
  }
  return true;
}

function decode(bits: string, codes: HuffmanCodeRow[]): string[] {
  const table = new Map(codes.map((row) => [row.symbol, row.code]));
  const out: string[] = [];
  let cursor = 0;
  while (cursor < bits.length) {
    let matched: string | null = null;
    for (const [symbol, code] of table) {
      if (bits.startsWith(code, cursor)) {
        matched = symbol;
        break;
      }
    }
    if (matched === null) throw new Error(`undecodable at ${cursor}`);
    out.push(matched);
    cursor += table.get(matched)!.length;
  }
  return out;
}

function wplFromTree(snapshotValue: HuffmanSnapshot): number {
  const nodes = new Map(snapshotValue.nodes.map((node) => [node.id, node]));
  const root = rootsOf(snapshotValue)[0];
  if (!root) return 0;
  let value = 0;
  const walk = (id: string, depth: number) => {
    const node = nodes.get(id)!;
    if (node.leftId === null || node.rightId === null) {
      value += node.weight * depth;
      return;
    }
    walk(node.leftId, depth + 1);
    walk(node.rightId, depth + 1);
  };
  walk(root.id, 0);
  return value;
}

describe('T4 Huffman real Python fixtures', () => {
  it('accepts every default and edge frame as a Huffman snapshot', () => {
    for (const frames of Object.values(defaults)) parse(frames);
    for (const frames of Object.values(edges)) parse(frames);
    expect(Object.values(defaults).reduce((sum, frames) => sum + frames.length, 0)).toBe(29);
    expect(Object.values(edges).reduce((sum, frames) => sum + frames.length, 0)).toBe(40);
  });

  it('pops the two real minima, creates a sum parent and requeues it', () => {
    const all = snapshot('official');
    const merges = all.filter((frame) => frame.operation === 'merge-select');
    expect(merges).toHaveLength(5);
    for (const frame of merges) {
      const roots = rootsOf(frame).sort((a, b) => a.weight - b.weight || a.order - b.order);
      expect(frame.pickedIds).toEqual([roots[0]!.id, roots[1]!.id]);
      expect(frame.queueIds).not.toContain(frame.pickedIds![0]);
      expect(frame.queueIds).not.toContain(frame.pickedIds![1]);
    }
    const create = all.find((frame) => frame.operation === 'merge-create')!;
    const picked = create.nodes.filter((node) => create.pickedIds!.includes(node.id));
    const parent = create.nodes.find((node) => node.id === create.createdId)!;
    expect(parent.symbol).toBeNull();
    expect(parent.weight).toBe(picked[0]!.weight + picked[1]!.weight);
    expect(parent.leftId).toBe(create.pickedIds![0]);
    expect(parent.rightId).toBe(create.pickedIds![1]);
    expect(parent.order).toBe(Math.max(...create.nodes.map((node) => node.order)));

    const requeue = all.find((frame) => frame.operation === 'merge-requeue')!;
    expect(requeue.queueIds).toContain(create.createdId);
    expect(requeue.metrics).toBeNull();
  });

  it('builds the official six-leaf tree and reports WPL 224 with 300 fixed bits', () => {
    const all = snapshot('official');
    const buildDone = all.find((frame) => frame.operation === 'build-done')!;
    expect(buildDone.nodes).toHaveLength(11);
    expect(leavesOf(buildDone).map((node) => node.symbol).sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(rootsOf(buildDone)).toHaveLength(1);
    expect(buildDone.metrics).toMatchObject({
      leafCount: 6,
      totalWeight: 100,
      wpl: 224,
      totalBits: 224,
      fixedBitsPerChar: 3,
      fixedBits: 300,
    });
    expect(wplFromTree(buildDone)).toBe(224);
    expect(buildDone.queueIds).toHaveLength(1);
  });

  it('generates a prefix-free code table that round-trips the official message', () => {
    const all = snapshot('official');
    const final = all.at(-1)!;
    expect(final.result).toBe('encoded');
    expect(final.codes.map((row) => row.symbol)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(isPrefixFree(final.codes)).toBe(true);
    for (const row of final.codes) {
      expect(row.length).toBe(row.code.length);
      expect(row.contribution).toBe(row.weight * row.length);
    }
    const message = ['A', 'B', 'C', 'D', 'E', 'F'];
    const table = new Map(final.codes.map((row) => [row.symbol, row.code]));
    const encoded = message.map((symbol) => table.get(symbol)!).join('');
    expect(decode(encoded, final.codes)).toEqual(message);
    expect(encoded.length).toBe(final.codes.reduce((sum, row) => sum + row.length, 0));
  });

  it('handles equal weights without pretending the code strings are unique', () => {
    const all = snapshot('equal');
    const final = all.at(-1)!;
    expect(final.codes).toHaveLength(4);
    expect(new Set(final.codes.map((row) => row.code))).toEqual(new Set(['00', '01', '10', '11']));
    expect(isPrefixFree(final.codes)).toBe(true);
    expect(final.metrics).toMatchObject({ wpl: 32, totalBits: 32, fixedBitsPerChar: 2, fixedBits: 32 });
    expect(wplFromTree(final)).toBe(32);
    for (const row of final.codes) {
      expect(row.length).toBe(2);
      expect(row.weight).toBe(4);
      expect(row.contribution).toBe(8);
    }
    expect(all.filter((frame) => frame.operation === 'merge-select').length).toBe(3);
  });

  it('keeps theoretical WPL=0 separate from the actual one-bit single code', () => {
    const all = snapshot('single');
    const buildDone = all.find((frame) => frame.operation === 'build-done')!;
    expect(leavesOf(buildDone)).toHaveLength(1);
    expect(buildDone.metrics).toMatchObject({
      leafCount: 1,
      totalWeight: 7,
      wpl: 0,
      totalBits: 7,
      fixedBitsPerChar: 1,
      fixedBits: 7,
    });
    const final = all.at(-1)!;
    expect(final.codes).toHaveLength(1);
    expect(final.codes[0]).toMatchObject({
      symbol: 'Z',
      code: '0',
      length: 1,
      weight: 7,
      contribution: 7,
    });
    expect(isPrefixFree(final.codes)).toBe(true);
    expect(decode('0'.repeat(14), final.codes)).toEqual(['Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z']);
    const leafFrame = all.find((frame) => frame.operation === 'encode-leaf')!;
    expect(leafFrame.prefix).toBe('');
    expect(leafFrame.pathIds).toHaveLength(1);
  });

  it('treats empty input as an explicit empty run, not a fake tree', () => {
    const all = snapshot('empty');
    expect(all).toHaveLength(2);
    expect(all[0]!.operation).toBe('init');
    expect(all[0]!.nodes).toEqual([]);
    expect(all[0]!.queueIds).toEqual([]);
    expect(all[0]!.metrics).toBeNull();
    const final = all[1]!;
    expect(final.operation).toBe('done');
    expect(final.result).toBe('empty');
    expect(final.nodes).toEqual([]);
    expect(final.metrics).toEqual({
      leafCount: 0,
      totalWeight: 0,
      wpl: 0,
      totalBits: 0,
      fixedBitsPerChar: 0,
      fixedBits: 0,
    });
  });

  it('aggregates duplicate symbols before building leaves', () => {
    const all = snapshot('duplicate');
    const buildDone = all.find((frame) => frame.operation === 'build-done')!;
    expect(leavesOf(buildDone).map((node) => [node.symbol, node.weight])).toEqual([
      ['A', 8],
      ['B', 7],
      ['C', 9],
    ]);
    const final = all.at(-1)!;
    expect(final.metrics).toMatchObject({ leafCount: 3, totalWeight: 24, wpl: 39, totalBits: 39, fixedBitsPerChar: 2, fixedBits: 48 });
    expect(wplFromTree(final)).toBe(39);
    expect(isPrefixFree(final.codes)).toBe(true);
  });

  it('rebuilds the same three regions after a backward jump', () => {
    const all = snapshot('official');
    const middle = all.findIndex((frame) => frame.operation === 'merge-requeue');
    const frameBack = all[middle - 1]!;
    const modelAfter = buildHuffmanModel(all[middle]!, 'empty')!;
    const modelBack = buildHuffmanModel(frameBack, 'empty')!;
    expect(modelBack.kind).toBe('huffman');
    expect(modelBack.nodes.map((node) => node.id).sort()).toEqual(frameBack.nodes.map((node) => node.id).sort());
    expect(modelBack.queueEntries.length).toBe(frameBack.queueIds.length);
    expect(modelBack.codes.length).toBe(frameBack.codes.length);
    expect(modelBack.createdEntry?.nodeId).toBe(frameBack.createdId);
    expect(modelAfter.createdEntry).toBeNull();
    expect(modelAfter.queueEntries.some((entry) => entry.nodeId === frameBack.createdId)).toBe(true);
    expect(modelAfter.queueEntries.length).toBe(all[middle]!.queueIds.length);
  });

  it('rejects forged snapshots instead of drawing a plausible tree', () => {
    const final = snapshot('official').at(-1)!;
    const wrongWpl = { ...final, metrics: { ...final.metrics!, wpl: 999 } };
    expect(huffmanSnapshotSchema.safeParse(wrongWpl).success).toBe(false);

    const wrongParent = {
      ...final,
      nodes: final.nodes.map((node, index) =>
        index === final.nodes.length - 1
          ? { ...node, weight: node.weight + 1 }
          : node,
      ),
    };
    expect(huffmanSnapshotSchema.safeParse(wrongParent).success).toBe(false);

    const wrongQueue = { ...final, queueIds: ['n1', 'n2'] };
    expect(huffmanSnapshotSchema.safeParse(wrongQueue).success).toBe(false);

    const fakeCode = {
      ...final,
      codes: final.codes.map((row, index) =>
        index === 0 ? { ...row, code: row.code === '0' ? '1' : '0' } : row,
      ),
    };
    expect(huffmanSnapshotSchema.safeParse(fakeCode).success).toBe(false);
  });

  it('lays out every node at a fixed size and keeps the forest stable', () => {
    const buildDone = snapshot('official').find((frame) => frame.operation === 'build-done')!;
    const layout = layoutHuffmanForest(buildDone.nodes, rootsOf(buildDone).map((node) => node.id));
    expect(layout.nodes).toHaveLength(buildDone.nodes.length);
    expect(layout.rootIds).toHaveLength(1);
    expect(layout.width).toBeGreaterThan(88 * 2);
    expect(new Set(layout.nodes.map((node) => node.id)).size).toBe(layout.nodes.length);
    for (const edge of layout.edges) {
      expect(['0', '1']).toContain(edge.bit);
      expect(edge.x2).toBeGreaterThanOrEqual(0);
      expect(edge.y2).toBeGreaterThan(edge.y1);
    }
    const init = snapshot('official')[0]!;
    const forest = layoutHuffmanForest(init.nodes, rootsOf(init).map((node) => node.id));
    expect(forest.rootIds).toHaveLength(6);
    expect(forest.nodes.every((node) => node.depth === 0)).toBe(true);
    expect(forest.width).toBe(6 * 88 + 5 * 44 + 2 * 30);
  });
});
