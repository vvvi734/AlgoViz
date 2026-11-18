import { describe, expect, it } from 'vitest';
import { primLesson } from './primLesson';
import { kruskalLesson } from './kruskalLesson';
import { lessonRegistry } from './registry';
import { validateLesson } from './schema';
import mstFixture from '../../test/fixtures/mst-default-frames.json';

const COURSES = [primLesson, kruskalLesson];
const FRAMES = {
  prim: mstFixture.prim as Array<{ lessonStepId?: string }>,
  kruskal: mstFixture.kruskal as Array<{ lessonStepId?: string }>,
};

function frameSteps(frames: Array<{ lessonStepId?: string }>): string[] {
  return frames.map((frame) => frame.lessonStepId).filter((id): id is string => Boolean(id));
}

describe('G2 Prim and Kruskal courses', () => {
  it('registers both courses and validates them', () => {
    expect(lessonRegistry.byAlgorithm('prim')).toBe(primLesson);
    expect(lessonRegistry.byAlgorithm('kruskal')).toBe(kruskalLesson);
    expect(validateLesson(primLesson).errors).toEqual([]);
    expect(validateLesson(kruskalLesson).errors).toEqual([]);
  });

  it('uses exactly the real Python lesson_step ids', () => {
    expect(primLesson.steps.map((step) => step.stepId)).toEqual([
      'init', 'start', 'push', 'pop', 'select', 'skip', 'component', 'done',
    ]);
    expect(kruskalLesson.steps.map((step) => step.stepId)).toEqual([
      'init', 'sort', 'inspect-edge', 'reject-edge', 'union', 'done',
    ]);
    const realPrimSteps = new Set(frameSteps(FRAMES.prim));
    const realKruskalSteps = new Set(frameSteps(FRAMES.kruskal));
    // The default graph is connected, so Prim's real trace cannot contain the
    // authored `component` step; every other step must be recorded exactly.
    for (const step of primLesson.steps) {
      if (step.stepId !== 'component') expect(realPrimSteps.has(step.stepId)).toBe(true);
    }
    for (const step of kruskalLesson.steps) expect(realKruskalSteps.has(step.stepId)).toBe(true);
    expect(realPrimSteps.size).toBe(primLesson.steps.length - 1);
    expect(realKruskalSteps.size).toBe(kruskalLesson.steps.length);
  });

  it('teaches MST definition, shortest-path distinction and both greedy strategies in both languages', () => {
    const primText = [
      primLesson.overview.zh, primLesson.overview.en,
      primLesson.intuition.zh, primLesson.intuition.en,
      ...primLesson.steps.flatMap((step) => [step.title.zh, step.title.en, step.explanation.zh, step.explanation.en, step.tip?.zh ?? '', step.tip?.en ?? '']),
      ...primLesson.commonMistakes.zh, ...primLesson.commonMistakes.en,
      primLesson.complexity.note.zh, primLesson.complexity.note.en,
    ].join('\n');
    expect(primText).toMatch(/生成树|spanning tree/);
    expect(primText).toMatch(/最小生成树|minimum spanning tree|MST/);
    expect(primText).toMatch(/最短路径|shortest path/);
    expect(primText).toMatch(/贪心|greedy/);
    expect(primText).toMatch(/横切|crossing edge/);
    expect(primText).toMatch(/环|cycle/);
    expect(primText).toMatch(/森林|forest/);
    expect(primText).toMatch(/负权|negative weight/);
    expect(primText).toMatch(/有向图|directed graph/);
    expect(primText).toMatch(/O\(\(V\+E\) log V\)/);

    const kruskalText = [
      kruskalLesson.overview.zh, kruskalLesson.overview.en,
      kruskalLesson.intuition.zh, kruskalLesson.intuition.en,
      ...kruskalLesson.steps.flatMap((step) => [step.title.zh, step.title.en, step.explanation.zh, step.explanation.en, step.tip?.zh ?? '', step.tip?.en ?? '']),
      ...kruskalLesson.commonMistakes.zh, ...kruskalLesson.commonMistakes.en,
      kruskalLesson.complexity.note.zh, kruskalLesson.complexity.note.en,
    ].join('\n');
    expect(kruskalText).toMatch(/并查集|Union-Find/);
    expect(kruskalText).toMatch(/按秩|by rank/);
    expect(kruskalText).toMatch(/路径压缩|path compression/);
    expect(kruskalText).toMatch(/find/);
    expect(kruskalText).toMatch(/环|cycle/);
    expect(kruskalText).toMatch(/排序|sort/);
    expect(kruskalText).toMatch(/森林|forest/);
    expect(kruskalText).toMatch(/O\(E log E\)/);
  });

  it('quotes the real default edge sets and total weight', () => {
    const primDone = primLesson.steps.at(-1)!;
    expect(primDone.explanation.zh).toContain('A–B、A–C、C–D、D–E');
    expect(primDone.explanation.zh).toContain('6');
    const kruskalDone = kruskalLesson.steps.at(-1)!;
    expect(kruskalDone.explanation.zh).toContain('C–D、D–E、B–C、A–B');
    expect(kruskalDone.explanation.zh).toContain('6');
    expect(kruskalDone.explanation.zh).toMatch(/相同|same/);
  });

  it('keeps bilingual lists balanced and gives every step a memory tip', () => {
    for (const course of COURSES) {
      expect(course.prerequisites.zh.length).toBe(course.prerequisites.en.length);
      expect(course.commonMistakes.zh.length).toBe(course.commonMistakes.en.length);
      expect(course.commonMistakes.zh.length).toBeGreaterThanOrEqual(8);
      for (const step of course.steps) {
        expect(step.tip?.zh.length).toBeGreaterThan(0);
        expect(step.tip?.en.length).toBeGreaterThan(0);
      }
    }
  });
});
