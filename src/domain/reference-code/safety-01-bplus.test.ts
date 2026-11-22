import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const source = join(
  process.cwd(),
  'src/domain/reference-code/sources/bplus-tree/bplus_tree.c',
);
const harness = join(
  process.cwd(),
  'src/domain/reference-code/safety-01-test/bplus_harness.c',
);
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

describe.skipIf(!hasGcc)('SAFETY-01 B+ tree split failure states', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), 'algoviz-safety-01-bplus-'));
    harnessBinary = join(workDir, 'bplus_harness.exe');
    demoBinary = join(workDir, 'bplus_demo.exe');

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

  it('keeps keys, leaf chain and parent separators on the normal path', () => {
    const result = run(harnessBinary, ['normal']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('BUILD_OK=1');
    expect(result.stdout).toContain('VALID=1');
    expect(result.stdout).toContain('ALL_KEYS=1');
    expect(result.stdout).toContain('LEAF_CHAIN=1');
    expect(result.stdout).toContain('SEPARATORS=1');
    expect(result.stdout).toContain('LEAF_SUM=2485');
    expect(result.stdout).toContain('EXPECTED_SUM=2485');
    expect(result.stdout).toContain('ALL_OK=1');
  });

  it('does not write nodes[-1] when the empty-root allocation fails', () => {
    const result = run(harnessBinary, ['empty-first']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('RESULT=-1');
    expect(result.stdout).toContain('ROOT=-1');
    expect(result.stdout).toContain('NODE_COUNT=72');
    expect(result.stdout).toContain('ALL_OK=1');
  });

  it.each([
    ['leaf-first', 72],
    ['leaf-second', 71],
    ['internal-second', 71],
  ] as const)('%s reports failure and leaves the tree unchanged', (mode, cap) => {
    const result = run(harnessBinary, [mode]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(`MODE=${mode}`);
    expect(result.stdout).toContain('RESULT=-1');
    expect(result.stdout).toContain(`CAP=${cap}`);
    expect(result.stdout).toContain(`NODE_COUNT=${cap}`);
    expect(result.stdout).toContain('VALID_AFTER=1');
    expect(result.stdout).toContain('EXISTING_KEYS=1');
    expect(result.stdout).toContain('TARGET_PRESENT=0');
    expect(result.stdout).toContain('LEAF_CHAIN=1');
    expect(result.stdout).toContain('SEPARATORS=1');
    expect(result.stdout).toContain('UNCHANGED=1');
    expect(result.stdout).toContain('ALL_OK=1');
  });

  it('fails a full internal child split before mutating its parent or leaf chain', () => {
    const result = run(harnessBinary, ['internal-child-second']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('RESULT=-1');
    expect(result.stdout).toContain('NODE_COUNT=70');
    expect(result.stdout).toContain('VALID_AFTER=1');
    expect(result.stdout).toContain('EXISTING_KEYS=1');
    expect(result.stdout).toContain('TARGET_PRESENT=0');
    expect(result.stdout).toContain('LEAF_CHAIN=1');
    expect(result.stdout).toContain('SEPARATORS=1');
    expect(result.stdout).toContain('UNCHANGED=1');
    expect(result.stdout).toContain('ALL_OK=1');
  });

  it('still inserts when a full root does not need to split', () => {
    const result = run(harnessBinary, ['root-full-no-split']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('RESULT=1');
    expect(result.stdout).toContain('NODE_COUNT=72');
    expect(result.stdout).toContain('VALID_AFTER=1');
    expect(result.stdout).toContain('ALL_KEYS=1');
    expect(result.stdout).toContain('LEAF_CHAIN=1');
    expect(result.stdout).toContain('SEPARATORS=1');
    expect(result.stdout).toContain('UNCHANGED_SHAPE=1');
    expect(result.stdout).toContain('ALL_OK=1');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe(
      [
        'leaves: [8 9] [10 15 20]',
        'find 15: found',
        'find 12: missing',
        'insert 12: inserted',
        'insert 12 again: duplicate',
        'range [10, 18]: 10 12 15',
        'find 12 after insertion: found',
        '',
      ].join('\n'),
    );
  });
});
