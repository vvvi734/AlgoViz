import { describe, expect, it } from 'vitest';
import {
  REFERENCE_CODE_BACKLOG,
  REFERENCE_CODE_ALGORITHMS,
  REFERENCE_LICENSE,
  REFERENCE_LANGUAGES,
  REFERENCE_SOURCE_NOTES,
  loadReferenceCode,
  referenceFileMeta,
  referenceImplementations,
  referenceLanguages,
} from './registry';

describe('three-language reference registry', () => {
  it('registers the seven covered algorithms with all three principle implementations', () => {
    expect(REFERENCE_CODE_ALGORITHMS.sort()).toEqual([
      'binary',
      'bubble',
      'dijkstra',
      'insertion',
      'linked',
      'merge',
      'selection',
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

  it('exposes convenience versions only for the three sorts and shares one resource', () => {
    for (const algorithmId of ['bubble', 'selection', 'insertion']) {
      for (const language of REFERENCE_LANGUAGES) {
        expect(referenceImplementations(algorithmId, language)).toEqual(['principle', 'convenience']);
        expect(referenceFileMeta(algorithmId, language, 'convenience')).toMatchObject({
          fileName: 'builtin_sorting.' + (language === 'python' ? 'py' : language),
          path: 'shared/builtin_sorting.' + (language === 'python' ? 'py' : language),
        });
      }
    }
    expect(referenceImplementations('binary', 'c')).toEqual(['principle']);
    expect(referenceFileMeta('binary', 'c', 'convenience')).toBeNull();
  });

  it('keeps the remaining 26 formal courses in the backlog instead of inventing code', () => {
    expect(REFERENCE_CODE_BACKLOG).toHaveLength(26);
    expect(REFERENCE_CODE_ALGORITHMS.length + REFERENCE_CODE_BACKLOG.length).toBe(33);
    expect(referenceLanguages('shell')).toEqual([]);
    expect(referenceFileMeta('shell', 'c')).toBeNull();
  });

  it('loads principle and shared convenience sources on demand', async () => {
    const linkedC = await loadReferenceCode('linked', 'c');
    expect(linkedC).toContain('struct Node');
    expect(linkedC).toContain('list_insert_after');
    expect(linkedC).toContain('MIT License');

    const bubbleC = await loadReferenceCode('bubble', 'c');
    expect(bubbleC).toContain('void bubble_sort');
    expect(bubbleC).toContain('MIT License');

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
  });

  it('returns null for unregistered, missing or unavailable implementation combinations', async () => {
    expect(await loadReferenceCode('shell', 'c')).toBeNull();
    expect(await loadReferenceCode('binary', 'c', 'convenience')).toBeNull();
    expect(await loadReferenceCode('linked', 'python')).not.toBeNull();
  });

  it('documents license and language-specific provenance', () => {
    expect(REFERENCE_LICENSE).toBe('MIT');
    for (const language of REFERENCE_LANGUAGES) {
      expect(REFERENCE_SOURCE_NOTES[language].zh.length).toBeGreaterThan(20);
      expect(REFERENCE_SOURCE_NOTES[language].en.length).toBeGreaterThan(20);
    }
  });
});
