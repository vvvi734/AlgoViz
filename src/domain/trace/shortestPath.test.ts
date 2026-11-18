import { describe, expect, it } from 'vitest';
import { framesToTraceDocument } from './adapter';
import {
  BELLMAN_OPERATIONS,
  FLOYD_OPERATIONS,
  parseTraceDocument,
  type BellmanFordSnapshot,
  type FloydWarshallSnapshot,
  type TraceEvent,
} from './schema';
import { buildBellmanVisualModel, buildFloydVisualModel } from '../visualization/shortestPathModel';
import floydFixture from '../../test/fixtures/floyd-default-frames.json';
import bellmanFixture from '../../test/fixtures/bellman-default-frames.json';
import edgeFixture from '../../test/fixtures/g1-edge-frames.json';
import { BELLMAN_DEFAULT_INPUT, FLOYD_DEFAULT_INPUT } from '../algorithms/shortestPathExamples';

type RawFixture = { frames: Array<Record<string, unknown>> };
const floydRaw = (floydFixture as RawFixture).frames;
const bellmanRaw = (bellmanFixture as RawFixture).frames;
const edges = edgeFixture as Record<string, RawFixture>;

function parsedFrames(raw: Array<Record<string, unknown>>): TraceEvent[] {
  const result = parseTraceDocument(framesToTraceDocument(raw as never, 'g1 fixture'));
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return result.document.events;
}

function structures(events: TraceEvent[]): Array<FloydWarshallSnapshot | BellmanFordSnapshot> {
  return events.map((event) => event.structure as FloydWarshallSnapshot | BellmanFordSnapshot);
}

function finalFloyd(events: TraceEvent[]): FloydWarshallSnapshot {
  const last = events[events.length - 1].structure;
  if (!last || last.kind !== 'floyd-warshall') throw new Error('missing Floyd final frame');
  return last;
}

function finalBellman(events: TraceEvent[]): BellmanFordSnapshot {
  const last = events[events.length - 1].structure;
  if (!last || last.kind !== 'bellman-ford') throw new Error('missing Bellman final frame');
  return last;
}

