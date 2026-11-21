import type { AlgorithmFlow, FlowEdge, FlowNode } from './flowTypes';

function edgeHasPath(
  edges: readonly FlowEdge[],
  from: string,
  to: string,
): boolean {
  const targets = new Map<string, string[]>();
  for (const edge of edges) {
    const list = targets.get(edge.from) ?? [];
    list.push(edge.to);
    targets.set(edge.from, list);
  }
  const stack = [from];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node === to) return true;
    if (seen.has(node)) continue;
    seen.add(node);
    for (const next of targets.get(node) ?? []) stack.push(next);
  }
  return false;
}

/**
 * Returns human-readable invariant failures. It is intentionally independent
 * of React so a new algorithm flow can be checked before it reaches the page.
 */
export function validateAlgorithmFlow(flow: AlgorithmFlow): string[] {
  const errors: string[] = [];
  const globalNodeIds = new Set<string>();
  const sectionIds = new Set<string>();

  if (!flow.algorithmId.trim()) errors.push('algorithmId must not be empty');
  if (flow.sections.length === 0) errors.push('a flow needs at least one section');

  for (const section of flow.sections) {
    const prefix = `${flow.algorithmId}/${section.id}`;
    const nodes = new Map<string, FlowNode>();
    const occupiedSlots = new Map<string, string>();

    if (!section.id.trim()) errors.push(`${prefix}: empty section id`);
    if (sectionIds.has(section.id)) {
      errors.push(`${prefix}: duplicate section id ${section.id}`);
    }
    sectionIds.add(section.id);
    if (section.nodes.length === 0) errors.push(`${prefix}: no nodes`);

    for (const node of section.nodes) {
      if (globalNodeIds.has(node.id)) {
        errors.push(`${prefix}: duplicate node id ${node.id} across the whole flow`);
      }
      globalNodeIds.add(node.id);
      if (nodes.has(node.id)) errors.push(`${prefix}: duplicate node id ${node.id}`);
      nodes.set(node.id, node);
      if (!Number.isInteger(node.row) || node.row < 0) {
        errors.push(`${prefix}/${node.id}: row must be a non-negative integer`);
      }
      if (node.lane !== -1 && node.lane !== 0 && node.lane !== 1) {
        errors.push(`${prefix}/${node.id}: lane must be -1, 0 or 1`);
      }
      const slot = `${node.row}:${node.lane}`;
      const occupying = occupiedSlots.get(slot);
      if (occupying) {
        errors.push(`${prefix}/${node.id}: shares row ${node.row}, lane ${node.lane} with ${occupying}`);
      } else {
        occupiedSlots.set(slot, node.id);
      }
      if (node.kind === 'end') {
        if (!node.tone) errors.push(`${prefix}/${node.id}: an end node needs a tone`);
      } else if (node.tone) {
        errors.push(`${prefix}/${node.id}: only end nodes may carry a tone`);
      }
    }

    const outgoing = new Map<string, FlowEdge[]>();
    const incoming = new Map<string, FlowEdge[]>();
    for (const edge of section.edges) {
      const from = nodes.get(edge.from);
      const to = nodes.get(edge.to);
      if (!from) {
        errors.push(`${prefix}: edge starts at missing node ${edge.from}`);
        continue;
      }
      if (!to) {
        errors.push(`${prefix}: edge ends at missing node ${edge.to}`);
        continue;
      }
      outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
      incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge]);

      if (from.kind === 'end') errors.push(`${prefix}: end node ${from.id} has an outgoing edge`);
      if (to.kind === 'start') errors.push(`${prefix}: start node ${to.id} has an incoming edge`);

      if (edge.back) {
        if (to.row > from.row) {
          errors.push(`${prefix}: back edge ${edge.from} → ${edge.to} must go back to an earlier or equal row`);
        }
      } else if (to.row < from.row) {
        errors.push(`${prefix}: forward edge ${edge.from} → ${edge.to} goes back a row; mark it as a back edge`);
      } else if (to.row > from.row && from.lane === to.lane) {
        const blocked = [...nodes.values()].find(
          (node) =>
            node.lane === from.lane &&
            node.row > from.row &&
            node.row < to.row,
        );
        if (blocked) {
          errors.push(
            `${prefix}: edge ${edge.from} → ${edge.to} would run through ${blocked.id}; move a node to another lane`,
          );
        }
      }
    }

    const starts = [...nodes.values()].filter((node) => node.kind === 'start');
    const ends = [...nodes.values()].filter((node) => node.kind === 'end');
    if (starts.length !== 1) errors.push(`${prefix}: expected exactly one start, found ${starts.length}`);
    if (ends.length === 0) errors.push(`${prefix}: no end node`);

    for (const node of nodes.values()) {
      if (node.kind === 'decision') {
        const out = outgoing.get(node.id) ?? [];
        if (out.length < 2) errors.push(`${prefix}/${node.id}: a decision needs at least two outgoing branches`);
        if (!out.some((edge) => edge.kind === 'yes')) errors.push(`${prefix}/${node.id}: decision is missing a yes branch`);
        if (!out.some((edge) => edge.kind === 'no')) errors.push(`${prefix}/${node.id}: decision is missing a no branch`);
      }
      if (node.kind !== 'start' && node.kind !== 'end') {
        if (!(incoming.get(node.id) ?? []).length) {
          errors.push(`${prefix}/${node.id}: node is unreachable (no incoming edge)`);
        }
      }
    }

    const start = starts[0];
    if (start) {
      for (const node of nodes.values()) {
        if (node.id === start.id) continue;
        if (!edgeHasPath(section.edges, start.id, node.id)) {
          errors.push(`${prefix}/${node.id}: node is not reachable from the start`);
        }
        if (node.kind === 'end') continue;
        const canReachEnd = ends.some((end) => edgeHasPath(section.edges, node.id, end.id));
        if (!canReachEnd) errors.push(`${prefix}/${node.id}: node cannot reach any end`);
      }
    }
  }

  return errors;
}
