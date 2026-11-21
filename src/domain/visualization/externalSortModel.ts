/**
 * TEXTBOOK-11 visual models for external sorting.
 *
 * All three models are pure projections of validated Trace snapshots. The multiway
 * model keeps each run's cursor and FIFO buffer visible; replacement selection
 * classifies every record as pending/workspace/current-run/completed-run; the
 * optimal tree lays out the current forest without inventing merge results.
 */
import type {
  MultiwaySnapshot,
  MultiwayOperation,
} from '../trace/multiwaySchema';
import type {
  ReplacementSnapshot,
  ReplacementOperation,
} from '../trace/replacementSchema';
import type {
  OptimalSnapshot,
  OptimalOperation,
} from '../trace/optimalMergeSchema';

export interface ExternalRecordView {
  id: string;
  value: number;
  label: string;
  originalIndex: number;
  runIndex: number | null;
  state: string;
}

export interface MultiwayRunView {
  id: string;
  label: string;
  index: number;
  cursor: number;
  buffer: string[];
  currentId: string | null;
  exhausted: boolean;
  records: ExternalRecordView[];
}

export interface MultiwayVisualModel {
  kind: 'multiway';
  operation: MultiwayOperation;
  preset: string | null;
  k: number;
  bufferCapacity: number;
  blockSize: number;
  runs: MultiwayRunView[];
  candidates: ExternalRecordView[];
  winnerId: string | null;
  output: ExternalRecordView[];
  outputBuffer: ExternalRecordView[];
  readBlocks: number;
  writeBlocks: number;
  mergePasses: number;
  result: MultiwaySnapshot['result'];
}

export function buildMultiwayModel(snapshot: MultiwaySnapshot): MultiwayVisualModel {
  const byId = new Map(snapshot.records.map((record) => [record.id, record]));
  const view = (id: string): ExternalRecordView => {
    const record = byId.get(id)!;
    return {
      id: record.id,
      value: record.value,
      label: record.id,
      originalIndex: record.originalIndex,
      runIndex: record.runIndex,
      state: 'idle',
    };
  };
  const runs: MultiwayRunView[] = snapshot.runs.map((run, index) => ({
    id: run.id,
    label: run.label,
    index,
    cursor: run.cursor,
    buffer: [...run.buffer],
    currentId: run.currentId,
    exhausted: run.exhausted,
    records: run.recordIds.map((id, position) => {
      const record = view(id);
      let state = 'unread';
      const bufferOffset = run.cursor - run.buffer.length;
      if (position < bufferOffset) state = 'consumed';
      else if (position < run.cursor) state = 'buffered';
      if (run.buffer[0] === id) state = 'current';
      if (run.exhausted) state = 'done';
      return { ...record, state };
    }),
  }));
  const candidates = snapshot.candidateIds.map((id) => {
    const record = view(id);
    return {
      ...record,
      state: snapshot.operation === 'select' || snapshot.operation === 'compare' ? 'candidate' : 'idle',
    };
  });
  return {
    kind: 'multiway',
    operation: snapshot.operation,
    preset: snapshot.preset,
    k: snapshot.k,
    bufferCapacity: snapshot.bufferCapacity,
    blockSize: snapshot.blockSize,
    runs,
    candidates,
    winnerId: snapshot.winnerId,
    output: snapshot.output.map(view),
    outputBuffer: snapshot.outputBuffer.map(view),
    readBlocks: snapshot.readBlocks,
    writeBlocks: snapshot.writeBlocks,
    mergePasses: snapshot.mergePasses,
    result: snapshot.result,
  };
}

export interface ReplacementWorkspaceSlot {
  record: ExternalRecordView | null;
  state: 'empty' | 'eligible' | 'frozen';
}

export interface ReplacementVisualModel {
  kind: 'replacement';
  operation: ReplacementOperation;
  preset: string | null;
  workspaceCapacity: number;
  workspace: ReplacementWorkspaceSlot[];
  records: ExternalRecordView[];
  inputIndex: number;
  lastOutput: number | null;
  currentId: string | null;
  newId: string | null;
  currentRun: ExternalRecordView[];
  runs: ExternalRecordView[][];
  eligibleIds: string[];
  frozenIds: string[];
  result: ReplacementSnapshot['result'];
}

