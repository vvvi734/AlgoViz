import { describe, expect, it } from 'vitest';
import { REFERENCE_ANNOTATIONS } from './annotations';
import { localizeReferenceSource, stripReferenceComments } from './localization';
import { loadReferenceCode, type ReferenceLanguage } from './registry';

interface Target {
  algorithmId: string;
  algorithmName: string;
  fileName: string;
  language: ReferenceLanguage;
  anchors: string[];
}

const targets: Target[] = [
  {
    algorithmId: 'circular',
    algorithmName: '循环链表',
    fileName: 'circular_linked_list.c',
    language: 'c',
    anchors: [
      'For the first node, next must point to itself: this single node is immediately both head and tail, so it already closes the ring.',
      'Save next before free: once the node is released, reading node->next would touch invalid memory.',
    ],
  },
  {
    algorithmId: 'circular',
    algorithmName: '循环链表',
    fileName: 'circular_linked_list.cpp',
    language: 'cpp',
    anchors: [
      'nothrow makes allocation failure a null pointer, allowing append to return false before the existing ring is touched.',
      'Join the old tail to the new node before moving tail_; moving first would lose the only pointer to the old tail.',
    ],
  },
  {
    algorithmId: 'circular',
    algorithmName: '循环链表',
    fileName: 'circular_linked_list.py',
    language: 'python',
    anchors: [
      'An empty ring has no node: both head and tail are None; neither points at a sentinel.',
      'The loop is not waiting for None: a non-empty ring has no None terminator, so it stops by comparing the advanced pointer with head.',
    ],
  },
  {
    algorithmId: 'kmp',
    algorithmName: 'KMP 字符串匹配',
    fileName: 'kmp.c',
    language: 'c',
    anchors: [
      "position is the prefix length being extended; border is that prefix's longest proper border length.",
      'A mismatch falls back to the longest border of the matched prefix; the text index stays put because that prefix is already known to match.',
    ],
  },
  {
    algorithmId: 'kmp',
    algorithmName: 'KMP 字符串匹配',
    fileName: 'kmp.cpp',
    language: 'cpp',
    anchors: [
      'j is a length, so the last matched character is at j-1; lps[j-1] is the next shorter border to try.',
      'A full match ends at i-1, so i-m is its start; j then falls back to lps[m-1] to preserve the longest overlap.',
    ],
  },
  {
    algorithmId: 'kmp',
    algorithmName: 'KMP 字符串匹配',
    fileName: 'kmp.py',
    language: 'python',
    anchors: [
      'lps[i] is a length, not a position: on mismatch fall back to lps[j - 1].',
      'Here i is the text position and j is the matched prefix length, not a character index into pattern.',
    ],
  },
  {
    algorithmId: 'articulation',
    algorithmName: '图的关节点',
    fileName: 'articulation.c',
    language: 'c',
    anchors: [
      "For a non-root u, low[v] >= disc[u] means no back edge from v's subtree can bypass u, so removing u separates that subtree.",
      'Skip the parent edge explicitly: it is the tree edge that discovered u, not a cycle back to an ancestor.',
    ],
  },
  {
    algorithmId: 'articulation',
    algorithmName: '图的关节点',
    fileName: 'articulation.cpp',
    language: 'cpp',
    anchors: [
      "For non-root u, low[v] >= disc[u] means v's subtree has no bypass around u, so u becomes a cut vertex.",
      'The parent edge is the tree edge that discovered u; treating it as a back edge would give every non-root a false bypass.',
    ],
  },
  {
    algorithmId: 'articulation',
    algorithmName: '图的关节点',
    fileName: 'articulation.py',
    language: 'python',
    anchors: [
      "For non-root u, low[v] >= disc[u] means no back edge from v's subtree can bypass u, so removing u separates that subtree.",
      'Exclude the parent edge explicitly: it is the tree edge that discovered u, not a back edge to an ancestor.',
    ],
  },
  {
    algorithmId: 'radix',
    algorithmName: '基数排序',
    fileName: 'radix_sort.c',
    language: 'c',
    anchors: [
      "Dividing by the current place value removes lower digits; %10 keeps this pass's digit. Missing higher positions naturally yield 0.",
      'After the most significant pass, every decimal digit has been applied from least to most significant; stability carried lower-digit order forward, so order is fully sorted.',
    ],
  },
  {
    algorithmId: 'radix',
    algorithmName: '基数排序',
    fileName: 'radix_sort.cpp',
    language: 'cpp',
    anchors: [
      'The place value selects one decimal digit; a shorter number has implicit leading zeros, so division naturally yields 0 beyond its top digit.',
      'push_back appends at the bucket tail; when buckets are collected front-to-back, this preserves FIFO order.',
    ],
  },
  {
    algorithmId: 'radix',
    algorithmName: '基数排序',
    fileName: 'radix_sort.py',
    language: 'python',
    anchors: [
      "Integer division removes lower digits and %10 selects this pass's digit; a short number behaves as if its missing high digits were zero.",
      'After the highest digit, every position has been applied; stable passes preserve lower digits, so the returned order is fully sorted.',
    ],
  },
  {
    algorithmId: 'replacement',
    algorithmName: '置换选择排序',
    fileName: 'replacement_selection.c',
    language: 'c',
    anchors: [
      'The workspace holds only resident candidates; current is a separate run buffer, so a run may grow beyond the workspace capacity.',
      'Mark the output slot empty so exactly one replacement can be read into it; frozen records must not be overwritten.',
    ],
  },
  {
    algorithmId: 'replacement',
    algorithmName: '置换选择排序',
    fileName: 'replacement_selection.cpp',
    language: 'cpp',
    anchors: [
      'workspace holds resident candidates only; current is a separate vector, so an output run can be larger than the workspace.',
      'current is appended in nondecreasing key order: every eligible refill must be at least the last output of this run.',
    ],
  },
  {
    algorithmId: 'replacement',
    algorithmName: '置换选择排序',
    fileName: 'replacement_selection.py',
    language: 'python',
    anchors: [
      'workspace stores resident candidates; current is a separate list, so the emitted run can grow beyond capacity.',
      'current is appended in nondecreasing key order: every eligible refill is checked against last_output.',
    ],
  },
];

