import { describe, expect, it } from 'vitest';
import { topologicalSortLesson } from './topologicalSortLesson';
import { criticalPathLesson } from './criticalPathLesson';
import { lessonRegistry } from './registry';
import { validateLesson } from './schema';
import dagFixture from '../../test/fixtures/dag-default-frames.json';

const COURSES = [topologicalSortLesson, criticalPathLesson];
const FRAMES = {
  topological: dagFixture.topological as Array<{ lessonStepId?: string; structure?: Record<string, unknown> }>,
  critical: dagFixture.critical as Array<{ lessonStepId?: string; structure?: Record<string, unknown> }>,
};

function frameSteps(frames: Array<{ lessonStepId?: string }>): string[] {
  return frames.map((frame) => frame.lessonStepId).filter((id): id is string => Boolean(id));
}

function lessonText(course: typeof topologicalSortLesson): string {
  return [
    course.overview.zh, course.overview.en,
    course.intuition.zh, course.intuition.en,
    ...course.steps.flatMap((step) => [
      step.title.zh, step.title.en, step.explanation.zh, step.explanation.en,
      step.tip?.zh ?? '', step.tip?.en ?? '',
    ]),
    ...course.commonMistakes.zh, ...course.commonMistakes.en,
    course.complexity.note.zh, course.complexity.note.en,
  ].join('\n');
}

describe('G3 topological sort and critical path courses', () => {
  it('registers both courses and validates them', () => {
    expect(lessonRegistry.byAlgorithm('topological')).toBe(topologicalSortLesson);
    expect(lessonRegistry.byAlgorithm('critical-path')).toBe(criticalPathLesson);
    expect(validateLesson(topologicalSortLesson).errors).toEqual([]);
    expect(validateLesson(criticalPathLesson).errors).toEqual([]);
  });

  it('uses exactly the real Python lesson_step ids', () => {
    expect(topologicalSortLesson.steps.map((step) => step.stepId)).toEqual([
      'init', 'seed', 'dequeue', 'inspect', 'decrement', 'enqueue', 'cycle', 'done',
    ]);
    expect(criticalPathLesson.steps.map((step) => step.stepId)).toEqual([
      'init', 'topo', 've', 'vl', 'activity', 'cycle', 'done',
    ]);
    const realTopological = new Set(frameSteps(FRAMES.topological));
    const realCritical = new Set(frameSteps(FRAMES.critical));
    for (const step of topologicalSortLesson.steps) {
      if (step.stepId !== 'cycle') expect(realTopological.has(step.stepId)).toBe(true);
    }
    for (const step of criticalPathLesson.steps) {
      if (step.stepId !== 'cycle') expect(realCritical.has(step.stepId)).toBe(true);
    }
    expect(realTopological.size).toBe(topologicalSortLesson.steps.length - 1);
    expect(realCritical.size).toBe(criticalPathLesson.steps.length - 1);
  });

  it('teaches DAG dependencies, multiple valid orders, cycles and Kahn complexity in both languages', () => {
    const text = lessonText(topologicalSortLesson);
    expect(text).toMatch(/DAG|有向无环图/);
    expect(text).toMatch(/入度|indegree/);
    expect(text).toMatch(/多种|several valid|not the unique|不唯一/);
    expect(text).toMatch(/有向环|directed cycle/);
    expect(text).toMatch(/非连通|disconnected/);
    expect(text).toMatch(/O\(V\+E\)/);
    expect(topologicalSortLesson.steps[0].explanation.zh).toContain('AOV');
  });

  it('teaches AOV vs AOE, longest path, ve/vl/slack and multiple paths in both languages', () => {
    const text = lessonText(criticalPathLesson);
    expect(text).toMatch(/AOV/);
    expect(text).toMatch(/AOE/);
    expect(text).toMatch(/最长路径|longest path/);
    expect(text).toMatch(/最短路径|shortest path/);
    expect(text).toMatch(/\bve\b/);
    expect(text).toMatch(/\bvl\b/);
    expect(text).toMatch(/余量|slack/);
    expect(text).toMatch(/多条|multiple critical|两条/);
    expect(text).toMatch(/多源|multiple source/);
    expect(text).toMatch(/多汇|multiple sink/);
    expect(text).toMatch(/O\(V\+E\)/);
  });

  it('quotes the real default results from the Python trace', () => {
    const topoDone = FRAMES.topological.at(-1)!;
    const topoStructure = topoDone.structure as {
      topologicalOrder?: string[];
      hasCycle?: boolean;
    };
    expect(topoStructure.topologicalOrder).toEqual(['A', 'B', 'D', 'C', 'E', 'F', 'G']);
    expect(topoStructure.hasCycle).toBe(false);
    expect(topologicalSortLesson.steps.at(-1)!.explanation.zh).toContain('A、B、D、C、E、F、G');

    const criticalDone = FRAMES.critical.at(-1)!;
    const criticalStructure = criticalDone.structure as {
      projectDuration?: number;
      criticalPaths?: string[][];
    };
    expect(criticalStructure.projectDuration).toBe(11);
    expect(criticalStructure.criticalPaths).toEqual([
      ['A', 'B', 'E', 'F'],
      ['A', 'C', 'D', 'E', 'F'],
    ]);
    expect(criticalPathLesson.steps.at(-1)!.explanation.zh).toContain('11');
    expect(criticalPathLesson.steps.at(-1)!.explanation.zh).toContain('A→B→E→F');
    expect(criticalPathLesson.steps.at(-1)!.explanation.zh).toContain('A→C→D→E→F');
  });

  it('keeps bilingual lists balanced and gives every step a memory tip', () => {
    for (const course of COURSES) {
      expect(course.prerequisites.zh.length).toBe(course.prerequisites.en.length);
      expect(course.commonMistakes.zh.length).toBe(course.commonMistakes.en.length);
      expect(course.commonMistakes.zh.length).toBeGreaterThanOrEqual(6);
      for (const step of course.steps) {
        expect(step.tip?.zh.length).toBeGreaterThan(0);
        expect(step.tip?.en.length).toBeGreaterThan(0);
      }
    }
  });
});
