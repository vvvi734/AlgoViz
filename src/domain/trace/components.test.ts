import { describe, expect, it } from 'vitest';
import rawFrames from '../../test/fixtures/components-default-frames.json';
import rawEdgeFrames from '../../test/fixtures/components-edge-frames.json';
import {
  connectedComponentsSnapshotSchema,
  kosarajuSnapshotSchema,
  structureSchema,
  type ConnectedComponentsSnapshot,
  type KosarajuSnapshot,
} from './schema';
import {
  buildConnectedComponentsVisualModel,
  buildKosarajuVisualModel,
  componentGroupKeys,
  type ConnectedComponentsVisualModel,
  type SccVisualModel,
} from '../visualization/componentsModel';

type Frame<T> = { structure: T };

const frames = rawFrames as unknown as {
  components: Frame<ConnectedComponentsSnapshot>[];
  scc: Frame<KosarajuSnapshot>[];
};
const edgeFrames = rawEdgeFrames as unknown as {
  components: Record<string, Frame<ConnectedComponentsSnapshot>[]>;
  scc: Record<string, Frame<KosarajuSnapshot>[]>;
};

function parseFrames<T>(
  source: Frame<T>[],
  schema: typeof connectedComponentsSnapshotSchema | typeof kosarajuSnapshotSchema,
): T[] {
  return source.map((frame) => {
    const parsed = structureSchema.safeParse(frame.structure);
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
    const typed = schema.safeParse(frame.structure);
    expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
    return frame.structure;
  });
}

function reachable(adjacency: Map<string, string[]>, start: string, target: string): boolean {
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length) {
    const node = stack.pop()!;
    if (node === target) return true;
    for (const next of adjacency.get(node) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return false;
}

function buildAdjacency(edges: Array<{ fromId: string; toId: string }>): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adjacency.get(edge.fromId) ?? [];
    list.push(edge.toId);
    adjacency.set(edge.fromId, list);
  }
  return adjacency;
}

function assertPartition<T extends {
  nodes: Array<{ id: string }>;
  components: Array<{ id: number; nodeIds: string[]; complete: boolean }>;
}>(
  final: T,
  expectedGroups: string[][],
): void {
  expect(final.components.every((group) => group.complete)).toBe(true);
  expect(componentGroupKeys(final.components)).toEqual(
    expectedGroups.map((group) => [...group].sort().join(',')).sort(),
  );
  const owner = new Map<string, number>();
  for (const group of final.components) {
    for (const nodeId of group.nodeIds) {
      expect(owner.has(nodeId), `node ${nodeId} appears twice`).toBe(false);
      owner.set(nodeId, group.id);
    }
  }
  expect(owner.size).toBe(final.nodes.length);
  expect([...owner.keys()].sort()).toEqual(final.nodes.map((node) => node.id).sort());
}

