import { describe, expect, it } from 'vitest';
import rawIndex from '../../test/fixtures/chapter12-file-index-frames.json';
import rawIsam from '../../test/fixtures/chapter12-isam-frames.json';
import rawInverted from '../../test/fixtures/chapter12-inverted-frames.json';
import { structureSchema } from '../trace/schema';
import { fileIndexSnapshotSchema, type FileIndexSnapshot } from '../trace/fileIndexSchema';
import { isamSnapshotSchema, type IsamSnapshot } from '../trace/isamSchema';
import { invertedSnapshotSchema, type InvertedSnapshot } from '../trace/invertedIndexSchema';
import { FILE_INDEX_DEFAULT_INPUT } from './fileIndexExamples';
import { ISAM_DEFAULT_INPUT } from './isamExamples';
import { INVERTED_INDEX_DEFAULT_INPUT } from './invertedIndexExamples';

interface FixtureFrame { structure: unknown; lessonStepId?: string | null }
interface FixtureCase { input: unknown; frames: FixtureFrame[] }
type Fixtures = Record<string, FixtureCase>;

const indexFixtures = rawIndex as Fixtures;
const isamFixtures = rawIsam as Fixtures;
const invertedFixtures = rawInverted as Fixtures;

function framesOf<T>(
  entry: FixtureCase,
  schema: { safeParse: (value: unknown) => { success: boolean; data?: T; error?: unknown } },
  label: string,
): T[] {
  return entry.frames.map((frame, index) => {
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, `${label}[${index}] union: ${JSON.stringify(union.error)}`).toBe(true);
    const parsed = schema.safeParse(frame.structure);
    expect(parsed.success, `${label}[${index}] schema: ${JSON.stringify(parsed.error)}`).toBe(true);
    return parsed.data as T;
  });
}

const indexFile = (name: string): FileIndexSnapshot[] =>
  framesOf(indexFixtures[name]!, fileIndexSnapshotSchema, `file-index/${name}`);
const isam = (name: string): IsamSnapshot[] =>
  framesOf(isamFixtures[name]!, isamSnapshotSchema, `isam/${name}`);
const inverted = (name: string): InvertedSnapshot[] =>
  framesOf(invertedFixtures[name]!, invertedSnapshotSchema, `inverted/${name}`);

