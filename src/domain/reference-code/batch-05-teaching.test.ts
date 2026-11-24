import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { REFERENCE_ANNOTATIONS } from './annotations';
import { BATCH_05_ANNOTATIONS } from './batch-05-annotations';
import { localizeReferenceSource, stripReferenceComments } from './localization';
import {
  loadReferenceCode,
  REFERENCE_CODE,
  type ReferenceLanguage,
} from './registry';

const algorithms = [
  'linear',
  'binary',
  'bst',
  'avl',
  'btree',
  'bplus-tree',
  'key-tree',
  'hash-chain',
  'hash-probe',
  'insertion',
  'shell',
] as const;

const languages: ReferenceLanguage[] = ['c', 'cpp', 'python'];

const expectedFiles = [
  'avl_tree.c', 'avl_tree.cpp', 'avl_tree.py',
  'binary_search.c', 'binary_search.cpp', 'binary_search.py',
  'bplus_tree.c', 'bplus_tree.cpp', 'bplus_tree.py',
  'bst.c', 'bst.cpp', 'bst.py',
  'btree.c', 'btree.cpp', 'btree.py',
  'hash_chain.c', 'hash_chain.cpp', 'hash_chain.py',
  'hash_probe.c', 'hash_probe.cpp', 'hash_probe.py',
  'insertion_sort.c', 'insertion_sort.cpp', 'insertion_sort.py',
  'key_tree.c', 'key_tree.cpp', 'key_tree.py',
  'linear_search.c', 'linear_search.cpp', 'linear_search.py',
  'shell_sort.c', 'shell_sort.cpp', 'shell_sort.py',
].sort();

const folders: Record<(typeof algorithms)[number], string> = {
  linear: 'linear',
  binary: 'binary',
  bst: 'bst',
  avl: 'avl',
  btree: 'btree',
  'bplus-tree': 'bplus-tree',
  'key-tree': 'key-tree',
  'hash-chain': 'hash-chain',
  'hash-probe': 'hash-probe',
  insertion: 'insertion',
  shell: 'shell',
};

// Four reviewed probes: a BST allocation-risk explanation, two multi-level
// split decisions, and the open-addressing sentinel collision.
const representative: Record<string, { en: string; zh: string }> = {
  'bst.c': {
    en: 'Allocation failure sets inserted=false, but this teaching function still returns NULL; a production caller must propagate failure instead of assigning NULL over an existing subtree.',
    zh: '分配失败会置 inserted=false，但这个教学函数仍返回 NULL；生产调用方必须向上传播失败，不能把 NULL 覆盖到已有子树上。',
  },
  'btree.c': {
    en: 'The median index is 1 for order 4; it is moved to the parent and removed from the child, so the two halves never both retain it.',
    zh: '4 阶的中位下标是 1；它被移入父结点并从孩子中删除，两半不会同时保留它。',
  },
  'bplus_tree.c': {
    en: 'The split is 2/2 after the overflow key is present: right keeps keys 2 and 3, left keeps keys 0 and 1, and the promoted separator stays in the right leaf.',
    zh: '溢出键存在后按 2/2 分裂：右叶保留 keys 2、3，左叶保留 keys 0、1，提升的分隔键仍留在右叶。',
  },
  'hash_probe.cpp': {
    en: 'kEmpty is also a legal int key, and this class does not reject -1; inserting -1 would make a real key look empty to contains(). Non-negative keys are therefore an implicit precondition.',
    zh: 'kEmpty 本身也是合法 int 键，而这个类不拒绝 -1；插入 -1 会让真实键在 contains() 中看起来像空槽。因此非负键是隐式前提。',
  },
};

function codeOnly(source: string, language: ReferenceLanguage): string {
  return stripReferenceComments(source, language)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .join('\n');
}

function localize(
  source: string,
  algorithmId: string,
  fileName: string,
  language: ReferenceLanguage,
  lang: 'zh' | 'en',
): string {
  return localizeReferenceSource(source, {
    algorithmId,
    algorithmName: algorithmId,
    language,
    implementation: 'principle',
    fileName,
    lang,
  });
}

