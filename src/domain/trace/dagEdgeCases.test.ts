import { describe, expect, it } from 'vitest';
import edgeFramesRaw from '../../test/fixtures/dag-edge-frames.json';
import {
  criticalPathSnapshotSchema,
  structureSchema,
  topologicalSortSnapshotSchema,
  type CriticalPathSnapshot,
  type TopologicalSortSnapshot,
} from './schema';

type Frame<T> = { structure: T };
const edgeFrames = edgeFramesRaw as unknown as {
  topological: Record<string, Frame<TopologicalSortSnapshot>[]>;
  critical: Record<string, Frame<CriticalPathSnapshot>[]>;
};

function validateFrames<T>(frames: Frame<T>[], schema: { safeParse: (value: unknown) => { success: boolean } }): void {
  for (const frame of frames) {
    expect(structureSchema.safeParse(frame.structure).success).toBe(true);
    expect(schema.safeParse(frame.structure).success).toBe(true);
  }
}

function topologicalFinal(frames: Frame<TopologicalSortSnapshot>[]): TopologicalSortSnapshot {
  const final = frames.at(-1)!.structure;
  expect(final.operation).toBe('done');
  return final;
}

function assertDependencyOrder(final: TopologicalSortSnapshot): void {
  const position = new Map(final.topologicalOrder.map((node, index) => [node, index]));
  for (const edge of final.edges) {
    expect(position.get(edge.fromId), `${edge.fromId}->${edge.toId}`).toBeLessThan(position.get(edge.toId)!);
  }
}

type Reference = {
  ve: Map<string, number>;
  vl: Map<string, number>;
  slack: Map<string, number>;
  duration: number;
  paths: string[][];
};

/**
 * Independent AOE reference: it rebuilds predecessors/successors from the raw
 * edge list instead of consuming the Python snapshots' ve/vl tables.
 */
function referenceCritical(snapshot: CriticalPathSnapshot): Reference {
  const nodes = snapshot.nodes.map((node) => node.id);
  const preds = new Map<string, Array<{ node: string; duration: number }>>();
  const succs = new Map<string, Array<{ node: string; duration: number }>>();
  nodes.forEach((node) => {
    preds.set(node, []);
    succs.set(node, []);
  });
  for (const edge of snapshot.edges) {
    preds.get(edge.toId)!.push({ node: edge.fromId, duration: edge.duration });
    succs.get(edge.fromId)!.push({ node: edge.toId, duration: edge.duration });
  }
  const indegree = new Map(nodes.map((node) => [node, preds.get(node)!.length]));
  const queue = nodes.filter((node) => indegree.get(node) === 0);
  const topo: string[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    topo.push(node);
    for (const next of succs.get(node)!) {
      indegree.set(next.node, indegree.get(next.node)! - 1);
      if (indegree.get(next.node) === 0) queue.push(next.node);
    }
  }
  expect(topo).toHaveLength(nodes.length);
  const ve = new Map<string, number>();
  for (const node of topo) {
    ve.set(node, Math.max(0, ...preds.get(node)!.map((pred) => ve.get(pred.node)! + pred.duration)));
  }
  const sinks = nodes.filter((node) => succs.get(node)!.length === 0);
  const duration = Math.max(0, ...sinks.map((sink) => ve.get(sink)!));
  const vl = new Map<string, number>();
  for (const node of [...topo].reverse()) {
    if (sinks.includes(node)) {
      vl.set(node, duration);
    } else {
      vl.set(node, Math.min(...succs.get(node)!.map((succ) => vl.get(succ.node)! - succ.duration)));
    }
  }
  const slack = new Map<string, number>();
  for (const edge of snapshot.edges) {
    slack.set(edge.id, vl.get(edge.toId)! - edge.duration - ve.get(edge.fromId)!);
  }
  const critical = new Map(snapshot.edges.map((edge) => [edge.id, (slack.get(edge.id) ?? 0) === 0]));
  const paths: string[][] = [];
  const visit = (node: string, path: string[], total: number): void => {
    if (sinks.includes(node)) {
      if (total === duration) paths.push([...path]);
      return;
    }
    for (const edge of snapshot.edges.filter((candidate) => candidate.fromId === node && critical.get(candidate.id))) {
      path.push(edge.toId);
      visit(edge.toId, path, total + edge.duration);
      path.pop();
    }
  };
  for (const node of nodes.filter((candidate) => preds.get(candidate)!.length === 0)) {
    visit(node, [node], 0);
  }
  return { ve, vl, slack, duration, paths };
}

