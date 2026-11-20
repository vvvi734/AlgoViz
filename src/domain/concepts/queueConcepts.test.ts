import { describe, expect, it } from 'vitest';
import { conceptById } from './catalog';

function formulas(id: string): string {
  const page = conceptById(id);
  if (!page) throw new Error(`missing concept ${id}`);
  return page.sections.map((section) => section.formula ?? '').join('\n');
}

describe('QUEUE-01 concept arithmetic and wording', () => {
  it('uses one reserved-slot convention for the circular queue', () => {
    const page = conceptById('circular-queue');
    if (!page) throw new Error('missing circular-queue');
    expect(page.diagram).toBe('circular-queue');

    const text = formulas('circular-queue');
    expect(text).toContain('front == rear');
    expect(text).toContain('(rear + 1) % capacity == front');
    expect(text).toContain('count = (rear - front + capacity) % capacity');
    expect(text).toContain('usable = capacity - 1 = 5');
    expect(text).toContain('② count = (5 - 0 + 6) % 6 = 5');
    expect(text).toContain('③ count = (5 - 1 + 6) % 6 = 4');
    expect(text).toContain('④ count = (0 - 2 + 6) % 6 = 4');
  });

  it('keeps the four state counts and wrap values consistent', () => {
    const count = (rear: number, front: number, capacity: number) =>
      (rear - front + capacity) % capacity;

    expect(count(0, 0, 6)).toBe(0);
    expect(count(5, 0, 6)).toBe(5);
    expect(count(5, 1, 6)).toBe(4);
    expect(count(0, 2, 6)).toBe(4);
    expect((5 + 1) % 6).toBe(0);
    expect((1 + 1) % 6).toBe(2);

    const page = conceptById('circular-queue');
    if (!page) throw new Error('missing circular-queue');
    const stateText = page.sections.flatMap((section) => section.points ?? []).join('\n');
    expect(stateText).toContain('front = rear = 0');
    expect(stateText).toContain('rear = 5，count = 5，队满');
    expect(stateText).toContain('front = 1，0 号格空出');
    expect(stateText).toContain('rear = (5 + 1) % 6 = 0');
    expect(stateText).toContain('再出队 B：front = 2');
  });

  it('documents all four physical stack/queue layouts', () => {
    const page = conceptById('stack-queue-storage');
    if (!page) throw new Error('missing stack-queue-storage');
    expect(page.diagram).toBe('stack-queue-storage');

    const terms = page.definitions.map((item) => item.term[0]).join('\n');
    expect(terms).toContain('顺序栈');
    expect(terms).toContain('链栈');
    expect(terms).toContain('顺序队列');
    expect(terms).toContain('链式队列');

    const text = page.sections.flatMap((section) => [
      section.body[0],
      ...(section.points ?? []).map((point) => point[0]),
    ]).join('\n');
    expect(text).toContain('top == -1');
    expect(text).toContain('top == MAXSIZE - 1');
    expect(text).toContain('rear = front');
    expect(text).toContain('front == rear == 头结点');

    const comparison = page.comparison;
    expect(comparison?.columns.map((column) => column[0])).toEqual([
      '比较项',
      '顺序栈',
      '链栈',
      '顺序队列',
      '链式队列',
    ]);
  });
});
