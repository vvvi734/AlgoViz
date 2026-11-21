import { describe, expect, it } from 'vitest';
import rawFree from '../../test/fixtures/chapter08-free-list-frames.json';
import rawBuddy from '../../test/fixtures/chapter08-buddy-frames.json';
import rawGc from '../../test/fixtures/chapter08-gc-frames.json';
import { structureSchema } from '../trace/schema';
import {
  freeListSnapshotSchema,
  type FreeListSnapshot,
} from '../trace/freeListSchema';
import {
  buddySnapshotSchema,
  type BuddySnapshot,
} from '../trace/buddySchema';
import { gcSnapshotSchema, type GcSnapshot } from '../trace/gcSchema';
import { buildFreeListVisualModel } from '../visualization/freeListModel';
import { buildBuddyVisualModel } from '../visualization/buddyModel';
import { buildGcVisualModel } from '../visualization/gcModel';
import {
  buildFreeListInput,
  emptyFreeListDraft,
  freeListDraftFromInput,
  FREE_LIST_RANDOM_SCENARIOS,
  randomFreeListDraft,
  type FreeListInputDraft,
} from './freeListInput';
import {
  buildBuddyInput,
  buddyDraftFromInput,
  emptyBuddyDraft,
  BUDDY_RANDOM_SCENARIOS,
  randomBuddyDraft,
  type BuddyInputDraft,
} from './buddyInput';
import {
  buildGarbageInput,
  emptyGarbageDraft,
  garbageDraftFromInput,
  GARBAGE_RANDOM_SCENARIOS,
  randomGarbageDraft,
  type GarbageInputDraft,
} from './garbageInput';

interface FixtureFrame {
  structure: unknown;
}

interface FixtureCase {
  input: unknown;
  frames: FixtureFrame[];
}

type Fixtures = Record<string, FixtureCase>;

const freeFixtures = rawFree as Fixtures;
const buddyFixtures = rawBuddy as Fixtures;
const gcFixtures = rawGc as Fixtures;

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

function freeSnapshots(caseName: string): FreeListSnapshot[] {
  return framesOf<FreeListSnapshot>(
    freeFixtures[caseName]!,
    freeListSnapshotSchema,
    `free/${caseName}`,
  );
}

function buddySnapshots(caseName: string): BuddySnapshot[] {
  return framesOf<BuddySnapshot>(
    buddyFixtures[caseName]!,
    buddySnapshotSchema,
    `buddy/${caseName}`,
  );
}

function gcSnapshots(caseName: string): GcSnapshot[] {
  return framesOf<GcSnapshot>(gcFixtures[caseName]!, gcSnapshotSchema, `gc/${caseName}`);
}

function openRange(block: { start: number; size: number }): string {
  return `[${block.start}, ${block.start + block.size})`;
}

