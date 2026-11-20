import { describe, expect, it } from 'vitest';
import {
  loadReferenceCode,
  REFERENCE_CODE_ALGORITHMS,
  type ReferenceImplementation,
  type ReferenceLanguage,
} from './registry';
import { localizeReferenceSource, stripReferenceComments } from './localization';

function localized(
  source: string,
  language: ReferenceLanguage,
  implementation: ReferenceImplementation,
  lang: 'zh' | 'en',
) {
  return localizeReferenceSource(source, {
    algorithmId: 'binary',
    algorithmName: lang === 'zh' ? '二分查找' : 'Binary search',
    language,
    implementation,
    lang,
  });
}

function codeOnly(source: string, language: ReferenceLanguage): string {
  return stripReferenceComments(source, language)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .join('\n');
}

describe('reference code localization', () => {
  it('keeps URLs and string literals when stripping C comments', () => {
    const source = [
      '// line comment',
      'const char* url = "https://example.com/a//b";',
      'char slash = \'/\';',
      '/* block',
      ' * comment */',
      'int x = 1;',
    ].join('\n');
    const stripped = stripReferenceComments(source, 'c');
    expect(stripped).toContain('https://example.com/a//b');
    expect(stripped).toContain("char slash = '/';");
    expect(stripped).toContain('int x = 1;');
    expect(stripped).not.toContain('line comment');
    expect(stripped).not.toContain('block');
  });

  it('adds Chinese annotations to an English C++ source without changing the code', async () => {
    const source = await loadReferenceCode('binary', 'cpp');
    expect(source).toContain('AlgoViz reference implementation');
    const translated = localized(source!, 'cpp', 'principle', 'zh');
    expect(translated).toContain('AlgoViz 参考代码');
    expect(translated).toContain('思路：');
    expect(translated).toContain('binary_search_index');
    expect(translated).not.toContain('Reading guide');
    expect(codeOnly(translated, 'cpp')).toBe(codeOnly(source!, 'cpp'));
  });

  it('adds English annotations to a Chinese textbook C source', async () => {
    const source = await loadReferenceCode('binary', 'c');
    expect(source).toContain('教材参考 C 实现');
    const translated = localized(source!, 'c', 'principle', 'en');
    expect(translated).toContain('AlgoViz reference code');
    expect(translated).toContain('Textbook code');
    expect(translated).toContain('int Binary_Search');
    expect(translated).not.toContain('教材参考 C 实现');
    expect(translated).not.toMatch(/[\u4e00-\u9fff]/);
    expect(codeOnly(translated, 'c')).toBe(codeOnly(source!, 'c'));
  });

  it('localizes Python docstrings and comments while preserving executable code', async () => {
    const source = await loadReferenceCode('binary', 'python');
    const zh = localized(source!, 'python', 'principle', 'zh');
    expect(zh).toContain('# 思路：');
    expect(zh).not.toContain('AlgoViz reference implementation');
    expect(zh).toContain('def binary_search');
    expect(codeOnly(zh, 'python')).toBe(codeOnly(source!, 'python'));
  });

  it('uses the standard-library caveat for convenience sources', async () => {
    const source = await loadReferenceCode('bubble', 'c', 'convenience');
    const translated = localizeReferenceSource(source!, {
      algorithmId: 'bubble',
      algorithmName: '冒泡排序',
      language: 'c',
      implementation: 'convenience',
      lang: 'zh',
    });
    expect(translated).toContain('标准库快捷方法不一定采用本课演示的底层算法');
    expect(translated).toContain('qsort');
    expect(translated).toContain('compare_int');
  });

  it('has a reviewed teaching note for every registered algorithm', async () => {
    expect(REFERENCE_CODE_ALGORITHMS).toHaveLength(36);
    for (const algorithmId of REFERENCE_CODE_ALGORITHMS) {
      const source = await loadReferenceCode(algorithmId, 'cpp');
      expect(source, algorithmId).not.toBeNull();
      const translated = localizeReferenceSource(source!, {
        algorithmId,
        algorithmName: algorithmId,
        language: 'cpp',
        implementation: 'principle',
        lang: 'zh',
      });
      expect(translated, algorithmId).toMatch(/思路：.+/);
      expect(translated, algorithmId).toMatch(/来源：.+/);
    }
  });

  it('leaves native-language sources untouched', async () => {
    const source = await loadReferenceCode('binary', 'c');
    expect(localized(source!, 'c', 'principle', 'zh')).toBe(source);
    const cpp = await loadReferenceCode('binary', 'cpp');
    expect(localized(cpp!, 'cpp', 'principle', 'en')).toBe(cpp);
  });
});
