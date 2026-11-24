import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { REFERENCE_ANNOTATIONS } from './annotations';
import { BATCH_06_ANNOTATIONS } from './batch-06-annotations';
import { localizeReferenceSource, stripReferenceComments } from './localization';
import {
  loadReferenceCode,
  REFERENCE_CODE,
  type ReferenceLanguage,
} from './registry';

const algorithms = [
  'bubble',
  'quick',
  'selection',
  'tournament',
  'heap',
  'merge',
  'multiway',
  'optimal-merge',
  'file-index',
  'isam',
  'inverted-index',
] as const;

const languages: ReferenceLanguage[] = ['c', 'cpp', 'python'];

const expectedFiles = [
  'bubble_sort.c', 'bubble_sort.cpp', 'bubble_sort.py',
  'indexed_file.c', 'indexed_file.cpp', 'indexed_file.py',
  'inverted_index.c', 'inverted_index.cpp', 'inverted_index.py',
  'isam_file.c', 'isam_file.cpp', 'isam_file.py',
  'max_heap.c', 'max_heap.cpp', 'max_heap.py',
  'merge_sort.c', 'merge_sort.cpp', 'merge_sort.py',
  'multiway_merge.c', 'multiway_merge.cpp', 'multiway_merge.py',
  'optimal_merge_tree.c', 'optimal_merge_tree.cpp', 'optimal_merge_tree.py',
  'quick_sort.c', 'quick_sort.cpp', 'quick_sort.py',
  'selection_sort.c', 'selection_sort.cpp', 'selection_sort.py',
  'tournament_sort.c', 'tournament_sort.cpp', 'tournament_sort.py',
].sort();

const folders: Record<(typeof algorithms)[number], string> = {
  bubble: 'bubble',
  quick: 'quick',
  selection: 'selection',
  tournament: 'tournament',
  heap: 'heap',
  merge: 'merge',
  multiway: 'multiway',
  'optimal-merge': 'optimal-merge',
  'file-index': 'file-index',
  isam: 'isam',
  'inverted-index': 'inverted-index',
};

// Six reviewed probes: bubble stability, quicksort pivot placement, tournament
// logical deletion, multiway final flush, optimal-tree cost accounting, and
// the ISAM lower_bound insertion-order difference.
const representative: Record<string, { en: string; zh: string }> = {
  'bubble_sort.c': {
    en: 'A pass without a swap means every adjacent pair in the remaining prefix is ordered; by transitivity the whole prefix is sorted, so stopping loses no work.',
    zh: '一整趟没有交换说明剩余前缀的每一对相邻元素都有序；由传递性可知整个前缀已经有序，停止不会漏排。',
  },
  'quick_sort.cpp': {
    en: 'The pivot moves to boundary+1 only after all smaller-or-equal keys are on its left; that slot is final, not provisional.',
    zh: '所有小于等于基准的键就位后，基准才移到 boundary+1；该位置是最终位置，不是暂存位置。',
  },
  'tournament_sort.cpp': {
    en: 'The winner is removed logically, not erased from the vector; tree slots and record indices stay stable.',
    zh: '赢家是逻辑删除而不是从 vector 中抹掉；树槽位和记录下标因此保持稳定。',
  },
  'multiway_merge.c': {
    en: 'The final flush is outside the loop because the last block is usually partial; dropping it would lose records.',
    zh: '最后一次写出在循环之外，因为最后一块通常不满；丢掉它会丢失记录。',
  },
  'optimal_merge_tree.c': {
    en: "Every internal node's weight is paid once in the merge schedule, so total cost is their sum, not the final root weight.",
    zh: '每个内部结点的权重在归并计划中支付一次，因此总代价是它们之和，而不是最终根权重。',
  },
  'isam_file.cpp': {
    en: 'lower_bound inserts before existing equal keys, so a later equal-key record precedes an earlier one; unlike the C version, this insert is not stable.',
    zh: 'lower_bound 会把新记录插到已有相等键之前，因此后插入的相等键反而更靠前；与 C 版不同，这个插入不稳定。',
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

describe('CODE-DOC-04-BATCH-06 teaching annotations', () => {
  it('registers exactly the 33 principle files from the 11 claimed algorithms', () => {
    expect(Object.keys(BATCH_06_ANNOTATIONS).sort()).toEqual(expectedFiles);
    expect(Object.keys(BATCH_06_ANNOTATIONS)).toHaveLength(33);
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

        const batch = BATCH_06_ANNOTATIONS[fileName] ?? [];
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
    const all = Object.values(BATCH_06_ANNOTATIONS).flat();
    expect(all.length).toBeGreaterThanOrEqual(180);
    expect(all.filter((item) => /^(Purpose:|作用：)/.test(item.en) || /^作用：/.test(item.zh)))
      .toHaveLength(0);
    expect(all.filter((item) => /^(Step \d|第\d步)/.test(item.en) || /^第\d步/.test(item.zh)))
      .toHaveLength(0);
  });
});
