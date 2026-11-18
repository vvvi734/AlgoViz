import { describe, expect, it } from 'vitest';
import rawFrames from '../../test/fixtures/dag-default-frames.json';
import {
  criticalPathSnapshotSchema,
  structureSchema,
  topologicalSortSnapshotSchema,
  type CriticalPathSnapshot,
  type TopologicalSortSnapshot,
} from './schema';
import {
  buildCriticalVisualModel,
  buildTopologicalVisualModel,
  layoutDag,
} from '../visualization/dagModel';

type Frame<T> = { structure: T };
const frames = rawFrames as unknown as {
  topological: Frame<TopologicalSortSnapshot>[];
  critical: Frame<CriticalPathSnapshot>[];
};

describe('G3 topological sort Python trace fixture', () => {
  it('accepts every real Kahn snapshot and visual model', () => {
    const models = frames.topological.map((frame) => {
      const parsed = structureSchema.safeParse(frame.structure);
      expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
      const typed = topologicalSortSnapshotSchema.safeParse(frame.structure);
      expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
      return buildTopologicalVisualModel(frame.structure, 'empty');
    });
    expect(models.every(Boolean)).toBe(true);
    const final = frames.topological.at(-1)!.structure;
    expect(final.operation).toBe('done');
    expect(final.hasCycle).toBe(false);
    expect(final.topologicalOrder).toEqual(['A', 'B', 'D', 'C', 'E', 'F', 'G']);
    expect(final.removedEdgeIds).toHaveLength(8);
  });

  it('validates every edge dependency rather than one fixed order', () => {
    const final = frames.topological.at(-1)!.structure;
    const position = new Map(final.topologicalOrder.map((node, index) => [node, index]));
    for (const edge of final.edges) {
      expect(position.get(edge.fromId)!).toBeLessThan(position.get(edge.toId)!);
    }
  });

  it('publishes real indegree changes and queue moves in the same frame', () => {
    const inspect = frames.topological.find((frame) => frame.structure.operation === 'inspect-edge')!.structure;
    const inspectModel = buildTopologicalVisualModel(inspect, 'empty')!;
    expect(inspectModel.currentEdgeId).toBe(inspect.currentEdgeId);
    expect(inspectModel.edges.find((edge) => edge.id === inspect.currentEdgeId)?.state).toBe('current');
    expect(inspectModel.indegreeChange).toBeNull();

    const decrement = frames.topological.find((frame) => frame.structure.operation === 'decrement')!.structure;
    const decrementModel = buildTopologicalVisualModel(decrement, 'empty')!;
    expect(decrement.indegreeChange).not.toBeNull();
    expect(decrement.indegreeChange!.before).toBe(decrement.indegreeChange!.after + 1);
    expect(decrementModel.edges.find((edge) => edge.id === decrement.currentEdgeId)?.removed).toBe(true);
    const target = decrementModel.nodes.find((node) => node.id === decrement.indegreeChange!.nodeId)!;
    expect(target.indegree).toBe(decrement.indegreeChange!.after);

    const enqueue = frames.topological.find((frame) => frame.structure.operation === 'enqueue')!.structure;
    const enqueueModel = buildTopologicalVisualModel(enqueue, 'empty')!;
    expect(enqueueModel.queueAdded?.nodeId).toBe(enqueue.queueAdded?.nodeId);
    expect(enqueueModel.nodes.find((node) => node.id === enqueue.queueAdded?.nodeId)?.inQueue).toBe(true);

    const dequeue = frames.topological.find((frame) => frame.structure.operation === 'dequeue')!.structure;
    const dequeueModel = buildTopologicalVisualModel(dequeue, 'empty')!;
    expect(dequeueModel.queueRemoved?.nodeId).toBe(dequeue.currentNodeId);
    expect(dequeueModel.nodes.find((node) => node.id === dequeue.currentNodeId)?.current).toBe(true);
    expect(dequeueModel.nodes.find((node) => node.id === dequeue.currentNodeId)?.processed).toBe(true);
  });

  it('keeps one deterministic layout across all frames', () => {
    const first = buildTopologicalVisualModel(frames.topological[0]!.structure, 'empty')!;
    const last = buildTopologicalVisualModel(frames.topological.at(-1)!.structure, 'empty')!;
    expect(first.nodes.map((node) => [node.id, node.x, node.y])).toEqual(last.nodes.map((node) => [node.id, node.x, node.y]));
    expect(first.edges.map((edge) => [edge.id, edge.x1, edge.y1, edge.x2, edge.y2])).toEqual(
      last.edges.map((edge) => [edge.id, edge.x1, edge.y1, edge.x2, edge.y2]),
    );
    const layout = layoutDag(first.nodes, first.edges);
    const second = layoutDag(first.nodes, first.edges);
    expect(layout.nodes).toEqual(second.nodes);
  });

  it('rejects a non-directed graph and an invalid snapshot', () => {
    const init = frames.topological[0]!.structure;
    const undirected = { ...init, directed: false };
    expect(topologicalSortSnapshotSchema.safeParse(undirected).success).toBe(false);
    const duplicateQueue = { ...init, queue: [{ id: 'q1', nodeId: 'A' }, { id: 'q2', nodeId: 'A' }] };
    expect(topologicalSortSnapshotSchema.safeParse(duplicateQueue).success).toBe(false);
  });
});

