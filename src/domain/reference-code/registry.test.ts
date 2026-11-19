import { describe, expect, it } from 'vitest';
import {
  REFERENCE_CODE_BACKLOG,
  REFERENCE_CODE_ALGORITHMS,
  REFERENCE_LICENSE,
  REFERENCE_LANGUAGES,
  REFERENCE_SOURCE_NOTES,
  loadReferenceCode,
  referenceFileMeta,
  referenceLanguages,
} from './registry';

describe('three-language reference registry', () => {
  it('registers the four representative algorithms with all three languages', () => {
    expect(REFERENCE_CODE_ALGORITHMS.sort()).toEqual(['binary', 'dijkstra', 'linked', 'merge']);
    for (const algorithmId of REFERENCE_CODE_ALGORITHMS) {
      expect(referenceLanguages(algorithmId)).toEqual(REFERENCE_LANGUAGES);
      for (const language of REFERENCE_LANGUAGES) {
        expect(referenceFileMeta(algorithmId, language)?.fileName).toMatch(
          language === 'c' ? /\.c$/ : language === 'cpp' ? /\.cpp$/ : /\.py$/,
        );
      }
    }
  });

  it('keeps 29 formal courses explicitly in the backlog instead of filling them with another algorithm', () => {
    expect(REFERENCE_CODE_BACKLOG).toHaveLength(29);
    expect(REFERENCE_CODE_ALGORITHMS.length + REFERENCE_CODE_BACKLOG.length).toBe(33);
    expect(referenceLanguages('bubble')).toEqual([]);
    expect(referenceFileMeta('bubble', 'c')).toBeNull();
  });

  it('loads raw source files on demand', async () => {
    const linkedC = await loadReferenceCode('linked', 'c');
    expect(linkedC).toContain('struct Node');
    expect(linkedC).toContain('list_insert_after');
    expect(linkedC).toContain('MIT License');

    const binaryCpp = await loadReferenceCode('binary', 'cpp');
    expect(binaryCpp).toContain('int binary_search_index');

    const mergePy = await loadReferenceCode('merge', 'python');
    expect(mergePy).toContain('def merge_sort');
    expect(mergePy).not.toContain('trace(');

    const dijkstraPy = await loadReferenceCode('dijkstra', 'python');
    expect(dijkstraPy).toContain('heapq');
    expect(dijkstraPy).not.toContain('trace(');
  });

  it('returns null for unregistered or missing combinations', async () => {
    expect(await loadReferenceCode('bubble', 'c')).toBeNull();
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
