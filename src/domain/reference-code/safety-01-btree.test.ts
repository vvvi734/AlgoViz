import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const source = join(process.cwd(), 'src/domain/reference-code/sources/btree/btree.c');
const harness = join(process.cwd(), 'src/domain/reference-code/safety-01-test/btree_harness.c');
const hasGcc = spawnSync('gcc', ['--version'], { encoding: 'utf8' }).status === 0;

type RunResult = { status: number | null; stdout: string; stderr: string };

function run(binary: string, args: string[]): RunResult {
  const result = spawnSync(binary, args, { encoding: 'utf8' });
  return {
    status: result.status,
    stdout: (result.stdout ?? '').replace(/\r\n/g, '\n'),
    stderr: result.stderr ?? '',
  };
}

describe.skipIf(!hasGcc)('SAFETY-01 B-tree split allocation failures', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), 'algoviz-safety-01-btree-'));
    harnessBinary = join(workDir, 'btree_harness.exe');
    demoBinary = join(workDir, 'btree_demo.exe');

    const compileHarness = spawnSync(
      'gcc',
      ['-std=c11', '-Wall', '-Wextra', '-Wpedantic', '-Werror', harness, '-o', harnessBinary],
      { encoding: 'utf8' },
    );
    expect(compileHarness.status, compileHarness.stderr).toBe(0);

    const compileDemo = spawnSync(
      'gcc',
      ['-std=c11', '-Wall', '-Wextra', '-Wpedantic', source, '-o', demoBinary],
      { encoding: 'utf8' },
    );
    expect(compileDemo.status, compileDemo.stderr).toBe(0);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('keeps all invariants on the normal path', () => {
    const result = run(harnessBinary, ['normal']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('NORMAL_OK=1');
    expect(result.stdout).toContain('OUTSTANDING=0');
  });

  it.each([
    ['empty-first', 1, 1],
    ['root-first', 1, 2],
    ['root-second', 2, 3],
    ['child-first', 1, 4],
    ['deep-third', 3, 8],
  ] as const)('%s fails cleanly at allocation %i', (mode, failOffset, callsAfter) => {
    const result = run(harnessBinary, [mode]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(`MODE=${mode}`);
    expect(result.stdout).toContain(`FAIL_OFFSET=${failOffset}`);
    expect(result.stdout).toContain('RESULT=0');
    expect(result.stdout).toContain(`CALLS_AFTER=${callsAfter}`);
    expect(result.stdout).toContain('VALID_AFTER=1');
    expect(result.stdout).toContain('EXISTING_KEYS=1');
    expect(result.stdout).toContain('TARGET_PRESENT=0');
    expect(result.stdout).toContain('INVARIANTS=1');
    expect(result.stdout).toContain('OUTSTANDING=0');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe(
      [
        '[10 20]',
        '  [5 6 7]',
        '  [12 17]',
        '  [30]',
        'contains 17: yes',
        'contains 18: no',
        'after delete 17:',
        '[10 20]',
        '  [5 6 7]',
        '  [12]',
        '  [30]',
        'delete missing 99 keeps contains 17 = no',
        '',
      ].join('\n'),
    );
  });
});