function isStandaloneComment(source: string, language: ReferenceLanguage, en: string): boolean {
  const prefix = language === 'python' ? '# ' : '// ';
  return source
    .split('\n')
    .some((line) => line.trim() === `${prefix}${en}`);
}

function headSource(algorithmId: (typeof algorithms)[number], fileName: string): string {
  const relative = `src/domain/reference-code/sources/${folders[algorithmId]}/${fileName}`;
  return execFileSync('git', ['show', `HEAD:${relative}`], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

describe('CODE-DOC-04-BATCH-05 teaching annotations', () => {
  it('registers exactly the 33 principle files from the 11 claimed algorithms', () => {
    expect(Object.keys(BATCH_05_ANNOTATIONS).sort()).toEqual(expectedFiles);
    expect(Object.keys(BATCH_05_ANNOTATIONS)).toHaveLength(33);
    expect(new Set(expectedFiles).size).toBe(33);
  });

  for (const algorithmId of algorithms) {
    for (const language of languages) {
      const file = REFERENCE_CODE[algorithmId]?.files[language];
      if (!file) throw new Error(`${algorithmId}/${language}: missing principle file`);
      const fileName = file.fileName;

      it(`keeps ${fileName} deep, bilingual, anchored and code-identical`, async () => {
        const source = await loadReferenceCode(algorithmId, language);
        expect(source, fileName).not.toBeNull();

        const batch = BATCH_05_ANNOTATIONS[fileName] ?? [];
        expect(batch.length, fileName).toBeGreaterThanOrEqual(5);
        expect(new Set(batch.map((item) => item.en)).size, fileName).toBe(batch.length);
        expect(new Set(batch.map((item) => item.zh)).size, fileName).toBe(batch.length);

        for (const annotation of batch) {
          expect(annotation.zh, `${fileName} empty Chinese`).toMatch(/[\u3400-\u9fff]/);
          expect(annotation.en, `${fileName} template English`).not.toMatch(
            /^(Purpose:|Step \d|This line (simply )?)/,
          );
          expect(annotation.zh, `${fileName} template Chinese`).not.toMatch(
            /^(作用：|第\d步|这一行)/,
          );
          expect(
            isStandaloneComment(source!, language, annotation.en),
            `${fileName} stale or inline anchor: ${annotation.en}`,
          ).toBe(true);
        }

        const merged = REFERENCE_ANNOTATIONS[fileName] ?? [];
        expect(merged.length, `${fileName} merged`).toBeGreaterThanOrEqual(5);
        expect(new Set(merged.map((item) => item.en)).size, `${fileName} merged uniqueness`).toBe(
          merged.length,
        );
        for (const annotation of batch) {
          expect(merged.some((item) => item.en === annotation.en), `${fileName} not merged`).toBe(
            true,
          );
        }

        const probe = representative[fileName] ?? batch[0];
        expect(batch.some((item) => item.en === probe.en), `${fileName} probe`).toBe(true);

        const zh = localize(source!, algorithmId, fileName, language, 'zh');
        const en = localize(source!, algorithmId, fileName, language, 'en');
        const annotation = batch.find((item) => item.en === probe.en);
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
        expect(codeOnly(source!, language), `${fileName}/HEAD`).toBe(
          codeOnly(headSource(algorithmId, fileName), language),
        );
      });
    }
  }

  it('does not accept a batch made only of file headers or generic labels', () => {
    const all = Object.values(BATCH_05_ANNOTATIONS).flat();
    expect(all.length).toBeGreaterThanOrEqual(180);
    expect(all.filter((item) => /^(Purpose:|作用：)/.test(item.en) || /^作用：/.test(item.zh)))
      .toHaveLength(0);
    expect(all.filter((item) => /^(Step \d|第\d步)/.test(item.en) || /^第\d步/.test(item.zh)))
      .toHaveLength(0);
  });
});
