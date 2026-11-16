import { describe, expect, it } from 'vitest';
import { defaultInputFor, exampleFor } from './examples';
import { LINKED_DEFAULT_INPUT, LINKED_PYTHON } from './linkedListExamples';
import { lessonRegistry } from '../lessons/registry';

describe('Stage 7C linked-list Python preset', () => {
  it('ships a real Node class with a real next reference', () => {
    expect(LINKED_PYTHON).toContain('class Node:');
    expect(LINKED_PYTHON).toContain('self.next = None');
    expect(LINKED_PYTHON).toContain('node.next = current.next');
    expect(LINKED_PYTHON).toContain('current.next = node');
    expect(LINKED_PYTHON).toContain('current.next = None');
    expect(LINKED_PYTHON).toContain('structure=payload');
    expect(LINKED_PYTHON).not.toContain('json.dumps(node)');
  });

  it('keeps the legacy JS demo unchanged and uses Python for the linked preset', () => {
    expect(exampleFor('linked', 'python')).toContain('class Node:');
    expect(exampleFor('linked', 'js')).toContain("trace({type:'linked'");
    expect(defaultInputFor('linked')).toEqual(LINKED_DEFAULT_INPUT);
  });

  it('default operations cover head build, middle insert, delete and traverse', () => {
    expect(LINKED_DEFAULT_INPUT).toEqual([
      ['insert_head', 5],
      ['insert_head', 8],
      ['insert_head', 3],
      ['insert_after', 3, 6],
      ['delete', 8],
      ['traverse'],
    ]);
  });

  it('line numbers point at real emit calls in the Python source', () => {
    const lines = LINKED_PYTHON.split('\n');
    const expected: Array<[number, string]> = [
      [77, 'emit("create"'],
      [81, 'emit("set-next"'],
      [98, 'emit("set-next"'],
      [101, 'emit("set-next"'],
      [121, 'emit("set-next"'],
      [124, 'emit("detach"'],
      [146, 'emit("visit"'],
      [150, 'emit("init"'],
      [165, 'emit("done"'],
    ];
    for (const [line, marker] of expected) {
      expect(lines[line - 1], `line ${line}`).toContain(marker);
    }
  });

  it('registers a bilingual lesson whose step ids match the Python lesson_step values', () => {
    const lesson = lessonRegistry.byAlgorithm('linked');
    expect(lesson?.lessonId).toBe('linked-list-pointer-basics');
    const stepIds = lesson?.steps.map((step) => step.stepId);
    expect(stepIds).toEqual(['init', 'create', 'find', 'connect', 'insert', 'unlink', 'traverse', 'done']);
    for (const stepId of stepIds ?? []) {
      expect(LINKED_PYTHON).toContain(`"${stepId}"`);
    }
    expect(lesson?.title.zh.length).toBeGreaterThan(0);
    expect(lesson?.title.en.length).toBeGreaterThan(0);
  });
});
