import { describe, expect, it } from 'vitest';
import { REFERENCE_ANNOTATIONS } from './annotations';
import { BATCH_03_ANNOTATIONS } from './batch-03-annotations';
import { localizeReferenceSource, stripReferenceComments } from './localization';
import {
  loadReferenceCode,
  REFERENCE_CODE,
  type ReferenceLanguage,
} from './registry';

const algorithms = [
  'seqlist',
  'linked',
  'doubly',
  'stack',
  'factorial',
  'fib',
  'queue',
  'inorder',
  'huffman',
  'bfs',
  'dfs',
] as const;

const languages: ReferenceLanguage[] = ['c', 'cpp', 'python'];

const representative: Record<string, { en: string; zh: string }> = {
  'seqlist.c': {
    en: 'Insertion accepts index == length as append, but rejects length == capacity: the legal range is bounded by both the live count and the physical array.',
    zh: '插入允许 index == length 表示追加，但 length == capacity 时必须拒绝：合法范围同时受有效元素数和物理数组容量约束。',
  },
  'doubly_linked_list.c': {
    en: 'Both endpoints are cleared together; this implementation keeps no count, so those two nulls fully describe the empty state.',
    zh: '两个端点必须一起清空；本实现没有计数，这两个 NULL 就完整描述了空表状态。',
  },
  'huffman.c': {
    en: 'Frequency is primary; order breaks ties, so equal weights still produce a deterministic tree shape.',
    zh: '频率是主键；插入序号用于打破平局，因此相同权值也会得到确定的树形。',
  },
  'bfs.c': {
    en: 'The queue holds only discovered vertices; visited is set at enqueue time, so no vertex can enter twice.',
    zh: '队列中只保存已发现的顶点；visited 在入队时置位，所以同一顶点不可能再次入队。',
  },
};

const expectedFiles = [
  'bfs.c', 'bfs.cpp', 'bfs.py',
  'dfs.c', 'dfs.cpp', 'dfs.py',
  'doubly_linked_list.c', 'doubly_linked_list.cpp', 'doubly_linked_list.py',
  'factorial.c', 'factorial.cpp', 'factorial.py',
  'fib.c', 'fib.cpp', 'fib.py',
  'huffman.c', 'huffman.cpp', 'huffman.py',
  'inorder.c', 'inorder.cpp', 'inorder.py',
  'queue.c', 'queue.cpp', 'queue.py',
  'seqlist.c', 'seqlist.cpp', 'seqlist.py',
  'singly_linked_list.c', 'singly_linked_list.cpp', 'singly_linked_list.py',
  'stack.c', 'stack.cpp', 'stack.py',
].sort();

function codeOnly(source: string, language: ReferenceLanguage): string {
  return stripReferenceComments(source, language)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .join('\n');
}

function localize(source: string, algorithmId: string, fileName: string, language: ReferenceLanguage, lang: 'zh' | 'en'): string {
  return localizeReferenceSource(source, {
    algorithmId,
    algorithmName: algorithmId,
    language,
    implementation: 'principle',
    fileName,
    lang,
  });
}

describe('CODE-DOC-04-BATCH-03 teaching annotations', () => {
  it('registers exactly the 33 principle files from the 11 claimed algorithms', () => {
    expect(Object.keys(BATCH_03_ANNOTATIONS).sort()).toEqual(expectedFiles);
    expect(Object.keys(BATCH_03_ANNOTATIONS)).toHaveLength(33);
  });

  for (const algorithmId of algorithms) {
    for (const language of languages) {
      const file = REFERENCE_CODE[algorithmId]?.files[language];
      if (!file) throw new Error(`${algorithmId}/${language}: missing principle file`);
      const fileName = file.fileName;

      it(`keeps ${fileName} deep, bilingual and code-identical`, async () => {
        const source = await loadReferenceCode(algorithmId, language);
        expect(source, fileName).not.toBeNull();

        const annotations = REFERENCE_ANNOTATIONS[fileName] ?? [];
        expect(annotations.length, fileName).toBeGreaterThanOrEqual(3);
        expect(new Set(annotations.map((item) => item.en)).size, fileName).toBe(
          annotations.length,
        );

        for (const annotation of annotations) {
          expect(source!, `${fileName} stale anchor: ${annotation.en}`).toContain(
            annotation.en,
          );
          expect(annotation.zh, `${fileName} empty Chinese`).toMatch(/[\u3400-\u9fff]/);
        }

        const probe = representative[fileName] ?? annotations[0];
        expect(annotations.some((item) => item.en === probe.en), `${fileName} probe`).toBe(
          true,
        );

        const zh = localize(source!, algorithmId, fileName, language, 'zh');
        const en = localize(source!, algorithmId, fileName, language, 'en');
        const annotation = annotations.find((item) => item.en === probe.en);
        expect(annotation, `${fileName} missing annotation`).toBeDefined();
        expect(zh, `${fileName}/zh`).toContain(annotation!.zh);
        expect(zh, `${fileName}/zh still English`).not.toContain(annotation!.en);
        expect(en, `${fileName}/en`).toContain(annotation!.en);
        expect(en, `${fileName}/en still Chinese`).not.toMatch(/[\u3400-\u9fff]/);

        expect(codeOnly(zh, language), `${fileName}/zh`).toBe(
          codeOnly(source!, language),
        );
        expect(codeOnly(en, language), `${fileName}/en`).toBe(
          codeOnly(source!, language),
        );
      });
    }
  }

  it('has no template-only 作用/Purpose labels in the 33 reviewed sources', async () => {
    for (const algorithmId of algorithms) {
      for (const language of languages) {
        const source = await loadReferenceCode(algorithmId, language);
        const fileName = REFERENCE_CODE[algorithmId]!.files[language]!.fileName;
        expect(source, fileName).not.toBeNull();
        expect(source!, `${fileName} Chinese template`).not.toContain('作用：');
        expect(source!, `${fileName} C++ template`).not.toMatch(/\/\/ Purpose:/);
        expect(source!, `${fileName} Python template`).not.toMatch(/# Purpose:/);
      }
    }
  });
});