function codeOnly(source: string, language: ReferenceLanguage): string {
  return stripReferenceComments(source, language)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .join('\n');
}

function localize(source: string, target: Target, lang: 'zh' | 'en'): string {
  return localizeReferenceSource(source, {
    algorithmId: target.algorithmId,
    algorithmName: target.algorithmName,
    language: target.language,
    implementation: 'principle',
    fileName: target.fileName,
    lang,
  });
}

describe('CODE-DOC-04-BATCH-01 teaching annotations', () => {
  for (const target of targets) {
    it(`renders and preserves ${target.fileName} in both languages`, async () => {
      const source = await loadReferenceCode(target.algorithmId, target.language);
      expect(source, target.fileName).not.toBeNull();
      const annotations = REFERENCE_ANNOTATIONS[target.fileName] ?? [];
      expect(annotations.length, target.fileName).toBeGreaterThan(0);

      for (const annotation of annotations) {
        expect(source!, `${target.fileName} stale anchor: ${annotation.en}`).toContain(annotation.en);
      }

      const zh = localize(source!, target, 'zh');
      const en = localize(source!, target, 'en');
      for (const anchor of target.anchors) {
        const annotation = annotations.find((item) => item.en === anchor);
        expect(annotation, `${target.fileName} missing annotation: ${anchor}`).toBeDefined();
        expect(annotation!.zh, `${target.fileName} missing Chinese: ${anchor}`).toMatch(
          /[\u3400-\u9fff]/,
        );
        expect(zh, `${target.fileName}/zh: ${anchor}`).toContain(annotation!.zh);
        expect(zh, `${target.fileName}/zh still English: ${anchor}`).not.toContain(anchor);
        expect(en, `${target.fileName}/en: ${anchor}`).toContain(anchor);
      }

      expect(en, target.fileName).not.toMatch(/[\u3400-\u9fff]/);
      expect(codeOnly(zh, target.language), `${target.fileName}/zh`).toBe(
        codeOnly(source!, target.language),
      );
      expect(codeOnly(en, target.language), `${target.fileName}/en`).toBe(
        codeOnly(source!, target.language),
      );
    });
  }
});
