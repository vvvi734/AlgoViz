import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const source = join(
  process.cwd(),
  'src/domain/reference-code/sources/doubly/doubly_linked_list.cpp',
);
const harness = join(
  process.cwd(),
  'src/domain/reference-code/safety-01-test/doubly_harness.cpp',
);
const hasGxx = spawnSync('g++', ['--version'], { encoding: 'utf8' }).status === 0;

function run(binary: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(binary, [], { encoding: 'utf8' });
  return {
    status: result.status,
    stdout: (result.stdout ?? '').replace(/\r\n/g, '\n'),
    stderr: result.stderr ?? '',
  };
}

describe.skipIf(!hasGxx)('SAFETY-01 doubly linked list remove', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), 'algoviz-safety-01-doubly-'));
    harnessBinary = join(workDir, 'doubly_harness.exe');
    demoBinary = join(workDir, 'doubly_demo.exe');

    const compileHarness = spawnSync(
      'g++',
      ['-std=c++17', '-Wall', '-Wextra', '-Wpedantic', '-Werror', harness, '-o', harnessBinary],
      { encoding: 'utf8' },
    );
    expect(compileHarness.status, compileHarness.stderr).toBe(0);

    const compileDemo = spawnSync(
      'g++',
      ['-std=c++17', '-Wall', '-Wextra', '-Wpedantic', source, '-o', demoBinary],
      { encoding: 'utf8' },
    );
    expect(compileDemo.status, compileDemo.stderr).toBe(0);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('removes empty, single, head, tail, middle and repeated nodes without touching freed memory', () => {
    const result = run(harnessBinary);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('FAILURES=0');
    expect(result.stdout).toContain('OUTSTANDING=0');
    expect(result.stdout).toContain('ALL_OK=1');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe(
      [
        'forward: 1 2 3',
        'backward: 3 2 1',
        'after remove 2: 1 3',
        'head: 1',
        '',
      ].join('\n'),
    );
  });
});
