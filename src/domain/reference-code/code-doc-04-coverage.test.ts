import { describe, expect, it } from 'vitest';
import { REFERENCE_ANNOTATIONS } from './annotations';
import { localizeReferenceSource, stripReferenceComments } from './localization';
import {
  loadReferenceCode,
  REFERENCE_CODE,
  REFERENCE_CODE_ALGORITHMS,
  REFERENCE_LANGUAGES,
  type ReferenceLanguage,
} from './registry';

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

// Fourteen hand-checked samples across linear lists, stacks, strings, trees,
// graphs, dynamic storage, search, internal/external sorting and file indexes.
const spotChecks: {
  id: string;
  language: ReferenceLanguage;
  fileName: string;
  en: string;
  zh: string;
}[] = [
  {
    id: 'seqlist',
    language: 'c',
    fileName: 'seqlist.c',
    en: 'Insertion accepts index == length as append, but rejects length == capacity: the legal range is bounded by both the live count and the physical array.',
    zh: '插入允许 index == length 表示追加，但 length == capacity 时必须拒绝：合法范围同时受有效元素数和物理数组容量约束。',
  },
  {
    id: 'doubly',
    language: 'c',
    fileName: 'doubly_linked_list.c',
    en: 'Both endpoints are cleared together; this implementation keeps no count, so those two nulls fully describe the empty state.',
    zh: '两个端点必须一起清空；本实现没有计数，这两个 NULL 就完整描述了空表状态。',
  },
  {
    id: 'stack',
    language: 'c',
    fileName: 'stack.c',
    en: 'The full check uses top, not a count: top == capacity-1 means the next increment would write past the array.',
    zh: '判满依据是 top 而不是元素计数：top == capacity-1 时再自增就会写出数组边界。',
  },
  {
    id: 'kmp',
    language: 'c',
    fileName: 'kmp.c',
    en: '-1 is a sentinel, not a real border: at the first pattern character there is no shorter prefix to fall back to.',
    zh: 'next[0] = -1 是哨兵而不是真实 border：模式串首字符之前没有更短前缀可以回退。',
  },
  {
    id: 'huffman',
    language: 'c',
    fileName: 'huffman.c',
    en: 'Frequency is primary; order breaks ties, so equal weights still produce a deterministic tree shape.',
    zh: '频率是主键；插入序号用于打破平局，因此相同权值也会得到确定的树形。',
  },
  {
    id: 'threaded-inorder',
    language: 'c',
    fileName: 'threaded_inorder.c',
    en: 'The walk needs no recursion stack: a right thread jumps directly to the successor, otherwise the successor is the leftmost node of the real right subtree.',
    zh: '遍历不需要递归栈：右线索直接跳到后继，否则后继就是真实右子树的最左结点。',
  },
  {
    id: 'articulation',
    language: 'c',
    fileName: 'articulation.c',
    en: "For a non-root u, low[v] >= disc[u] means no back edge from v's subtree can bypass u, so removing u separates that subtree.",
    zh: '对非根 u，low[v] >= disc[u] 表示 v 子树没有任何返祖边能绕过 u；删除 u 就会把这棵子树分离出去。',
  },
  {
    id: 'free-list',
    language: 'c',
    fileName: 'free_list.c',
    en: 'First Fit can stop at the first adequate block; Best Fit cannot, because a later block may leave a smaller remainder.',
    zh: '首次适应一旦遇到第一个足够大的块就可以停止；最佳适应不能停，因为后面的块可能留下更小的剩余空间。',
  },
  {
    id: 'linear',
    language: 'c',
    fileName: 'linear_search.c',
    en: '-1 lies outside every valid index, so a real match at index 0 is never confused with the failure value.',
    zh: '-1 不属于任何有效下标，因此真实命中下标 0 不会与失败值混淆。',
  },
  {
    id: 'insertion',
    language: 'c',
    fileName: 'insertion_sort.c',
    en: 'The strict > is the stability decision: equal keys stop the shift, so the new key lands after them and their relative order survives.',
    zh: '严格的 > 是稳定性决策：相等键会停止搬移，新键落在它们之后，相对次序得以保留。',
  },
  {
    id: 'quick',
    language: 'c',
    fileName: 'quick_sort.c',
    en: 'The final swap puts the pivot immediately after the <= region; boundary+1 is its final position, so later recursion must exclude it.',
    zh: '最终交换把基准放到 <= 区域之后；boundary+1 就是它的最终位置，后续递归必须排除它。',
  },
  {
    id: 'multiway',
    language: 'c',
    fileName: 'multiway_merge.c',
    en: 'The final flush is outside the loop because the last block is usually partial; dropping it would lose records.',
    zh: '最后一次写出在循环之外，因为最后一块通常不满；丢掉它会丢失记录。',
  },
  {
    id: 'isam',
    language: 'c',
    fileName: 'isam_file.c',
    en: "The main block's last key is only a starting maximum; the true maximum may live in this block's overflow chain.",
    zh: '主块末键只是最大值的起点；真实最大值可能位于该块的溢出链中。',
  },
  {
    id: 'file-index',
    language: 'c',
    fileName: 'indexed_file.c',
    en: "A sparse entry is the block's own maximum, not the next block's minimum; using the next block's first key would send equal boundary keys to the wrong block.",
    zh: '稀疏索引项是本块自己的最大键，不是下一块的最小键；用下一块首键会把边界相等键导向错误块。',
  },
];

