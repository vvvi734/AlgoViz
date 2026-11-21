import { describe, expect, it } from 'vitest';
import rawMultiway from '../../test/fixtures/chapter11-multiway-frames.json';
import rawReplacement from '../../test/fixtures/chapter11-replacement-frames.json';
import rawOptimal from '../../test/fixtures/chapter11-optimal-tree-frames.json';
import { structureSchema } from '../trace/schema';
import { multiwaySnapshotSchema, type MultiwaySnapshot } from '../trace/multiwaySchema';
import { replacementSnapshotSchema, type ReplacementSnapshot } from '../trace/replacementSchema';
import {
  optimalSnapshotSchema,
  type OptimalSnapshot,
} from '../trace/optimalMergeSchema';
import { MULTIWAY_DEFAULT_INPUT } from './multiwayExamples';
import { REPLACEMENT_DEFAULT_INPUT } from './replacementExamples';
import { OPTIMAL_MERGE_DEFAULT_INPUT } from './optimalMergeExamples';

interface FixtureFrame { structure: unknown; lessonStepId?: string | null }
interface FixtureCase { input: unknown; frames: FixtureFrame[] }
type Fixtures = Record<string, FixtureCase>;

const multiwayFixtures = rawMultiway as Fixtures;
const replacementFixtures = rawReplacement as Fixtures;
const optimalFixtures = rawOptimal as Fixtures;

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

const multiway = (name: string): MultiwaySnapshot[] =>
  framesOf(multiwayFixtures[name]!, multiwaySnapshotSchema, `multiway/${name}`);
const replacement = (name: string): ReplacementSnapshot[] =>
  framesOf(replacementFixtures[name]!, replacementSnapshotSchema, `replacement/${name}`);
const optimal = (name: string): OptimalSnapshot[] =>
  framesOf(optimalFixtures[name]!, optimalSnapshotSchema, `optimal/${name}`);

describe('TEXTBOOK-11 multiway merge traces', () => {
  it('validates every frame and ends with a complete stable merge', () => {
    for (const name of Object.keys(multiwayFixtures)) {
      const snapshots = multiway(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      const done = snapshots.at(-1)!;
      expect(done.result).toBe('sorted');
      expect(done.output).toHaveLength(done.records.length);
      const byId = new Map(done.records.map((record) => [record.id, record]));
      const expected = [...done.records]
        .sort((left, right) => left.value - right.value || left.originalIndex - right.originalIndex)
        .map((record) => record.id);
      expect(done.output).toEqual(expected);
      expect(done.output.every((id, index) => index === 0 ||
        byId.get(done.output[index - 1]!)!.value <= byId.get(id)!.value)).toBe(true);
    }
  });

  it('covers 2/3/4-way merge, uneven runs and an empty run', () => {
    expect(multiway('two-way').at(-1)!.k).toBe(2);
    expect(multiway('three-way').at(-1)!.k).toBe(3);
    expect(multiway('four-way').at(-1)!.k).toBe(4);
    expect(multiway('empty-run').at(-1)!.runs.some((run) => run.recordIds.length === 0)).toBe(true);
    expect(multiway('two-way').at(-1)!.readBlocks).toBeGreaterThan(0);
    expect(multiway('two-way').at(-1)!.writeBlocks).toBeGreaterThan(0);
  });

  it('keeps equal keys stable by original index', () => {
    const done = multiway('duplicates').at(-1)!;
    expect(done.output).toEqual(['A', 'D', 'B', 'C', 'E', 'F']);
    expect(done.records.map((record) => record.value)).toEqual([1, 3, 3, 2, 3, 4]);
  });

  it('exposes the official default shape and buffer capacities', () => {
    expect((MULTIWAY_DEFAULT_INPUT as { k: number }).k).toBe(2);
    const init = multiway('two-way')[0]!;
    expect(init.bufferCapacity).toBe(2);
    expect(init.blockSize).toBe(1);
    expect(init.candidateIds).toEqual([]);
  });
});

describe('TEXTBOOK-11 replacement-selection traces', () => {
  it('validates every frame and preserves each input multiset', () => {
    for (const name of Object.keys(replacementFixtures)) {
      const snapshots = replacement(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      const done = snapshots.at(-1)!;
      expect(done.result).toBe('runs-ready');
      expect(done.workspace.every((slot) => slot.recordId === null)).toBe(true);
      const flattened = done.runs.flat();
      expect(flattened).toHaveLength(done.records.length);
      expect(new Set(flattened).size).toBe(done.records.length);
      expect([...flattened].sort()).toEqual(done.records.map((record) => record.id).sort());
    }
  });

  it('freezes records for the next run and unfreezes them together', () => {
    const snapshots = replacement('normal');
    expect(snapshots.some((snapshot) => snapshot.operation === 'freeze')).toBe(true);
    expect(snapshots.some((snapshot) => snapshot.operation === 'segment-end')).toBe(true);
    expect(snapshots.some((snapshot) => snapshot.operation === 'advance')).toBe(true);
    const advanced = snapshots.find((snapshot) => snapshot.operation === 'advance')!;
    expect(advanced.lastOutput).toBeNull();
    expect(advanced.frozenIds).toEqual([]);
  });

  it('produces a run longer than the workspace for the default case', () => {
    const done = replacement('normal').at(-1)!;
    expect(done.workspaceCapacity).toBe(3);
    expect(Math.max(...done.runs.map((run) => run.length))).toBeGreaterThan(3);
    expect(done.runs.length).toBeGreaterThan(1);
  });

  it('handles a single record and the official default', () => {
    const single = replacement('single').at(-1)!;
    expect(single.runs).toEqual([['A']]);
    expect((REPLACEMENT_DEFAULT_INPUT as { workspaceCapacity: number }).workspaceCapacity).toBe(3);
  });
});

describe('TEXTBOOK-11 optimal merge tree traces', () => {
  it('validates every frame, one root, correct sum and virtual leaves', () => {
    for (const name of Object.keys(optimalFixtures)) {
      const snapshots = optimal(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      const done = snapshots.at(-1)!;
      expect(done.result).toBe('built');
      expect(done.forestIds).toHaveLength(1);
      expect(done.selectedIds).toEqual([]);
      const internal = done.nodes.filter((node) => !node.leaf);
      expect(done.totalCost).toBe(internal.reduce((sum, node) => sum + node.weight, 0));
      expect(done.combines).toBe(internal.length);
    }
  });

  it('computes the classic two-way cost', () => {
    expect(optimal('two-way').at(-1)!.totalCost).toBe(51);
    expect(optimal('three-way').at(-1)!.totalCost).toBe(50);
    expect(optimal('single').at(-1)!.totalCost).toBe(0);
  });

  it('adds only the necessary virtual leaves for a full k-ary tree', () => {
    const virtual = optimal('virtual-dummy').at(-1)!;
    expect(virtual.k).toBe(3);
    expect(virtual.nodes.filter((node) => node.virtual).length).toBe(1);
    expect(virtual.nodes.find((node) => node.virtual)!.weight).toBe(0);
    expect(virtual.segmentWeights).toHaveLength(6);
    expect((OPTIMAL_MERGE_DEFAULT_INPUT as { segmentWeights: number[] }).segmentWeights)
      .toEqual([3, 5, 8, 11]);
  });
});
