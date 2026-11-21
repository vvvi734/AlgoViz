import { describe, expect, it } from 'vitest';
import {
  loadReferenceCode,
  REFERENCE_CODE_ALGORITHMS,
  type ReferenceImplementation,
  type ReferenceLanguage,
} from './registry';
import { localizeReferenceSource, stripReferenceComments } from './localization';
import { REFERENCE_ANNOTATIONS } from './annotations';

const rawSources = import.meta.glob('./sources/**/*.{c,cpp,py}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function sourceByName(fileName: string): string {
  const match = Object.entries(rawSources).find(([path]) => path.endsWith(`/${fileName}`));
  if (!match) throw new Error(`missing source ${fileName}`);
  return match[1];
}

function commentText(line: string, language: ReferenceLanguage): string | null {
  const trimmed = line.trim();
  const marker = language === 'python' ? '#' : '//';
  return trimmed.startsWith(marker) ? trimmed.slice(marker.length).trim() : null;
}

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

  it('adds Chinese annotations to an English C source', async () => {
    const source = await loadReferenceCode('binary', 'c');
    expect(source).toContain('Binary search in C11');
    const translated = localized(source!, 'c', 'principle', 'zh');
    expect(translated).toContain('AlgoViz 参考代码');
    expect(translated).toContain('思路：');
    expect(translated).toContain('int Binary_Search');
    expect(translated).not.toMatch(/来源：|许可：/);
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
    expect(REFERENCE_CODE_ALGORITHMS).toHaveLength(44);
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
      expect(translated, algorithmId).not.toMatch(/来源：|许可：/);
    }
  });

  it('renders reviewed Chinese annotations in the linked-list source without touching code', async () => {
    const source = await loadReferenceCode('linked', 'c');
    const translated = localizeReferenceSource(source!, {
      algorithmId: 'linked',
      algorithmName: '单链表',
      language: 'c',
      implementation: 'principle',
      fileName: 'singly_linked_list.c',
      lang: 'zh',
    });
    expect(translated).toContain('先让新节点指向旧头');
    expect(translated).toContain('删除头节点只需移动');
    expect(translated).not.toContain(
      'Link the new node to the old head before changing *head',
    );
    expect(codeOnly(translated, 'c')).toBe(codeOnly(source!, 'c'));
  });

  it('annotates every registered source file', () => {
    const sourceFiles = Object.keys(rawSources)
      .map((path) => path.split('/').pop() ?? path)
      .sort();
    expect(Object.keys(REFERENCE_ANNOTATIONS).sort()).toEqual(sourceFiles);
  });

  it('maps every reviewed annotation to a standalone source comment', async () => {
    for (const [fileName, annotations] of Object.entries(REFERENCE_ANNOTATIONS)) {
      const source = sourceByName(fileName);
      const language: ReferenceLanguage = fileName.endsWith('.py')
        ? 'python'
        : fileName.endsWith('.cpp')
          ? 'cpp'
          : 'c';
      for (const annotation of annotations) {
        const occurrences = source
          .split('\n')
          .filter((line) => commentText(line, language) === annotation.en);
        expect(occurrences, `${fileName}: ${annotation.en}`).toHaveLength(1);

        const translated = localizeReferenceSource(source, {
          algorithmId: 'linked',
          algorithmName: 'linked',
          language,
          implementation: 'principle',
          fileName,
          lang: 'zh',
        });
        expect(translated, `${fileName}: ${annotation.zh}`).toContain(annotation.zh);
        expect(translated, `${fileName}: ${annotation.en}`).not.toContain(annotation.en);
        expect(codeOnly(translated, language), fileName).toBe(codeOnly(source, language));
      }
    }
  });

  it('leaves native-language sources untouched', async () => {
    const source = await loadReferenceCode('binary', 'c');
    expect(localized(source!, 'c', 'principle', 'en')).toBe(source);
    expect(localized(source!, 'c', 'principle', 'zh')).not.toBe(source);
    const cpp = await loadReferenceCode('binary', 'cpp');
    expect(localized(cpp!, 'cpp', 'principle', 'en')).toBe(cpp);
  });
});
