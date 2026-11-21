import type { GcSnapshot } from '../trace/gcSchema';

export interface GcNodeModel {
  id: string;
  size: number;
  start: number;
  previousStart: number | null;
  status: 'allocated' | 'free';
  marked: boolean;
  reachable: boolean;
  root: boolean;
  current: boolean;
  target: boolean;
  x: number;
  y: number;
}

export interface GcRefModel {
  id: string;
  fromId: string;
  toId: string;
  fromStart: number;
  toStart: number;
  updated: boolean;
  live: boolean;
}

export interface GcSegmentModel {
  start: number;
  size: number;
  kind: 'object' | 'free';
  label: string | null;
  current: boolean;
  marked: boolean;
}

export interface GcVisualModel {
  kind: 'garbage-collection';
  mode: 'mark-sweep' | 'compaction';
  operation: string;
  capacity: number;
  nodes: GcNodeModel[];
  refs: GcRefModel[];
  roots: string[];
  markedIds: string[];
  reachableIds: string[];
  stackIds: string[];
  segments: GcSegmentModel[];
  freeSpans: Array<{ start: number; size: number }>;
  currentObjectId: string | null;
  targetObjectId: string | null;
  lastMove: { objectId: string; from: number; to: number } | null;
  updatedRefIds: string[];
  liveBytes: number;
  freeBytes: number;
  decision: string | null;
}

function distribute(count: number): number[] {
  const left = 70;
  const usable = 860;
  if (count <= 1) return [500];
  return Array.from({ length: count }, (_, index) => left + (index * usable) / (count - 1));
}

function positionsFor(objects: GcSnapshot['objects']): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const roots = objects.filter((object) => object.root);
  const marked = objects.filter((object) => object.marked && !object.root);
  const rest = objects.filter((object) => !object.root && !object.marked);
  const rows: Array<{ items: typeof objects; y: number }> = [];
  if (roots.length) rows.push({ items: roots, y: 54 });
  if (marked.length) rows.push({ items: marked, y: roots.length ? 152 : 66 });
  if (rest.length) rows.push({ items: rest, y: rows.length ? 250 : 66 });
  for (const row of rows) {
    const xs = distribute(row.items.length);
    row.items.forEach((object, index) => {
      positions.set(object.id, { x: xs[index] ?? 500, y: row.y });
    });
  }
  return positions;
}

/** TEXTBOOK-08: shared object graph and memory map for Mark-Sweep / Compaction. */
export function buildGcVisualModel(snapshot: GcSnapshot): GcVisualModel {
  const positions = positionsFor(snapshot.objects);
  const nodes: GcNodeModel[] = snapshot.objects.map((object) => {
    const point = positions.get(object.id) ?? { x: 500, y: 66 };
    return {
      id: object.id,
      size: object.size,
      start: object.start,
      previousStart: object.previousStart,
      status: object.status,
      marked: object.marked,
      reachable: object.reachable,
      root: object.root,
      current: snapshot.currentObjectId === object.id,
      target: snapshot.targetObjectId === object.id,
      x: point.x,
      y: point.y,
    };
  });

  const refs: GcRefModel[] = snapshot.refs.map((ref) => {
    const source = snapshot.objects.find((object) => object.id === ref.fromId);
    return {
      id: ref.id,
      fromId: ref.fromId,
      toId: ref.toId,
      fromStart: ref.fromStart,
      toStart: ref.toStart,
      updated: snapshot.updatedRefIds.includes(ref.id),
      live: Boolean(source?.marked),
    };
  });

  const segments: GcSegmentModel[] = [];
  for (const object of snapshot.objects) {
    if (object.status !== 'allocated') continue;
    segments.push({
      start: object.start,
      size: object.size,
      kind: 'object',
      label: object.id,
      current: snapshot.currentObjectId === object.id,
      marked: object.marked,
    });
  }
  for (const span of snapshot.freeSpans) {
    segments.push({
      start: span.start,
      size: span.size,
      kind: 'free',
      label: null,
      current: false,
      marked: false,
    });
  }
  segments.sort((left, right) => left.start - right.start);

  return {
    kind: 'garbage-collection',
    mode: snapshot.mode,
    operation: snapshot.operation,
    capacity: snapshot.capacity,
    nodes,
    refs,
    roots: snapshot.roots,
    markedIds: snapshot.markedIds,
    reachableIds: snapshot.reachableIds,
    stackIds: snapshot.stackIds,
    segments,
    freeSpans: snapshot.freeSpans,
    currentObjectId: snapshot.currentObjectId,
    targetObjectId: snapshot.targetObjectId,
    lastMove: snapshot.lastMove,
    updatedRefIds: snapshot.updatedRefIds,
    liveBytes: snapshot.liveBytes,
    freeBytes: snapshot.freeBytes,
    decision: snapshot.decision,
  };
}
