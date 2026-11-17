import { describe, expect, it } from 'vitest';
import { bellmanFordLesson } from './bellmanFordLesson';
import { floydWarshallLesson } from './floydWarshallLesson';
import { lessonRegistry } from './registry';
import { validateLesson } from './schema';
import floydFixture from '../../test/fixtures/floyd-default-frames.json';
import bellmanFixture from '../../test/fixtures/bellman-default-frames.json';

function frameSteps(fixture: { frames: Array<{ lessonStepId?: string }> }): string[] {
  return fixture.frames.map((frame) => frame.lessonStepId).filter((id): id is string => Boolean(id));
}

describe('G1 Floyd-Warshall and Bellman-Ford courses', () => {
  it('registers both courses and validates them', () => {
    expect(lessonRegistry.byAlgorithm('floyd-warshall')).toBe(floydWarshallLesson);
    expect(lessonRegistry.byAlgorithm('bellman-ford')).toBe(bellmanFordLesson);
    expect(validateLesson(floydWarshallLesson).errors).toEqual([]);
    expect(validateLesson(bellmanFordLesson).errors).toEqual([]);
  });

  it('uses exactly the real Python lesson_step ids', () => {
    expect(floydWarshallLesson.steps.map((step) => step.stepId)).toEqual([
      'init', 'k', 'update', 'skip', 'negative-cycle', 'done',
    ]);
    expect(bellmanFordLesson.steps.map((step) => step.stepId)).toEqual([
      'init', 'round', 'inspect', 'relax', 'skip', 'early-exit', 'negative-cycle', 'done',
    ]);
    for (const course of [floydWarshallLesson, bellmanFordLesson]) {
      const courseSteps = new Set(course.steps.map((step) => step.stepId));
      const fixtureSteps = new Set(course === floydWarshallLesson ? frameSteps(floydFixture) : frameSteps(bellmanFixture));
      for (const step of fixtureSteps) expect(courseSteps.has(step)).toBe(true);
      expect(courseSteps.size).toBe(course.steps.length);
    }
  });

  it('teaches the requested concepts in both languages', () => {
    const floydText = [
      floydWarshallLesson.overview.zh, floydWarshallLesson.overview.en,
      floydWarshallLesson.intuition.zh, floydWarshallLesson.intuition.en,
      ...floydWarshallLesson.steps.flatMap((step) => [step.title.zh, step.title.en, step.explanation.zh, step.explanation.en, step.tip?.zh ?? '', step.tip?.en ?? '']),
      ...floydWarshallLesson.commonMistakes.zh, ...floydWarshallLesson.commonMistakes.en,
      floydWarshallLesson.complexity.note.zh, floydWarshallLesson.complexity.note.en,
    ].join('\n');
    expect(floydText).toMatch(/三重循环|triple loop/);
    expect(floydText).toMatch(/动态规划|dynamic programming/);
    expect(floydText).toMatch(/O\(V³\)/);
    expect(floydText).toMatch(/O\(V²\)/);
    expect(floydText).toMatch(/负权环|negative cycle/);
    expect(floydText).toMatch(/距离矩阵|distance matrix/);
    expect(floydText).toMatch(/前驱|previous/);

    const bellmanText = [
      bellmanFordLesson.overview.zh, bellmanFordLesson.overview.en,
      bellmanFordLesson.intuition.zh, bellmanFordLesson.intuition.en,
      ...bellmanFordLesson.steps.flatMap((step) => [step.title.zh, step.title.en, step.explanation.zh, step.explanation.en, step.tip?.zh ?? '', step.tip?.en ?? '']),
      ...bellmanFordLesson.commonMistakes.zh, ...bellmanFordLesson.commonMistakes.en,
      bellmanFordLesson.complexity.note.zh, bellmanFordLesson.complexity.note.en,
    ].join('\n');
    expect(bellmanText).toMatch(/V[−-]1|V-1/);
    expect(bellmanText).toMatch(/O\(VE\)/);
    expect(bellmanText).toMatch(/负权边|negative edge/);
    expect(bellmanText).toMatch(/负权环|negative cycle/);
    expect(bellmanText).toMatch(/Dijkstra/);
    expect(bellmanText).toMatch(/提前结束|early exit/);
    expect(bellmanText).toMatch(/不可达|unreachable/);
  });

  it('quotes the real default paths and edge changes', () => {
    const floydDone = floydWarshallLesson.steps.at(-1)!;
    expect(floydDone.explanation.zh).toContain('A → C → B → D → E');
    expect(floydDone.explanation.zh).toContain('2');
    const floydUpdate = floydWarshallLesson.steps.find((step) => step.stepId === 'update')!;
    expect(floydUpdate.explanation.zh).toContain('−1');

    const bellmanDone = bellmanFordLesson.steps.at(-1)!;
    expect(bellmanDone.explanation.zh).toContain('A → C → B → D → E');
    expect(bellmanDone.explanation.zh).toContain('2');
    const bellmanRelax = bellmanFordLesson.steps.find((step) => step.stepId === 'relax')!;
    expect(bellmanRelax.explanation.zh).toContain('−1');
  });

  it('keeps bilingual lists balanced and every concept has a memory tip', () => {
    for (const course of [floydWarshallLesson, bellmanFordLesson]) {
      expect(course.prerequisites.zh.length).toBe(course.prerequisites.en.length);
      expect(course.commonMistakes.zh.length).toBe(course.commonMistakes.en.length);
      expect(course.commonMistakes.zh.length).toBeGreaterThanOrEqual(6);
      for (const step of course.steps) expect(step.tip?.zh && step.tip.en).toBeTruthy();
    }
  });
});