describe('TEXTBOOK-08 free-space list traces', () => {
  it('parses every first-fit, best-fit and fragmentation frame', () => {
    for (const name of Object.keys(freeFixtures)) {
      const snapshots = freeSnapshots(name);
      expect(snapshots.length).toBeGreaterThan(10);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      for (const snapshot of snapshots) {
        expect(snapshot.kind).toBe('free-list');
        expect(snapshot.algorithm).toBe('free-list');
        expect(snapshot.blocks[0]!.start).toBe(0);
        expect(snapshot.blocks.at(-1)!.start + snapshot.blocks.at(-1)!.size).toBe(
          snapshot.capacity,
        );
        expect(snapshot.blocks.reduce((sum, block) => sum + block.size, 0)).toBe(
          snapshot.capacity,
        );
        for (const block of snapshot.blocks) {
          expect(block.boundary.headSize).toBe(block.size);
          expect(block.boundary.tailSize).toBe(block.size);
          expect(block.boundary.headStatus).toBe(block.status);
          expect(block.boundary.tailStatus).toBe(block.status);
        }
        expect(snapshot.freeRegionCount).toBe(
          snapshot.blocks.filter((block) => block.status === 'free').length,
        );
        expect(snapshot.totalFree).toBe(
          snapshot.blocks
            .filter((block) => block.status === 'free')
            .reduce((sum, block) => sum + block.size, 0),
        );
      }
    }
  });

  it('keeps First Fit address-ordered and Best Fit remainder-minimal', () => {
    const first = freeSnapshots('first-vs-best-first');
    const best = freeSnapshots('first-vs-best-best');
    const choose = (snapshots: FreeListSnapshot[]) =>
      snapshots.find(
        (snapshot) =>
          snapshot.operation === 'select' && snapshot.request?.id === 'D',
      )!;
    expect(choose(first).selectedStart).toBe(0);
    expect(choose(best).selectedStart).toBe(24);

    const officialFirst = freeSnapshots('first-fit-default');
    const officialBest = freeSnapshots('best-fit-default');
    const pickF = (snapshots: FreeListSnapshot[]) =>
      snapshots.find(
        (snapshot) =>
          snapshot.operation === 'select' && snapshot.request?.id === 'F',
      )!;
    expect(pickF(officialFirst).selectedStart).toBe(12);
    expect(pickF(officialBest).selectedStart).toBe(54);

    for (const snapshots of [officialFirst, officialBest]) {
      const final = snapshots.at(-1)!;
      expect(final.allocatedCount).toBe(2);
      expect(final.freeRegionCount).toBe(2);
      expect(final.blocks.map((block) => [block.start, block.size, block.status, block.label])).toEqual([
        [0, 12, 'allocated', 'A'],
        [12, 38, 'free', null],
        [50, 4, 'allocated', 'E'],
        [54, 10, 'free', null],
      ]);
    }
  });

  it('splits only in place, merges both neighbours and refuses without moving data', () => {
    const coalesce = freeSnapshots('coalesce-both-sides');
    expect(coalesce.some((snapshot) => snapshot.decision === 'both-free')).toBe(true);
    expect(coalesce.filter((snapshot) => snapshot.operation === 'merge').length).toBeGreaterThanOrEqual(2);
    const coalesceFinal = coalesce.at(-1)!;
    expect(coalesceFinal.blocks).toHaveLength(1);
    expect(openRange(coalesceFinal.blocks[0]!)).toBe('[0, 48)');
    expect(coalesceFinal.freeRegionCount).toBe(1);

    const fragmented = freeSnapshots('external-fragmentation');
    const failure = fragmented.find(
      (snapshot) => snapshot.operation === 'fail' && snapshot.request?.id === 'D',
    )!;
    expect(failure.decision).toBe('no-fit');
    expect(failure.allocatedCount).toBe(2);
    expect(failure.totalFree).toBe(44);
    expect(failure.largestFree).toBe(24);
    expect(failure.request!.size).toBe(25);
    const afterFailure = fragmented[fragmented.indexOf(failure) - 1]!;
    expect(afterFailure.blocks).toEqual(failure.blocks);

    const recovery = fragmented.at(-1)!;
    expect(recovery.blocks.map((block) => [block.start, block.size, block.status, block.label])).toEqual([
      [0, 30, 'allocated', 'E'],
      [30, 10, 'allocated', 'C'],
      [40, 24, 'free', null],
    ]);
    for (const snapshot of fragmented) {
      expect(snapshot.internalFragment).toBe(0);
    }
  });

  it('maps the partition onto the shared memory strip and the free table', () => {
    const bounded = freeSnapshots('coalesce-both-sides').find(
      (snapshot) => snapshot.decision === 'both-free',
    )!;
    const model = buildFreeListVisualModel(bounded);
    expect(model.kind).toBe('free-list');
    expect(model.blocks).toHaveLength(bounded.blocks.length);
    expect(model.blocks.find((block) => block.merging)).toBeTruthy();
    expect(model.freeRows).toEqual(
      bounded.freeBlocks.map((block) => ({
        start: block.start,
        size: block.size,
        status: 'free',
        label: null,
      })),
    );
    expect(model.blocks.every((block) => block.headSize === block.size)).toBe(true);
  });
});

