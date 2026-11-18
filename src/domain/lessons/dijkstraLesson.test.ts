import { describe, expect, it } from 'vitest';
import { dijkstraLesson } from './dijkstraLesson';
import { lessonRegistry } from './registry';
import { validateLesson } from './schema';
import fixture from '../../test/fixtures/dijkstra-default-frames.json';

const FRAME_STEPS = (fixture as { frames: Array<{ lessonStepId?: string }> }).frames
  .map((frame) => frame.lessonStepId)
  .filter((id): id is string => Boolean(id));

describe('Stage 7F Dijkstra course', () => {
  it('is registered for dijkstra and validates against the lesson schema', () => {
    expect(lessonRegistry.byAlgorithm('dijkstra')).toBe(dijkstraLesson);
    expect(lessonRegistry.byId('dijkstra-weighted-shortest-path')).toBe(dijkstraLesson);
    expect(validateLesson(dijkstraLesson).errors).toEqual([]);
  });

  it('uses exactly the lesson_step ids emitted by the real Python trace', () => {
    expect(dijkstraLesson.steps.map((step) => step.stepId)).toEqual([
      'init',
      'start',
      'pop',
      'stale',
      'settle',
      'inspect',
      'relax',
      'skip',
      'done',
    ]);
    const courseSteps = new Set(dijkstraLesson.steps.map((step) => step.stepId));
    for (const step of FRAME_STEPS) expect(courseSteps.has(step)).toBe(true);
    expect(courseSteps.size).toBe(dijkstraLesson.steps.length);
  });

  it('teaches every requested shortest-path concept in both languages', () => {
    const text = [
      dijkstraLesson.overview.zh,
      dijkstraLesson.overview.en,
      dijkstraLesson.intuition.zh,
      dijkstraLesson.intuition.en,
      ...dijkstraLesson.steps.flatMap((step) => [step.title.zh, step.title.en, step.explanation.zh, step.explanation.en, step.tip?.zh ?? '', step.tip?.en ?? '']),
      ...dijkstraLesson.commonMistakes.zh,
      ...dijkstraLesson.commonMistakes.en,
      ...dijkstraLesson.prerequisites.zh,
      ...dijkstraLesson.prerequisites.en,
      dijkstraLesson.complexity.note.zh,
      dijkstraLesson.complexity.note.en,
    ].join('\n');
    expect(text).toMatch(/最短路径|shortest-path/);
    expect(text).toMatch(/边权|edge weight|weight/);
    expect(text).toMatch(/距离表|distance table/);
    expect(text).toMatch(/松弛|relax/);
    expect(text).toMatch(/最小堆|min-heap|优先队列|priority queue/);
    expect(text).toMatch(/前驱|previous/);
    expect(text).toMatch(/负权|negative/);
    expect(text).toMatch(/O\(\(V\+E\) log V\)/);
    expect(text).toMatch(/过期|stale/);
    expect(text).toMatch(/不可达|unreachable/);
    expect(text).toMatch(/有向|directed/);
  });

  it('quotes the real default run instead of inventing a path', () => {
    const done = dijkstraLesson.steps.at(-1)!;
    expect(done.explanation.zh).toContain('A → B → E → F → G');
    expect(done.explanation.en).toContain('A → B → E → F → G');
    expect(done.explanation.zh).toContain('7');
    const stale = dijkstraLesson.steps.find((step) => step.stepId === 'stale')!;
    expect(stale.explanation.zh).toContain('(6,F)');
    expect(stale.explanation.en).toContain('(6,F)');
    const relax = dijkstraLesson.steps.find((step) => step.stepId === 'relax')!;
    expect(relax.explanation.zh).toContain('6');
    expect(relax.explanation.zh).toContain('4');
  });

  it('keeps bilingual prerequisites and mistakes balanced', () => {
    expect(dijkstraLesson.prerequisites.zh.length).toBe(dijkstraLesson.prerequisites.en.length);
    expect(dijkstraLesson.commonMistakes.zh.length).toBe(dijkstraLesson.commonMistakes.en.length);
    expect(dijkstraLesson.commonMistakes.zh.length).toBeGreaterThanOrEqual(6);
  });
});