describe('G4 connected components real Python fixture', () => {
  it('accepts every real frame in both default runs', () => {
    parseFrames(frames.components, connectedComponentsSnapshotSchema);
    parseFrames(frames.scc, kosarajuSnapshotSchema);
    expect(frames.components).toHaveLength(50);
    expect(frames.scc).toHaveLength(60);
  });

  it('partitions the default graph into four complete components', () => {
    const final = frames.components.at(-1)!.structure;
    expect(final.operation).toBe('done');
    expect(final.componentCount).toBe(4);
    assertPartition(final, [['A', 'B', 'C'], ['D', 'E'], ['F', 'G'], ['H']]);
    expect(final.visitedIds.sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  });

  it('keeps discovery, stack and component membership synchronized', () => {
    for (const frame of frames.components) {
      const structure = frame.structure;
      const stack = structure.frontierItems.map((item) => item.nodeId);
      expect(new Set(stack).size).toBe(stack.length);
      expect(stack.every((nodeId) => structure.discoveredIds.includes(nodeId))).toBe(true);
      if (structure.frontierAdded) expect(stack).toContain(structure.frontierAdded.nodeId);
      if (structure.frontierRemoved) expect(stack).not.toContain(structure.frontierRemoved.nodeId);
      for (const group of structure.components) {
        expect(group.nodeIds.every((nodeId) => structure.discoveredIds.includes(nodeId))).toBe(true);
      }
      if (structure.operation === 'complete-component') {
        expect(structure.components.every((group) => group.complete)).toBe(true);
      }
    }
    const model = buildConnectedComponentsVisualModel(frames.components[10]!.structure);
    expect(model.nodes.find((node) => node.id === model.currentNodeId)?.current).toBe(true);
    expect(model.components.find((group) => group.current)?.id).toBe(model.currentComponentId);
  });

  it('covers isolated, single, empty and fully connected edge cases', () => {
    for (const [name, source] of Object.entries(edgeFrames.components)) {
      const parsed = parseFrames(source, connectedComponentsSnapshotSchema);
      const final = parsed.at(-1)!;
      expect(final.operation).toBe('done');
      const expected: Record<string, string[][]> = {
        disconnected: [['A', 'B'], ['C', 'D'], ['E']],
        single: [['A']],
        empty: [],
        complete: [['A', 'B', 'C', 'D']],
      };
      assertPartition(final, expected[name]!);
    }
  });

  it('rejects a directed/malformed connected-component snapshot', () => {
    const init = frames.components[0]!.structure;
    expect(connectedComponentsSnapshotSchema.safeParse({ ...init, directed: true }).success).toBe(false);
    expect(connectedComponentsSnapshotSchema.safeParse({
      ...init,
      frontierItems: [{ id: 's1', nodeId: 'A' }, { id: 's2', nodeId: 'A' }],
    }).success).toBe(false);
    expect(connectedComponentsSnapshotSchema.safeParse({
      ...init,
      components: [{ id: 1, nodeIds: ['A'], complete: false }, { id: 3, nodeIds: ['B'], complete: false }],
    }).success).toBe(false);
  });
});

describe('G4 Kosaraju SCC real Python fixture', () => {
  it('accepts every frame and matches independent bidirectional reachability', () => {
    const parsed = parseFrames(frames.scc, kosarajuSnapshotSchema);
    const final = parsed.at(-1)!;
    expect(final.operation).toBe('done');
    expect(final.finishOrder).toEqual(['E', 'D', 'C', 'B', 'A', 'G', 'F', 'H']);
    expect(final.secondPassOrder).toEqual([...final.finishOrder].reverse());
    expect(final.componentCount).toBe(5);
    assertPartition(final, [['H'], ['F'], ['G'], ['A', 'B', 'C'], ['D', 'E']]);

    const adjacency = buildAdjacency(final.edges);
    for (const group of final.components) {
      for (const from of group.nodeIds) {
        for (const to of group.nodeIds) {
          expect(reachable(adjacency, from, to), `${from} -> ${to} inside SCC`).toBe(true);
        }
      }
    }
    for (const group of final.components) {
      for (const other of final.components.filter((item) => item.id !== group.id)) {
        for (const from of group.nodeIds) {
          for (const to of other.nodeIds) {
            expect(reachable(adjacency, from, to) && reachable(adjacency, to, from)).toBe(false);
          }
        }
      }
    }
  });

  it('uses a dedicated enlarged eight-node layout for the official SCC graph', () => {
    const model = buildKosarajuVisualModel(frames.scc[0]!.structure);
    expect(model.nodeRadius).toBe(30);
    expect(model.nodes).toHaveLength(8);
    expect(model.nodes.find((node) => node.id === 'H')).toMatchObject({ x: 445, y: 325 });
    expect(new Set(model.nodes.map((node) => `${node.x},${node.y}`)).size).toBe(8);
    expect(model.nodes.every((node) => node.x >= 30 && node.x <= 550)).toBe(true);
    expect(model.nodes.every((node) => node.y >= 30 && node.y <= 350)).toBe(true);
  });

  it('distinguishes a one-way chain from a directed cycle', () => {
    const chain = parseFrames(edgeFrames.scc.chain!, kosarajuSnapshotSchema).at(-1)!;
    const cycle = parseFrames(edgeFrames.scc.cycle!, kosarajuSnapshotSchema).at(-1)!;
    expect(chain.componentCount).toBe(3);
    expect(componentGroupKeys(chain.components)).toEqual(['A', 'B', 'C']);
    expect(cycle.componentCount).toBe(1);
    expect(componentGroupKeys(cycle.components)).toEqual(['A,B,C']);
  });

  it('keeps the transpose and second-pass order in the same frame state', () => {
    const reverse = frames.scc.find((frame) => frame.structure.operation === 'reverse')!.structure;
    expect(reverse.phase).toBe('reverse');
    expect(reverse.reversed).toBe(true);
    expect(reverse.discoveredIds).toEqual([]);
    expect(reverse.visitedIds).toEqual([]);
    expect(reverse.frontierItems).toEqual([]);
    expect(reverse.components).toEqual([]);
    expect(reverse.secondPassOrder).toEqual([...reverse.finishOrder].reverse());

    const reverseModel = buildKosarajuVisualModel(reverse);
    expect(reverseModel.reversed).toBe(true);
    expect(reverseModel.edges.every((edge) => edge.reversed)).toBe(true);
    expect(reverseModel.edges[0]!.fromId).toBe(reverse.edges[0]!.toId);
    expect(reverseModel.edges[0]!.toId).toBe(reverse.edges[0]!.fromId);

    const second = frames.scc.find((frame) => frame.structure.operation === 'start-second')!.structure;
    const secondModel = buildKosarajuVisualModel(second);
    expect(secondModel.secondPassIndex).toBe(second.secondPassIndex);
    expect(secondModel.currentComponentId).toBe(second.currentComponentId);
    expect(secondModel.components.find((group) => group.current)?.id).toBe(second.currentComponentId);
  });

  it('covers bridge, single and empty SCC edge cases', () => {
    const bridge = parseFrames(edgeFrames.scc.bridge!, kosarajuSnapshotSchema).at(-1)!;
    const single = parseFrames(edgeFrames.scc.single!, kosarajuSnapshotSchema).at(-1)!;
    const empty = parseFrames(edgeFrames.scc.empty!, kosarajuSnapshotSchema).at(-1)!;
    assertPartition(bridge, [['A', 'B'], ['C', 'D']]);
    assertPartition(single, [['A']]);
    assertPartition(empty, []);
  });

  it('rejects a non-directed graph and a wrong second-pass order', () => {
    const init = frames.scc[0]!.structure;
    expect(kosarajuSnapshotSchema.safeParse({ ...init, directed: false }).success).toBe(false);
    const reverse = frames.scc.find((frame) => frame.structure.operation === 'reverse')!.structure;
    expect(kosarajuSnapshotSchema.safeParse({
      ...reverse,
      secondPassOrder: reverse.finishOrder,
    }).success).toBe(false);
    expect(kosarajuSnapshotSchema.safeParse({
      ...init,
      frontierItems: [{ id: 's1', nodeId: 'A' }, { id: 's2', nodeId: 'A' }],
    }).success).toBe(false);
  });
});

describe('G4 shared visual model and rollback stability', () => {
  it('rebuilds identical models when jumping back and forth', () => {
    const ccModels: ConnectedComponentsVisualModel[] = frames.components.map((frame) =>
      buildConnectedComponentsVisualModel(frame.structure));
    const first = ccModels[5]!;
    const later = ccModels[35]!;
    const back = buildConnectedComponentsVisualModel(frames.components[5]!.structure);
    expect(back.nodes).toEqual(first.nodes);
    expect(back.components).toEqual(first.components);
    expect(back.frontierItems).toEqual(first.frontierItems);
    expect(later.nodes.map((node) => [node.id, node.x, node.y])).toEqual(first.nodes.map((node) => [node.id, node.x, node.y]));

    const sccModels: SccVisualModel[] = frames.scc.map((frame) => buildKosarajuVisualModel(frame.structure));
    const sccFirst = sccModels[10]!;
    const sccBack = buildKosarajuVisualModel(frames.scc[10]!.structure);
    expect(sccBack.nodes).toEqual(sccFirst.nodes);
    expect(sccBack.components).toEqual(sccFirst.components);
    expect(sccBack.frontierItems).toEqual(sccFirst.frontierItems);
    expect(sccBack.finishOrder).toEqual(sccFirst.finishOrder);
  });

  it('paints group identity with C ids, not only colour', () => {
    const final = buildConnectedComponentsVisualModel(frames.components.at(-1)!.structure);
    expect(final.components.map((group) => group.id)).toEqual([1, 2, 3, 4]);
    expect(final.nodes.filter((node) => node.componentId !== null).every((node) => node.componentId! >= 1)).toBe(true);
    const scc = buildKosarajuVisualModel(frames.scc.at(-1)!.structure);
    expect(scc.components.map((group) => group.id)).toEqual([1, 2, 3, 4, 5]);
    expect(scc.nodes.every((node) => node.state === 'assigned')).toBe(true);
  });
});
