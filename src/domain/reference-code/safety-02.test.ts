import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const sourceDir = join(repoRoot, 'src/domain/reference-code/sources');
const harnessDir = join(repoRoot, 'src/domain/reference-code/safety-02-test');
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

const expectedFreeListC = [
  'policy=first-fit',
  'used A [0, 12) size=12 head=12 tail=12',
  'free [12, 50) size=38',
  'used E [50, 54) size=4 head=4 tail=4',
  'free [54, 64) size=10',
  'request G=40 -> fail',
  'used A [0, 12) size=12 head=12 tail=12',
  'free [12, 50) size=38',
  'used E [50, 54) size=4 head=4 tail=4',
  'free [54, 64) size=10',
  '',
].join('\n');

const expectedFreeListShared = [
  'used A [0, 12) size=12 head=12 tail=12',
  'free [12, 50) size=38',
  'used E [50, 54) size=4 head=4 tail=4',
  'free [54, 64) size=10',
  'request G=40 -> fail',
  'used A [0, 12) size=12 head=12 tail=12',
  'free [12, 50) size=38',
  'used E [50, 54) size=4 head=4 tail=4',
  'free [54, 64) size=10',
  '',
].join('\n');

describe.skipIf(!hasGcc)('SAFETY-02 free-list C boundaries', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = workspace('algoviz-safety-02-free-c-');
    harnessBinary = join(workDir, `free_list_c_harness${binarySuffix}`);
    demoBinary = join(workDir, `free_list_c_demo${binarySuffix}`);
    compile('gcc', [
      '-std=c11', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(harnessDir, 'free_list_c_harness.c'), '-o', harnessBinary,
    ]);
    compile('gcc', [
      '-std=c11', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(sourceDir, 'free-list/free_list.c'), '-o', demoBinary,
    ]);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('rejects invalid capacities without replacing the current table', () => {
    const result = run(harnessBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('CAP8=1 CAP=8');
    expect(result.stdout).toContain('BAD_LOW=0');
    expect(result.stdout).toContain('BAD_LOW_KEEPS=1,64,1');
    expect(result.stdout).toContain('BAD_HIGH=0');
    expect(result.stdout).toContain('BAD_HIGH_KEEPS=1,64,1');
  });

  it('rejects invalid requests, IDs, duplicates and descriptor overflow', () => {
    const result = run(harnessBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('NULL_ID=0');
    expect(result.stdout).toContain('EMPTY_ID=0');
    expect(result.stdout).toContain('LONG_ID=0');
    expect(result.stdout).toContain('ZERO_REQUEST=0');
    expect(result.stdout).toContain('NEGATIVE_REQUEST=0');
    expect(result.stdout).toContain('COUNT_AFTER_INVALID=1 SIZE=64');
    expect(result.stdout).toContain('DUP1=1 DUP2=0');
    expect(result.stdout).toContain('UNKNOWN_RELEASE=0 NULL_RELEASE=0');
    expect(result.stdout).toContain('MERGE_COUNT=1 MERGE_SIZE=64 MERGE_FREE=1 MERGE_COVERS=1');
    expect(result.stdout).toContain('DESCRIPTOR_LIMIT=23 ALLOCATED=23 COUNT=24 COVERS=1');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(expectedFreeListC);
  });
});

describe.skipIf(!hasGxx)('SAFETY-02 free-list C++ boundaries', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = workspace('algoviz-safety-02-free-cpp-');
    harnessBinary = join(workDir, `free_list_cpp_harness${binarySuffix}`);
    demoBinary = join(workDir, `free_list_cpp_demo${binarySuffix}`);
    compile('g++', [
      '-std=c++17', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(harnessDir, 'free_list_cpp_harness.cpp'), '-o', harnessBinary,
    ]);
    compile('g++', [
      '-std=c++17', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(sourceDir, 'free-list/free_list.cpp'), '-o', demoBinary,
    ]);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('throws clear errors for invalid capacities, IDs and requests', () => {
    const result = run(harnessBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('CAP7_THROWS=1');
    expect(result.stdout).toContain('CAP129_THROWS=1');
    expect(result.stdout).toContain('NULL_ID_THROWS=1');
    expect(result.stdout).toContain('LONG_ID_THROWS=1');
    expect(result.stdout).toContain('ZERO_REQUEST_THROWS=1');
    expect(result.stdout).toContain('NEGATIVE_REQUEST_THROWS=1');
    expect(result.stdout).toContain('TOO_LARGE_RETURNS=1');
    expect(result.stdout).toContain('DUP2_THROWS=1');
  });

  it('keeps merge and release semantics on valid input', () => {
    const result = run(harnessBinary, []);
    expect(result.stdout).toContain('DUP1=1');
    expect(result.stdout).toContain('DUP_RELEASE=1 UNKNOWN_RELEASE=0');
    expect(result.stdout).toContain('MERGE_ALLOC=1,1,1');
    expect(result.stdout).toContain('MERGE_RELEASE=1,1,1');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(expectedFreeListShared);
  });
});

describe.skipIf(!hasPython)('SAFETY-02 free-list Python boundaries', () => {
  it('rejects invalid capacities, IDs, requests and duplicates', () => {
    const result = run(pythonCommand!, [join(harnessDir, 'free_list_py_harness.py')]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('cap8 True');
    expect(result.stdout).toContain('cap7 error');
    expect(result.stdout).toContain('cap129 error');
    expect(result.stdout).toContain('empty_id error');
    expect(result.stdout).toContain('long_id error');
    expect(result.stdout).toContain('zero_request error');
    expect(result.stdout).toContain('negative_request error');
    expect(result.stdout).toContain('bool_request error');
    expect(result.stdout).toContain('too_large False');
    expect(result.stdout).toContain('dup1 True');
    expect(result.stdout).toContain('dup2 error');
    expect(result.stdout).toContain('merge_blocks [(0, 64, True, \'\')]');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(pythonCommand!, [join(sourceDir, 'free-list/free_list.py')]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(expectedFreeListShared);
  });
});

const expectedKmpC = [
  'text: ababcabcacbab',
  'pattern: abcac',
  'matches: 1',
  'overlapping: 4',
  'missing: 0',
  '',
].join('\n');

describe.skipIf(!hasGcc)('SAFETY-02 KMP C allocation failure', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = workspace('algoviz-safety-02-kmp-c-');
    harnessBinary = join(workDir, `kmp_c_harness${binarySuffix}`);
    demoBinary = join(workDir, `kmp_c_demo${binarySuffix}`);
    compile('gcc', [
      '-std=c11', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(harnessDir, 'kmp_c_harness.c'), '-o', harnessBinary,
    ]);
    compile('gcc', [
      '-std=c11', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(sourceDir, 'kmp/kmp.c'), '-o', demoBinary,
    ]);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('distinguishes allocation failure from a real zero-match result', () => {
    const result = run(harnessBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('OVERLAP=4');
    expect(result.stdout).toContain('NO_MATCH=0');
    expect(result.stdout).toContain('EMPTY_PATTERN=0');
    expect(result.stdout).toContain('EMPTY_TEXT=0');
    expect(result.stdout).toContain('NULL_TEXT=-1');
    expect(result.stdout).toContain('NULL_PATTERN=-1');
    expect(result.stdout).toContain('ALLOCATION_FAILURE=-1');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(expectedKmpC);
  });
});

describe.skipIf(!hasGxx)('SAFETY-02 KMP C++ convention', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = workspace('algoviz-safety-02-kmp-cpp-');
    harnessBinary = join(workDir, `kmp_cpp_harness${binarySuffix}`);
    demoBinary = join(workDir, `kmp_cpp_demo${binarySuffix}`);
    compile('g++', [
      '-std=c++17', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(harnessDir, 'kmp_cpp_harness.cpp'), '-o', harnessBinary,
    ]);
    compile('g++', [
      '-std=c++17', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(sourceDir, 'kmp/kmp.cpp'), '-o', demoBinary,
    ]);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('returns every start, including overlaps, and no starts for an empty pattern', () => {
    const result = run(harnessBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('OVERLAP_COUNT=4 FIRST=0 LAST=3');
    expect(result.stdout).toContain('NO_MATCH=0');
    expect(result.stdout).toContain('EMPTY_PATTERN=0');
    expect(result.stdout).toContain('EMPTY_TEXT=0');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('matches = 2\nstart[0] = 2\nstart[1] = 9\n');
  });
});

describe.skipIf(!hasPython)('SAFETY-02 KMP Python convention', () => {
  it('keeps empty text legal and rejects an empty pattern with ValueError', () => {
    const result = run(pythonCommand!, [join(harnessDir, 'kmp_py_harness.py')]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('overlap [0, 1, 2, 3]');
    expect(result.stdout).toContain('no_match []');
    expect(result.stdout).toContain('empty_text []');
    expect(result.stdout).toContain('empty_lps []');
    expect(result.stdout).toContain('empty_pattern ValueError pattern must not be empty');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(pythonCommand!, [join(sourceDir, 'kmp/kmp.py')]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('matches = 2\nstart[0] = 2\nstart[1] = 9\n');
  });
});

describe.skipIf(!hasGcc)('SAFETY-02 articulation C state reset', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = workspace('algoviz-safety-02-articulation-c-');
    harnessBinary = join(workDir, `articulation_c_harness${binarySuffix}`);
    demoBinary = join(workDir, `articulation_c_demo${binarySuffix}`);
    compile('gcc', [
      '-std=c11', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(harnessDir, 'articulation_c_harness.c'), '-o', harnessBinary,
    ]);
    compile('gcc', [
      '-std=c11', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(sourceDir, 'articulation/articulation.c'), '-o', demoBinary,
    ]);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('resets the forest and rejects invalid endpoints before indexing', () => {
    const result = run(harnessBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('ADD_NEGATIVE=0');
    expect(result.stdout).toContain('ADD_TOO_LARGE=0');
    expect(result.stdout).toContain('ADD_NULL_GRAPH=0');
    expect(result.stdout).toContain('INVALID_EDGES_KEEP_GRAPH=1');
    expect(result.stdout).toContain('FIRST_ART=00110000');
    expect(result.stdout).toContain('SECOND_ART=00110000');
    expect(result.stdout).toContain('SECOND_TIMER=8');
    expect(result.stdout).toContain('SINGLE_ART=00000000');
    expect(result.stdout).toContain('OLD_BRIDGE_23=0');
    expect(result.stdout).toContain('OLD_BRIDGE_67=0');
    expect(result.stdout).toContain('NULL_GRAPH=0');
    expect(result.stdout).toContain('STAR_ART=1000');
    expect(result.stdout).toContain('ROOT_STAR_BRIDGES=1,1,1');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('articulation: 2 3\nbridges: 2-3 6-7\n');
  });
});

describe.skipIf(!hasGxx)('SAFETY-02 articulation C++ state reset', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = workspace('algoviz-safety-02-articulation-cpp-');
    harnessBinary = join(workDir, `articulation_cpp_harness${binarySuffix}`);
    demoBinary = join(workDir, `articulation_cpp_demo${binarySuffix}`);
    compile('g++', [
      '-std=c++17', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(harnessDir, 'articulation_cpp_harness.cpp'), '-o', harnessBinary,
    ]);
    compile('g++', [
      '-std=c++17', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(sourceDir, 'articulation/articulation.cpp'), '-o', demoBinary,
    ]);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('resets the forest, validates endpoints and rejects a wrong matrix shape', () => {
    const result = run(harnessBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('ADD_NEGATIVE=0');
    expect(result.stdout).toContain('ADD_TOO_LARGE=0');
    expect(result.stdout).toContain('FIRST_ART=00110000');
    expect(result.stdout).toContain('SECOND_ART=00110000');
    expect(result.stdout).toContain('SECOND_TIMER=8');
    expect(result.stdout).toContain('SINGLE_ART=00000000');
    expect(result.stdout).toContain('OLD_BRIDGE_23=0');
    expect(result.stdout).toContain('OLD_BRIDGE_67=0');
    expect(result.stdout).toContain('STAR_ART=1000');
    expect(result.stdout).toContain('ROOT_STAR_BRIDGES=1,1,1');
    expect(result.stdout).toContain('WRONG_SHAPE_ADD=0');
    expect(result.stdout).toContain('WRONG_SHAPE_FIND=0');
    expect(result.stdout).toContain('WRONG_SHAPE_KEEPS=1');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('articulation: 2 3\nbridges: 2-3 6-7\n');
  });
});

describe.skipIf(!hasPython)('SAFETY-02 articulation Python state reset', () => {
  it('resets module state and validates endpoints and graph shape', () => {
    const result = run(pythonCommand!, [join(harnessDir, 'articulation_py_harness.py')]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('second_art [False, False, True, True, False, False, False, False]');
    expect(result.stdout).toContain('second_timer 8');
    expect(result.stdout).toContain('single_art [False, False, False, False, False, False, False, False]');
    expect(result.stdout).toContain('single_bridges [(0, 1)]');
    expect(result.stdout).toContain('star_art [True, False, False, False, False, False, False, False]');
    expect(result.stdout).toContain('star_bridges [(0, 1), (0, 2), (0, 3)]');
    expect(result.stdout).toContain('invalid_endpoint -1 error');
    expect(result.stdout).toContain('invalid_endpoint 8 error');
    expect(result.stdout).toContain('wrong_shape error');
    expect(result.stdout).toContain('invalid_neighbor error');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(pythonCommand!, [join(sourceDir, 'articulation/articulation.py')]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('articulation: [2, 3]\nbridges: [(2, 3), (6, 7)]\n');
  });
});

describe.skipIf(!hasGcc)('SAFETY-02 radix C independent interface', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = workspace('algoviz-safety-02-radix-c-');
    harnessBinary = join(workDir, `radix_c_harness${binarySuffix}`);
    demoBinary = join(workDir, `radix_c_demo${binarySuffix}`);
    compile('gcc', [
      '-std=c11', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(harnessDir, 'radix_c_harness.c'), '-o', harnessBinary,
    ]);
    compile('gcc', [
      '-std=c11', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(sourceDir, 'radix/radix_sort.c'), '-o', demoBinary,
    ]);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('rejects empty, oversized and out-of-range batches before mutating storage', () => {
    const result = run(harnessBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('NORMAL_RESULT=1');
    expect(result.stdout).toContain('NEGATIVE=0 NEGATIVE_UNCHANGED=-1,42');
    expect(result.stdout).toContain('TOO_LARGE=0 TOO_LARGE_UNCHANGED=10000,43');
    expect(result.stdout).toContain('NULL=0');
    expect(result.stdout).toContain('EMPTY=0');
    expect(result.stdout).toContain('TOO_MANY=0');
    expect(result.stdout).toContain('MAX_BATCH_RESULT=1 MAX_BATCH_FIRST=1 MAX_BATCH_LAST=16');
  });

  it('keeps duplicate keys in stable original order', () => {
    const result = run(harnessBinary, []);
    expect(result.stdout).toContain(
      'NORMAL_ORDER (2,6) (24,5) (45,1) (45,2) (66,7) (90,3) (170,0) (802,4)',
    );
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('(2,G) (24,F) (45,B) (66,H) (75,C) (90,D) (170,A) (802,E)\n');
  });
});

describe.skipIf(!hasGxx)('SAFETY-02 radix C++ independent interface', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = workspace('algoviz-safety-02-radix-cpp-');
    harnessBinary = join(workDir, `radix_cpp_harness${binarySuffix}`);
    demoBinary = join(workDir, `radix_cpp_demo${binarySuffix}`);
    compile('g++', [
      '-std=c++17', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(harnessDir, 'radix_cpp_harness.cpp'), '-o', harnessBinary,
    ]);
    compile('g++', [
      '-std=c++17', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(sourceDir, 'radix/radix_sort.cpp'), '-o', demoBinary,
    ]);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('rejects empty, oversized and out-of-range batches before mutating storage', () => {
    const result = run(harnessBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('NORMAL_RESULT=1');
    expect(result.stdout).toContain('NEGATIVE=0 NEGATIVE_VALUE=-1 NEGATIVE_INDEX=42');
    expect(result.stdout).toContain('TOO_LARGE=0 TOO_LARGE_VALUE=10000 TOO_LARGE_INDEX=43');
    expect(result.stdout).toContain('EMPTY=0');
    expect(result.stdout).toContain('TOO_MANY=0');
    expect(result.stdout).toContain('MAX_BATCH_RESULT=1 MAX_BATCH_FIRST=1 MAX_BATCH_LAST=16');
  });

  it('keeps duplicate keys in stable original order', () => {
    const result = run(harnessBinary, []);
    expect(result.stdout).toContain(
      'NORMAL_ORDER (2,6) (24,5) (45,1) (45,2) (66,7) (90,3) (170,0) (802,4)',
    );
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('(2,G) (24,F) (45,B) (66,H) (75,C) (90,D) (170,A) (802,E)\n');
  });
});

describe.skipIf(!hasPython)('SAFETY-02 radix Python independent interface', () => {
  it('keeps the existing 1..16, 0..9999 and empty-input contract', () => {
    const result = run(pythonCommand!, [join(harnessDir, 'radix_py_harness.py')]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('empty ValueError radix sort needs 1..16 records');
    expect(result.stdout).toContain('negative ValueErr');
    expect(result.stdout).toContain('too_large ValueError radix sort only accepts values up to 9999');
    expect(result.stdout).toContain('too_many ValueError radix sort needs 1..16 records');
    expect(result.stdout).toContain('max_batch 16');
  });

  it('keeps duplicate keys in stable original order', () => {
    const result = run(pythonCommand!, [join(harnessDir, 'radix_py_harness.py')]);
    expect(result.stdout).toContain(
      "normal [{'value': 2, 'original_index': 6}, {'value': 24, 'original_index': 5}, {'value': 45, 'original_index': 1}, {'value': 45, 'original_index': 2}",
    );
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(pythonCommand!, [join(sourceDir, 'radix/radix_sort.py')]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('(2,G) -> (24,F) -> (45,B) -> (66,H) -> (75,C) -> (90,D) -> (170,A) -> (802,E)\n');
  });
});

describe.skipIf(!hasGcc)('SAFETY-02 replacement C fixed capacities', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = workspace('algoviz-safety-02-replacement-c-');
    harnessBinary = join(workDir, `replacement_c_harness${binarySuffix}`);
    demoBinary = join(workDir, `replacement_c_demo${binarySuffix}`);
    compile('gcc', [
      '-std=c11', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(harnessDir, 'replacement_c_harness.c'), '-o', harnessBinary,
    ]);
    compile('gcc', [
      '-std=c11', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(sourceDir, 'replacement/replacement_selection.c'), '-o', demoBinary,
    ]);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('rejects invalid record counts, capacities and absent buffers', () => {
    const result = run(harnessBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('EMPTY=-1');
    expect(result.stdout).toContain('CAPACITY_ONE=-1');
    expect(result.stdout).toContain('CAPACITY_SEVEN=-1');
    expect(result.stdout).toContain('TOO_MANY=-1');
    expect(result.stdout).toContain('NULL_INPUT=-1');
    expect(result.stdout).toContain('NULL_RUNS=-1');
  });

  it('keeps runs sorted, complete and stable on valid input', () => {
    const result = run(harnessBinary, []);
    expect(result.stdout).toContain('VALID_RUNS=2 VALID_SORTED=1 VALID_COVER=1');
    expect(result.stdout).toContain('MAX_BATCH_RUNS=10 MAX_BATCH_SORTED=1 MAX_BATCH_COVER=1');
    expect(result.stdout).toContain('runA length=4: 3 7 8 9');
    expect(result.stdout).toContain('runB length=5: 1 2 4 5 6');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('runA length=4: 3 7 8 9\nrunB length=5: 1 2 4 5 6\nruns=2 records=9 workspace=3\n');
  });
});

describe.skipIf(!hasGxx)('SAFETY-02 replacement C++ fixed capacities', () => {
  let workDir = '';
  let harnessBinary = '';
  let demoBinary = '';

  beforeAll(() => {
    workDir = workspace('algoviz-safety-02-replacement-cpp-');
    harnessBinary = join(workDir, `replacement_cpp_harness${binarySuffix}`);
    demoBinary = join(workDir, `replacement_cpp_demo${binarySuffix}`);
    compile('g++', [
      '-std=c++17', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(harnessDir, 'replacement_cpp_harness.cpp'), '-o', harnessBinary,
    ]);
    compile('g++', [
      '-std=c++17', '-Wall', '-Wextra', '-Wpedantic', '-Werror',
      join(sourceDir, 'replacement/replacement_selection.cpp'), '-o', demoBinary,
    ]);
  });

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('throws typed errors for invalid record counts and capacities', () => {
    const result = run(harnessBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('EMPTY=invalid_argument:replacement selection needs 1..20 records');
    expect(result.stdout).toContain('CAPACITY_ONE=invalid_argument:workspace capacity must be 2..6');
    expect(result.stdout).toContain('CAPACITY_SEVEN=invalid_argument:workspace capacity must be 2..6');
    expect(result.stdout).toContain('TOO_MANY=invalid_argument:replacement selection needs 1..20 records');
    expect(result.stdout).toContain('NEGATIVE_CAPACITY=invalid_argument:workspace capacity must be 2..6');
  });

  it('keeps runs sorted and complete on valid input', () => {
    const result = run(harnessBinary, []);
    expect(result.stdout).toContain('VALID_RUNS=2 VALID_SORTED=1 VALID_COVER=1');
    expect(result.stdout).toContain('MAX_BATCH_RUNS=10 MAX_BATCH_SORTED=1 MAX_BATCH_COVER=1');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(demoBinary, []);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('runA length=4: 3 7 8 9\nrunB length=5: 1 2 4 5 6\nruns=2 records=9 workspace=3\n');
  });
});

describe.skipIf(!hasPython)('SAFETY-02 replacement Python failure paths', () => {
  it('keeps the existing input contract and raises ValueError on invalid state', () => {
    const result = run(pythonCommand!, [join(harnessDir, 'replacement_py_harness.py')]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('VALID_RUNS 2');
    expect(result.stdout).toContain('VALID_SORTED True');
    expect(result.stdout).toContain('VALID_COVER True');
    expect(result.stdout).toContain('MAX_BATCH_RUNS 10');
    expect(result.stdout).toContain('MAX_BATCH_SORTED True');
    expect(result.stdout).toContain('MAX_BATCH_COVER True');
    expect(result.stdout).toContain('empty ValueError replacement selection needs 1..20 records');
    expect(result.stdout).toContain('capacity_one ValueError workspace capacity must be an integer from 2 to 6');
    expect(result.stdout).toContain('capacity_seven ValueError workspace capacity must be an integer from 2 to 6');
    expect(result.stdout).toContain('too_many ValueError replacement selection needs 1..20 records');
    expect(result.stdout).toContain('bool_capacity ValueError workspace capacity must be an integer from 2 to 6');
  });

  it('keeps the teaching demo output unchanged', () => {
    const result = run(pythonCommand!, [join(sourceDir, 'replacement/replacement_selection.py')]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('runA length=4: 3 7 8 9\nrunB length=5: 1 2 4 5 6\nruns=2 records=9 workspace=3\n');
  });
});
