import { describe, expect, it } from 'vitest';
import fixture from '../../test/fixtures/generalized-list-python-frames.json';
import {
  GL_MAX_DEPTH,
  formatGeneralizedList,
  generalizedListDepth,
  generalizedListEquivalent,
  parseGeneralizedList,
} from '../generalizedList';
import {
  buildGeneralizedListInput,
  randomGeneralizedListDraft,
  GENERALIZED_LIST_RANDOM_SCENARIOS,
} from '../algorithms/generalizedListInput';
import { glDepthLesson, glCopyLesson } from '../lessons/generalizedListLessons';
import { buildGeneralizedListModel } from '../visualization/glModel';
import {
  generalizedListSnapshotSchema,
  type GeneralizedListSnapshot,
} from './generalizedListSchema';
import { framesToTraceDocument } from './adapter';
import { parseTraceDocument } from './schema';
import type { RawTraceFrame } from './types';

const scenarios = fixture as unknown as Record<string, RawTraceFrame[]>;

function lastSnapshot(name: string): GeneralizedListSnapshot {
  const frames = scenarios[name]!;
  const raw = frames.at(-1)!.structure;
  return generalizedListSnapshotSchema.parse(raw);
}

function walkSnapshot(
  node: GeneralizedListSnapshot['original'],
): Array<GeneralizedListSnapshot['original']> {
  return [node, ...node.children.flatMap(walkSnapshot)];
}