describe('G1 Floyd-Warshall real Python trace', () => {
  it('validates every frame and preserves the 87-frame default run', () => {
    expect(floydRaw.length).toBeLessThan(500);
    const events = parsedFrames(floydRaw);
    expect(events).toHaveLength(floydRaw.length);
    for (const event of events) {
      expect(event.structure?.kind).toBe('floyd-warshall');
      expect(FLOYD_OPERATIONS).toContain((event.structure as FloydWarshallSnapshot).operation);
    }
  });

  it('exposes the full matrix, current k/i/j and the final path', () => {
    const events = parsedFrames(floydRaw);
    const comparison = structures(events).find((frame) =>
      frame.operation === 'update' && frame.compare?.kNodeId === 'C',
    ) as FloydWarshallSnapshot;
    expect(comparison.compare).toMatchObject({ updated: true, kNodeId: 'C' });
    expect(comparison.iNodeId).toBeTruthy();
    expect(comparison.jNodeId).toBeTruthy();
    expect(comparison.distances).toHaveLength(25);
    expect(comparison.previous).toHaveLength(25);

    const final = finalFloyd(events);
    expect(final.operation).toBe('done');
    expect(final.pathNodeIds).toEqual(['A', 'C', 'B', 'D', 'E']);
    expect(final.pathDistance).toBe(2);
    expect(final.negativeCycle).toEqual({ hasCycle: false, nodeIds: [] });
    expect(final.distances.find((cell) => cell.fromId === 'A' && cell.toId === 'B')?.distance).toBe(-1);
    expect(final.distances.find((cell) => cell.fromId === 'B' && cell.toId === 'A')?.distance).toBeNull();
  });

  it('detects a reachable negative cycle and does not report a finite path', () => {
    const events = parsedFrames(edges['floyd-cycle'].frames);
    const final = finalFloyd(events);
    expect(final.negativeCycle).toEqual({ hasCycle: true, nodeIds: ['B', 'C'] });
    expect(final.pathNodeIds).toEqual([]);
    expect(final.pathDistance).toBeNull();
    expect(events.some((event) => (event.structure as FloydWarshallSnapshot).operation === 'negative-cycle')).toBe(true);
  });

  it('keeps unreachable cells null rather than inventing a path', () => {
    const events = parsedFrames(edges['floyd-unreachable'].frames);
    const final = finalFloyd(events);
    expect(final.pathNodeIds).toEqual([]);
    expect(final.pathDistance).toBeNull();
    expect(final.negativeCycle?.hasCycle).toBe(false);
    expect(final.distances.find((cell) => cell.fromId === 'A' && cell.toId === 'D')?.distance).toBeNull();
  });

  it('builds a matrix visual model directly from the final frame', () => {
    const final = finalFloyd(parsedFrames(floydRaw));
    const model = buildFloydVisualModel(final, 'empty');
    expect(model).not.toBeNull();
    if (!model) return;
    expect(model.rows).toHaveLength(5);
    expect(model.rows[0].cells).toHaveLength(5);
    expect(model.rows[0].cells.find((cell) => cell.columnNodeId === 'B')?.value).toBe(-1);
    expect(model.rows[0].cells.find((cell) => cell.columnNodeId === 'D')?.value).toBe(1);
    expect(model.pathNodeIds).toEqual(['A', 'C', 'B', 'D', 'E']);
    expect(model.nodes.filter((node) => node.onPath).map((node) => node.id).sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
});

describe('G1 Bellman-Ford real Python trace', () => {
  it('validates every frame and stops early after a zero-update round', () => {
    expect(bellmanRaw.length).toBeLessThan(500);
    const events = parsedFrames(bellmanRaw);
    expect(events).toHaveLength(bellmanRaw.length);
    for (const event of events) {
      expect(event.structure?.kind).toBe('bellman-ford');
      expect(BELLMAN_OPERATIONS).toContain((event.structure as BellmanFordSnapshot).operation);
    }
    const early = structures(events).find((frame) => frame.operation === 'early-exit') as BellmanFordSnapshot;
    expect(early.round).toBe(2);
    expect(early.earlyExit).toBe(true);
    expect(events.some((event) => (event.structure as BellmanFordSnapshot).operation === 'round-start')).toBe(true);
  });

  it('keeps the real distance table and previous chain', () => {
    const events = parsedFrames(bellmanRaw);
    const final = finalBellman(events);
    expect(final.pathNodeIds).toEqual(['A', 'C', 'B', 'D', 'E']);
    expect(final.pathDistance).toBe(2);
    expect(final.negativeCycle).toEqual({ hasCycle: false, nodeIds: [] });
    expect(final.distances.find((cell) => cell.toId === 'B')?.distance).toBe(-1);
    expect(final.previous.find((cell) => cell.toId === 'B')?.previousId).toBe('C');
    expect(final.distances.find((cell) => cell.toId === 'E')?.distance).toBe(2);
    expect(final.maxRounds).toBe(4);
  });

  it('detects a reachable negative cycle, but not an unreachable one', () => {
    const reachable = finalBellman(parsedFrames(edges['bellman-cycle'].frames));
    expect(reachable.negativeCycle?.hasCycle).toBe(true);
    expect(reachable.negativeCycle?.nodeIds).toEqual(['B', 'C']);
    expect(reachable.pathDistance).toBeNull();

    const unreachable = finalBellman(parsedFrames(edges['bellman-unreachable-cycle'].frames));
    expect(unreachable.negativeCycle?.hasCycle).toBe(false);
    expect(unreachable.pathNodeIds).toEqual([]);
    expect(unreachable.pathDistance).toBeNull();
    expect(unreachable.distances.find((cell) => cell.toId === 'C')?.distance).toBeNull();
    expect(unreachable.distances.find((cell) => cell.toId === 'D')?.distance).toBeNull();
  });

  it('builds the round/relax table model from a real relax frame', () => {
    const events = parsedFrames(bellmanRaw);
    const relax = structures(events).find((frame) =>
      frame.operation === 'relax' && frame.relax?.nodeId === 'B' && frame.relax.oldDistance === 4,
    ) as BellmanFordSnapshot;
    const model = buildBellmanVisualModel(relax, 'empty');
    expect(model).not.toBeNull();
    if (!model) return;
    expect(model.currentEdgeId).toBe(relax.currentEdgeId);
    expect(model.relax).toMatchObject({ nodeId: 'B', oldDistance: 4, newDistance: -1, newPreviousId: 'C' });
    expect(model.distances.find((row) => row.nodeId === 'B')).toMatchObject({
      distance: -1,
      previousId: 'C',
      updated: true,
      neighbor: true,
    });
    expect(model.edges.find((edge) => edge.id === relax.currentEdgeId)?.active).toBe(true);
  });

  it('uses the same lightweight graph input contract as Dijkstra', () => {
    expect(FLOYD_DEFAULT_INPUT).toMatchObject({ start: 'A', target: 'E', directed: true });
    expect(BELLMAN_DEFAULT_INPUT).toMatchObject({ start: 'A', target: 'E', directed: true });
    expect((FLOYD_DEFAULT_INPUT as { edges: unknown[][] }).edges).toContainEqual(['C', 'B', -2]);
    expect((BELLMAN_DEFAULT_INPUT as { edges: unknown[][] }).edges).toContainEqual(['C', 'B', -2]);
  });
});
