/**
 * RECUR-01: a pure model for the two real recursive traces.
 *
 * The Trace already stores every frame that ever existed, not just the current
 * stack: each frame appears in `callStack` while it is alive and carries
 * `status='returning'` plus `returnValue` on its return event. This module folds
 * those snapshots into one call graph/tree and resolves each node against the
 * current playhead. It never invents a future call: pending nodes are nodes that
 * really appear later in the completed Trace, and they stay visually pending
 * until the playhead reaches their real call event.
 */
import type { CallFrame, TraceEvent, VariableSnapshot } from '../trace/schema';

export type RecursionAlgorithm = 'factorial' | 'fib';
export type RecursionNodeStatus = 'pending' | 'active' | 'waiting' | 'returning' | 'returned';
export type RecursionLinkStatus = 'pending' | 'active' | 'returned';

export interface RecursionNodeModel {
  id: string;
  parentId: string | null;
  depth: number;
  n: number;
  label: string;
  status: RecursionNodeStatus;
  combine: string | null;
  repeatTone: number | null;
  repeatCount: number;
  firstStep: number;
  returnStep: number | null;
  returnValue: number | null;
  isCurrent: boolean;
  x: number;
  y: number;
}

export interface RecursionLinkModel {
  from: string;
  to: string;
  status: RecursionLinkStatus;
}

export interface RecursionModel {
  algorithm: RecursionAlgorithm;
  kind: 'call-chain' | 'call-tree';
  nodes: RecursionNodeModel[];
  links: RecursionLinkModel[];
  width: number;
  height: number;
  nodeWidth: number;
  nodeHeight: number;
  rootId: string;
  currentId: string | null;
  stackDepth: number;
  totalCalls: number;
  returnedCount: number;
  pendingCount: number;
  repeated: { n: number; count: number }[];
  maxDepth: number;
  result: number | null;
}

interface WorkingFrame {
  id: string;
  parentId: string | null;
  depth: number;
  n: number;
  firstStep: number;
  lastStep: number;
  returnStep: number | null;
  returnValue: number | null;
}

const NODE_W = 88;
const NODE_H = 54;
const GAP_X = 12;
const GAP_Y = 34;
const MARGIN = 18;

function variableNumber(
  variables: VariableSnapshot[] | undefined,
  name: string,
): number | null {
  const item = variables?.find((variable) => variable.name === name);
  return typeof item?.value === 'number' && Number.isFinite(item.value) ? item.value : null;
}

function frameN(frame: CallFrame): number | null {
  return variableNumber(frame.arguments, 'n') ?? variableNumber(frame.locals, 'n');
}

function frameReturnValue(frame: CallFrame): number | null {
  return typeof frame.returnValue === 'number' && Number.isFinite(frame.returnValue)
    ? frame.returnValue
    : null;
}

function eventResult(event: TraceEvent | undefined): number | null {
  return variableNumber(event?.variables, 'answer');
}

function combineText(
  algorithm: RecursionAlgorithm,
  frame: CallFrame | undefined,
  n: number,
): string | null {
  if (!frame) return null;
  const locals = frame.locals;
  const result = variableNumber(locals, 'result');
  if (result === null) return null;
  if (algorithm === 'factorial') {
    const partial = variableNumber(locals, 'partial');
    return partial === null ? null : `${n} × ${partial} = ${result}`;
  }
  const left = variableNumber(locals, 'left');
  const right = variableNumber(locals, 'right');
  return left === null || right === null ? null : `${left} + ${right} = ${result}`;
}

/**
 * Build the complete call graph from the whole validated Trace, then resolve
 * the visual status at `index`. `null` means this algorithm has no recursive
 * call frames and the caller should keep its existing renderer.
 */
