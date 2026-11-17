import { describe, expect, it } from 'vitest';
import { bfsLesson, dfsLesson } from './graphLessons';
import { lessonRegistry } from './registry';
import { validateLesson } from './schema';

const BFS_STEPS = ['init', 'start', 'dequeue', 'visit', 'inspect', 'discover', 'enqueue', 'skip', 'done'];
const DFS_STEPS = ['init', 'start', 'pop', 'visit', 'inspect', 'discover', 'push', 'skip', 'done'];

describe('Stage 7E bilingual graph courses', () => {
  it('ships one complete course per graph algorithm', () => {
    expect(lessonRegistry.byAlgorithm('bfs')).toBe(bfsLesson);
    expect(lessonRegistry.byAlgorithm('dfs')).toBe(dfsLesson);
    expect(lessonRegistry.byId('graph-bfs-queue-basics')).toBe(bfsLesson);
    expect(lessonRegistry.byId('graph-dfs-stack-basics')).toBe(dfsLesson);
  });

  it('validates both courses against the lesson schema', () => {
    expect(validateLesson(bfsLesson).errors).toEqual([]);
    expect(validateLesson(dfsLesson).errors).toEqual([]);
  });

  it('uses exactly the lesson_step ids emitted by real BFS Python', () => {
    expect(bfsLesson.steps.map((step) => step.stepId)).toEqual(BFS_STEPS);
    expect(new Set(bfsLesson.steps.map((step) => step.stepId)).size).toBe(BFS_STEPS.length);
  });

  it('uses exactly the lesson_step ids emitted by real DFS Python', () => {
    expect(dfsLesson.steps.map((step) => step.stepId)).toEqual(DFS_STEPS);
    expect(new Set(dfsLesson.steps.map((step) => step.stepId)).size).toBe(DFS_STEPS.length);
  });

  it('covers graph basics, both frontier kinds, complexity and mistakes bilingually', () => {
    const joined = (lesson: typeof bfsLesson) => [
      lesson.overview.zh,
      lesson.overview.en,
      lesson.intuition.zh,
      lesson.intuition.en,
      ...lesson.steps.flatMap((step) => [step.title.zh, step.title.en, step.explanation.zh, step.explanation.en]),
      ...lesson.commonMistakes.zh,
      ...lesson.commonMistakes.en,
      ...lesson.prerequisites.zh,
      ...lesson.prerequisites.en,
    ].join('\n');
    for (const lesson of [bfsLesson, dfsLesson]) {
      const text = joined(lesson);
      expect(text).toMatch(/无向|undirected/);
      expect(text).toMatch(/邻接表|adjacency/);
      expect(text).toMatch(/环|cycle/);
      expect(text).toMatch(/非连通|disconnected/);
      expect(text).toMatch(/O\(V\+E\)/);
      expect(text).toMatch(/队列|queue/);
      expect(text).toMatch(/栈|stack/);
      expect(text).toMatch(/discovered/);
      expect(text).toMatch(/visited/);
    }
  });

  it('keeps the real sequences and does not claim inorder-like uniqueness', () => {
    expect(bfsLesson.steps.at(-1)?.explanation.zh).toContain('A → B → C → D → E → F → G');
    expect(dfsLesson.steps.at(-1)?.explanation.zh).toContain('A → B → D → E → F → G → C');
    expect(bfsLesson.steps.at(-1)?.explanation.en).toContain('A → B → C → D → E → F → G');
    expect(dfsLesson.steps.at(-1)?.explanation.en).toContain('A → B → D → E → F → G → C');
    for (const lesson of [bfsLesson, dfsLesson]) {
      const allText = [
        lesson.overview.zh,
        lesson.overview.en,
        ...lesson.steps.flatMap((step) => [step.explanation.zh, step.explanation.en]),
      ].join('\n');
      expect(/唯一|unique|one unique/i.test(allText)).toBe(true);
    }
  });

  it('has balanced bilingual prerequisites and common mistakes', () => {
    for (const lesson of [bfsLesson, dfsLesson]) {
      expect(lesson.prerequisites.zh.length).toBe(lesson.prerequisites.en.length);
      expect(lesson.commonMistakes.zh.length).toBe(lesson.commonMistakes.en.length);
      expect(lesson.prerequisites.zh.length).toBeGreaterThan(0);
      expect(lesson.commonMistakes.zh.length).toBeGreaterThanOrEqual(5);
    }
  });
});
