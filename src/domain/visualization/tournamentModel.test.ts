import { describe, expect, it } from 'vitest';
import rawTournament from '../../test/fixtures/chapter10-tournament-frames.json';
import {
  TOURNAMENT_MAX_LEAVES,
  tournamentSnapshotSchema,
  type TournamentNode,
  type TournamentSnapshot,
} from '../trace/tournamentSchema';
import {
  buildTournamentModel,
  TOURNAMENT_NODE_H,
  TOURNAMENT_NODE_W,
} from './tournamentModel';

interface FixtureFrame {
  structure: unknown;
}

type Fixtures = Record<string, { frames: FixtureFrame[] }>;

const fixtures = rawTournament as Fixtures;

function snapshotsOf(name: string): TournamentSnapshot[] {
  return fixtures[name]!.frames.map((frame, index) => {
    const parsed = tournamentSnapshotSchema.safeParse(frame.structure);
    expect(parsed.success, `${name}[${index}]: ${JSON.stringify(parsed.error)}`).toBe(true);
    return parsed.data as TournamentSnapshot;
  });
}

/** Build the largest legal complete tree: 16 leaf slots, 12 real records. */
function maxLeafSnapshot(): TournamentSnapshot {
  const leafCount = TOURNAMENT_MAX_LEAVES;
  const height = Math.log2(leafCount);
  const realRecords = 12;
  const nodes: TournamentNode[] = [];
  for (let slot = 0; slot < leafCount; slot += 1) {
    nodes.push({
      id: `L${slot}`,
      level: 0,
      slot,
      leaf: true,
      filled: slot < realRecords,
      recordId: slot < realRecords ? String.fromCharCode(65 + slot) : null,
      leftId: null,
      rightId: null,
    });
  }
  for (let level = 1; level <= height; level += 1) {
    for (let slot = 0; slot < 2 ** (height - level); slot += 1) {
      nodes.push({
        id: `N${level}-${slot}`,
        level,
        slot,
        leaf: false,
        filled: false,
        recordId: null,
        leftId: level === 1 ? `L${slot * 2}` : `N${level - 1}-${slot * 2}`,
        rightId: level === 1 ? `L${slot * 2 + 1}` : `N${level - 1}-${slot * 2 + 1}`,
      });
    }
  }
  return {
    kind: 'tournament',
    preset: null,
    operation: 'init',
    records: Array.from({ length: realRecords }, (_, index) => ({
      id: String.fromCharCode(65 + index),
      value: realRecords - index,
      originalIndex: index,
      leafId: `L${index}`,
      active: true,
    })),
    nodes,
    rootId: `N${height}-0`,
    output: [],
    activeCount: realRecords,
    currentNodeId: null,
    compareIds: [],
    winnerId: null,
    affectedNodeIds: [],
    result: null,
  };
}

function expectTreeGeometry(snapshot: TournamentSnapshot) {
  const model = buildTournamentModel(snapshot);
  const leaves = model.nodes.filter((node) => node.leaf);
  expect(leaves).toHaveLength(model.leafCount);
  expect(model.nodes).toHaveLength(model.leafCount * 2 - 1);

  for (const node of model.nodes) {
    const expectedX =
      (node.slot + 0.5) * (model.width / 2 ** (model.height - node.level));
    expect(node.x).toBeCloseTo(expectedX, 8);
    expect(node.x - TOURNAMENT_NODE_W / 2).toBeGreaterThanOrEqual(0);
    expect(node.x + TOURNAMENT_NODE_W / 2).toBeLessThanOrEqual(model.width);
    expect(node.y - TOURNAMENT_NODE_H / 2).toBeGreaterThanOrEqual(0);
    expect(node.y + TOURNAMENT_NODE_H / 2).toBeLessThanOrEqual(model.stageHeight);
  }

  const byId = new Map(model.nodes.map((node) => [node.id, node]));
  for (const node of model.nodes) {
    if (node.leaf) continue;
    const left = byId.get(snapshot.nodes.find((candidate) => candidate.id === node.id)!.leftId!)!;
    const right = byId.get(snapshot.nodes.find((candidate) => candidate.id === node.id)!.rightId!)!;
    expect(node.x).toBeCloseTo((left.x + right.x) / 2, 8);
    expect(node.y).toBeLessThan(left.y);
    expect(node.y).toBeLessThan(right.y);
  }

  for (let slot = 1; slot < leaves.length; slot += 1) {
    expect(leaves[slot]!.x - leaves[slot - 1]!.x).toBeCloseTo(
      model.width / model.leafCount,
      8,
    );
  }
  return model;
}

describe('tournament visual model geometry', () => {
  it('keeps every real trace frame inside its viewBox with parents centred over children', () => {
    for (const name of Object.keys(fixtures)) {
      for (const snapshot of snapshotsOf(name)) {
        expectTreeGeometry(snapshot);
      }
    }
  });

  it('centres the root and distributes eight leaves across the full width', () => {
    const normal = snapshotsOf('normal')[0]!;
    const model = expectTreeGeometry(normal);
    const leaves = model.nodes.filter((node) => node.leaf);
    expect(leaves.map((node) => node.x)).toEqual([62.5, 187.5, 312.5, 437.5, 562.5, 687.5, 812.5, 937.5]);
    expect(model.nodes.find((node) => node.id === model.rootId)!.x).toBe(500);
  });

  it('supports the largest legal 16-leaf tree without horizontal coordinate overflow', () => {
    const model = expectTreeGeometry(maxLeafSnapshot());
    const leaves = model.nodes.filter((node) => node.leaf);
    expect(model.leafCount).toBe(16);
    expect(leaves.map((node) => node.x)).toEqual(
      Array.from({ length: 16 }, (_, slot) => (slot + 0.5) * (model.width / 16)),
    );
    expect(leaves[0]!.x - TOURNAMENT_NODE_W / 2).toBeGreaterThan(0);
    expect(leaves.at(-1)!.x + TOURNAMENT_NODE_W / 2).toBeLessThan(model.width);
  });

  it('places a one-leaf tournament at the exact centre of its viewBox', () => {
    const single = snapshotsOf('single')[0]!;
    const model = expectTreeGeometry(single);
    expect(model.leafCount).toBe(1);
    expect(model.height).toBe(0);
    expect(model.nodes).toHaveLength(1);
    expect(model.nodes[0]!.x).toBe(500);
  });
});
