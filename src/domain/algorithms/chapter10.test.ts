import { describe, expect, it } from 'vitest';
import rawTournament from '../../test/fixtures/chapter10-tournament-frames.json';
import rawRadix from '../../test/fixtures/chapter10-radix-frames.json';
import { structureSchema } from '../trace/schema';
import {
  tournamentSnapshotSchema,
  type TournamentSnapshot,
} from '../trace/tournamentSchema';
import { radixSnapshotSchema, type RadixSnapshot } from '../trace/radixSchema';
import { buildTournamentModel } from '../visualization/tournamentModel';
import { buildRadixModel } from '../visualization/radixModel';
import {
  buildGuidedInput,
  guidedDraftFromInput,
  guidedRandomScenarios,
  randomGuidedDraft,
} from './guidedInput';
import { TOURNAMENT_DEFAULT_INPUT, TOURNAMENT_PRESETS } from './tournamentExamples';
import { RADIX_DEFAULT_INPUT, RADIX_PRESETS } from './radixExamples';

interface FixtureFrame {
  structure: unknown;
}

interface FixtureCase {
  input: unknown;
  frames: FixtureFrame[];
}

type Fixtures = Record<string, FixtureCase>;

const tournamentFixtures = rawTournament as Fixtures;
const radixFixtures = rawRadix as Fixtures;

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

function tournamentSnapshots(name: string): TournamentSnapshot[] {
  return framesOf(
    tournamentFixtures[name]!,
    tournamentSnapshotSchema,
    `tournament/${name}`,
  );
}

function radixSnapshots(name: string): RadixSnapshot[] {
  return framesOf(radixFixtures[name]!, radixSnapshotSchema, `radix/${name}`);
}

function sortedLabels(records: Array<{ id: string; value: number }>): string[] {
  return [...records]
    .sort((left, right) => left.value - right.value || left.id.localeCompare(right.id))
    .map((record) => record.id);
}