describe('TEXTBOOK-08 buddy-system traces', () => {
  it('parses aligned power-of-two levels and correct internal fragmentation', () => {
    for (const name of Object.keys(buddyFixtures)) {
      const snapshots = buddySnapshots(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      for (const snapshot of snapshots) {
        expect(snapshot.capacity & (snapshot.capacity - 1)).toBe(0);
        expect(snapshot.maxLevel).toBe(Math.log2(snapshot.capacity));
        let cursor = 0;
        for (const block of snapshot.blocks) {
          expect(block.start).toBe(cursor);
          expect(block.size & (block.size - 1)).toBe(0);
          expect(block.start % block.size).toBe(0);
          expect(block.level).toBe(Math.log2(block.size));
          cursor += block.size;
        }
        expect(cursor).toBe(snapshot.capacity);
        if (snapshot.blockSize !== null) {
          expect(snapshot.blockSize).toBeGreaterThanOrEqual(snapshot.requestedSize!);
          expect(snapshot.blockSize - snapshot.requestedSize!).toBe(snapshot.internalFragment);
        }
      }
    }
  });

  it('rounds 3 and 5 bytes up to 4 and 8 byte blocks', () => {
    const snapshots = buddySnapshots('default');
    const a = snapshots.find(
      (snapshot) => snapshot.operation === 'allocate' && snapshot.requestedId === 'A',
    )!;
    expect(a.targetLevel).toBe(2);
    expect(a.blockSize).toBe(4);
    expect(a.internalFragment).toBe(1);
    const b = snapshots.find(
      (snapshot) => snapshot.operation === 'allocate' && snapshot.requestedId === 'B',
    )!;
    expect(b.targetLevel).toBe(3);
    expect(b.blockSize).toBe(8);
    expect(b.internalFragment).toBe(3);
  });

  it('splits repeatedly, merges only true buddies and stops at a busy buddy', () => {
    const multi = buddySnapshots('merge-multi');
    expect(multi.filter((snapshot) => snapshot.operation === 'split').length).toBeGreaterThan(3);
    expect(multi.filter((snapshot) => snapshot.operation === 'merge').length).toBeGreaterThanOrEqual(3);
    expect(multi.at(-1)!.blocks).toEqual([
      { start: 0, size: 32, level: 5, status: 'free', label: null },
    ]);

    const one = buddySnapshots('merge-one');
    expect(one.at(-1)!.blocks).toEqual([
      { start: 0, size: 8, level: 3, status: 'free', label: null },
      { start: 8, size: 8, level: 3, status: 'allocated', label: 'B' },
      { start: 16, size: 16, level: 4, status: 'free', label: null },
    ]);

    const busy = buddySnapshots('buddy-busy');
    expect(busy.some((snapshot) => snapshot.operation === 'merge')).toBe(false);
    expect(busy.at(-1)!.blocks.find((block) => block.start === 0)).toMatchObject({
      size: 4,
      status: 'free',
    });
  });

  it('fails an oversized request without changing the tree', () => {
    const snapshots = buddySnapshots('insufficient');
    const failure = snapshots.find(
      (snapshot) => snapshot.operation === 'fail' && snapshot.requestedId === 'C',
    )!;
    expect(failure.requestedSize).toBe(20);
    expect(failure.targetLevel).toBe(5);
    expect(failure.blockSize).toBeNull();
    expect(failure.internalFragment).toBe(0);
    expect(failure.blocks.map((block) => [block.start, block.size, block.status, block.label])).toEqual([
      [0, 4, 'allocated', 'A'],
      [4, 4, 'free', null],
      [8, 8, 'allocated', 'B'],
      [16, 16, 'free', null],
    ]);
    expect(snapshots.at(-1)!.blocks).toEqual(failure.blocks);
  });

  it('builds a two-view model with a level-ordered split tree', () => {
    const snapshots = buddySnapshots('default');
    const split = snapshots.find((snapshot) => snapshot.operation === 'split')!;
    const model = buildBuddyVisualModel(split);
    expect(model.kind).toBe('buddy-system');
    expect(model.segments).toHaveLength(split.blocks.length);
    expect(model.nodes.length).toBeGreaterThan(model.segments.length);
    expect(model.nodes.map((node) => node.level)).toEqual(
      [...model.nodes].map((node) => node.level).sort((left, right) => left - right),
    );
    expect(model.nodes.filter((node) => node.status === 'free').length).toBeGreaterThan(0);
  });
});

describe('TEXTBOOK-08 garbage collection and compaction traces', () => {
  it('parses mark-sweep and compaction frames with reachable closure', () => {
    for (const name of Object.keys(gcFixtures)) {
      const snapshots = gcSnapshots(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      for (const snapshot of snapshots) {
        expect(snapshot.kind).toBe('garbage-collection');
        expect(snapshot.objects.length).toBeGreaterThan(0);
        expect(snapshot.liveBytes).toBe(
          snapshot.objects
            .filter((object) => object.status === 'allocated')
            .reduce((sum, object) => sum + object.size, 0),
        );
        expect(snapshot.freeBytes).toBe(snapshot.capacity - snapshot.liveBytes);
        for (const ref of snapshot.refs) {
          const source = snapshot.objects.find((object) => object.id === ref.fromId)!;
          const target = snapshot.objects.find((object) => object.id === ref.toId)!;
          expect(ref.fromStart).toBe(source.start);
          expect(ref.toStart).toBe(target.start);
        }
      }
    }
  });

  it('reclaims an unreachable cycle and keeps every root-reachable object', () => {
    const cycle = gcSnapshots('mark-sweep-cycle');
    const final = cycle.at(-1)!;
    expect(final.objects.map((object) => [object.id, object.status])).toEqual([
      ['A', 'allocated'],
      ['B', 'allocated'],
      ['C', 'free'],
    ]);
    expect(final.reachableIds).toEqual(['A', 'B']);
    expect(final.refs.map((ref) => [ref.fromId, ref.toId])).toEqual([
      ['A', 'B'],
      ['B', 'A'],
    ]);
    expect(final.freeSpans).toEqual([{ start: 12, size: 12 }]);
    expect(cycle.length).toBeLessThan(20);
  });

  it('supports several roots and reports scattered holes after sweeping', () => {
    const multi = gcSnapshots('mark-sweep-multi-root').at(-1)!;
    expect(multi.roots).toEqual(['A', 'C']);
    expect(multi.reachableIds).toEqual(['A', 'B', 'C']);
    expect(multi.objects.map((object) => [object.id, object.status])).toEqual([
      ['A', 'allocated'],
      ['B', 'allocated'],
      ['C', 'allocated'],
      ['D', 'free'],
      ['E', 'free'],
    ]);
    expect(multi.freeSpans).toEqual([{ start: 18, size: 30 }]);

    const defaultSweep = gcSnapshots('mark-sweep-default').at(-1)!;
    expect(defaultSweep.freeSpans).toEqual([
      { start: 12, size: 8 },
      { start: 30, size: 8 },
      { start: 46, size: 6 },
      { start: 64, size: 32 },
    ]);
    expect(defaultSweep.refs.some((ref) => ['E', 'F', 'H'].includes(ref.fromId))).toBe(false);
    expect(defaultSweep.refs.some((ref) => ['E', 'F', 'H'].includes(ref.toId))).toBe(false);
  });

  it('compacts live objects and rewrites every reference to the new address', () => {
    const snapshots = gcSnapshots('compaction-default');
    const final = snapshots.at(-1)!;
    expect(final.mode).toBe('compaction');
    expect(final.objects.filter((object) => object.status === 'allocated').map((object) => [
      object.id,
      object.start,
      object.size,
    ])).toEqual([
      ['A', 0, 12],
      ['B', 12, 10],
      ['C', 22, 8],
      ['D', 30, 12],
    ]);
    expect(final.freeSpans).toEqual([{ start: 42, size: 54 }]);
    expect(final.refs.map((ref) => [ref.fromId, ref.toId, ref.toStart])).toEqual([
      ['A', 'B', 12],
      ['A', 'C', 22],
      ['B', 'D', 30],
      ['C', 'B', 12],
    ]);
    expect(final.lastMove).toEqual({ objectId: 'D', from: 52, to: 30 });
    expect(snapshots.some((snapshot) => snapshot.updatedRefIds.length > 0)).toBe(true);

    const moves = snapshots.filter((snapshot) => snapshot.operation === 'move');
    expect(moves.length).toBeGreaterThan(0);
    for (const move of moves) {
      expect(move.lastMove).not.toBeNull();
      expect(move.lastMove!.to).toBeLessThanOrEqual(move.capacity);
      expect(move.objects.some((object) => object.id === move.lastMove!.objectId)).toBe(true);
    }
  });

  it('maps live nodes, reference edges and memory segments consistently', () => {
    const final = gcSnapshots('compaction-default').at(-1)!;
    const model = buildGcVisualModel(final);
    expect(model.kind).toBe('garbage-collection');
    expect(model.nodes.filter((node) => node.status === 'allocated')).toHaveLength(4);
    expect(model.refs.every((ref) => ref.live)).toBe(true);
    expect(model.segments.reduce((sum, segment) => sum + segment.size, 0)).toBe(final.capacity);
    expect(model.freeSpans).toEqual(final.freeSpans);
  });
});

describe('TEXTBOOK-08 structured input and random scenarios', () => {
  const freeDraft = (overrides: Partial<FreeListInputDraft> = {}): FreeListInputDraft => ({
    ...emptyFreeListDraft(),
    ...overrides,
  });
  const buddyDraft = (overrides: Partial<BuddyInputDraft> = {}): BuddyInputDraft => ({
    ...emptyBuddyDraft(),
    ...overrides,
  });
  const gcDraft = (overrides: Partial<GarbageInputDraft> = {}): GarbageInputDraft => ({
    ...emptyGarbageDraft(),
    ...overrides,
  });

  it('validates free-list capacity, ids, duplicate allocations and release order', () => {
    const base = freeDraft();
    expect(buildFreeListInput(base).ok).toBe(true);
    expect(buildFreeListInput(freeDraft({ capacity: '7' })).ok).toBe(false);
    expect(buildFreeListInput(freeDraft({ capacity: '129' })).ok).toBe(false);
    const duplicate = freeDraft({
      rows: [
        { id: 'r1', op: 'alloc', blockId: 'A', size: '8' },
        { id: 'r2', op: 'alloc', blockId: 'A', size: '8' },
      ],
    });
    expect(buildFreeListInput(duplicate).ok).toBe(false);
    const premature = freeDraft({
      rows: [{ id: 'r1', op: 'free', blockId: 'A', size: '' }],
    });
    expect(buildFreeListInput(premature).ok).toBe(false);
    const zero = freeDraft({
      rows: [{ id: 'r1', op: 'alloc', blockId: 'A', size: '0' }],
    });
    expect(buildFreeListInput(zero).ok).toBe(false);
    const roundTrip = freeListDraftFromInput(freeFixtures['first-fit-default']!.input);
    expect(buildFreeListInput(roundTrip).ok).toBe(true);
  });

  it('rejects non-power-of-two buddy capacities and oversized allocations', () => {
    expect(buildBuddyInput(buddyDraft({ capacity: '24' })).ok).toBe(false);
    expect(buildBuddyInput(buddyDraft({ capacity: '33' })).ok).toBe(false);
    const oversized = buddyDraft({
      capacity: '32',
      rows: [{ id: 'r1', op: 'alloc', blockId: 'A', size: '33' }],
    });
    expect(buildBuddyInput(oversized).ok).toBe(false);
    expect(
      buildBuddyInput(
        buddyDraft({
          capacity: '32',
          rows: [{ id: 'r1', op: 'free', blockId: 'A', size: '' }],
        }),
      ).ok,
    ).toBe(false);
    expect(buildBuddyInput(buddyDraftFromInput(buddyFixtures['default']!.input)).ok).toBe(true);
  });

  it('validates GC roots, object ids, references and capacity', () => {
    expect(buildGarbageInput(gcDraft()).ok).toBe(true);
    const unknownRoot = gcDraft({ roots: 'Z' });
    expect(buildGarbageInput(unknownRoot).ok).toBe(false);
    const duplicateObject = gcDraft({
      objects: [
        { id: 'r1', objectId: 'A', size: '8', refs: '' },
        { id: 'r2', objectId: 'A', size: '8', refs: '' },
      ],
    });
    expect(buildGarbageInput(duplicateObject).ok).toBe(false);
    const unknownRef = gcDraft({
      objects: [{ id: 'r1', objectId: 'A', size: '8', refs: 'Z' }],
    });
    expect(buildGarbageInput(unknownRef).ok).toBe(false);
    expect(
      buildGarbageInput(
        gcDraft({
          capacity: '32',
          objects: [{ id: 'r1', objectId: 'A', size: '40', refs: '' }],
        }),
      ).ok,
    ).toBe(false);
    expect(buildGarbageInput(garbageDraftFromInput(gcFixtures['mark-sweep-default']!.input)).ok).toBe(
      true,
    );
  });

  it('generates every advertised random scenario as a valid editable input', () => {
    for (const scenario of FREE_LIST_RANDOM_SCENARIOS) {
      expect(buildFreeListInput(randomFreeListDraft(scenario.id)).ok, scenario.id).toBe(true);
    }
    for (const scenario of BUDDY_RANDOM_SCENARIOS) {
      expect(buildBuddyInput(randomBuddyDraft(scenario.id)).ok, scenario.id).toBe(true);
    }
    for (const scenario of GARBAGE_RANDOM_SCENARIOS) {
      expect(buildGarbageInput(randomGarbageDraft(scenario.id)).ok, scenario.id).toBe(true);
    }
  });
});

describe('TEXTBOOK-08 snapshot union', () => {
  it('recognises all three structures through the shared union', () => {
    const one = [
      freeSnapshots('first-fit-default')[0]!,
      buddySnapshots('default')[0]!,
      gcSnapshots('mark-sweep-default')[0]!,
    ];
    for (const snapshot of one) {
      expect(structureSchema.safeParse(snapshot).success).toBe(true);
    }
  });
});
