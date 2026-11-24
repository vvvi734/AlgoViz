import { describe, expect, it } from 'vitest';
import { localizeComplexity, localizeTraceMessage } from './localizeMessage';

describe('localizeTraceMessage', () => {
  it('picks the Chinese half of a bilingual trace message', () => {
    expect(localizeTraceMessage('空表：5 个桶全部为 NULL / Empty table: all 5 buckets are NULL', 'zh'))
      .toBe('空表：5 个桶全部为 NULL');
  });

  it('picks the English half of a bilingual trace message', () => {
    expect(localizeTraceMessage('空表：5 个桶全部为 NULL / Empty table: all 5 buckets are NULL', 'en'))
      .toBe('Empty table: all 5 buckets are NULL');
  });

  it('explains machine status tokens only in the Chinese display layer', () => {
    expect(localizeTraceMessage('EMPTY / OCCUPIED', 'en')).toBe('EMPTY / OCCUPIED');
    expect(localizeTraceMessage('EMPTY / OCCUPIED', 'zh')).toBe('空槽（EMPTY） / 占用（OCCUPIED）');
    expect(localizeTraceMessage('删除后写入 DELETED / delete writes DELETED', 'zh'))
      .toBe('删除后写入 已删除（DELETED）');
    expect(localizeTraceMessage('堆后缀 SORTED / heap suffix SORTED', 'zh'))
      .toBe('堆后缀 已排序（SORTED）');
  });

  it('keeps plain and empty messages unchanged', () => {
    expect(localizeTraceMessage('relax B→E', 'zh')).toBe('relax B→E');
    expect(localizeTraceMessage('   ', 'en')).toBe('');
  });
});

describe('localizeComplexity', () => {
  it('translates a Chinese descriptor in English mode', () => {
    expect(localizeComplexity('最好 O(1)；平均与最坏 O(log n)', 'en'))
      .toBe('Best O(1); average and worst O(log n)');
    expect(localizeComplexity('O(n) 辅助空间（数组实现）', 'en'))
      .toBe('O(n) auxiliary space (array implementation)');
  });

  it('returns Chinese and notation-only strings unchanged', () => {
    expect(localizeComplexity('最好 O(1)；平均与最坏 O(log n)', 'zh'))
      .toBe('最好 O(1)；平均与最坏 O(log n)');
    expect(localizeComplexity('O(V + E)', 'en')).toBe('O(V + E)');
  });
});