describe('TEXTBOOK-10 tournament selection sort traces', () => {
  it('validates every real frame against the union and the tournament schema', () => {
    for (const name of Object.keys(tournamentFixtures)) {
      const snapshots = tournamentSnapshots(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      expect(snapshots.at(-1)!.output).toHaveLength(snapshots.at(-1)!.records.length);
      expect(snapshots.at(-1)!.activeCount).toBe(0);
      expect(snapshots.at(-1)!.result).toBe('sorted');
    }
  });

  it('emits the stable sorted order for shuffled, reversed and non-power-of-two input', () => {
    expect(tournamentSnapshots('normal').at(-1)!.output).toEqual([
      'D', 'F', 'B', 'H', 'E', 'A', 'G', 'C',
    ]);
    expect(tournamentSnapshots('reversed').at(-1)!.output).toEqual([
      'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A',
    ]);
    expect(tournamentSnapshots('non-power').at(-1)!.output).toEqual([
      'B', 'D', 'E', 'A', 'C',
    ]);
    expect(tournamentSnapshots('negatives').at(-1)!.output).toEqual([
      'A', 'D', 'C', 'E', 'B',
    ]);
  });

  it('keeps equal keys in original identity order', () => {
    const duplicates = tournamentSnapshots('duplicates');
    expect(duplicates.at(-1)!.output).toEqual(['B', 'E', 'H', 'D', 'G', 'A', 'C', 'F']);
    const records = duplicates.at(-1)!.records;
    expect(records.filter((record) => record.value === 3).map((record) => record.id)).toEqual([
      'A', 'C', 'F',
    ]);
  });

  it('outputs the root winner before deactivating its leaf and recomputes a real path', () => {
    const normal = tournamentSnapshots('normal');
    const select = normal.find((snapshot) => snapshot.operation === 'select')!;
    const root = select.nodes.find((node) => node.id === select.rootId)!;
    expect(select.winnerId).toBe(root.recordId);
    expect(select.winnerId).toBe('D');

    const output = normal.find((snapshot) => snapshot.operation === 'output')!;
    expect(output.output).toEqual(['D']);
    expect(output.records.find((record) => record.id === 'D')!.active).toBe(true);

    const update = normal.find((snapshot) => snapshot.operation === 'update')!;
    expect(update.records.find((record) => record.id === 'D')!.active).toBe(false);
    expect(update.affectedNodeIds[0]).toBe('L3');
    expect(update.affectedNodeIds.at(-1)).toBe(update.rootId);
    expect(update.affectedNodeIds.length).toBeGreaterThan(1);
  });

  it('handles the single-record tree as its own root leaf', () => {
    const single = tournamentSnapshots('single');
    expect(single.map((snapshot) => snapshot.operation)).toEqual([
      'init', 'select', 'output', 'update', 'done',
    ]);
    expect(single.at(-1)!.rootId).toBe('L0');
    expect(single.at(-1)!.output).toEqual(['A']);
    expect(single.at(-1)!.nodes[0]!.recordId).toBeNull();
  });

  it('preserves every record through the visual model and marks the output winner', () => {
    const select = tournamentSnapshots('normal').find((snapshot) => snapshot.operation === 'select')!;
    const model = buildTournamentModel(select);
    expect(model.nodes).toHaveLength(select.nodes.length);
    expect(model.records).toHaveLength(8);
    expect(model.output).toHaveLength(0);
    expect(model.compareNodeIds.length).toBe(2);
    expect(model.records.find((record) => record.id === 'D')!.state).toBe('winner');
  });
});

describe('TEXTBOOK-10 radix sort traces', () => {
  it('validates every real frame and never reorders records by comparison', () => {
    for (const name of Object.keys(radixFixtures)) {
      const snapshots = radixSnapshots(name);
      expect(snapshots[0]!.operation).toBe('init');
      expect(snapshots.at(-1)!.operation).toBe('done');
      expect(snapshots.at(-1)!.result).toBe('sorted');
      for (const snapshot of snapshots) {
        expect(snapshot.records.map((record) => record.id)).toEqual(
          sortedLabels(snapshot.records.map((record) => ({ id: record.id, value: record.originalIndex }))),
        );
      }
    }
  });

  it('processes every pass with a digit, ten buckets and a stable collected prefix', () => {
    const multi = radixSnapshots('multi-digit');
    expect(multi.filter((snapshot) => snapshot.operation === 'digit-start')).toHaveLength(3);
    for (const snapshot of multi.filter((frame) => frame.operation === 'collect')) {
      expect(snapshot.collected).toEqual(
        snapshot.buckets.slice(0, (snapshot.currentBucket ?? 0) + 1).flat(),
      );
      expect(snapshot.currentDigit).toBe(snapshot.currentBucket);
    }
    expect(multi.at(-1)!.order).toEqual(['G', 'F', 'B', 'H', 'C', 'D', 'A', 'E']);
  });

  it('keeps duplicate keys stable through every pass', () => {
    const duplicates = radixSnapshots('duplicates');
    expect(duplicates.at(-1)!.order).toEqual(['E', 'B', 'D', 'A', 'C', 'F']);
    expect(duplicates.at(-1)!.records.filter((record) => record.value === 21).map((record) => record.id)).toEqual([
      'A', 'C', 'F',
    ]);
  });

  it('handles zero, mixed digit lengths and completely identical keys', () => {
    expect(radixSnapshots('zero').at(-1)!.order).toEqual(['A', 'E', 'C', 'B', 'D']);
    expect(radixSnapshots('mixed-length').at(-1)!.order).toEqual([
      'F', 'D', 'A', 'G', 'C', 'E', 'B',
    ]);
    expect(radixSnapshots('identical').at(-1)!.order).toEqual(['A', 'B', 'C', 'D']);
  });

  it('builds a visual model with ten buckets and highlights the current bucket', () => {
    const distribute = radixSnapshots('multi-digit').find((snapshot) => snapshot.operation === 'distribute')!;
    const model = buildRadixModel(distribute);
    expect(model.buckets).toHaveLength(10);
    expect(model.buckets[model.currentDigit!]!.active).toBe(true);
    expect(model.currentId).toBe(distribute.currentId);
    expect(model.order).toHaveLength(8);
  });
});

describe('TEXTBOOK-10 guided input', () => {
  it('parses the official default and rejects invalid tournament lengths', () => {
    const tournament = buildGuidedInput(
      'tournament',
      guidedDraftFromInput('tournament', TOURNAMENT_DEFAULT_INPUT),
    );
    expect(tournament.ok).toBe(true);
    if (!tournament.ok) return;
    expect(tournament.input).toEqual([8, 3, 11, 1, 7, 2, 9, 4]);

    const tooMany = buildGuidedInput('tournament', {
      ...guidedDraftFromInput('tournament', TOURNAMENT_DEFAULT_INPUT),
      values: '1,2,3,4,5,6,7,8,9,10,11,12,13',
    });
    expect(tooMany.ok).toBe(false);
  });

  it('rejects negative and over-range radix values without absolute-valuing them', () => {
    const base = guidedDraftFromInput('radix', RADIX_DEFAULT_INPUT);
    const negative = buildGuidedInput('radix', { ...base, values: '-3, 5, 0' });
    expect(negative.ok).toBe(false);
    if (!negative.ok) expect(negative.error.key).toBe('guidedErrorRadixNonNegative');

    const over = buildGuidedInput('radix', { ...base, values: '10000' });
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.error.key).toBe('guidedErrorRadixRange');

    const valid = buildGuidedInput('radix', { ...base, values: '0, 10, 2, 100, 0' });
    expect(valid.ok).toBe(true);
    if (valid.ok) expect(valid.input).toEqual([0, 10, 2, 100, 0]);
  });

  it('generates a valid deterministic draft for every declared scenario', () => {
    let seed = 123456789;
    const random = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    for (const algorithm of ['tournament', 'radix'] as const) {
      for (const scenario of guidedRandomScenarios(algorithm)) {
        const draft = randomGuidedDraft(algorithm, scenario.id, random);
        const built = buildGuidedInput(algorithm, draft);
        expect(built.ok, `${algorithm}/${scenario.id}`).toBe(true);
        if (!built.ok) continue;
        if (algorithm === 'radix') {
          const values = built.input as number[];
          expect(values.every((value) => value >= 0 && value <= 9999)).toBe(true);
        }
      }
    }
  });

  it('exposes every official preset and the two default inputs', () => {
    expect(TOURNAMENT_PRESETS).toHaveLength(6);
    expect(RADIX_PRESETS).toHaveLength(6);
    expect(TOURNAMENT_DEFAULT_INPUT).toBeTruthy();
    expect(RADIX_DEFAULT_INPUT).toBeTruthy();
  });
});
