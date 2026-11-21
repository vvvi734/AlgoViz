import { describe, expect, it } from 'vitest';
import { ALGORITHM_FLOWS } from './algorithmFlows';
import { lessonRegistry } from '../lessons/registry';
import type { FlowSection } from './flowTypes';
import { validateAlgorithmFlow } from './validateFlow';

function expectBilingual(label: { zh: string; en: string } | undefined, context: string) {
  expect(label?.zh.trim(), `${context} zh`).toBeTruthy();
  expect(label?.en.trim(), `${context} en`).toBeTruthy();
}

function section(algorithmId: keyof typeof ALGORITHM_FLOWS, id: string): FlowSection {
  const found = ALGORITHM_FLOWS[algorithmId].sections.find((item) => item.id === id);
  if (!found) throw new Error(`missing ${algorithmId}/${id}`);
  return found;
}

function edge(sectionValue: FlowSection, from: string, to: string) {
  return sectionValue.edges.find((item) => item.from === from && item.to === to);
}

describe('declarative algorithm flows (VISUAL-01 + VISUAL-02)', () => {
  it.each(Object.keys(ALGORITHM_FLOWS))('%s satisfies the graph invariants', (id) => {
    expect(validateAlgorithmFlow(ALGORITHM_FLOWS[id])).toEqual([]);
  });

  it('Kruskal scans every edge and exits only when the candidate list is exhausted', () => {
    const main = section('kruskal', 'main');

    expect(edge(main, 'edge-loop', 'done')?.kind).toBe('no');
    expect(edge(main, 'edge-loop', 'take-edge')?.kind).toBe('yes');
    expect(edge(main, 'connected', 'skip')?.kind).toBe('yes');
    expect(edge(main, 'connected', 'accept')?.kind).toBe('no');
    expect(edge(main, 'skip', 'edge-loop')?.back).toBe(true);
    expect(edge(main, 'accept', 'edge-loop')?.back).toBe(true);

    // The implementation keeps scanning after accepting an edge; it never
    // stops at V−1 selected edges because later edges are still inspected.
    const exits = main.edges.filter((item) => item.to === 'done');
    expect(exits.map((item) => `${item.from}:${item.kind}`)).toEqual(['edge-loop:no']);
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

  it('covers every bundled algorithm lesson exactly once', () => {
    const lessonAlgorithmIds = lessonRegistry.lessons.map((lesson) => lesson.algorithmId);
    expect(new Set(lessonAlgorithmIds).size).toBe(lessonAlgorithmIds.length);
    expect(Object.keys(ALGORITHM_FLOWS).sort()).toEqual([...lessonAlgorithmIds].sort());
    for (const [key, flow] of Object.entries(ALGORITHM_FLOWS)) {
      expect(flow.algorithmId).toBe(key);
    }
  });

  it('keeps every flow section, node and branch label bilingual', () => {
    for (const [algorithmId, flow] of Object.entries(ALGORITHM_FLOWS)) {
      for (const sectionValue of flow.sections) {
        expectBilingual(sectionValue.title, `${algorithmId}/${sectionValue.id}/title`);
        if (sectionValue.summary) {
          expectBilingual(sectionValue.summary, `${algorithmId}/${sectionValue.id}/summary`);
        }
        for (const node of sectionValue.nodes) {
          expectBilingual(node.label, `${algorithmId}/${sectionValue.id}/${node.id}/label`);
          if (node.detail) {
            expectBilingual(node.detail, `${algorithmId}/${sectionValue.id}/${node.id}/detail`);
          }
        }
        for (const edgeValue of sectionValue.edges) {
          if (edgeValue.label) {
            expectBilingual(
              edgeValue.label,
              `${algorithmId}/${sectionValue.id}/${edgeValue.from}->${edgeValue.to}/label`,
            );
          }
        }
      }
    }
  });

  it('keeps the B-tree split order and models AOE forward, backward and recursive path collection', () => {
    const insert = section('btree', 'insert');
    expect(edge(insert, 'btree-insert-loop', 'btree-insert-choose')?.kind).toBe('no');
    expect(edge(insert, 'btree-insert-choose', 'btree-insert-fullchild')).toBeTruthy();
    expect(edge(insert, 'btree-insert-fullchild', 'btree-insert-split-child')?.kind).toBe('yes');
    expect(edge(insert, 'btree-insert-fullchild', 'btree-insert-descend')?.kind).toBe('no');
    expect(edge(insert, 'btree-insert-split-child', 'btree-insert-descend')).toBeTruthy();

    const forward = section('critical-path', 'forward');
    expect(edge(forward, 'aoe-forward-acyclic', 'aoe-forward-cycle')?.kind).toBe('no');
    expect(edge(forward, 'aoe-forward-acyclic', 'aoe-forward-order')?.kind).toBe('yes');
    expect(forward.nodes.find((node) => node.id === 'aoe-forward-cycle')?.tone).toBe('failure');
    expect(forward.nodes.find((node) => node.id === 'aoe-forward-calc')?.label.zh).toContain('max');

    const backward = section('critical-path', 'backward');
    expect(edge(backward, 'aoe-backward-sink', 'aoe-backward-duration')?.kind).toBe('yes');
    expect(edge(backward, 'aoe-backward-sink', 'aoe-backward-calc')?.kind).toBe('no');
    expect(backward.nodes.find((node) => node.id === 'aoe-backward-calc')?.label.zh).toContain('min');

    const paths = section('critical-path', 'paths');
    expect(edge(paths, 'aoe-paths-call', 'aoe-paths-return')?.kind).toBe('return');
    const collect = section('critical-path', 'collect');
    expect(edge(collect, 'aoe-collect-call', 'aoe-collect-subreturn')?.kind).toBe('return');
    expect(edge(collect, 'aoe-collect-advance', 'aoe-collect-loop')?.back).toBe(true);
  });

  it('models graph traversals and Kosaraju with real explicit-stack control', () => {
    for (const id of ['dfs', 'components', 'scc'] as const) {
      const nodes = ALGORITHM_FLOWS[id].sections.flatMap((item) => item.nodes);
      expect(nodes.some((node) => node.kind === 'call' || node.kind === 'subreturn'), id).toBe(false);
    }

    const dfs = section('dfs', 'main');
    expect(dfs.nodes.find((node) => node.id === 'dfs-pop')?.label.zh).toContain('stack.pop');
    expect(edge(dfs, 'dfs-advance', 'dfs-inner')?.back).toBe(true);
    expect(edge(dfs, 'dfs-inner', 'dfs-outer')?.kind).toBe('no');
    expect(edge(dfs, 'dfs-inner', 'dfs-outer')?.back).toBe(true);
    expect(edge(dfs, 'dfs-discovered', 'dfs-push')?.kind).toBe('no');

    expect(ALGORITHM_FLOWS.components.sections.map((item) => item.id)).toEqual(['main', 'dfs']);
    const componentsDfs = section('components', 'dfs');
    expect(edge(componentsDfs, 'components-dfs-advance', 'components-dfs-loop')?.back).toBe(true);
    expect(edge(componentsDfs, 'components-dfs-loop', 'components-dfs-outer')?.kind).toBe('no');
    expect(edge(componentsDfs, 'components-dfs-loop', 'components-dfs-outer')?.back).toBe(true);

    expect(ALGORITHM_FLOWS.scc.sections.map((item) => item.id)).toEqual([
      'first-pass',
      'dfs1',
      'reverse-graph',
      'second-pass',
      'dfs2',
    ]);
    expect(edge(section('scc', 'dfs1'), 'scc-dfs1-continue', 'scc-dfs1-outer')?.back).toBe(true);
    expect(edge(section('scc', 'dfs1'), 'scc-dfs1-has-next', 'scc-dfs1-pop')?.kind).toBe('no');
    expect(edge(section('scc', 'dfs2'), 'scc-dfs2-continue', 'scc-dfs2-outer')?.back).toBe(true);
    expect(edge(section('scc', 'dfs2'), 'scc-dfs2-assigned', 'scc-dfs2-push')?.kind).toBe('no');
  });

  it('models recursive courses with calls, base cases and returns', () => {
    for (const id of ['factorial', 'fib', 'inorder', 'quick', 'merge'] as const) {
      const nodes = ALGORITHM_FLOWS[id].sections.flatMap((item) => item.nodes);
      expect(nodes.some((node) => node.kind === 'call'), id).toBe(true);
      expect(nodes.some((node) => node.kind === 'subreturn'), id).toBe(true);
    }
  });

  it('distinguishes operations and recursive control across representative courses', () => {
    expect(ALGORITHM_FLOWS.stack.sections.map((item) => item.id)).toEqual([
      'push',
      'pop',
      'peek',
    ]);
    expect(ALGORITHM_FLOWS['hash-probe'].sections.map((item) => item.id)).toEqual([
      'probe',
      'insert',
      'find',
      'delete',
    ]);
    expect(ALGORITHM_FLOWS.bst.sections.map((item) => item.id)).toEqual([
      'find',
      'insert',
      'delete',
      'delete-leaf',
      'delete-one',
      'delete-two',
    ]);

    const quick = ALGORITHM_FLOWS.quick.sections.find((item) => item.id === 'recursive-range');
    const merges = ALGORITHM_FLOWS.merge.sections.find((item) => item.id === 'recursive-range');
    for (const flow of [quick, merges]) {
      expect(flow?.nodes.some((node) => node.kind === 'call')).toBe(true);
      expect(flow?.nodes.some((node) => node.kind === 'subreturn')).toBe(true);
    }

    expect(edge(section('bubble', 'main'), 'bubble-inner', 'bubble-compare')?.back).toBe(true);
    expect(edge(section('dijkstra', 'main'), 'dijkstra-stale', 'dijkstra-skip')?.kind).toBe('yes');
    expect(edge(section('dijkstra', 'main'), 'dijkstra-negative', 'dijkstra-negative-end')?.kind).toBe('yes');
  });

  it('keeps structure flows tied to each runtime operation and real base cases', () => {
    const stackPush = section('stack', 'push');
    expect(stackPush.nodes.map((node) => node.id)).toEqual([
      'stack-push-start',
      'stack-push-append',
      'stack-push-done',
    ]);
    expect(stackPush.nodes.every((node) => !node.label.zh.includes('capacity'))).toBe(true);

    expect(ALGORITHM_FLOWS.queue.sections.map((item) => item.id)).toEqual([
      'enqueue',
      'dequeue',
      'front',
    ]);
    const queueNodes = ALGORITHM_FLOWS.queue.sections.flatMap((item) => item.nodes);
    expect(queueNodes.every((node) => !/(capacity|count|tail)/i.test(node.label.zh))).toBe(true);

    const bstInsert = section('bst', 'insert');
    expect(bstInsert.nodes.some((node) => node.id === 'bst-insert-search')).toBe(true);
    expect(bstInsert.nodes.some((node) => node.id === 'bst-insert-rebalance')).toBe(false);
    const bstDelete = section('bst', 'delete');
    expect(bstDelete.nodes.some((node) => node.id === 'bst-delete-rebalance')).toBe(false);

    expect(ALGORITHM_FLOWS.doubly.sections.map((item) => item.id)).toContain('delete-head');
    expect(ALGORITHM_FLOWS.doubly.sections.map((item) => item.id)).toContain('delete-tail');
    expect(ALGORITHM_FLOWS.circular.sections.map((item) => item.id)).toContain('delete-head');
    expect(ALGORITHM_FLOWS.circular.sections.map((item) => item.id)).toContain('delete-tail');

    const binary = section('binary', 'main');
    expect(binary.nodes.map((node) => node.id)).toEqual(expect.arrayContaining([
      'empty', 'empty-fail', 'sorted', 'invalid',
    ]));
    expect(edge(binary, 'empty', 'empty-fail')?.kind).toBe('yes');
    expect(edge(binary, 'sorted', 'invalid')?.kind).toBe('no');

    const quick = section('quick', 'recursive-range');
    expect(quick.nodes.some((node) => node.id === 'quick-empty-return')).toBe(true);
    expect(quick.nodes.some((node) => node.id === 'quick-singleton-return')).toBe(true);

    const merge = section('merge', 'recursive-range');
    expect(merge.nodes.find((node) => node.id === 'merge-base')?.label.zh).toBe('left == right ？');
  });
});