describe('G3 AOE critical path Python trace fixture', () => {
  it('accepts every real AOE snapshot and visual model', () => {
    const models = frames.critical.map((frame) => {
      const parsed = structureSchema.safeParse(frame.structure);
      expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
      const typed = criticalPathSnapshotSchema.safeParse(frame.structure);
      expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
      return buildCriticalVisualModel(frame.structure, 'empty');
    });
    expect(models.every(Boolean)).toBe(true);
    const final = frames.critical.at(-1)!.structure;
    expect(final.operation).toBe('done');
    expect(final.projectDuration).toBe(11);
    expect(final.criticalEdgeIds.sort()).toEqual(['e1', 'e2', 'e4', 'e5', 'e6', 'e7'].sort());
    expect(final.criticalPaths).toEqual([
      ['A', 'B', 'E', 'F'],
      ['A', 'C', 'D', 'E', 'F'],
    ]);
  });

  it('matches independently verified ve, vl and activity slack', () => {
    const final = frames.critical.at(-1)!.structure;
    const ve = Object.fromEntries(final.veRows.map((row) => [row.nodeId, row.time]));
    const vl = Object.fromEntries(final.vlRows.map((row) => [row.nodeId, row.time]));
    expect(ve).toEqual({ A: 0, B: 3, C: 2, D: 6, E: 9, F: 11 });
    expect(vl).toEqual({ A: 0, B: 3, C: 2, D: 6, E: 9, F: 11 });
    const slack = Object.fromEntries(final.activities.map((row) => [`${row.fromId}-${row.toId}`, row.slack]));
    expect(slack).toEqual({ 'A-B': 0, 'A-C': 0, 'B-D': 1, 'B-E': 0, 'C-D': 0, 'D-E': 0, 'E-F': 0 });
  });

  it('shows the current phase and every final path in the visual model', () => {
    const done = frames.critical.at(-1)!.structure;
    const model = buildCriticalVisualModel(done, 'empty')!;
    expect(model.done).toBe(true);
    expect(model.projectDuration).toBe(11);
    expect(model.criticalPaths).toHaveLength(2);
    expect(model.edges.find((edge) => edge.id === 'e3')?.state).toBe('slack');
    expect(model.edges.find((edge) => edge.id === 'e1')?.onPath).toBe(true);
    expect(model.nodes.find((node) => node.id === 'F')?.sink).toBe(true);

    const activity = frames.critical.find((frame) => frame.structure.operation === 'activity')!.structure;
    const activityModel = buildCriticalVisualModel(activity, 'empty')!;
    expect(activityModel.currentEdgeId).toBe(activity.currentEdgeId);
    expect(activityModel.edges.find((edge) => edge.id === activity.currentEdgeId)?.state).toBe('current');
    expect(activityModel.activityChange?.edgeId).toBe(activity.currentEdgeId);
  });

  it('keeps layout identity and rejects negative durations', () => {
    const first = buildCriticalVisualModel(frames.critical[0]!.structure, 'empty')!;
    const last = buildCriticalVisualModel(frames.critical.at(-1)!.structure, 'empty')!;
    expect(first.nodes.map((node) => [node.id, node.x, node.y])).toEqual(last.nodes.map((node) => [node.id, node.x, node.y]));

    const init = frames.critical[0]!.structure;
    const negative = {
      ...init,
      edges: init.edges.map((edge, index) => (index === 0 ? { ...edge, duration: -1 } : edge)),
      activities: init.activities.map((row, index) => (index === 0 ? { ...row, duration: -1 } : row)),
    };
    expect(criticalPathSnapshotSchema.safeParse(negative).success).toBe(false);
  });

  it('agrees with the topological order computed by Kahn', () => {
    const final = frames.critical.at(-1)!.structure;
    const position = new Map(final.topologicalOrder.map((node, index) => [node, index]));
    for (const edge of final.edges) {
      expect(position.get(edge.fromId)!).toBeLessThan(position.get(edge.toId)!);
    }
  });
});