describe('CODE-DOC-04 full reference-code coverage', () => {
  it('has 60 formal algorithms and 180 distinct trilingual principle files', () => {
    expect(REFERENCE_CODE_ALGORITHMS).toHaveLength(60);
    expect(REFERENCE_LANGUAGES).toEqual(['c', 'cpp', 'python']);

    const files = new Set<string>();
    for (const algorithmId of REFERENCE_CODE_ALGORITHMS) {
      const entry = REFERENCE_CODE[algorithmId];
      expect(entry, algorithmId).toBeDefined();
      for (const language of REFERENCE_LANGUAGES) {
        const file = entry.files[language];
        expect(file, `${algorithmId}/${language}`).toBeDefined();
        expect(file!.fileName, `${algorithmId}/${language}`).toMatch(/\.(c|cpp|py)$/);
        files.add(file!.fileName);
      }
    }
    expect(files.size).toBe(180);
  });

  it('keeps every formal file annotated and code-identical in both languages', async () => {
    for (const algorithmId of REFERENCE_CODE_ALGORITHMS) {
      const entry = REFERENCE_CODE[algorithmId];
      for (const language of REFERENCE_LANGUAGES) {
        const fileName = entry.files[language]!.fileName;
        const source = await loadReferenceCode(algorithmId, language);
        expect(source, `${algorithmId}/${language}`).not.toBeNull();
        expect(REFERENCE_ANNOTATIONS[fileName]?.length ?? 0, fileName).toBeGreaterThanOrEqual(3);

        const zh = localize(source!, algorithmId, fileName, language, 'zh');
        const en = localize(source!, algorithmId, fileName, language, 'en');
        expect(codeOnly(zh, language), `${fileName}/zh`).toBe(codeOnly(source!, language));
        expect(codeOnly(en, language), `${fileName}/en`).toBe(codeOnly(source!, language));
        expect(en, `${fileName}/en`).not.toMatch(/[\u3400-\u9fff]/);
      }
    }
  });

  it('spot-checks 14 reviewed algorithms across every textbook content domain', async () => {
    const covered = new Set<string>();
    for (const item of spotChecks) {
      covered.add(item.id);
      const source = await loadReferenceCode(item.id, item.language);
      expect(source, item.id).not.toBeNull();
      const merged = REFERENCE_ANNOTATIONS[item.fileName] ?? [];
      const annotation = merged.find((entry) => entry.en === item.en);
      expect(annotation, `${item.fileName} exact annotation`).toBeDefined();
      expect(annotation!.zh, `${item.fileName} reviewed zh`).toBe(item.zh);

      const zh = localize(source!, item.id, item.fileName, item.language, 'zh');
      const en = localize(source!, item.id, item.fileName, item.language, 'en');
      expect(zh, `${item.fileName}/zh`).toContain(item.zh);
      expect(zh, `${item.fileName}/zh still English`).not.toContain(item.en);
      expect(en, `${item.fileName}/en`).toContain(item.en);
      expect(en, `${item.fileName}/en still Chinese`).not.toMatch(/[\u3400-\u9fff]/);
    }
    expect(covered.size).toBe(14);
  });
});
