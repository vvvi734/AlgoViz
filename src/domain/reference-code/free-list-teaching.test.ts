import { describe, expect, it } from 'vitest';
import { REFERENCE_ANNOTATIONS } from './annotations';
import { localizeReferenceSource, stripReferenceComments } from './localization';
import { loadReferenceCode, type ReferenceLanguage } from './registry';

const pilot = [
  {
    algorithmId: 'free-list',
    language: 'c' as const,
    fileName: 'free_list.c',
    zh: [
      '首次适应一旦遇到第一个足够大的块就可以停止',
      '最佳适应必须检查所有候选',
      'remainder_start 等于原起点加申请量',
      '先插入后缀、再缩小选中块',
      '左合并后联合块位于 index-1',
      'right_free 在左合并前就已记录',
      'chosen=-1 表示“尚无候选”',
      '联合块从左邻块的地址开始',
      '联合块保留当前起点',
    ],
    en: [
      'First Fit can stop at the first adequate block',
      'Best Fit must inspect every candidate',
      'remainder_start is old start + request',
      'Insert the suffix before shrinking the chosen block',
      'After a left merge the unified block sits at index-1',
      'right_free was captured before the left merge',
      'chosen=-1 means "no candidate"',
      "The union starts at the left neighbour",
      'The union keeps the current start',
    ],
  },
  {
    algorithmId: 'free-list',
    language: 'cpp' as const,
    fileName: 'free_list.cpp',
    zh: [
      '首次适应立即结束扫描',
      'block 是引用而不是副本',
      'vector::insert 会把后面的记录右移',
      '必须执行 index -= 1',
      'right_free 在左删除前就已记录',
      '合并区间从左邻块开始',
      '第二次合并保留当前起点',
    ],
    en: [
      'First Fit breaks immediately',
      'block is a reference, not a copy',
      'vector::insert shifts later records right',
      'index -= 1 is required',
      'right_free was captured before the left erase',
      'The merged range starts at the left neighbour',
      'The second merge keeps the current start',
    ],
  },
  {
    algorithmId: 'free-list',
    language: 'python' as const,
    fileName: 'free_list.py',
    zh: [
      'best_fit 是每次调用独立的策略开关',
      '先插入后缀、再缩小 block',
      '必须执行 index -= 1',
      'right_free 记录删除前的邻居快照',
      '条件必须重新求值',
      '合并对象从 left.start 开始',
      '第二次合并保留当前起点',
    ],
    en: [
      'best_fit is a per-call policy switch',
      'Insert the suffix before shrinking block',
      'index -= 1 is required',
      'right_free records the pre-deletion neighbour snapshot',
      'the condition must be evaluated anew',
      'The merged object starts at left.start',
      'The second merge keeps the current start',
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

function localize(
  source: string,
  language: ReferenceLanguage,
  fileName: string,
  lang: 'zh' | 'en',
): string {
  return localizeReferenceSource(source, {
    algorithmId: 'free-list',
    algorithmName: lang === 'zh' ? '空闲空间分配' : 'Free-space list',
    language,
    implementation: 'principle',
    fileName,
    lang,
  });
}

describe('free-list teaching pilot', () => {
  for (const item of pilot) {
    it(`renders complete ${item.language} internals in both languages`, async () => {
      const source = await loadReferenceCode('free-list', item.language);
      expect(source, item.language).not.toBeNull();
      expect(REFERENCE_ANNOTATIONS[item.fileName].length, item.fileName).toBeGreaterThanOrEqual(30);

      const zh = localize(source!, item.language, item.fileName, 'zh');
      const en = localize(source!, item.language, item.fileName, 'en');

      for (const phrase of item.zh) {
        expect(zh, `${item.fileName}: ${phrase}`).toContain(phrase);
      }
      for (const phrase of item.en) {
        expect(en, `${item.fileName}: ${phrase}`).toContain(phrase);
      }
      expect(zh, item.fileName).not.toContain('First Fit can stop at the first adequate block');
      expect(en, item.fileName).not.toMatch(/[\u3400-\u9fff]/);
      expect(codeOnly(zh, item.language), `${item.fileName}/zh`).toBe(
        codeOnly(source!, item.language),
      );
      expect(codeOnly(en, item.language), `${item.fileName}/en`).toBe(
        codeOnly(source!, item.language),
      );
    });
  }

  it('keeps the split and coalescing state transitions in the translated comments', async () => {
    const source = await loadReferenceCode('free-list', 'c');
    const zh = localize(source!, 'c', 'free_list.c', 'zh');
    expect(zh).toContain('只有严格大于申请量的块才分裂');
    expect(zh).toContain('两个相邻块长度之和');
    expect(zh).toContain('释放只接受“已占用且 ID 完全匹配”的记录');
    expect(zh).toContain('左合并后联合块位于 index-1');
    expect(zh).toContain('right_free 在左合并前就已记录');
  });
});
