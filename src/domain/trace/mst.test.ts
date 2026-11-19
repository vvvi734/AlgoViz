import { describe, expect, it } from 'vitest';
import rawFrames from '../../test/fixtures/mst-default-frames.json';
import {
  kruskalMstSnapshotSchema,
  primMstSnapshotSchema,
  structureSchema,
  type KruskalMstSnapshot,
  type PrimMstSnapshot,
} from './schema';
import {
  buildKruskalVisualModel,
  buildPrimVisualModel,
  computeMstViewBox,
  MST_LABEL_GUTTER,
  MST_NODE_RADIUS,
} from '../visualization/mstModel';

type Frame = { structure: PrimMstSnapshot | KruskalMstSnapshot };
const frames = rawFrames as unknown as { prim: Frame[]; kruskal: Frame[] };

describe('G2 MST Python trace fixture', () => {
  it('accepts every real Prim snapshot and visual model', () => {
    const model = frames.prim.map((frame) => {
      const parsed = structureSchema.safeParse(frame.structure);
      expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
      const prim = primMstSnapshotSchema.safeParse(frame.structure);
      expect(prim.success).toBe(true);
      return buildPrimVisualModel(frame.structure as PrimMstSnapshot, 'empty');
    });
    expect(model.every(Boolean)).toBe(true);
    const final = frames.prim.at(-1)!.structure as PrimMstSnapshot;
    expect(final.operation).toBe('done');
    expect(final.totalWeight).toBe(6);
    expect(final.selectedEdgeIds).toHaveLength(4);
    expect(final.forest).toBe(false);
    expect(final.treeNodeIds).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('accepts every real Kruskal snapshot and visual model', () => {
    const model = frames.kruskal.map((frame) => {
      const parsed = structureSchema.safeParse(frame.structure);
      expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
      const kruskal = kruskalMstSnapshotSchema.safeParse(frame.structure);
      expect(kruskal.success).toBe(true);
      return buildKruskalVisualModel(frame.structure as KruskalMstSnapshot, 'empty');
    });
    expect(model.every(Boolean)).toBe(true);
    const final = frames.kruskal.at(-1)!.structure as KruskalMstSnapshot;
    expect(final.operation).toBe('done');
    expect(final.totalWeight).toBe(6);
    expect(final.selectedEdgeIds).toHaveLength(4);
    expect(final.rejectedEdgeIds).toHaveLength(2);
    expect(final.componentCount).toBe(1);
    expect(final.forest).toBe(false);
  });

  it('fits the MST viewport to the drawing while preserving the label gutter', () => {
    const prim = buildPrimVisualModel(frames.prim[0].structure as PrimMstSnapshot, 'empty')!;
    expect(prim.nodeRadius).toBe(MST_NODE_RADIUS);
    const box = computeMstViewBox(prim);
    expect(box.width).toBeLessThan(prim.width);
    expect(box.height).toBeLessThan(prim.height);
    for (const node of prim.nodes) {
      expect(node.x - prim.nodeRadius).toBeGreaterThan(box.x);
      expect(node.x + prim.nodeRadius).toBeLessThan(box.x + box.width);
      expect(node.y - prim.nodeRadius).toBeGreaterThan(box.y);
      expect(node.y + prim.nodeRadius + MST_LABEL_GUTTER).toBeLessThanOrEqual(box.y + box.height);
    }
    const empty = buildPrimVisualModel({
      ...frames.prim[0].structure,
      nodes: [],
      edges: [],
      startNodeId: null,
    } as PrimMstSnapshot, 'empty')!;
    expect(computeMstViewBox(empty)).toEqual({ x: 0, y: 0, width: 580, height: 380 });
  });

  it('keeps the real algorithms distinct while both remain minimum', () => {
    const prim = frames.prim.at(-1)!.structure as PrimMstSnapshot;
    const kruskal = frames.kruskal.at(-1)!.structure as KruskalMstSnapshot;
    expect(prim.totalWeight).toBe(kruskal.totalWeight);
    expect([...prim.selectedEdgeIds].sort()).not.toEqual([...kruskal.selectedEdgeIds].sort());
  });

  it('projects heap, tree and edge states without a second source of truth', () => {
    const push = frames.prim.find((frame) => frame.structure.operation === 'push')!.structure as PrimMstSnapshot;
    const model = buildPrimVisualModel(push, 'empty')!;
    expect(model.frontierItems).toHaveLength(1);
    expect(model.frontierAddedId).toBe(model.frontierItems[0].id);
    expect(model.nodes.find((node) => node.id === 'A')?.inTree).toBe(true);

    const select = frames.prim.find((frame) => frame.structure.operation === 'select-edge')!.structure as PrimMstSnapshot;
    const selectedModel = buildPrimVisualModel(select, 'empty')!;
    expect(selectedModel.selectedEdge?.edgeId).toBe(select.currentEdgeId);
    expect(selectedModel.edges.find((edge) => edge.id === select.currentEdgeId)?.state).toBe('selected');
    expect(selectedModel.edges.find((edge) => edge.id === select.currentEdgeId)?.current).toBe(true);
  });

  it('only marks a Prim edge as skipped when the pop really rejects it', () => {
    const beforeSkip = frames.prim.find((frame) => frame.structure.operation === 'select-edge' && frame.structure.currentEdgeId === 'e5')!
      .structure as PrimMstSnapshot;
    expect(beforeSkip.skippedEdgeIds).toEqual([]);

    const skip = frames.prim.find((frame) => frame.structure.operation === 'skip')!.structure as PrimMstSnapshot;
    const model = buildPrimVisualModel(skip, 'empty')!;
    expect(model.skippedCount).toBe(1);
    const current = model.currentEdge!;
    expect(model.skippedEdgeIds).toContain(current.edgeId);
    expect(model.edges.find((edge) => edge.id === current.edgeId)?.state).toBe('skipped');
    expect(model.edges.find((edge) => edge.id === current.edgeId)?.current).toBe(true);
  });

  it('keeps union-find roots and the rejected edge visible', () => {
    const reject = frames.kruskal.find((frame) => frame.structure.operation === 'reject-edge')!.structure as KruskalMstSnapshot;
    const model = buildKruskalVisualModel(reject, 'empty')!;
    expect(model.formsCycle).toBe(true);
    const current = model.currentEdge!;
    const rowA = model.parent.find((row) => row.nodeId === current.fromId)!;
    const rowB = model.parent.find((row) => row.nodeId === current.toId)!;
    expect(rowA.rootId).toBe(rowB.rootId);
    expect(model.edges.find((edge) => edge.id === current.edgeId)?.state).toBe('rejected');

    const union = frames.kruskal.find((frame) => frame.structure.operation === 'union')!.structure as KruskalMstSnapshot;
    const unionModel = buildKruskalVisualModel(union, 'empty')!;
    expect(unionModel.union).not.toBeNull();
    expect(unionModel.union?.componentCountAfter).toBe(unionModel.componentCount);
    expect(unionModel.components.reduce((sum, component) => sum + component.size, 0)).toBe(5);
  });
});
