import { describe, expect, it } from 'vitest';
import { ALGORITHM_FLOWS } from './algorithmFlows';
import type { FlowSection } from './flowTypes';
import { validateAlgorithmFlow } from './validateFlow';

function section(algorithmId: keyof typeof ALGORITHM_FLOWS, id: string): FlowSection {
  const found = ALGORITHM_FLOWS[algorithmId].sections.find((item) => item.id === id);
  if (!found) throw new Error(`missing ${algorithmId}/${id}`);
  return found;
}

function edge(sectionValue: FlowSection, from: string, to: string) {
  return sectionValue.edges.find((item) => item.from === from && item.to === to);
}

describe('VISUAL-01 declarative algorithm flows', () => {
  it.each(Object.keys(ALGORITHM_FLOWS))('%s satisfies the graph invariants', (id) => {
    expect(validateAlgorithmFlow(ALGORITHM_FLOWS[id])).toEqual([]);
  });

  it('Kruskal rejects edges back to the loop, exits on exhaustion, and stops after V−1 edges', () => {
    const main = section('kruskal', 'main');

    expect(edge(main, 'edge-loop', 'forest')?.kind).toBe('no');
    expect(edge(main, 'edge-loop', 'take-edge')?.kind).toBe('yes');
    expect(edge(main, 'connected', 'skip')?.kind).toBe('yes');
    expect(edge(main, 'connected', 'accept')?.kind).toBe('no');
    expect(edge(main, 'skip', 'edge-loop')?.back).toBe(true);
    expect(edge(main, 'enough', 'mst')?.kind).toBe('yes');
    expect(edge(main, 'enough', 'edge-loop')?.back).toBe(true);
    expect(edge(main, 'enough', 'edge-loop')?.kind).toBe('no');

    // The exhaustion exit is reached from the loop condition, never after an
    // accepted edge. The forest end is a legal second exit.
    const exits = main.edges.filter((item) => ['mst', 'forest'].includes(item.to));
    expect(exits.map((item) => `${item.from}:${item.kind}`)).toEqual([
      'edge-loop:no',
      'enough:yes',
    ]);
  });

  it('Binary search has two update loops and never branches back from the hit exit', () => {
    const main = section('binary', 'main');

    const hit = edge(main, 'hit', 'found');
    expect(hit?.kind).toBe('yes');
    expect(main.edges.some((item) => item.from === 'found')).toBe(false);

    const loops = main.edges.filter((item) => item.back);
    expect(loops.map((item) => `${item.from}->${item.to}`)).toEqual([
      'move-left->valid',
      'move-right->valid',
    ]);
    expect(main.nodes.find((node) => node.id === 'not-found')?.tone).toBe('failure');
  });

  it('KMP keeps LPS fallback separate from the text pointer', () => {
    const lps = section('kmp', 'lps');
    const match = section('kmp', 'match');

    expect(edge(lps, 'lps-fallback', 'lps-compare')?.back).toBe(true);
    expect(edge(lps, 'lps-fallback', 'lps-loop')).toBeUndefined();
    expect(edge(match, 'match-fallback', 'match-compare')?.back).toBe(true);

    // The text pointer i may only advance. An LPS-style fallback can never be
    // spliced onto the main matching loop as a text-pointer rewind.
    expect(match.edges.some((item) => item.from === 'match-fallback' && item.to === 'match-loop')).toBe(false);
    expect(match.nodes.find((node) => node.id === 'match-lps')?.kind).toBe('subflow');
    expect(ALGORITHM_FLOWS.kmp.sections.map((item) => item.id)).toEqual(['lps', 'match']);
  });

  it('Merge sort exposes the base case, recursive calls, returns and merge order', () => {
    const flow = section('merge', 'recursive-range');
    const kinds = flow.nodes.map((node) => node.kind);

    expect(kinds).toContain('call');
    expect(kinds).toContain('subreturn');
    expect(edge(flow, 'merge-base', 'merge-base-return')?.kind).toBe('yes');
    expect(edge(flow, 'merge-base', 'merge-split')?.kind).toBe('no');
    expect(edge(flow, 'merge-call-left', 'merge-return-left')?.kind).toBe('return');
    expect(edge(flow, 'merge-call-right', 'merge-return-right')?.kind).toBe('return');
    expect(edge(flow, 'merge-combine', 'merge-writeback')?.kind).toBe('next');
    expect(flow.nodes.find((node) => node.id === 'merge-return')?.kind).toBe('end');
  });
});
