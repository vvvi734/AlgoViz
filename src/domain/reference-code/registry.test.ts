import { describe, expect, it } from 'vitest';
import {
  REFERENCE_CODE_BACKLOG,
  REFERENCE_CODE_ALGORITHMS,
  REFERENCE_LANGUAGES,
  loadReferenceCode,
  referenceFileMeta,
  referenceImplementations,
  referenceLanguages,
} from './registry';

describe('three-language reference registry', () => {
  it('registers all 57 formal courses with three principle implementations', () => {
    expect(REFERENCE_CODE_ALGORITHMS.sort()).toEqual([
      'articulation',
      'avl',
      'bellman-ford',
      'bf',
      'bfs',
      'binary',
      'block-search',
      'bplus-tree',
      'bst',
      'btree',
      'bubble',
      'buddy-system',
      'circular',
      'components',
      'critical-path',
      'dfs',
      'dijkstra',
      'doubly',
      'factorial',
      'fib',
      'floyd-warshall',
      'free-list',
      'garbage-collection',
      'gl-copy',
      'gl-depth',
      'hash-chain',
      'hash-probe',
      'heap',
      'huffman',
      'infix-to-postfix',
      'inorder',
      'insertion',
      'key-tree',
      'kmp',
      'kruskal',
      'linear',
      'linked',
      'merge',
      'multiway',
      'optimal-merge',
      'polynomial-add',
      'postfix-eval',
      'prim',
      'queue',
      'quick',
      'radix',
      'replacement',
      'scc',
      'selection',
      'seqlist',
      'shell',
      'sparse-transpose',
      'stack',
      'static-linked-list',
      'threaded-inorder',
      'topological',
      'tournament',
    ]);
    for (const algorithmId of REFERENCE_CODE_ALGORITHMS) {
      expect(referenceLanguages(algorithmId)).toEqual(REFERENCE_LANGUAGES);
      for (const language of REFERENCE_LANGUAGES) {
        expect(referenceFileMeta(algorithmId, language)?.fileName).toMatch(
          language === 'c' ? /\.c$/ : language === 'cpp' ? /\.cpp$/ : /\.py$/,
        );
      }
    }
  });

  it('exposes shared convenience versions for the sorts and search', () => {
    for (const algorithmId of ['bubble', 'selection', 'insertion', 'shell', 'quick']) {
      for (const language of REFERENCE_LANGUAGES) {
        expect(referenceImplementations(algorithmId, language)).toEqual(['principle', 'convenience']);
        expect(referenceFileMeta(algorithmId, language, 'convenience')).toMatchObject({
          fileName: 'builtin_sorting.' + (language === 'python' ? 'py' : language),
          path: 'shared/builtin_sorting.' + (language === 'python' ? 'py' : language),
        });
      }
    }
    for (const language of REFERENCE_LANGUAGES) {
      expect(referenceImplementations('binary', language)).toEqual(['principle', 'convenience']);
      expect(referenceFileMeta('binary', language, 'convenience')).toMatchObject({
        fileName: 'builtin_search.' + (language === 'python' ? 'py' : language),
        path: 'shared/builtin_search.' + (language === 'python' ? 'py' : language),
      });
    }
  });

  it('offers convenience versions only where a language adds a distinct route', () => {
    expect(referenceImplementations('merge', 'c')).toEqual(['principle']);
    expect(referenceImplementations('stack', 'c')).toEqual(['principle']);
    expect(referenceImplementations('stack', 'cpp')).toEqual(['principle', 'convenience']);
    expect(referenceImplementations('stack', 'python')).toEqual(['principle', 'convenience']);
    expect(referenceImplementations('factorial', 'python')).toEqual(['principle', 'convenience']);
    expect(referenceImplementations('factorial', 'cpp')).toEqual(['principle']);
    expect(referenceImplementations('avl', 'c')).toEqual(['principle']);
  });

  it('has no remaining formal course outside the registry', () => {
    expect(REFERENCE_CODE_BACKLOG).toHaveLength(0);
    expect(REFERENCE_CODE_ALGORITHMS.length + REFERENCE_CODE_BACKLOG.length).toBe(57);
    expect(referenceLanguages('shell')).toEqual(REFERENCE_LANGUAGES);
    expect(referenceFileMeta('shell', 'c')).not.toBeNull();
  });

  it('adds explicit KMP code plus C++/Python lookup shortcuts', () => {
    expect(referenceImplementations('kmp', 'c')).toEqual(['principle']);
    expect(referenceImplementations('kmp', 'cpp')).toEqual(['principle', 'convenience']);
    expect(referenceImplementations('kmp', 'python')).toEqual(['principle', 'convenience']);
    expect(referenceFileMeta('kmp', 'cpp', 'convenience')?.fileName).toBe('kmp_find_builtin.cpp');
    expect(referenceFileMeta('kmp', 'python', 'convenience')?.fileName).toBe('kmp_find_builtin.py');
  });

  it('loads principle and shared convenience sources on demand', async () => {
    const linkedC = await loadReferenceCode('linked', 'c');
    expect(linkedC).toContain('struct Node');
    expect(linkedC).toContain('ListInsert');

    const bubbleC = await loadReferenceCode('bubble', 'c');
    expect(bubbleC).toContain('void BubbleSort');

    const sharedC = await loadReferenceCode('bubble', 'c', 'convenience');
    expect(sharedC).toContain('qsort(');

    const sharedCpp = await loadReferenceCode('selection', 'cpp', 'convenience');
    expect(sharedCpp).toContain('std::sort');
    expect(sharedCpp).toContain('std::stable_sort');

    const sharedPy = await loadReferenceCode('insertion', 'python', 'convenience');
    expect(sharedPy).toContain('sorted(values)');
    expect(sharedPy).toContain('in_place.sort()');

    const binaryCpp = await loadReferenceCode('binary', 'cpp');
    expect(binaryCpp).toContain('int binary_search_index');

    const mergePy = await loadReferenceCode('merge', 'python');
    expect(mergePy).toContain('def merge_sort');
    expect(mergePy).not.toContain('trace(');

    const dijkstraPy = await loadReferenceCode('dijkstra', 'python');
    expect(dijkstraPy).toContain('heapq');
    expect(dijkstraPy).not.toContain('trace(');

    const shellC = await loadReferenceCode('shell', 'c');
    expect(shellC).toContain('void ShellSort');

    const binaryConvenience = await loadReferenceCode('binary', 'c', 'convenience');
    expect(binaryConvenience).toContain('bsearch(');

    const stackConvenience = await loadReferenceCode('stack', 'cpp', 'convenience');
    expect(stackConvenience).toContain('std::stack');

    const kmpC = await loadReferenceCode('kmp', 'c');
    expect(kmpC).toContain('void get_next');
    expect(kmpC).toContain('next[pattern_index]');

    const kmpCpp = await loadReferenceCode('kmp', 'cpp');
    expect(kmpCpp).toContain('kmp_find_all');
    expect(kmpCpp).not.toContain('find(pattern)');

    const kmpPython = await loadReferenceCode('kmp', 'python');
    expect(kmpPython).toContain('def kmp_find_all');
    expect(kmpPython).not.toContain('trace(');

    const kmpFindCpp = await loadReferenceCode('kmp', 'cpp', 'convenience');
    expect(kmpFindCpp).toContain('text.find(pattern)');

    const kmpFindPython = await loadReferenceCode('kmp', 'python', 'convenience');
    expect(kmpFindPython).toContain('text.find(pattern)');

    const btreeC = await loadReferenceCode('btree', 'c');
    expect(btreeC).toContain('void split');
    expect(btreeC).toContain('void InsertBTree');

    const btreeCpp = await loadReferenceCode('btree', 'cpp');
    expect(btreeCpp).toContain('split_child');
    expect(btreeCpp).not.toContain('std::map<');

    const btreePython = await loadReferenceCode('btree', 'python');
    expect(btreePython).toContain('def btree_insert');
    expect(btreePython).not.toContain('trace(');
  });

  it('returns null for unregistered or unavailable implementation combinations', async () => {
    expect(await loadReferenceCode('unknown-algorithm', 'c')).toBeNull();
    expect(await loadReferenceCode('factorial', 'cpp', 'convenience')).toBeNull();
    expect(await loadReferenceCode('linked', 'python')).not.toBeNull();
  });

  it('keeps every registered source original and free of provenance wording', async () => {
    for (const algorithmId of REFERENCE_CODE_ALGORITHMS) {
      for (const language of REFERENCE_LANGUAGES) {
        for (const implementation of referenceImplementations(algorithmId, language)) {
          const source = await loadReferenceCode(algorithmId, language, implementation);
          expect(source, `${algorithmId}/${language}/${implementation}`).not.toBeNull();
          expect(source, `${algorithmId}/${language}/${implementation}`).not.toMatch(
            /MIT|License|版权|Copyright|来源|许可|Textbook/,
          );
        }
      }
    }
  });
});