export function buildRecursionModel(
  events: readonly TraceEvent[],
  index: number,
  algorithmId: string,
): RecursionModel | null {
  if (algorithmId !== 'factorial' && algorithmId !== 'fib') return null;
  const algorithm: RecursionAlgorithm = algorithmId;
  if (events.length === 0) return null;

  const frames = new Map<string, WorkingFrame>();
  for (const event of events) {
    const stack = event.callStack ?? [];
    for (let depth = 0; depth < stack.length; depth += 1) {
      const frame = stack[depth]!;
      const frameId = frame.frameId;
      if (!frameId) continue;
      const parentId = depth > 0 ? stack[depth - 1]?.frameId ?? null : null;
      let working = frames.get(frameId);
      const n = frameN(frame) ?? 0;
      if (!working) {
        working = {
          id: frameId,
          parentId,
          depth: frame.depth ?? depth,
          n,
          firstStep: event.step,
          lastStep: event.step,
          returnStep: null,
          returnValue: null,
        };
        frames.set(frameId, working);
      } else {
        working.lastStep = event.step;
        working.depth = frame.depth ?? working.depth;
        if (frame.arguments) working.n = n;
      }
      if (frame.status === 'returning') {
        working.returnStep = event.step;
        working.returnValue = frameReturnValue(frame);
      }
    }
  }

  if (frames.size === 0) return null;

  const safeIndex = Math.max(0, Math.min(index, events.length - 1));
  const current = events[safeIndex]!;
  const currentStep = current.step;
  const currentStack = current.callStack ?? [];
  const currentIds = new Set(
    currentStack.flatMap((frame) => (frame.frameId ? [frame.frameId] : [])),
  );
  const topFrame = currentStack.length ? currentStack[currentStack.length - 1] : undefined;
  const topId = topFrame?.frameId ?? null;

  const workingFrames = [...frames.values()].sort((left, right) => left.firstStep - right.firstStep);
  const countByN = new Map<number, number>();
  for (const frame of workingFrames) countByN.set(frame.n, (countByN.get(frame.n) ?? 0) + 1);
  const repeated = [...countByN.entries()]
    // Base calls (0/1) repeat too, but the teaching point is overlapping
    // non-trivial subproblems; colouring every base leaf would drown that out.
    .filter(([n, count]) => n >= 2 && count > 1)
    .map(([n, count]) => ({ n, count }))
    .sort((left, right) => left.n - right.n);
  const toneByN = new Map<number, number>();
  repeated.forEach((entry, index) => toneByN.set(entry.n, index % 8));

  const root = workingFrames.find((frame) => frame.parentId === null) ?? workingFrames[0]!;
  const currentN = topFrame ? frameN(topFrame) ?? 0 : 0;
  const currentCombine = topFrame ? combineText(algorithm, topFrame, currentN) : null;

  const nodes: RecursionNodeModel[] = workingFrames.map((frame) => {
    let status: RecursionNodeStatus;
    if (currentIds.has(frame.id)) {
      const live = currentStack.find((candidate) => candidate.frameId === frame.id)!;
      status = live.status === 'returning'
        ? 'returning'
        : frame.id === topId
          ? 'active'
          : 'waiting';
    } else if (frame.firstStep > currentStep) {
      status = 'pending';
    } else if (frame.returnStep !== null && frame.returnStep <= currentStep) {
      status = 'returned';
    } else {
      // A real tracked call that has left the stack always emitted a return
      // event. Keeping it pending would claim work that did not happen.
      status = 'returned';
    }

    return {
      id: frame.id,
      parentId: frame.parentId,
      depth: frame.depth,
      n: frame.n,
      label: `${algorithm}(${frame.n})`,
      status,
      combine: status === 'active' && frame.id === topId ? currentCombine : null,
      repeatTone: toneByN.get(frame.n) ?? null,
      repeatCount: countByN.get(frame.n) ?? 1,
      firstStep: frame.firstStep,
      returnStep: frame.returnStep,
      returnValue: frame.returnValue,
      isCurrent: frame.id === topId,
      x: 0,
      y: 0,
    };
  });

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const children = new Map<string, RecursionNodeModel[]>();
  for (const node of nodes) {
    if (!node.parentId || !nodeById.has(node.parentId)) continue;
    const bucket = children.get(node.parentId) ?? [];
    bucket.push(node);
    children.set(node.parentId, bucket);
  }
  for (const bucket of children.values()) {
    bucket.sort((left, right) => left.firstStep - right.firstStep);
  }

  let nextLeaf = 0;
  const place = (node: RecursionNodeModel): number => {
    const bucket = children.get(node.id) ?? [];
    let x: number;
    if (bucket.length === 0) {
      x = MARGIN + nextLeaf * (NODE_W + GAP_X);
      nextLeaf += 1;
    } else {
      const childXs = bucket.map((child) => place(child));
      x = (childXs[0]! + childXs[childXs.length - 1]!) / 2;
    }
    node.x = x;
    node.y = MARGIN + node.depth * (NODE_H + GAP_Y);
    return x;
  };
  place(nodeById.get(root.id)!);

  const maxDepth = nodes.reduce((depth, node) => Math.max(depth, node.depth), 0);
  const width = Math.max(
    320,
    MARGIN * 2 + Math.max(1, nextLeaf) * (NODE_W + GAP_X) - (nextLeaf ? GAP_X : 0),
  );
  const height = MARGIN * 2 + (maxDepth + 1) * NODE_H + maxDepth * GAP_Y;

  const links: RecursionLinkModel[] = nodes.flatMap((node) => {
    if (!node.parentId || !nodeById.has(node.parentId)) return [];
    return [{
      from: node.parentId,
      to: node.id,
      status: node.status === 'pending'
        ? 'pending'
        : node.status === 'returned'
          ? 'returned'
          : 'active',
    }];
  });

  return {
    algorithm,
    kind: algorithm === 'factorial' ? 'call-chain' : 'call-tree',
    nodes,
    links,
    width,
    height,
    nodeWidth: NODE_W,
    nodeHeight: NODE_H,
    rootId: root.id,
    currentId: topId,
    stackDepth: currentStack.length,
    totalCalls: nodes.length,
    returnedCount: nodes.filter((node) => node.status === 'returned').length,
    pendingCount: nodes.filter((node) => node.status === 'pending').length,
    repeated,
    maxDepth,
    result: eventResult(current),
  };
}
