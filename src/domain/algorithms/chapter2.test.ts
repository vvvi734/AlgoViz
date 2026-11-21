import { describe, expect, it } from 'vitest';
import {
  buildPolynomialInput,
  buildStaticLinkedInput,
  randomPolynomialDraft,
  randomStaticLinkedDraft,
} from './chapter2Input';
import { STATIC_LINKED_DEFAULT_INPUT, POLYNOMIAL_ADD_DEFAULT_INPUT } from './chapter2Examples';
import { staticLinkedSnapshotSchema, polynomialSnapshotSchema } from '../trace/schema';
import { formatPolynomialTerm } from '../visualization/polynomialModel';
import { buildVisualModel } from '../visualization/model';
import { catalog } from './examples';
import { buildTextbookNavigation } from './textbook';

const labels = {
  invalid: 'invalid',
  emptyStructure: 'empty',
  emptyStack: 'empty stack',
  emptyQueue: 'empty queue',
  emptyLinked: 'empty list',
};

const staticSnapshot = {
  kind: 'static-linked-list' as const,
  operation: 'delete' as const,
  action: 'complete' as const,
  phase: 'complete' as const,
  capacity: 4,
  head: 0,
  freeHead: 1,
  slots: [
    { index: 0, data: 10, cursor: 3 },
    { index: 1, data: null, cursor: null },
    { index: 2, data: 30, cursor: null },
    { index: 3, data: 25, cursor: 2 },
  ],
  logical: [0, 3, 2],
  freeList: [1],
  focusIndex: 0,
  removedIndex: 1,
};

const polynomialSnapshot = {
  kind: 'polynomial' as const,
  operation: 'done' as const,
  action: 'complete' as const,
  phase: 'complete' as const,
  aHeadId: 'a1',
  bHeadId: 'b1',
  resultHeadId: 'r1',
  aNodes: [
    { id: 'a1', coefficient: 3, exponent: 4, nextId: 'a2' },
    { id: 'a2', coefficient: 2, exponent: 2, nextId: 'a3' },
    { id: 'a3', coefficient: -5, exponent: 0, nextId: null },
  ],
  bNodes: [
    { id: 'b1', coefficient: -3, exponent: 4, nextId: 'b2' },
    { id: 'b2', coefficient: 4, exponent: 3, nextId: 'b3' },
    { id: 'b3', coefficient: 7, exponent: 0, nextId: null },
  ],
  resultNodes: [
    { id: 'r1', coefficient: 4, exponent: 3, nextId: 'r2' },
    { id: 'r2', coefficient: 2, exponent: 2, nextId: 'r3' },
    { id: 'r3', coefficient: 2, exponent: 0, nextId: null },
  ],
  aCurrentId: null,
  bCurrentId: null,
  resultTailId: 'r3',
  focusSide: 'result' as const,
};

describe('TEXTBOOK-02 chapter 2 directory', () => {
  it('publishes all eight topics without planned placeholders and with a working entry', () => {
    const chapter = buildTextbookNavigation(catalog).find((item) => item.id === 'ch2-linear');
    expect(chapter).toBeTruthy();
    expect(chapter!.topics.map((topic) => topic.id)).toEqual([
      'linear-basics',
      'sequential-list',
      'sequential-capacity',
      'linked-list',
      'static-linked-group',
      'circular-linked-list',
      'doubly-linked-list',
      'polynomial-add',
    ]);
    for (const topic of chapter!.topics) {
      expect(topic.planned, topic.id).toBeUndefined();
      expect(Boolean(topic.conceptId) || topic.algorithms.length > 0 || Boolean(topic.children?.length), topic.id).toBe(true);
    }
    expect(chapter!.topics.find((topic) => topic.id === 'sequential-capacity')?.conceptId).toBe(
      'sequential-list-capacity',
    );
    const staticGroup = chapter!.topics.find((topic) => topic.id === 'static-linked-group');
    expect(staticGroup?.children?.map((child) => child.id)).toEqual([
      'static-linked-list',
      'static-linked-operations',
    ]);
    expect(staticGroup?.children?.find((child) => child.id === 'static-linked-list')?.conceptId).toBe(
      'static-linked-list',
    );
    expect(staticGroup?.children?.find((child) => child.id === 'static-linked-operations')?.algorithms.map(
      (algorithm) => algorithm.id,
    )).toEqual(['static-linked-list']);
    expect(chapter!.topics.find((topic) => topic.id === 'polynomial-add')?.algorithms.map(
      (algorithm) => algorithm.id,
    )).toEqual(['polynomial-add']);
  });
});

