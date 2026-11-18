import { describe, expect, it } from 'vitest';
import { connectedComponentsLesson } from './connectedComponentsLesson';
import { stronglyConnectedComponentsLesson } from './stronglyConnectedComponentsLesson';
import { lessonRegistry } from './registry';
import { validateLesson } from './schema';
import componentFixture from '../../test/fixtures/components-default-frames.json';

const COURSES = [connectedComponentsLesson, stronglyConnectedComponentsLesson];
const FRAMES = {
  components: componentFixture.components as Array<{ lessonStepId?: string; structure?: Record<string, unknown> }>,
  scc: componentFixture.scc as Array<{ lessonStepId?: string; structure?: Record<string, unknown> }>,
};

function frameSteps(frames: Array<{ lessonStepId?: string }>): string[] {
  return frames.map((frame) => frame.lessonStepId).filter((id): id is string => Boolean(id));
}

function lessonText(course: typeof connectedComponentsLesson): string {
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

describe('G4 connected components and Kosaraju courses', () => {
  it('registers both courses and validates them', () => {
    expect(lessonRegistry.byAlgorithm('components')).toBe(connectedComponentsLesson);
    expect(lessonRegistry.byAlgorithm('scc')).toBe(stronglyConnectedComponentsLesson);
    expect(validateLesson(connectedComponentsLesson).errors).toEqual([]);
    expect(validateLesson(stronglyConnectedComponentsLesson).errors).toEqual([]);
  });

  it('uses exactly the real Python lesson_step ids', () => {
    expect(connectedComponentsLesson.steps.map((step) => step.stepId)).toEqual([
      'init', 'start', 'pop', 'visit', 'inspect', 'discover', 'push', 'skip', 'complete', 'done',
    ]);
    expect(stronglyConnectedComponentsLesson.steps.map((step) => step.stepId)).toEqual([
      'init', 'start-first', 'inspect', 'push', 'skip', 'finish', 'reverse', 'start-second', 'assign', 'complete', 'done',
    ]);
    const realComponents = new Set(frameSteps(FRAMES.components));
    const realScc = new Set(frameSteps(FRAMES.scc));
    expect([...realComponents].sort()).toEqual(connectedComponentsLesson.steps.map((step) => step.stepId).sort());
    expect([...realScc].sort()).toEqual(stronglyConnectedComponentsLesson.steps.map((step) => step.stepId).sort());
  });

  it('teaches undirected components, isolated nodes, deterministic DFS and complexity', () => {
    const text = lessonText(connectedComponentsLesson);
    expect(text).toMatch(/无向|undirected/);
    expect(text).toMatch(/连通分量|connected component/);
    expect(text).toMatch(/孤立|isolated/);
    expect(text).toMatch(/DFS|深度优先/);
    expect(text).toMatch(/O\(V\+E\)/);
    expect(text).toMatch(/多个|multiple|非连通|disconnected/);
    expect(connectedComponentsLesson.steps[0].explanation.zh).toContain('4 个分量');
  });

  it('teaches direction, transpose, finish order and why two passes are needed', () => {
    const text = lessonText(stronglyConnectedComponentsLesson);
    expect(text).toMatch(/有向|directed/);
    expect(text).toMatch(/强连通|strongly connected/);
    expect(text).toMatch(/转置|transpose|反转|reverse/);
    expect(text).toMatch(/完成顺序|finish order/);
    expect(text).toMatch(/两遍|two pass|两次/);
    expect(text).toMatch(/单向链|one-way chain/);
    expect(text).toMatch(/有向环|directed cycle/);
    expect(text).toMatch(/O\(V\+E\)/);
  });

  it('quotes the real default partitions from the Python trace', () => {
    const ccDone = FRAMES.components.at(-1)!.structure as { components?: Array<{ nodeIds: string[] }> };
    expect(new Set(ccDone.components?.map((group) => [...group.nodeIds].sort().join(',')))).toEqual(
      new Set(['A,B,C', 'D,E', 'F,G', 'H']),
    );
    expect(connectedComponentsLesson.steps.at(-1)!.explanation.zh).toContain('C1={A,B,C}');

    const sccDone = FRAMES.scc.at(-1)!.structure as { components?: Array<{ nodeIds: string[] }> };
    expect(new Set(sccDone.components?.map((group) => [...group.nodeIds].sort().join(',')))).toEqual(
      new Set(['H', 'F', 'G', 'A,B,C', 'D,E']),
    );
    expect(stronglyConnectedComponentsLesson.steps.at(-1)!.explanation.zh).toContain('C1={H}');
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
