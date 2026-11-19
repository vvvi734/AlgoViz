import { describe, expect, it } from 'vitest';
import type { TraceEvent } from '../trace/schema';
import { avlLesson } from './avlLesson';
import { bstLesson } from './bstLesson';
import { huffmanLesson } from './huffmanLesson';
import { dijkstraLesson } from './dijkstraLesson';
import { buildFrameInsight } from './frameInsight';
import { stronglyConnectedComponentsLesson } from './stronglyConnectedComponentsLesson';
import { bubbleSortLesson } from './bubbleSort';
import { topologicalSortLesson } from './topologicalSortLesson';

import dijkstraRaw from '../../test/fixtures/dijkstra-default-frames.json';
import dagRaw from '../../test/fixtures/dag-default-frames.json';
import componentsRaw from '../../test/fixtures/components-edge-frames.json';
import bstRaw from '../../test/fixtures/bst-default-frames.json';
import avlRaw from '../../test/fixtures/avl-default-frames.json';
import huffmanRaw from '../../test/fixtures/huffman-default-frames.json';

function asEvents(frames: unknown[]): TraceEvent[] {
  return frames.map((frame, index) => ({
    schemaVersion: 1,
    step: index,
    eventType: 'step',
    visualType: 'graph',
    ...(frame as Record<string, unknown>),
  }) as unknown as TraceEvent);
}

const dijkstraFrames = asEvents((dijkstraRaw as { frames: unknown[] }).frames);
const kahnFrames = asEvents((dagRaw as { topological: unknown[] }).topological);
const kosarajuFrames = asEvents((componentsRaw as { scc: { bridge: unknown[] } }).scc.bridge);
const bstFrames = asEvents((bstRaw as { insert: unknown[] }).insert);
const avlFrames = asEvents((avlRaw as { 'insert-ll': unknown[] })['insert-ll']);
const huffmanFrames = asEvents((huffmanRaw as { official: unknown[] }).official);

function insightAt(frames: TraceEvent[], lesson: typeof dijkstraLesson, index: number, lang: 'zh' | 'en' = 'zh') {
  const previous = index > 0 ? frames[index - 1] : undefined;
  return buildFrameInsight(lesson, frames[index], previous, lang);
}