export function buildReplacementModel(snapshot: ReplacementSnapshot): ReplacementVisualModel {
  const byId = new Map(snapshot.records.map((record) => [record.id, record]));
  const currentRun = new Set(snapshot.currentRun);
  const completed = new Set(snapshot.runs.flat());
  const slotState = new Map(
    snapshot.workspace
      .filter((slot) => slot.recordId !== null)
      .map((slot) => [slot.recordId!, slot.state]),
  );
  const view = (id: string): ExternalRecordView => {
    const record = byId.get(id)!;
    let state = 'pending';
    if (slotState.has(id)) state = slotState.get(id)!;
    if (currentRun.has(id)) state = 'current-run';
    if (completed.has(id)) state = 'completed';
    if (snapshot.newId === id) state = `${state}-new`;
    return {
      id: record.id,
      value: record.value,
      label: record.id,
      originalIndex: record.originalIndex,
      runIndex: null,
      state,
    };
  };
  return {
    kind: 'replacement',
    operation: snapshot.operation,
    preset: snapshot.preset,
    workspaceCapacity: snapshot.workspaceCapacity,
    workspace: snapshot.workspace.map((slot) => ({
      record: slot.recordId ? view(slot.recordId) : null,
      state: slot.state,
    })),
    records: snapshot.records.map((record) => view(record.id)),
    inputIndex: snapshot.inputIndex,
    lastOutput: snapshot.lastOutput,
    currentId: snapshot.currentId,
    newId: snapshot.newId,
    currentRun: snapshot.currentRun.map(view),
    runs: snapshot.runs.map((run) => run.map(view)),
    eligibleIds: snapshot.eligibleIds,
    frozenIds: snapshot.frozenIds,
    result: snapshot.result,
  };
}

export interface OptimalNodeView {
  id: string;
  weight: number;
  virtual: boolean;
  leaf: boolean;
  sourceIndex: number | null;
  children: string[];
  x: number;
  y: number;
  selected: boolean;
  isNew: boolean;
}

export interface OptimalEdgeView {
  id: string;
  fromId: string;
  toId: string;
  selected: boolean;
}

export interface OptimalVisualModel {
  kind: 'merge-tree';
  operation: OptimalOperation;
  preset: string | null;
  k: number;
  segmentWeights: number[];
  nodes: OptimalNodeView[];
  edges: OptimalEdgeView[];
  roots: string[];
  selectedIds: string[];
  newNodeId: string | null;
  costAdded: number;
  totalCost: number;
  combines: number;
  virtualCount: number;
  width: number;
  height: number;
  result: OptimalSnapshot['result'];
}

export function buildOptimalMergeModel(snapshot: OptimalSnapshot): OptimalVisualModel {
  const byId = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const leafCount = snapshot.nodes.filter((node) => node.leaf).length;
  const width = Math.max(640, leafCount * 72 + 64);
  const height = Math.max(220, 120);
  const xPositions = new Map<string, number>();
  const depths = new Map<string, number>();
  let leafCursor = 0;
  const GAP = 72;

  const layout = (nodeId: string, depth: number, startLeaf: number): { first: number; last: number; leaves: number } => {
    const node = byId.get(nodeId)!;
    depths.set(nodeId, depth);
    if (node.leaf) {
      const x = 40 + leafCursor * GAP;
      leafCursor += 1;
      xPositions.set(nodeId, x);
      return { first: x, last: x, leaves: 1 };
    }
    let leaves = 0;
    let first = Number.POSITIVE_INFINITY;
    let last = Number.NEGATIVE_INFINITY;
    for (const child of node.children) {
      const childLayout = layout(child, depth + 1, startLeaf + leaves);
      leaves += childLayout.leaves;
      first = Math.min(first, childLayout.first);
      last = Math.max(last, childLayout.last);
    }
    xPositions.set(nodeId, (first + last) / 2);
    return { first, last, leaves };
  };

  for (const rootId of snapshot.forestIds) layout(rootId, 0, leafCursor);
  const nodes: OptimalNodeView[] = snapshot.nodes.map((node) => ({
    ...node,
    x: xPositions.get(node.id) ?? 40,
    y: 36 + (depths.get(node.id) ?? 0) * 76,
    selected: snapshot.selectedIds.includes(node.id),
    isNew: snapshot.newNodeId === node.id,
  }));
  const edges: OptimalEdgeView[] = snapshot.nodes.flatMap((node) =>
    node.children.map((childId) => ({
      id: `${node.id}-${childId}`,
      fromId: node.id,
      toId: childId,
      selected: snapshot.selectedIds.includes(node.id) && snapshot.selectedIds.includes(childId),
    })),
  );
  const maxDepth = Math.max(0, ...nodes.map((node) => depths.get(node.id) ?? 0));
  return {
    kind: 'merge-tree',
    operation: snapshot.operation,
    preset: snapshot.preset,
    k: snapshot.k,
    segmentWeights: [...snapshot.segmentWeights],
    nodes,
    edges,
    roots: [...snapshot.forestIds],
    selectedIds: [...snapshot.selectedIds],
    newNodeId: snapshot.newNodeId,
    costAdded: snapshot.costAdded,
    totalCost: snapshot.totalCost,
    combines: snapshot.combines,
    virtualCount: nodes.filter((node) => node.virtual).length,
    width,
    height: Math.max(height, 36 + maxDepth * 76 + 60),
    result: snapshot.result,
  };
}
