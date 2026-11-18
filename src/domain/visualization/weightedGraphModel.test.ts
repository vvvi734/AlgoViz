import { describe, expect, it } from 'vitest';
import fixture from '../../test/fixtures/dijkstra-default-frames.json';
import type { WeightedGraphSnapshot } from '../trace/schema';
import { buildGraphVisualModel, buildWeightedGraphVisualModel } from './graphModel';
import { buildVisualModel } from './model';

const frames = (fixture as { frames: Array<{ structure: WeightedGraphSnapshot }> }).frames;
const final = frames[frames.length - 1].structure;
const staleFrame = frames.find((frame) => frame.structure.operation === 'stale')!.structure;
const relaxFrame = frames.find((frame) => frame.structure.operation === 'relax' && frame.structure.relax?.nodeId === 'F' && frame.structure.relax?.oldDistance === 6)!.structure;

describe('Stage 7F weighted graph model', () => {
  it('copies the final distances, previous pointers and reconstructed path from one frame', () => {
    const model = buildWeightedGraphVisualModel(final, 'empty');
    expect(model).not.toBeNull();
    if (!model) return;
    expect(model.weighted).toBe(true);
    expect(model.frontierKind).toBe('priority-queue');
    expect(model.pathNodeIds).toEqual(['A', 'B', 'E', 'F', 'G']);
    expect(model.pathDistance).toBe(7);
    expect(model.pathEdgeIds).toHaveLength(4);
    expect(model.nodes.find((node) => node.id === 'F')).toMatchObject({
      distance: 4,
      previousId: 'E',
      settled: true,
      onPath: true,
      target: false,
    });
    expect(model.nodes.find((node) => node.id === 'G')).toMatchObject({
      distance: 7,
      target: true,
      onPath: true,
    });
    expect(model.nodes.find((node) => node.id === 'D')).toMatchObject({
      distance: 6,
      previousId: 'B',
      settled: true,
      onPath: false,
    });
    expect(model.edges.filter((edge) => edge.onPath).map((edge) => edge.id)).toEqual(model.pathEdgeIds);
    expect(model.edges.find((edge) => edge.active)).toBeUndefined();
  });

  it('shows the real stale heap entry instead of inventing a second animation', () => {
    const model = buildWeightedGraphVisualModel(staleFrame, 'empty');
    expect(model).not.toBeNull();
    if (!model) return;
    expect(model.operation).toBe('stale');
    expect(model.frontierRemoved).toMatchObject({ nodeId: 'F', distance: 6, stale: true });
    expect(model.frontierItems.some((item) => item.stale && item.distance === 6 && item.nodeId === 'F')).toBe(false);
    expect(model.frontierItems).toHaveLength(1);
    expect(model.frontierItems[0]).toMatchObject({ nodeId: 'G', distance: 7, stale: false });
  });

  it('keeps a relax frame and its old → new change', () => {
    const model = buildWeightedGraphVisualModel(relaxFrame, 'empty');
    expect(model).not.toBeNull();
    if (!model) return;
    expect(model.operation).toBe('relax');
    expect(model.relax).toMatchObject({ nodeId: 'F', oldDistance: 6, newDistance: 4, newPreviousId: 'E' });
    expect(model.currentEdgeId).toBe(relaxFrame.currentEdgeId);
    expect(model.frontierAdded).toMatchObject({ nodeId: 'F', distance: 4 });
  });

  it('sorts the heap for display without mutating the frame array', () => {
    const raw = staleFrame.frontierItems.map((item) => ({ ...item }));
    const model = buildWeightedGraphVisualModel(staleFrame, 'empty');
    expect(model).not.toBeNull();
    if (!model) return;
    expect(staleFrame.frontierItems).toEqual(raw);
    const sortedKeys = model.frontierItems.map((item) => `${item.distance}-${item.nodeId}`);
    expect(sortedKeys).toEqual([...sortedKeys].sort((a, b) => {
      const [da, na] = a.split('-');
      const [db, nb] = b.split('-');
      return Number(da) - Number(db) || na.localeCompare(nb);
    }));
  });

  it('routes a weighted-graph event through buildVisualModel', () => {
    const event = {
      schemaVersion: 1 as const,
      step: 0,
      eventType: 'step' as const,
      visualType: 'graph' as const,
      state: { type: 'graph' },
      message: 'done',
      structure: final,
    };
    const model = buildVisualModel(
      event.state,
      {
        invalid: 'invalid',
        emptyStructure: 'empty',
        emptyStack: 'empty stack',
        emptyQueue: 'empty queue',
        emptyLinked: 'empty',
        emptyTree: 'empty tree',
        emptyGraph: 'empty graph',
      },
      event.structure,
    );
    expect(model.kind).toBe('graph-traversal');
    if (model.kind !== 'graph-traversal') return;
    expect(model.algorithm).toBe('dijkstra');
    expect(model.pathDistance).toBe(7);
  });

  it('rejects malformed weighted snapshots instead of rendering half-state', () => {
    const badKind = { ...final, kind: 'graph' } as unknown as WeightedGraphSnapshot;
    expect(buildWeightedGraphVisualModel(badKind, 'empty')).toBeNull();
    expect(buildWeightedGraphVisualModel({
      ...final,
      distances: final.distances.slice(0, -1),
    }, 'empty')).toBeNull();
    expect(buildWeightedGraphVisualModel({
      ...final,
      edges: [{ ...final.edges[0], weight: -1 }, ...final.edges.slice(1)],
    }, 'empty')).toBeNull();
    expect(buildWeightedGraphVisualModel({
      ...final,
      nodes: [final.nodes[0], final.nodes[0], ...final.nodes.slice(2)],
    }, 'empty')).toBeNull();
  });

  it('leaves the Stage 7E BFS model unweighted', () => {
    const model = buildGraphVisualModel({
      kind: 'graph',
      algorithm: 'bfs',
      operation: 'done',
      nodes: [{ id: 'A', value: 'A' }, { id: 'B', value: 'B' }],
      edges: [{ id: 'e1', fromId: 'A', toId: 'B' }],
      startNodeId: 'A',
      currentNodeId: null,
      currentEdgeId: null,
      neighborNodeId: null,
      discoveredIds: ['A', 'B'],
      visitedIds: ['A', 'B'],
      visitOrder: ['A', 'B'],
      frontierKind: 'queue',
      frontierItems: [],
      frontierRemoved: null,
    }, 'empty');
    expect(model).not.toBeNull();
    if (!model) return;
    expect(model.weighted).toBeUndefined();
    expect(model.nodes.every((node) => node.distance === undefined)).toBe(true);
  });
});