describe('UX-02 frame insight', () => {
  it('reads Dijkstra relax as a real distance/previous update, never as prose', () => {
    const insight = insightAt(dijkstraFrames, dijkstraLesson, 27);
    expect(insight?.semantic).toBe(true);
    expect(insight?.action).toContain('松弛');
    expect(insight?.changes[0]).toMatchObject({ label: '距离', before: '6', after: '4' });
    expect(insight?.changes[1]).toMatchObject({ label: '前驱', before: 'C', after: 'E' });
    expect(insight?.memory).toContain('严格变小');
  });

  it('keeps a Dijkstra skip honest: it reports equality, not a fake update', () => {
    const insight = insightAt(dijkstraFrames, dijkstraLesson, 25);
    expect(insight?.action).toContain('不松弛');
    expect(insight?.changes[0]?.after).toContain('3 + 1 = 4');
    expect(insight?.changes[1]?.after).toContain('B = 2');
    expect(insight?.memory).toContain('skip');
  });

  it('finishes Dijkstra with the real reconstructed path and weight', () => {
    const insight = insightAt(dijkstraFrames, dijkstraLesson, 45);
    expect(insight?.action).toContain('堆空');
    expect(insight?.changes[0]?.after).toBe('A → B → E → F → G');
    expect(insight?.changes[1]?.after).toBe('7');
  });

  it('reads Kahn decrement, enqueue and cycle data from the snapshot', () => {
    const decrement = insightAt(kahnFrames, topologicalSortLesson, 5);
    expect(decrement?.action).toContain('移除依赖');
    expect(decrement?.changes[0]).toMatchObject({ before: '2', after: '1' });

    const enqueue = insightAt(kahnFrames, topologicalSortLesson, 8);
    expect(enqueue?.action).toContain('D 入队');
    expect(enqueue?.changes[0]?.after).toBe('D');
    expect(enqueue?.changes[1]?.after).toContain('0');
  });

  it('reads both Kosaraju passes and component completion', () => {
    const finish = insightAt(kosarajuFrames, stronglyConnectedComponentsLesson, 13);
    expect(finish?.action).toContain('完成');
    expect(finish?.changes[1]?.after).toContain('D, C');

    const reverse = insightAt(kosarajuFrames, stronglyConnectedComponentsLesson, 16);
    expect(reverse?.action).toContain('转置图');
    expect(reverse?.changes[2]?.after).toBe('A, B, C, D');

    const second = insightAt(kosarajuFrames, stronglyConnectedComponentsLesson, 17);
    expect(second?.action).toContain('第二遍 DFS');
    expect(second?.changes[1]?.after).toContain('C1={A}');

    const done = insightAt(kosarajuFrames, stronglyConnectedComponentsLesson, 35);
    expect(done?.changes[0]?.after).toBe('2');
    expect(done?.changes[1]?.after).toContain('C1={A,B}');
  });

  it('reads BST insert and AVL rotation from real tree fields', () => {
    const insert = insightAt(bstFrames, bstLesson, 7);
    expect(insert?.action).toContain('插入');
    expect(insert?.changes[0]?.after).toContain('b8(35)');
    expect(insert?.changes[1]?.after).toContain('b5(40)');

    const imbalance = insightAt(avlFrames, avlLesson, 10);
    expect(imbalance?.action).toContain('失衡');
    expect(imbalance?.changes[2]?.after).toBe('LL');

    const rotate = insightAt(avlFrames, avlLesson, 12);
    expect(rotate?.action).toContain('右旋');
    expect(rotate?.changes[1]?.after).toContain('a4');
  });

  it('falls back honestly when an array frame records no structured change', () => {
    const eventA = {
      schemaVersion: 1,
      step: 0,
      eventType: 'step',
      visualType: 'array',
      state: { type: 'array', values: [1, 2] },
      message: 'compare',
      lessonStepId: 'compare',
    } as unknown as TraceEvent;
    const eventB = { ...eventA, step: 1, state: { type: 'array', values: [1, 2] } };
    const insight = buildFrameInsight(bubbleSortLesson, eventB, eventA, 'zh');
    expect(insight?.semantic).toBe(false);
    expect(insight?.changes[0]?.detail).toContain('没有记录结构化状态变化');
    expect(insight?.action).toContain('比较相邻元素');
  });

  it('reads the Huffman build and code table from the real snapshot', () => {
    const select = insightAt(huffmanFrames, huffmanLesson, 1);
    expect(select?.semantic).toBe(true);
    expect(select?.action).toContain('A=5(n1)');
    expect(select?.action).toContain('B=9(n2)');
    expect(select?.changes.find((change) => change.label === '取出的两个最小根')?.after).toBe('A=5(n1) + B=9(n2)');

    const create = insightAt(huffmanFrames, huffmanLesson, 2);
    expect(create?.action).toContain('5+9=14');
    expect(create?.changes.find((change) => change.label === '新父节点')?.after).toBe('n7: 14');

    const leaf = insightAt(huffmanFrames, huffmanLesson, 18);
    expect(leaf?.action).toContain('F');
    expect(leaf?.action).toContain('编码 0');

    const done = insightAt(huffmanFrames, huffmanLesson, 28);
    expect(done?.action).toContain('WPL=224');
    expect(done?.changes.find((change) => change.label === 'WPL / 实际总位数')?.after).toBe('224 / 224');
    expect(done?.memory).toContain('两小合一');
  });

  it('localises the same structure fields into English', () => {
    const insight = insightAt(dijkstraFrames, dijkstraLesson, 27, 'en');
    expect(insight?.action).toContain('Relax');
    expect(insight?.changes[0]?.label).toBe('distance');
    expect(insight?.memory).toContain('strict decrease');
  });

  it('does not invent a memory hook or step when the course has no matching frame', () => {
    const event = { ...dijkstraFrames[0], lessonStepId: 'missing-step' } as TraceEvent;
    const insight = buildFrameInsight(dijkstraLesson, event, undefined, 'zh');
    expect(insight?.memory).toBeNull();
    expect(insight?.action).toContain('初始化');
  });
});
