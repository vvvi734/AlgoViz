import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const harnessDir = join(repoRoot, 'src/domain/reference-code/risk-06-test');
const binarySuffix = process.platform === 'win32' ? '.exe' : '';
const hasGcc = spawnSync('gcc', ['--version'], { encoding: 'utf8' }).status === 0;
const hasGxx = spawnSync('g++', ['--version'], { encoding: 'utf8' }).status === 0;
const pythonCommand = ['python', 'python3'].find(
  (command) => spawnSync(command, ['--version'], { encoding: 'utf8' }).status === 0,
);
const hasPython = pythonCommand !== undefined;

type RunResult = { status: number | null; stdout: string; stderr: string };

function normalize(stdout: string): string {
  return stdout.replace(/\r\n/g, '\n');
}

function run(command: string, args: string[]): RunResult {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return {
    status: result.status,
    stdout: normalize(result.stdout ?? ''),
    stderr: result.stderr ?? '',
  };
}

function compile(compiler: string, args: string[]): void {
  const result = spawnSync(compiler, args, { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
}

function workspace(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

const cHarnesses = [
  'tournament_large',
  'multiway_large',
  'isam_capacity',
  'inverted_capacity',
  'quick_large',
  'merge_oom',
  'optimal_shape',
] as const;

const cppHarnesses = ['isam_stable', 'indexed_capacity'] as const;

describe.skipIf(!hasGcc)('RISK-06 C capacity and failure paths', () => {
  let workDir = '';
  const binaries = new Map<string, string>();

  beforeAll(() => {
    workDir = workspace('algoviz-risk-06-c-');
    for (const name of cHarnesses) {
      const binary = join(workDir, `${name}${binarySuffix}`);
      compile('gcc', [
        '-std=c11', '-Wall', '-Wextra', '-Werror',
        join(harnessDir, `${name}.c`), '-o', binary,
      ]);
      binaries.set(name, binary);
    }
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  const expected = new Map<string, string>([
    ['tournament_large', 'PASS: 64 records sorted'],
    ['multiway_large', 'PASS: 7 runs, 42 records'],
    ['isam_capacity', 'PASS: accepted=10 overflowNodes=5'],
    ['inverted_capacity', 'PASS: term and keyword overflow rejected'],
    ['quick_large', 'PASS: 200000 ordered records sorted twice'],
    ['merge_oom', 'PASS: allocation failure returned 0'],
    ['optimal_shape', 'PASS: cost=21 virtual=0'],
  ]);

  for (const name of cHarnesses) {
    it(`${name} reports the boundary outcome`, () => {
      const result = run(binaries.get(name)!, []);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain(expected.get(name)!);
    });
  }
});

describe.skipIf(!hasGxx)('RISK-06 C++ stability and layout', () => {
  let workDir = '';
  const binaries = new Map<string, string>();

  beforeAll(() => {
    workDir = workspace('algoviz-risk-06-cpp-');
    for (const name of cppHarnesses) {
      const binary = join(workDir, `${name}${binarySuffix}`);
      compile('g++', [
        '-std=c++17', '-Wall', '-Wextra', '-Werror',
        join(harnessDir, `${name}.cpp`), '-o', binary,
      ]);
      binaries.set(name, binary);
    }
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('appends equal ISAM keys after existing equal keys', () => {
    const result = run(binaries.get('isam_stable')!, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('PASS: equal-key labels are X then Y');
  });

  it('uses the capacity parameter for the indexed-file position', () => {
    const result = run(binaries.get('indexed_capacity')!, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('PASS: capacity 4 position=5');
  });
});

describe.skipIf(!hasPython)('RISK-06 Python dynamic capacity', () => {
  it('sorts a larger tournament input and keeps the indexed position parameterized', () => {
    const result = run(pythonCommand!, [join(harnessDir, 'python_checks.py')]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('PASS: Python dynamic capacity and ordered quicksort');
  });
});
