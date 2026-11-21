import { describe, expect, it } from 'vitest';
import baseline from '../../test/fixtures/legacy-frames.json';
import { catalog, exampleFor, algorithmIds, groupLabel } from './examples';
import { CODE_LANGUAGES, CODE_LANGUAGE_LABELS } from './types';
import { runJsProgram } from '../../runtime/js/program';
import type { TraceFrame } from '../trace/types';

const expected = baseline as Record<string, TraceFrame[]>;
const nonLegacyIds = new Set([
  'bf',
  'kmp',
  'sparse-transpose',
  'static-linked-list',
  'polynomial-add',
  'infix-to-postfix',
  'postfix-eval',
  'gl-depth',
  'gl-copy',
]);
const legacyIds = Object.keys(catalog).filter((id) => !nonLegacyIds.has(id));

function visualFrames(code: string, input: unknown): TraceFrame[] {
  const result = runJsProgram({ mode: 'visual', code, input, tests: null });
  if (!result.ok || result.mode !== 'visual') throw new Error(result.ok ? 'wrong mode' : result.error);
  return result.frames;
}

describe('algorithm catalogue (35 legacy presets plus real-trace additions)', () => {
  it('keeps all legacy presets and adds the real-trace additions', () => {
    expect(algorithmIds()).toHaveLength(44);
    expect(legacyIds).toHaveLength(35);
    expect(Object.keys(expected)).toHaveLength(35);
    expect(catalog.kmp.time).toBe('O(n + m)');
    expect(catalog.kmp.space).toBe('O(m)');
    expect(catalog['sparse-transpose'].time).toBe('O(t + c)');
    expect(catalog['sparse-transpose'].space).toBe('O(c) 额外');
    expect(catalog['static-linked-list'].time).toContain('O(n)');
    expect(catalog['polynomial-add'].time).toBe('O(m+n)');
  });

  it.each(legacyIds)('%s reproduces the pre-refactor frame stream byte-for-byte', (id) => {
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

  it.each(['bubble', 'insertion', 'selection', 'shell', 'quick', 'merge'])('%s ends with a sorted array', (id) => {
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
