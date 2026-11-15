import { describe, expect, it } from 'vitest';
import { runJsProgram } from './program';

describe('JavaScript runner (legacy Worker semantics)', () => {
  it('collects structured-clone snapshots for visual mode', () => {
    const result = runJsProgram({
      mode: 'visual',
      code: "const a=[...input]; trace({type:'array',values:a,focus:[0]},'start'); a[0]=99;",
      input: [1, 2, 3],
      tests: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== 'visual') return;
    expect(result.frames).toEqual([
      { state: { type: 'array', values: [1, 2, 3], focus: [0] }, message: 'start' },
    ]);
  });

  it('caps frames at 500 and truncates messages at 240 characters', () => {
    const capped = runJsProgram({
      mode: 'visual',
      code: "for(let i=0;i<501;i++) trace({type:'array',values:[i]},'x');",
      input: null,
      tests: null,
    });
    expect(capped.ok).toBe(false);
    if (!capped.ok) expect(capped.error).toContain('Too many trace steps');

    const long = runJsProgram({
      mode: 'visual',
      code: "trace({type:'array',values:[1]}, 'a'.repeat(300));",
      input: null,
      tests: null,
    });
    if (!long.ok || long.mode !== 'visual') throw new Error('expected frames');
    expect(long.frames[0].message).toHaveLength(240);
  });

  it('reports a missing solve() and runtime exceptions', () => {
    const missing = runJsProgram({ mode: 'test', code: 'const x = 1;', input: null, tests: [[1, 1]] });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error).toContain('Define function solve(input)');

    const broken = runJsProgram({ mode: 'visual', code: 'throw new Error("boom")', input: null, tests: null });
    expect(broken.ok).toBe(false);
    if (!broken.ok) expect(broken.error).toBe('boom');
  });

  it('compares practice results with JSON equality like the legacy worker', () => {
    const cases: Array<[unknown, unknown]> = [[{ nums: [2, 7, 11, 15], target: 9 }, [0, 1]], [[1, 2, 3], [3, 2, 1]]];
    const correct = runJsProgram({
      mode: 'test',
      code: `function solve(input){
        if (Array.isArray(input)) return [...input].reverse();
        const seen = new Map();
        for (let i=0;i<input.nums.length;i++){
          const need = input.target - input.nums[i];
          if (seen.has(need)) return [seen.get(need), i];
          seen.set(input.nums[i], i);
        }
        return [];
      }`,
      input: null,
      tests: cases,
    });
    expect(correct.ok).toBe(true);
    if (!correct.ok || correct.mode !== 'test') return;
    expect(correct.result.map((r) => r.pass)).toEqual([true, true]);

    const scaffold = runJsProgram({
      mode: 'test',
      code: 'function solve(input){ return []; }',
      input: null,
      tests: cases,
    });
    if (!scaffold.ok || scaffold.mode !== 'test') throw new Error('expected results');
    expect(scaffold.result.every((r) => !r.pass)).toBe(true);
  });
});
