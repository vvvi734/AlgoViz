import type { FreeListSnapshot } from '../trace/freeListSchema';

export interface FreeListSegmentModel {
  start: number;
  size: number;
  status: 'free' | 'allocated';
  label: string | null;
  headSize: number;
  tailSize: number;
  headStatus: 'free' | 'allocated';
  tailStatus: 'free' | 'allocated';
  current: boolean;
  candidate: boolean;
  selected: boolean;
  merging: boolean;
}

export interface FreeListRowModel {
  start: number;
  size: number;
  status: 'free' | 'allocated';
  label: string | null;
}

export interface FreeListVisualModel {
  kind: 'free-list';
  policy: 'first-fit' | 'best-fit';
  operation: string;
  capacity: number;
  blocks: FreeListSegmentModel[];
  freeRows: FreeListRowModel[];
  request: { id: string; size: number } | null;
  currentStart: number | null;
  candidateStart: number | null;
  selectedStart: number | null;
  decision: string | null;
  internalFragment: number;
  freeRegionCount: number;
  totalFree: number;
  largestFree: number;
  allocatedCount: number;
}

/** TEXTBOOK-08: map the validated free-list snapshot onto the shared memory band. */
export function buildFreeListVisualModel(snapshot: FreeListSnapshot): FreeListVisualModel {
  const merging =
    snapshot.operation === 'release' ||
    snapshot.operation === 'merge' ||
    snapshot.decision === 'merged' ||
    snapshot.decision === 'left-free' ||
    snapshot.decision === 'right-free' ||
    snapshot.decision === 'both-free';
  return {
    kind: 'free-list',
    policy: snapshot.policy,
    operation: snapshot.operation,
    capacity: snapshot.capacity,
    blocks: snapshot.blocks.map((block) => ({
      start: block.start,
      size: block.size,
      status: block.status,
      label: block.label,
      headSize: block.boundary.headSize,
      tailSize: block.boundary.tailSize,
      headStatus: block.boundary.headStatus,
      tailStatus: block.boundary.tailStatus,
      current: snapshot.currentStart === block.start,
      candidate: snapshot.candidateStart === block.start,
      selected: snapshot.selectedStart === block.start,
      merging: merging && snapshot.selectedStart === block.start,
    })),
    freeRows: snapshot.freeBlocks.map((block) => ({
      start: block.start,
      size: block.size,
      status: block.status,
      label: block.label,
    })),
    request: snapshot.request,
    currentStart: snapshot.currentStart,
    candidateStart: snapshot.candidateStart,
    selectedStart: snapshot.selectedStart,
    decision: snapshot.decision,
    internalFragment: snapshot.internalFragment,
    freeRegionCount: snapshot.freeRegionCount,
    totalFree: snapshot.totalFree,
    largestFree: snapshot.largestFree,
    allocatedCount: snapshot.allocatedCount,
  };
}
