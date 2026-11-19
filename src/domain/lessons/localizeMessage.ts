import type { LessonLang } from './types';

const CJK = /[\u3400-\u9fff]/;

/**
 * UX-SIMPLIFY-02: many real Python traces emit one string in the shape
 * `中文说明 / English note`. The trace data is shared by both UI languages, so
 * pick the matching half at render time instead of showing both.
 *
 * Strings that are not bilingual (e.g. `EMPTY / OCCUPIED`) are left intact.
 */
export function localizeTraceMessage(message: string, lang: LessonLang): string {
  const value = message.trim();
  if (!value) return value;
  const splitAt = value.indexOf(' / ');
  if (splitAt <= 0) return value;
  const left = value.slice(0, splitAt).trim();
  const right = value.slice(splitAt + 3).trim();
  if (!left || !right) return value;
  const leftIsZh = CJK.test(left);
  const rightIsZh = CJK.test(right);
  if (leftIsZh === rightIsZh) return value;
  if (lang === 'zh') return leftIsZh ? left : right;
  return leftIsZh ? right : left;
}

/**
 * Complexity rows are notation plus a short Chinese descriptor. The notation
 * is universal, so only the descriptor needs translating when the UI is in
 * English. Values are exact because lesson data is reviewed copy, not free
 * prose that should be machine-translated.
 */
const COMPLEXITY_EN: Record<string, string> = {
  '最好 O(1)；平均与最坏 O(log n)': 'Best O(1); average and worst O(log n)',
  '平均 O(log n) · 最坏 O(n)': 'Average O(log n) · worst O(n)',
  '查找 O(n) · 头/尾操作取决于 head/tail 维护方式':
    'Search O(n) · head/tail operations depend on how head/tail are maintained',
  '按值查找 O(n) · 已持有节点引用时局部改链 O(1)':
    'Search by value O(n) · local relinking O(1) when the node reference is already held',
  '平均/期望 O(1 + α)；最坏 O(n)': 'Average/expected O(1 + α); worst O(n)',
  '平均/期望 O(1)；最坏 O(n)': 'Average/expected O(1); worst O(n)',
  '建堆 O(n) · 插删 O(log n) · 排序 O(n log n)':
    'Build O(n) · insert/delete O(log n) · sort O(n log n)',
  '最好 O(n)，平均 O(n²)，最坏 O(n²)': 'Best O(n), average O(n²), worst O(n²)',
  '最好 O(1)；平均与最坏 O(n)': 'Best O(1); average and worst O(n)',
  'O(n log n)（最好、平均、最坏）': 'O(n log n) (best, average, worst)',
  '平均及通常期望 O(n log n)；最坏 O(n²)': 'Average and typical expected O(n log n); worst O(n²)',
  'O(n²)（最好、平均、最坏）': 'O(n²) (best, average, worst)',
  '访问 O(1) · 查找/插入/删除 O(n)': 'Access O(1) · search/insert/delete O(n)',
  '取决于间隔序列（本课 n//2 折半序列最坏 O(n²)）':
    'Depends on the gap sequence (this course’s n//2 halving sequence: worst O(n²))',
  '原地排序 O(1)': 'In-place sort O(1)',
  'O(n) 辅助空间（数组实现）': 'O(n) auxiliary space (array implementation)',
  '递归栈平均 O(log n)；最坏 O(n)': 'Recursion stack average O(log n); worst O(n)',
};

/** Translate the Chinese descriptor in a lesson complexity row. */
export function localizeComplexity(text: string, lang: LessonLang): string {
  const value = text.trim();
  if (lang === 'zh' || !value || !CJK.test(value)) return value;
  return COMPLEXITY_EN[value] ?? value;
}