describe('TEXTBOOK-12 indexed-file traces', () => {
  it('validates every frame and agrees with the materialized file', () => {
    for (const name of Object.keys(indexFixtures)) {
      const snapshots = indexFile(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      const done = snapshots.at(-1)!;
      const recordIds = done.blocks.flatMap((block) => block.recordIds);
      expect(recordIds).toHaveLength(done.records.length);
      expect(new Set(recordIds).size).toBe(done.records.length);
      expect(done.indexBlockReads).toBe(1);
      expect(done.dataBlockReads).toBe(1);
      expect(done.indexEntryProbes).toBeGreaterThan(0);

      const targetInFile = done.records.some((record) => record.key === done.targetKey);
      expect(done.result === 'found').toBe(targetInFile);
      if (done.result === 'found') {
        expect(done.records.find((record) => record.id === done.foundId)!.key).toBe(done.targetKey);
      }
    }
  });

  it('distinguishes dense and sparse indexes while preserving block addresses', () => {
    const dense = indexFile('dense-hit').at(-1)!;
    const sparse = indexFile('sparse-hit').at(-1)!;
    expect(dense.indexKind).toBe('dense');
    expect(sparse.indexKind).toBe('sparse');
    expect(dense.indexEntries).toHaveLength(dense.records.length);
    expect(sparse.indexEntries).toHaveLength(sparse.blocks.length);
    for (const block of sparse.blocks) {
      expect(sparse.indexEntries.find((entry) => entry.blockId === block.id)!.key)
        .toBe(sparse.records.find((record) => record.id === block.recordIds[0])!.key);
    }
  });

  it('covers hits, misses, small and large blocks', () => {
    expect(indexFile('dense-hit').at(-1)!.result).toBe('found');
    expect(indexFile('sparse-hit').at(-1)!.result).toBe('found');
    expect(indexFile('dense-miss').at(-1)!.result).toBe('not-found');
    expect(indexFile('sparse-miss').at(-1)!.result).toBe('not-found');
    expect(indexFile('small-blocks').at(-1)!.blocks).toHaveLength(4);
    expect(indexFile('large-blocks').at(-1)!.blocks).toHaveLength(2);
    expect((FILE_INDEX_DEFAULT_INPUT as { targetKey: number }).targetKey).toBe(106);
  });
});

describe('TEXTBOOK-12 ISAM traces', () => {
  it('validates every frame and keeps one upper bound per main block', () => {
    for (const name of Object.keys(isamFixtures)) {
      const snapshots = isam(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      const done = snapshots.at(-1)!;
      expect(done.indexEntries).toHaveLength(done.blocks.length);
      const stored = [
        ...done.blocks.flatMap((block) => block.recordIds),
        ...done.overflowNodes.flatMap((node) => node.recordIds),
      ];
      expect(new Set(stored).size).toBe(done.records.length);
      expect(stored).toHaveLength(done.records.length);
      expect(done.mainBlockReads).toBe(1);
      expect(done.indexBlockReads).toBe(1);
      if (done.result === 'inserted') {
        expect(done.insertedId).not.toBeNull();
        expect(done.foundId).toBe(done.insertedId);
      }
    }
  });

  it('follows only the selected block’s overflow chain', () => {
    const snapshots = isam('find-overflow');
    expect(snapshots.some((snapshot) => snapshot.operation === 'insert-overflow')).toBe(true);
    expect(snapshots.some((snapshot) => snapshot.operation === 'link-overflow')).toBe(true);
    expect(snapshots.some((snapshot) => snapshot.operation === 'read-overflow')).toBe(true);
    const done = snapshots.at(-1)!;
    expect(done.result).toBe('inserted');
    expect(done.overflowBlockReads).toBe(1);
    const selected = done.blocks.find((block) => block.id === done.selectedBlockId)!;
    expect(done.overflowNodes.some((node) => node.blockId === selected.id)).toBe(true);
  });

  it('inserts into a main block when space remains and re-finds it', () => {
    const done = isam('insert-main').at(-1)!;
    expect(done.result).toBe('inserted');
    expect(done.records.find((record) => record.id === done.insertedId)!.key).toBe(done.targetKey);
    expect(done.blocks.some((block) => block.recordIds.includes(done.insertedId!))).toBe(true);
    expect(done.overflowBlockReads).toBe(0);
  });

  it('reports a miss without inventing an overflow record', () => {
    const done = isam('find-miss').at(-1)!;
    expect(done.result).toBe('not-found');
    expect(done.foundId).toBeNull();
    expect(done.overflowBlockReads).toBe(0);
    expect((ISAM_DEFAULT_INPUT as { command: string }).command).toBe('insert');
  });
});

describe('TEXTBOOK-12 inverted-index traces', () => {
  it('validates every frame and builds exact posting lists', () => {
    for (const name of Object.keys(invertedFixtures)) {
      const snapshots = inverted(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      const done = snapshots.at(-1)!;
      for (const entry of done.index) {
        const expected = done.records
          .filter((record) => record.keywords.includes(entry.term))
          .map((record) => record.id);
        expect(entry.postings).toEqual(expected);
      }
      expect(done.builtCount).toBe(done.records.length);
    }
  });

  it('computes AND intersection and OR union from real posting lists', () => {
    expect(inverted('and-query').at(-1)!.matchedIds).toEqual(['R2']);
    expect(inverted('or-query').at(-1)!.matchedIds).toEqual(['R1', 'R2', 'R3', 'R4']);
  });

  it('handles a shared keyword, missing term and empty result', () => {
    expect(inverted('shared-keyword').at(-1)!.matchedIds).toEqual(['R1', 'R3']);
    expect(inverted('missing-term').at(-1)!.result).toBe('empty');
    expect(inverted('missing-term').at(-1)!.matchedIds).toEqual([]);
    expect(inverted('no-match').at(-1)!.result).toBe('empty');
    expect((INVERTED_INDEX_DEFAULT_INPUT as { queryTerms: string[] }).queryTerms)
      .toEqual(['算法', '排序']);
  });
});
