/**
 * TEXTBOOK-10: tournament-tree visual model. Leaves store records; every
 * internal node stores the winner passed up from its two children. A record's
 * identity is its stable original index, so equal keys remain distinguishable.
 */
import type { TournamentSnapshot } from '../trace/tournamentSchema';

export const TOURNAMENT_WIDTH = 1000;
export const TOURNAMENT_LEVEL_GAP = 66;
export const TOURNAMENT_NODE_W = 58;
export const TOURNAMENT_NODE_H = 38;

export interface TournamentNodeModel {
  id: string;
  level: number;
  slot: number;
  leaf: boolean;
  filled: boolean;
  recordId: string | null;
  label: string;
  value: number | null;
  x: number;
  y: number;
  state: 'idle' | 'current' | 'compare' | 'affected' | 'removed';
}

export interface TournamentRecordModel {
  id: string;
  label: string;
  value: number;
  originalIndex: number;
  leafId: string;
  active: boolean;
  state: 'idle' | 'compare' | 'winner' | 'output' | 'removed';
}

export interface TournamentVisualModel {
  kind: 'tournament';
  operation: TournamentSnapshot['operation'];
  records: TournamentRecordModel[];
  nodes: TournamentNodeModel[];
  edges: Array<{ id: string; fromId: string; toId: string }>;
  rootId: string;
  output: Array<{ id: string; label: string; value: number }>;
  activeCount: number;
  currentNodeId: string | null;
  compareNodeIds: string[];
  winnerId: string | null;
  affectedNodeIds: string[];
  result: TournamentSnapshot['result'];
  leafCount: number;
  height: number;
  width: number;
  stageHeight: number;
}

export function tournamentRecordLabel(value: number, label: string): string {
  return `${value} · ${label}`;
}

export function buildTournamentModel(snapshot: TournamentSnapshot): TournamentVisualModel {
  const byId = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const recordById = new Map(snapshot.records.map((record) => [record.id, record]));
  const currentNode = snapshot.currentNodeId ? byId.get(snapshot.currentNodeId) : undefined;
  const compareNodeIds = currentNode
    ? [currentNode.leftId, currentNode.rightId].filter((id): id is string => Boolean(id))
    : [];
  const compareRecords = new Set(snapshot.compareIds);
  const affected = new Set(snapshot.affectedNodeIds);
  const leafCount = Math.max(1, snapshot.nodes.filter((node) => node.leaf).length);
  const height = Math.max(0, ...snapshot.nodes.map((node) => node.level));
  const stageHeight = 40 + height * TOURNAMENT_LEVEL_GAP + TOURNAMENT_NODE_H;

  const records: TournamentRecordModel[] = snapshot.records.map((record) => ({
    id: record.id,
    label: record.id,
    value: record.value,
    originalIndex: record.originalIndex,
    leafId: record.leafId,
    active: record.active,
    state: !record.active
      ? 'removed'
      : snapshot.output.includes(record.id)
        ? 'output'
        : compareRecords.has(record.id)
          ? 'compare'
          : snapshot.winnerId === record.id
            ? 'winner'
            : 'idle',
  }));

  const nodes: TournamentNodeModel[] = snapshot.nodes.map((node) => {
    const record = node.recordId ? recordById.get(node.recordId) : undefined;
    const state: TournamentNodeModel['state'] = node.leaf && record && !record.active
      ? 'removed'
      : node.id === snapshot.currentNodeId
        ? 'current'
        : compareNodeIds.includes(node.id)
          ? 'compare'
          : affected.has(node.id)
            ? 'affected'
            : 'idle';
    return {
      id: node.id,
      level: node.level,
      slot: node.slot,
      leaf: node.leaf,
      filled: node.filled,
      recordId: node.recordId,
      label: record ? record.id : '',
      value: record ? record.value : null,
      x: (node.slot + 0.5) * (TOURNAMENT_WIDTH / 2 ** node.level),
      y: 22 + (height - node.level) * TOURNAMENT_LEVEL_GAP,
      state,
    };
  });

  const edges = snapshot.nodes.flatMap((node) => {
    if (node.leaf || !node.leftId || !node.rightId) return [];
    return [
      { id: `${node.id}->${node.leftId}`, fromId: node.id, toId: node.leftId },
      { id: `${node.id}->${node.rightId}`, fromId: node.id, toId: node.rightId },
    ];
  });

  return {
    kind: 'tournament',
    operation: snapshot.operation,
    records,
    nodes,
    edges,
    rootId: snapshot.rootId,
    output: snapshot.output.map((id) => {
      const record = recordById.get(id)!;
      return { id, label: record.id, value: record.value };
    }),
    activeCount: snapshot.activeCount,
    currentNodeId: snapshot.currentNodeId,
    compareNodeIds,
    winnerId: snapshot.winnerId,
    affectedNodeIds: snapshot.affectedNodeIds,
    result: snapshot.result,
    leafCount,
    height,
    width: TOURNAMENT_WIDTH,
    stageHeight,
  };
}
