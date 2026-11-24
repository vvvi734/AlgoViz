import type { LessonLang } from './types';

const CJK = /[\u3400-\u9fff]/;

/**
 * Trace payloads deliberately keep machine-stable status tokens. Only the
 * Chinese rendering gets a visible gloss; the events themselves are unchanged,
 * so stepping backwards still reads the same frame.
 */
const CHINESE_STATUS_LABELS: Record<string, string> = {
  EMPTY: '空槽（EMPTY）',
  OCCUPIED: '占用（OCCUPIED）',
  DELETED: '已删除（DELETED）',
  SORTED: '已排序（SORTED）',
};

function localizeStatusTokens(value: string): string {
  return value.replace(/\b(EMPTY|OCCUPIED|DELETED|SORTED)\b/g, (token) =>
    CHINESE_STATUS_LABELS[token] ?? token,
  );
}

/**
 * UX-SIMPLIFY-02: many real Python traces emit one string in the shape
 * `中文说明 / English note`. The trace data is shared by both UI languages, so
 * pick the matching half at render time instead of showing both.
 *
 * Strings that are not bilingual (e.g. `EMPTY / OCCUPIED`) are left intact
 * except for the reviewed Chinese status gloss above.
 */
export function localizeTraceMessage(message: string, lang: LessonLang): string {
  const value = message.trim();
  if (!value) return value;
  const splitAt = value.indexOf(' / ');
  let selected = value;
  if (splitAt > 0) {
    const left = value.slice(0, splitAt).trim();
    const right = value.slice(splitAt + 3).trim();
    if (left && right) {
      const leftIsZh = CJK.test(left);
      const rightIsZh = CJK.test(right);
      if (leftIsZh !== rightIsZh) {
        if (lang === 'zh') selected = leftIsZh ? left : right;
        else selected = leftIsZh ? right : left;
      }
    }
  }
  return lang === 'zh' ? localizeStatusTokens(selected) : selected;
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
  '按位置定位 O(n) · 改游标 O(1) · 遍历 O(n)':
    'Locate by position O(n) · relink cursors O(1) · traverse O(n)',
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
  'O(log_m n) 节点访问': 'O(log_m n) node visits',
  'O(log n) 节点访问': 'O(log n) node visits',
  'O(√n) 次比较（块长约 √n 时）': 'O(√n) comparisons (with block length near √n)',
  '点查找 O(log_m n)；范围查询 O(log_m n + k)': 'Point search O(log_m n); range query O(log_m n + k)',
  '查找、插入 O(L)；L 为关键字长度': 'Search and insert O(L); L is key length',
  'O(ΣL) 个字符节点': 'O(ΣL) character nodes',
  '递归栈平均 O(log n)；最坏 O(n)': 'Recursion stack average O(log n); worst O(n)',
  'O(m+n)（结果链新建结点）': 'O(m+n) (a new result chain is allocated)',
  '建树 O(n)；每输出一个记录更新 O(log n)，共 O(n log n)':
    'Build O(n); each output updates one path in O(log n), total O(n log n)',
  'O(n) 选择树（2n-1 个节点；补齐到 2 的幂时不超过 4n）':
    'O(n) selection tree (2n-1 nodes; at most 4n when padded to a power of two)',
  'O(d(n + k))，d 为最大位数，k=10 为基数':
    'O(d(n + k)) where d is the maximum digit count and k=10 is the radix',
  'O(n + k)（记录引用/链节点与 10 个桶）':
    'O(n + k) (record references/links and 10 buckets)',
  'O(n × k)；败者树可降至 O(n log k)':
    'O(n × k); a loser tree reduces selection to O(n log k)',
  'O(k × B + B) 个缓冲区槽位，外加输出序列':
    'O(k × B + B) buffer slots plus the output sequence',
  '每条输出线性扫描工作区 O(M)，共 n 条，O(n × M)':
    'Each output scans the workspace in O(M); n outputs cost O(n × M)',
  'O(M) 工作区 + O(n) 输入与输出段':
    'O(M) workspace plus O(n) input and output run storage',
  'O(n × k)；用堆可降至 O(n log n)':
    'O(n × k); a heap can reduce this to O(n log n)',
  'O(n) 个树节点（含虚拟叶）':
    'O(n) tree nodes including virtual leaves',
  'O(E + B)，E 为实际检查的索引项数，B 为块内记录数':
    'O(E + B), where E is the index entries actually probed and B is the records per block',
  'O(n) 稠密索引 / O(n/B) 稀疏索引，外加数据块':
    'O(n) for a dense index or O(n/B) for a sparse index, plus the data blocks',
  'O(E + C + B)，E 索引项、C 溢出链节点、B 块内记录':
    'O(E + C + B), where E is index entries, C is overflow nodes and B is records per block',
  '主区 O(n) + 索引 O(块数) + 溢出区 O(溢出记录)':
    'O(n) main area + O(number of blocks) index + O(overflow records) overflow area',
  '构建 O(T)；查询 O(Σ|L_i|) 的列表读取与集合运算':
    'Build O(T); query reads posting lists and performs set operations in O(Σ|L_i|)',
  'O(T + P)，T 为不同关键字数，P 为倒排项总数':
    'O(T + P), where T is the number of distinct terms and P is the total number of postings',
};

/** Translate the Chinese descriptor in a lesson complexity row. */
export function localizeComplexity(text: string, lang: LessonLang): string {
  const value = text.trim();
  if (lang === 'zh' || !value || !CJK.test(value)) return value;
  return COMPLEXITY_EN[value] ?? value;
}

