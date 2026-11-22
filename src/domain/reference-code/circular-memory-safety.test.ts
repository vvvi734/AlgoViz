import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const sourceDir = join(process.cwd(), 'src/domain/reference-code/sources/circular');
const harnessDir = join(process.cwd(), 'src/domain/reference-code/circular-test');
const cSource = join(sourceDir, 'circular_linked_list.c');
const cppSource = join(sourceDir, 'circular_linked_list.cpp');
const hasGcc = spawnSync('gcc', ['--version'], { encoding: 'utf8' }).status === 0;
const hasGxx = spawnSync('g++', ['--version'], { encoding: 'utf8' }).status === 0;

type RunResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

function run(binary: string, failAt: number): RunResult {
  const result = spawnSync(binary, [String(failAt)], { encoding: 'utf8' });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

describe.skipIf(!hasGcc || !hasGxx)('circular list allocation failures', () => {
  let workDir = '';
  let cBinary = '';
  let cppBinary = '';

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), 'algoviz-circular-'));
    const cObject = join(workDir, 'list_c.o');
    const cppObject = join(workDir, 'list_cpp.o');
    cBinary = join(workDir, 'list_c_test.exe');
    cppBinary = join(workDir, 'list_cpp_test.exe');

    const compileC = spawnSync(
      'gcc',
      [
        '-std=c11',
        '-Wall',
        '-Wextra',
        '-Wpedantic',
        '-Dmain=circular_app_main',
        '-Dmalloc=test_malloc',
        '-Dfree=test_free',
        '-c',
        cSource,
        '-o',
        cObject,
      ],
      { encoding: 'utf8' },
    );
    expect(compileC.status, compileC.stderr).toBe(0);
    const linkC = spawnSync(
      'gcc',
      [
        '-std=c11',
        '-Wall',
        '-Wextra',
        '-Wpedantic',
        join(harnessDir, 'c_harness.c'),
        cObject,
        '-o',
        cBinary,
      ],
      { encoding: 'utf8' },
    );
    expect(linkC.status, linkC.stderr).toBe(0);

    const compileCpp = spawnSync(
      'g++',
      [
        '-std=c++17',
        '-Wall',
        '-Wextra',
        '-Wpedantic',
        '-Dmain=circular_cpp_app_main',
        '-c',
        cppSource,
        '-o',
        cppObject,
      ],
      { encoding: 'utf8' },
    );
    expect(compileCpp.status, compileCpp.stderr).toBe(0);
    const linkCpp = spawnSync(
      'g++',
      [
        '-std=c++17',
        '-Wall',
        '-Wextra',
        '-Wpedantic',
        join(harnessDir, 'cpp_harness.cpp'),
        cppObject,
        '-o',
        cppBinary,
      ],
      { encoding: 'utf8' },
    );
    expect(linkCpp.status, linkCpp.stderr).toBe(0);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it.each([
    ['C', 0, ''],
    ['C', 1, 'append 1 failed'],
    ['C', 2, 'append 2 failed'],
    ['C', 3, 'append 3 failed'],
  ] as const)('%s exits cleanly with injection at call %i', (language, failAt, message) => {
    const result = run(language === 'C' ? cBinary : cppBinary, failAt);
    if (failAt === 0) {
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('circular: 1 2 3');
      expect(result.stdout).toContain('tail->next: 1');
      expect(result.stdout).toContain('TRACKED_OUTSTANDING=0');
      expect(result.stdout).toContain('ALLOCATION_CALLS=3');
      return;
    }
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
    expect(result.stdout).toContain('TRACKED_OUTSTANDING=0');
    expect(result.stdout).toContain(`ALLOCATION_CALLS=${failAt}`);
  });

  it.each([
    [0, ''],
    [1, 'append 1 failed'],
    [2, 'append 2 failed'],
    [3, 'append 3 failed'],
  ] as const)('second implementation exits cleanly with injection at call %i', (failAt, message) => {
    const result = run(cppBinary, failAt);
    if (failAt === 0) {
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('circular: 1 2 3');
      expect(result.stdout).toContain('tail->next: 1');
      expect(result.stdout).toContain('TRACKED_OUTSTANDING=0');
      expect(result.stdout).toContain('ALLOCATION_CALLS=3');
      return;
    }
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
    expect(result.stdout).toContain('TRACKED_OUTSTANDING=0');
    expect(result.stdout).toContain(`ALLOCATION_CALLS=${failAt}`);
  });
});
