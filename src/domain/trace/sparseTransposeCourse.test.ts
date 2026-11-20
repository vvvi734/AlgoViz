import { describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/sparse-transpose-default-frames.json';
import { lessonRegistry } from '../../domain/lessons/registry';
import { COURSE_GUIDES } from '../../domain/guides/courseGuides';
import { loadReferenceCode, referenceFileMeta, referenceImplementations } from '../../domain/reference-code/registry';

describe('MATRIX-01 lesson, guide and reference code', () => {
  it('uses one lesson step for every real trace stage, in order', () => {
    const lesson = lessonRegistry.byAlgorithm('sparse-transpose')!;
    expect(lesson).toBeTruthy();
    expect(lesson.lessonId).toBe('sparse-transpose-fast');
    const traceSteps = Array.from(
      new Set((defaultFrames as Array<{ lessonStepId: string }>).map((frame) => frame.lessonStepId)),
    );
    expect(traceSteps).toEqual([
      'init',
      'count-start',
      'count-scan',
      'count-complete',
      'cpot-start',
      'cpot-compute',
      'cpot-complete',
      'place-start',
      'place-read',
      'place-write',
      'place-update',
      'done',
    ]);
    expect(lesson.steps.map((step) => step.stepId)).toEqual(traceSteps);
    expect(lesson.complexity.time).toBe('O(t + c)');
    expect(lesson.complexity.space).toBe('O(c)');
    expect(lesson.complexity.note.zh).toContain('结果');
  });

  it('keeps the guide abstract and tied to loops plus cpot data dependencies', () => {
    const guide = COURSE_GUIDES['sparse-transpose'];
    expect(guide).toBeTruthy();
    expect(guide.flowKind).toBe('algorithm');
    expect(guide.stages).toHaveLength(7);
    expect(guide.stages.map((stage) => stage.title.en)).toEqual([
      'Read the input and clear num',
      'First loop: count each column',
      'Recurrence for cpot: block starts',
      'Second loop: read a source triplet',
      'Write: swap coordinates, keep the value',
      'Update cpot: advance that column',
      'Done: the result is row-major',
    ]);
    expect(guide.conditions.zh.join(' ')).toContain('0 基');
    expect(guide.conditions.zh.join(' ')).toContain('O(t+c)');
    expect(guide.definition.zh).toContain('cpot[c]=cpot[c−1]+num[c−1]');
  });

  it('ships copyable C, C++ and Python principle sources plus two sort shortcuts', async () => {
    expect(referenceImplementations('sparse-transpose', 'c')).toEqual(['principle']);
    expect(referenceImplementations('sparse-transpose', 'cpp')).toEqual(['principle', 'convenience']);
    expect(referenceImplementations('sparse-transpose', 'python')).toEqual(['principle', 'convenience']);
    expect(referenceFileMeta('sparse-transpose', 'c')?.fileName).toBe('sparse_transpose.c');
    expect(referenceFileMeta('sparse-transpose', 'cpp')?.fileName).toBe('sparse_transpose.cpp');
    expect(referenceFileMeta('sparse-transpose', 'python')?.fileName).toBe('sparse_transpose.py');
    expect(referenceFileMeta('sparse-transpose', 'cpp', 'convenience')?.fileName).toBe(
      'sparse_transpose_sort.cpp',
    );
    expect(referenceFileMeta('sparse-transpose', 'python', 'convenience')?.fileName).toBe(
      'sparse_transpose_sort.py',
    );

    const [c, cpp, py, cppSort, pySort] = await Promise.all([
      loadReferenceCode('sparse-transpose', 'c'),
      loadReferenceCode('sparse-transpose', 'cpp'),
      loadReferenceCode('sparse-transpose', 'python'),
      loadReferenceCode('sparse-transpose', 'cpp', 'convenience'),
      loadReferenceCode('sparse-transpose', 'python', 'convenience'),
    ]);
    expect(c).toContain('fast_transpose');
    expect(c).toContain('cpot[src->data[k].col]');
    expect(cpp).toContain('SparseMatrix fast_transpose');
    expect(cpp).toContain('++cpot[');
    expect(py).toContain('def fast_transpose');
    expect(py).toContain('cpot[item.col] = q + 1');
    expect(cppSort).toContain('std::sort');
    expect(pySort).toContain('sorted(');
  });
});
