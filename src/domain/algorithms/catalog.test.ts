import { describe, expect, it } from 'vitest';
import baseline from '../../test/fixtures/legacy-frames.json';
import { catalog, exampleFor, algorithmIds, groupLabel } from './examples';
import { CODE_LANGUAGES, CODE_LANGUAGE_LABELS } from './types';
import { runJsProgram } from '../../runtime/js/program';
import type { TraceFrame } from '../trace/types';

const expected = baseline as Record<string, TraceFrame[]>;

function visualFrames(code: string, input: unknown): TraceFrame[] {
  const result = runJsProgram({ mode: 'visual', code, input, tests: null });
  if (!result.ok || result.mode !== 'visual') throw new Error(result.ok ? 'wrong mode' : result.error);
  return result.frames;
}

describe('legacy algorithm catalogue (24 presets)', () => {
  it('ship exactly the 13 original algorithms, 2 recursion demos, 2 G1 shortest-path, 2 G2 MST, 2 G3 DAG, 2 G4 components and 1 T1 BST preset', () => {
    expect(algorithmIds()).toHaveLength(24);
    expect(Object.keys(expected)).toHaveLength(24);
  });

  it.each(Object.keys(catalog))('%s reproduces the pre-refactor frame stream byte-for-byte', (id) => {
    const entry = catalog[id];
    expect(visualFrames(entry.code, entry.input)).toEqual(expected[id]);
  });

  it.each(Object.keys(catalog))('%s emits structurally valid frames', (id) => {
    const frames = visualFrames(catalog[id].code, catalog[id].input);
    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) {
      expect(typeof frame.message).toBe('string');
      expect(frame.message.length).toBeLessThanOrEqual(240);
      expect(frame.state).toBeTruthy();
      expect(typeof frame.state.type).toBe('string');
    }
  });

  it.each(['bubble', 'insertion', 'selection', 'quick'])('%s ends with a sorted array', (id) => {
    const entry = catalog[id];
    const frames = visualFrames(entry.code, entry.input);
    const last = frames[frames.length - 1];
    expect(last.state.done).toBe(true);
    expect(last.state.values).toEqual([...entry.input as number[]].sort((a, b) => a - b));
  });

  it('handles empty, duplicate and single-element inputs', () => {
    for (const input of [[], [2, 2, 2], [1]]) {
      const frames = visualFrames(catalog.bubble.code, input);
      expect(frames.length).toBeGreaterThanOrEqual(2);
      expect(frames[0].state.values).toEqual(input);
      expect(frames[frames.length - 1].state.values).toEqual(input);
      expect(frames[frames.length - 1].state.done).toBe(true);
    }
    expect(visualFrames(catalog.bubble.code, [])).toHaveLength(2);
  });

  it('provides a non-empty preset for every algorithm × teaching language', () => {
    for (const id of algorithmIds()) {
      for (const language of CODE_LANGUAGES) {
        expect(exampleFor(id, language).length, `${id}/${language}`).toBeGreaterThan(0);
      }
    }
  });

  it('ships only the two teaching languages (Python + JavaScript)', () => {
    expect(CODE_LANGUAGES).toEqual(['js', 'python']);
    expect(CODE_LANGUAGE_LABELS).toEqual({ js: 'JavaScript', python: 'Python' });
    expect(exampleFor('bubble', 'python')).toContain('trace(');
  });

  it('ships real Python recursion presets for factorial and fib', () => {
    expect(exampleFor('factorial', 'python')).toContain('@tracked');
    expect(exampleFor('factorial', 'python')).toContain('def factorial');
    expect(exampleFor('fib', 'python')).toContain('@tracked');
    expect(exampleFor('fib', 'python')).toContain('def fib');
  });

  it('labels every sidebar group in both UI languages', () => {
    for (const group of ['sort', 'search', 'ds', 'graph', 'tree', 'recursion', 'custom']) {
      expect(groupLabel(group, 'zh')).toBeTruthy();
      expect(groupLabel(group, 'en')).toBeTruthy();
    }
  });
});