describe('generalized-list parser, input and real Python frames', () => {
  it('uses the textbook depth convention and canonical formatting', () => {
    const cases: Array<[string, number]> = [
      ['()', 1],
      ['(())', 2],
      ['(a, b, c)', 1],
      ['(a, (b, c), d)', 2],
      ['(a, (b, c), ((d), e))', 3],
      ['(((), a), (b, (c, d)))', 3],
    ];
    for (const [expression, depth] of cases) {
      const parsed = parseGeneralizedList(expression);
      expect(parsed.ok, expression).toBe(true);
      if (!parsed.ok) continue;
      expect(generalizedListDepth(parsed.root), expression).toBe(depth);
      expect(parsed.expression, expression).toBe(expression.replace(/\s+/g, ''));
    }
  });

  it('rejects empty input, a root atom, malformed commas, long atoms and depth', () => {
    for (const expression of ['', 'a', '(a,,b)', '(a,b', '(a,)', '(a b)', '(a,(b,c)))']) {
      expect(parseGeneralizedList(expression).ok, expression).toBe(false);
    }
    expect(parseGeneralizedList(`(${'x'.repeat(9)})`).ok).toBe(false);
    const tooDeep = '('.repeat(GL_MAX_DEPTH + 2) + ')'.repeat(GL_MAX_DEPTH + 2);
    expect(parseGeneralizedList(tooDeep).ok).toBe(false);
  });

  it('builds official and custom inputs through the same parser', () => {
    expect(buildGeneralizedListInput({ expression: '(a, (b, c), ((d), e))' })).toEqual({
      ok: true,
      input: { expression: '(a,(b,c),((d),e))' },
    });
    const invalid = buildGeneralizedListInput({ expression: '(a,,b)' });
    expect(invalid.ok).toBe(false);
    if (invalid.ok) return;
    expect(invalid.error.key).toBe('guidedErrorGLSyntax');
  });

  it('keeps every random scenario parseable and inside limits', () => {
    for (const scenario of GENERALIZED_LIST_RANDOM_SCENARIOS) {
      for (let seed = 1; seed <= 5; seed += 1) {
        const draft = randomGeneralizedListDraft(scenario.id, () => seed / 6);
        const built = buildGeneralizedListInput(draft);
        expect(built.ok, `${scenario.id}/${seed}`).toBe(true);
        if (!built.ok) continue;
        const parsed = parseGeneralizedList(built.input.expression);
        expect(parsed.ok).toBe(true);
      }
    }
  });

  it('parses every real Python frame through the union and event schema', () => {
    for (const [name, frames] of Object.entries(scenarios)) {
      const lesson = name.startsWith('depth') ? glDepthLesson : glCopyLesson;
      const lessonSteps = lesson.steps.map((step) => step.stepId);
      for (const frame of frames) {
        const structure = generalizedListSnapshotSchema.safeParse(frame.structure);
        expect(structure.success, `${name}/${frame.lessonStepId}`).toBe(true);
        if (!structure.success) continue;
        expect(lessonSteps).toContain(frame.lessonStepId);
        const document = framesToTraceDocument([frame], 'fixture');
        const parsed = parseTraceDocument(document);
        expect(parsed.ok, `${name}/${frame.lessonStepId}`).toBe(true);
        if (!parsed.ok) continue;
        expect(parsed.document.events[0]!.structure?.kind).toBe('generalized-list');
      }
    }
  });

  it('computes depth 3 for the default and distinguishes () from (())', () => {
    expect(lastSnapshot('depth-default').resultDepth).toBe(3);
    expect(lastSnapshot('depth-empty').resultDepth).toBe(1);
    expect(lastSnapshot('depth-nested-empty').resultDepth).toBe(2);
    expect(lastSnapshot('depth-atom-list').resultDepth).toBe(1);

    const atomFrame = scenarios['depth-default']!.find(
      (frame) => frame.lessonStepId === 'atom-return',
    )!;
    const atom = generalizedListSnapshotSchema.parse(atomFrame.structure);
    expect(atom.currentDepth).toBe(0);
    expect(atom.depths.find((entry) => entry.id === atom.activeId)?.depth).toBe(0);

    const emptyFrame = scenarios['depth-nested-empty']!.find(
      (frame) => frame.lessonStepId === 'empty-return',
    )!;
    const empty = generalizedListSnapshotSchema.parse(emptyFrame.structure);
    expect(empty.currentDepth).toBe(1);
  });

  it('copies every node into new c-prefixed nodes with no source links', () => {
    for (const name of ['copy-default', 'copy-empty', 'copy-nested-empty']) {
      const snapshot = lastSnapshot(name);
      expect(snapshot.copy).not.toBeNull();
      expect(snapshot.copiedCount).toBe(snapshot.totalNodes);
      const sourceNodes = walkSnapshot(snapshot.original);
      const copyNodes = walkSnapshot(snapshot.copy!);
      expect(copyNodes).toHaveLength(sourceNodes.length);
      expect(copyNodes.every((node) => node.sourceId !== null)).toBe(true);
      expect(copyNodes.every((node) => node.id.startsWith('c'))).toBe(true);
      expect(generalizedListEquivalent(snapshot.copy!, snapshot.original)).toBe(true);
      expect(snapshot.resultExpression).toBe(formatGeneralizedList(snapshot.original));
      for (const copyNode of copyNodes) {
        for (const child of copyNode.children) {
          expect(child.id.startsWith('c'), `${name}/${copyNode.id}->${child.id}`).toBe(true);
        }
      }
    }
    expect(lastSnapshot('copy-nested-empty').copy?.children[0]!.id).toMatch(/^c/);
  });

  it('marks inspect as focusing the destination copy list, not a new child', () => {
    const inspectFrame = scenarios['copy-default']!.find(
      (frame) => frame.lessonStepId === 'inspect',
    )!;
    const snapshot = generalizedListSnapshotSchema.parse(inspectFrame.structure);
    expect(snapshot.copyId).toBe(snapshot.parentCopyId);

    const tampered = { ...snapshot, parentCopyId: 'c999' };
    expect(generalizedListSnapshotSchema.safeParse(tampered).success).toBe(false);
  });

  it('builds a layout with the original tree, copy tree and depth ledger', () => {
    const depth = buildGeneralizedListModel(lastSnapshot('depth-default'));
    expect(depth.mode).toBe('depth');
    expect(depth.original.nodes).toHaveLength(9);
    expect(depth.copy).toBeNull();
    expect(depth.depthRows).toHaveLength(9);
    expect(depth.depthRows[0]?.id).toBe('n0');
    expect(depth.depthRows[0]?.depth).toBe(3);

    const copy = buildGeneralizedListModel(lastSnapshot('copy-default'));
    expect(copy.mode).toBe('copy');
    expect(copy.original.nodes).toHaveLength(9);
    expect(copy.copy?.nodes).toHaveLength(9);
    expect(copy.copy?.nodes.every((node) => node.tone === 'copied')).toBe(true);
  });
});