describe('TEXTBOOK-02 static linked-list input and model', () => {
  it('round-trips the official input into the exact Python object shape', () => {
    const built = buildStaticLinkedInput({
      capacity: '8',
      values: '10, 20, 30',
      operations: [
        { id: 's1', op: 'insert', position: '2', value: '25' },
        { id: 's2', op: 'delete', position: '3', value: '' },
        { id: 's3', op: 'traverse', position: '', value: '' },
      ],
    });
    expect(built.ok).toBe(true);
    if (built.ok) expect(built.input).toEqual(STATIC_LINKED_DEFAULT_INPUT);
  });

  it('reports a full array and invalid logical positions before execution', () => {
    const full = buildStaticLinkedInput({
      capacity: '4',
      values: '1, 2, 3, 4',
      operations: [{ id: 's1', op: 'insert', position: '2', value: '9' }],
    });
    expect(full.ok ? '' : full.error.key).toBe('chapter2StaticFull');

    const badPosition = buildStaticLinkedInput({
      capacity: '4',
      values: '1, 2, 3',
      operations: [{ id: 's1', op: 'delete', position: '4', value: '' }],
    });
    expect(badPosition.ok ? '' : badPosition.error.key).toBe('chapter2StaticDeleteRange');
  });

  it('builds every random static scenario without violating capacity or positions', () => {
    for (const scenario of ['standard', 'empty', 'full', 'delete-head', 'reuse-slot']) {
      for (let seed = 1; seed <= 5; seed += 1) {
        const fields = randomStaticLinkedDraft(scenario);
        const built = buildStaticLinkedInput(fields);
        expect(built.ok, scenario).toBe(true);
      }
    }
  });

  it('parses the recorded array snapshot and keeps physical order separate from logical order', () => {
    const parsed = staticLinkedSnapshotSchema.safeParse(staticSnapshot);
    expect(parsed.success, parsed.success ? '' : parsed.error.message).toBe(true);
    if (!parsed.success) return;
    const model = buildVisualModel({ type: 'array', values: [10, 25, 30] }, labels, parsed.data);
    expect(model.kind).toBe('static-linked-list');
    if (model.kind !== 'static-linked-list') return;
    expect(model.slots.map((slot) => slot.index)).toEqual([0, 1, 2, 3]);
    expect(model.logical.map((node) => node.index)).toEqual([0, 3, 2]);
    expect(model.logical.map((node) => node.value)).toEqual([10, 25, 30]);
    expect(model.freeList.map((node) => node.index)).toEqual([1]);
    expect(model.slots[1]!.role).toBe('free-head');
    // Array index 3 holds the second logical node, while index 1 is already free.
    expect(model.slots[3]!.role).toBe('live');
    expect(model.logical[1]!.index).toBe(3);
    expect(model.slots[model.logical[1]!.index]!.data).toBe(25);
  });
});

describe('TEXTBOOK-02 polynomial input and model', () => {
  it('round-trips the official terms into the exact Python object shape', () => {
    const built = buildPolynomialInput({
      a: [
        { id: 'a1', coefficient: '3', exponent: '4' },
        { id: 'a2', coefficient: '2', exponent: '2' },
        { id: 'a3', coefficient: '-5', exponent: '0' },
      ],
      b: [
        { id: 'b1', coefficient: '-3', exponent: '4' },
        { id: 'b2', coefficient: '4', exponent: '3' },
        { id: 'b3', coefficient: '7', exponent: '0' },
      ],
    });
    expect(built.ok).toBe(true);
    if (built.ok) expect(built.input).toEqual(POLYNOMIAL_ADD_DEFAULT_INPUT);
  });

  it('rejects duplicate, unordered and zero-coefficient terms instead of sorting them', () => {
    const duplicate = buildPolynomialInput({
      a: [
        { id: 'a1', coefficient: '3', exponent: '2' },
        { id: 'a2', coefficient: '2', exponent: '2' },
      ],
      b: [],
    });
    expect(duplicate.ok ? '' : duplicate.error.key).toBe('chapter2PolyDuplicate');

    const unordered = buildPolynomialInput({
      a: [
        { id: 'a1', coefficient: '3', exponent: '1' },
        { id: 'a2', coefficient: '2', exponent: '3' },
      ],
      b: [],
    });
    expect(unordered.ok ? '' : unordered.error.key).toBe('chapter2PolyOrder');

    const zero = buildPolynomialInput({
      a: [{ id: 'a1', coefficient: '0', exponent: '3' }],
      b: [],
    });
    expect(zero.ok ? '' : zero.error.key).toBe('chapter2PolyZero');
  });

  it('accepts empty polynomials and every random scenario', () => {
    const empty = buildPolynomialInput({ a: [], b: [] });
    expect(empty.ok).toBe(true);
    if (empty.ok) expect(empty.input).toEqual({ a: [], b: [] });

    for (const scenario of ['overlap', 'cancel', 'disjoint', 'a-empty', 'b-empty', 'both-empty']) {
      const fields = randomPolynomialDraft(scenario);
      const built = buildPolynomialInput(fields);
      expect(built.ok, scenario).toBe(true);
    }
  });

  it('derives three independent chains and the final expression from one snapshot', () => {
    const parsed = polynomialSnapshotSchema.safeParse(polynomialSnapshot);
    expect(parsed.success, parsed.success ? '' : parsed.error.message).toBe(true);
    if (!parsed.success) return;
    const model = buildVisualModel({ type: 'linked', values: [] }, labels, parsed.data);
    expect(model.kind).toBe('polynomial');
    if (model.kind !== 'polynomial') return;
    expect(model.a.terms.map((term) => term.id)).toEqual(['a1', 'a2', 'a3']);
    expect(model.b.terms.map((term) => term.id)).toEqual(['b1', 'b2', 'b3']);
    expect(model.result.terms.map((term) => term.id)).toEqual(['r1', 'r2', 'r3']);
    expect(model.result.expression).toBe('4x³ + 2x² + 2');
    expect(formatPolynomialTerm(-1, 1)).toBe('−x');
    expect(formatPolynomialTerm(1, 5)).toBe('x⁵');
  });
});