describe('G3 Kahn edge cases', () => {
  it('keeps every real snapshot schema-valid across disconnected, cycle, single and empty graphs', () => {
    for (const frames of Object.values(edgeFrames.topological)) {
      validateFrames(frames, topologicalSortSnapshotSchema);
    }
  });

  it('sorts a disconnected DAG component by component and honours every dependency', () => {
    const final = topologicalFinal(edgeFrames.topological.disconnected);
    expect(final.hasCycle).toBe(false);
    expect(final.topologicalOrder).toEqual(['A', 'C', 'B', 'D']);
    assertDependencyOrder(final);
    expect(final.removedEdgeIds).toHaveLength(2);
  });

  it('reports a directed cycle and refuses to force the remaining vertices into the order', () => {
    const final = topologicalFinal(edgeFrames.topological.cycle);
    expect(final.hasCycle).toBe(true);
    expect(final.topologicalOrder).toEqual([]);
    expect(final.cycleNodeIds).toEqual(['A', 'B', 'C']);
    expect(final.queue).toEqual([]);
  });

  it('handles a single vertex and the empty graph with explicit outcomes', () => {
    const single = topologicalFinal(edgeFrames.topological.single);
    expect(single.topologicalOrder).toEqual(['A']);
    expect(single.hasCycle).toBe(false);
    const empty = topologicalFinal(edgeFrames.topological.empty);
    expect(empty.nodes).toEqual([]);
    expect(empty.topologicalOrder).toEqual([]);
    expect(empty.hasCycle).toBe(false);
  });

  it('publishes queue additions and removals in the same frame as the operation', () => {
    for (const frames of Object.values(edgeFrames.topological)) {
      for (const frame of frames) {
        const structure = frame.structure;
        if (structure.operation === 'enqueue') {
          expect(structure.queueAdded).not.toBeNull();
          expect(structure.queue.some((item) => item.id === structure.queueAdded?.id)).toBe(true);
        }
        if (structure.operation === 'dequeue') {
          expect(structure.queueRemoved).not.toBeNull();
          expect(structure.queue.some((item) => item.nodeId === structure.currentNodeId)).toBe(false);
        }
        const nodeIds = structure.queue.map((item) => item.nodeId);
        expect(new Set(nodeIds).size).toBe(nodeIds.length);
      }
    }
  });
});

describe('G3 AOE edge cases and independent reference', () => {
  it('keeps every real snapshot schema-valid across multi-source, multi-sink, single and empty graphs', () => {
    for (const frames of Object.values(edgeFrames.critical)) {
      validateFrames(frames, criticalPathSnapshotSchema);
    }
  });

  it('uses ve=0 for every source and vl=duration for every sink', () => {
    const final = edgeFrames.critical.multiSource.at(-1)!.structure;
    expect(final.sourceNodeIds).toEqual(['A', 'B']);
    expect(final.sinkNodeIds).toEqual(['D']);
    const ve = Object.fromEntries(final.veRows.map((row) => [row.nodeId, row.time]));
    const vl = Object.fromEntries(final.vlRows.map((row) => [row.nodeId, row.time]));
    expect(ve).toEqual({ A: 0, B: 0, C: 3, D: 4 });
    expect(vl).toEqual({ A: 1, B: 0, C: 3, D: 4 });
    expect(final.criticalPaths).toEqual([['B', 'C', 'D']]);
  });

  it('does not mistake a longer multi-sink branch for the critical path', () => {
    const final = edgeFrames.critical.multiSink.at(-1)!.structure;
    expect(final.sinkNodeIds).toEqual(['B', 'C']);
    expect(final.projectDuration).toBe(5);
    expect(final.vlRows).toEqual([
      { nodeId: 'A', time: 0 },
      { nodeId: 'B', time: 5 },
      { nodeId: 'C', time: 5 },
    ]);
    expect(final.criticalPaths).toEqual([['A', 'C']]);
    expect(final.activities.find((row) => row.fromId === 'A' && row.toId === 'B')?.slack).toBe(3);
  });

  it('matches an independent ve/vl/slack and longest-path enumeration on every DAG case', () => {
    for (const [name, frames] of Object.entries(edgeFrames.critical)) {
      const final = frames.at(-1)!.structure as CriticalPathSnapshot;
      if (final.nodes.length === 0 || final.hasCycle) continue;
      const reference = referenceCritical(final);
      expect(final.projectDuration, name).toBe(reference.duration);
      for (const row of final.veRows) expect(row.time, `${name}/ve/${row.nodeId}`).toBe(reference.ve.get(row.nodeId));
      for (const row of final.vlRows) expect(row.time, `${name}/vl/${row.nodeId}`).toBe(reference.vl.get(row.nodeId));
      for (const row of final.activities) {
        expect(row.slack, `${name}/slack/${row.edgeId}`).toBe(reference.slack.get(row.edgeId));
      }
      const paths = final.criticalPaths.map((path) => path.join('>')).sort();
      expect(paths, name).toEqual(reference.paths.map((path) => path.join('>')).sort());
      for (const path of final.criticalPaths) {
        let total = 0;
        for (let index = 0; index + 1 < path.length; index += 1) {
          const edge = final.edges.find((candidate) => candidate.fromId === path[index] && candidate.toId === path[index + 1]);
          expect(edge, `${name}/${path.join('>')}`).toBeTruthy();
          expect(final.criticalEdgeIds.includes(edge!.id), `${name}/critical edge`).toBe(true);
          total += edge!.duration;
        }
        expect(total, `${name}/path duration`).toBe(final.projectDuration);
      }
    }
  });

  it('handles a single event and the empty graph without inventing a duration', () => {
    const single = edgeFrames.critical.single.at(-1)!.structure;
    expect(single.projectDuration).toBe(0);
    expect(single.criticalPaths).toEqual([['A']]);
    const empty = edgeFrames.critical.empty.at(-1)!.structure;
    expect(empty.projectDuration).toBe(0);
    expect(empty.criticalPaths).toEqual([]);
    expect(empty.nodes).toEqual([]);
  });
});
