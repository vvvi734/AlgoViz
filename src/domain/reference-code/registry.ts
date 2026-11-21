import type { LocalizedText } from '../lessons/types';

export type ReferenceLanguage = 'c' | 'cpp' | 'python';

export const REFERENCE_LANGUAGES: readonly ReferenceLanguage[] = ['c', 'cpp', 'python'];

export type ReferenceImplementation = 'principle' | 'convenience';

export const REFERENCE_IMPLEMENTATIONS: readonly ReferenceImplementation[] = [
  'principle',
  'convenience',
];

export const REFERENCE_LANGUAGE_LABELS: Record<ReferenceLanguage, string> = {
  c: 'C',
  cpp: 'C++',
  python: 'Python',
};

/**
 * Generic convenience note for non-sorting tasks. Sorting pages override it
 * with the stability-specific note below.
 */
export const REFERENCE_CONVENIENCE_NOTES: Record<ReferenceLanguage, LocalizedText> = {
  c: {
    zh: '共享便捷示例：使用 C 标准库中与该任务对应的成熟接口（qsort、bsearch）；调用方负责提供正确的数组、长度与比较函数。',
    en: 'Shared convenience example: mature C standard-library interfaces for the task (qsort, bsearch); the caller supplies the array, length and comparison function.',
  },
  cpp: {
    zh: '共享便捷示例：使用 C++ 标准库中与该任务对应的成熟容器或算法（std::sort、std::lower_bound、std::stack、std::queue、std::priority_queue、std::set、std::list 等）。',
    en: 'Shared convenience example: mature C++ standard-library containers or algorithms for the task (std::sort, std::lower_bound, std::stack, std::queue, std::priority_queue, std::set, std::list, and so on).',
  },
  python: {
    zh: '共享便捷示例：使用 Python 标准库中与该任务对应的成熟接口（sorted、bisect、heapq、collections.deque、math.factorial、dict 等）。',
    en: 'Shared convenience example: mature Python standard-library interfaces for the task (sorted, bisect, heapq, collections.deque, math.factorial, dict, and so on).',
  },
};

/** Sorting-specific note keeps the stability details visible to learners. */
const SORTING_CONVENIENCE_NOTE: Record<ReferenceLanguage, LocalizedText> = {
  c: {
    zh: '共享便捷示例：使用 C 标准库 qsort() 完成升序排序；qsort 不保证稳定。',
    en: 'Shared convenience example: C standard-library qsort() performs the ascending sort; qsort is not guaranteed stable.',
  },
  cpp: {
    zh: '共享便捷示例：使用 std::sort() / std::stable_sort() 完成升序排序；前者不保证稳定，后者稳定。',
    en: 'Shared convenience example: std::sort() / std::stable_sort() perform the ascending sort; the former is not stable, the latter is stable.',
  },
  python: {
    zh: '共享便捷示例：使用内置 sorted() / list.sort() 完成升序排序；二者都稳定，sorted 返回新列表，list.sort 原地修改。',
    en: 'Shared convenience example: built-in sorted() / list.sort() perform the ascending sort; both are stable, sorted returns a new list and list.sort mutates in place.',
  },
};

export interface ReferenceFileMeta {
  fileName: string;
  /** Optional path under sources/, used by shared resources. */
  path?: string;
}

export interface ReferenceEntry {
  /** Manual/principle implementation. */
  files: Partial<Record<ReferenceLanguage, ReferenceFileMeta>>;
  /** Optional language-native convenience implementation. */
  convenience?: Partial<Record<ReferenceLanguage, ReferenceFileMeta>>;
  /** Optional footer override for the convenience implementation. */
  convenienceNote?: Partial<Record<ReferenceLanguage, LocalizedText>>;
}

/**
 * Shared resources are registered once and linked from several algorithm
 * pages; they are never treated as separate algorithms.
 */
const SHARED_SORTING_FILES: Partial<Record<ReferenceLanguage, ReferenceFileMeta>> = {
  c: { fileName: 'builtin_sorting.c', path: 'shared/builtin_sorting.c' },
  cpp: { fileName: 'builtin_sorting.cpp', path: 'shared/builtin_sorting.cpp' },
  python: { fileName: 'builtin_sorting.py', path: 'shared/builtin_sorting.py' },
};

const SHARED_SEARCH_FILES: Partial<Record<ReferenceLanguage, ReferenceFileMeta>> = {
  c: { fileName: 'builtin_search.c', path: 'shared/builtin_search.c' },
  cpp: { fileName: 'builtin_search.cpp', path: 'shared/builtin_search.cpp' },
  python: { fileName: 'builtin_search.py', path: 'shared/builtin_search.py' },
};

/**
 * Every formal course has an independently checked principle implementation in
 * C, C++ and Python. Convenience implementations are added only when the
 * language's standard library offers a genuinely different, teachable route.
 */
export const REFERENCE_CODE: Record<string, ReferenceEntry> = {
  linked: {
    files: {
      c: { fileName: 'singly_linked_list.c' },
      cpp: { fileName: 'singly_linked_list.cpp' },
      python: { fileName: 'singly_linked_list.py' },
    },
  },
  binary: {
    files: {
      c: { fileName: 'binary_search.c' },
      cpp: { fileName: 'binary_search.cpp' },
      python: { fileName: 'binary_search.py' },
    },
    convenience: SHARED_SEARCH_FILES,
  },
  bubble: {
    files: {
      c: { fileName: 'bubble_sort.c' },
      cpp: { fileName: 'bubble_sort.cpp' },
      python: { fileName: 'bubble_sort.py' },
    },
    convenience: SHARED_SORTING_FILES,
    convenienceNote: SORTING_CONVENIENCE_NOTE,
  },
  selection: {
    files: {
      c: { fileName: 'selection_sort.c' },
      cpp: { fileName: 'selection_sort.cpp' },
      python: { fileName: 'selection_sort.py' },
    },
    convenience: SHARED_SORTING_FILES,
    convenienceNote: SORTING_CONVENIENCE_NOTE,
  },
  insertion: {
    files: {
      c: { fileName: 'insertion_sort.c' },
      cpp: { fileName: 'insertion_sort.cpp' },
      python: { fileName: 'insertion_sort.py' },
    },
    convenience: SHARED_SORTING_FILES,
    convenienceNote: SORTING_CONVENIENCE_NOTE,
  },
  shell: {
    files: {
      c: { fileName: 'shell_sort.c' },
      cpp: { fileName: 'shell_sort.cpp' },
      python: { fileName: 'shell_sort.py' },
    },
    convenience: SHARED_SORTING_FILES,
    convenienceNote: SORTING_CONVENIENCE_NOTE,
  },
  quick: {
    files: {
      c: { fileName: 'quick_sort.c' },
      cpp: { fileName: 'quick_sort.cpp' },
      python: { fileName: 'quick_sort.py' },
    },
    convenience: SHARED_SORTING_FILES,
    convenienceNote: SORTING_CONVENIENCE_NOTE,
  },
  merge: {
    files: {
      c: { fileName: 'merge_sort.c' },
      cpp: { fileName: 'merge_sort.cpp' },
      python: { fileName: 'merge_sort.py' },
    },
  },
  factorial: {
    files: {
      c: { fileName: 'factorial.c' },
      cpp: { fileName: 'factorial.cpp' },
      python: { fileName: 'factorial.py' },
    },
    convenience: {
      python: { fileName: 'factorial_builtin.py' },
    },
  },
  fib: {
    files: {
      c: { fileName: 'fib.c' },
      cpp: { fileName: 'fib.cpp' },
      python: { fileName: 'fib.py' },
    },
  },
  stack: {
    files: {
      c: { fileName: 'stack.c' },
      cpp: { fileName: 'stack.cpp' },
      python: { fileName: 'stack.py' },
    },
    convenience: {
      cpp: { fileName: 'stack_builtin.cpp' },
      python: { fileName: 'stack_builtin.py' },
    },
  },
  queue: {
    files: {
      c: { fileName: 'queue.c' },
      cpp: { fileName: 'queue.cpp' },
      python: { fileName: 'queue.py' },
    },
    convenience: {
      cpp: { fileName: 'queue_builtin.cpp' },
      python: { fileName: 'queue_builtin.py' },
    },
  },
  seqlist: {
    files: {
      c: { fileName: 'seqlist.c' },
      cpp: { fileName: 'seqlist.cpp' },
      python: { fileName: 'seqlist.py' },
    },
    convenience: {
      cpp: { fileName: 'seqlist_builtin.cpp' },
      python: { fileName: 'seqlist_builtin.py' },
    },
  },
  doubly: {
    files: {
      c: { fileName: 'doubly_linked_list.c' },
      cpp: { fileName: 'doubly_linked_list.cpp' },
      python: { fileName: 'doubly_linked_list.py' },
    },
    convenience: {
      cpp: { fileName: 'doubly_linked_list_builtin.cpp' },
    },
  },
  circular: {
    files: {
      c: { fileName: 'circular_linked_list.c' },
      cpp: { fileName: 'circular_linked_list.cpp' },
      python: { fileName: 'circular_linked_list.py' },
    },
  },
  inorder: {
    files: {
      c: { fileName: 'inorder.c' },
      cpp: { fileName: 'inorder.cpp' },
      python: { fileName: 'inorder.py' },
    },
    convenience: {
      c: { fileName: 'levelorder_queue.c' },
      cpp: { fileName: 'levelorder_queue.cpp' },
      python: { fileName: 'levelorder_queue.py' },
    },
    convenienceNote: {
      c: {
        zh: '队列版层序遍历：队首出队后访问，再按从左到右把孩子入队。',
        en: 'Queue-based level order: dequeue and visit the front, then enqueue children left to right.',
      },
      cpp: {
        zh: '使用 std::queue 的层序遍历；队首出队后访问，再按从左到右把孩子入队。',
        en: 'Level order with std::queue: pop the front to visit it, then enqueue children left to right.',
      },
      python: {
        zh: '使用 collections.deque 的层序遍历；popleft 取出队首，append 依次加入左、右孩子。',
        en: 'Level order with collections.deque: popleft the front, then append the left and right children.',
      },
    },
  },
  bst: {
    files: {
      c: { fileName: 'bst.c' },
      cpp: { fileName: 'bst.cpp' },
      python: { fileName: 'bst.py' },
    },
    convenience: {
      cpp: { fileName: 'bst_builtin.cpp' },
      python: { fileName: 'bst_builtin.py' },
    },
  },
  avl: {
    files: {
      c: { fileName: 'avl_tree.c' },
      cpp: { fileName: 'avl_tree.cpp' },
      python: { fileName: 'avl_tree.py' },
    },
  },
  btree: {
    files: {
      c: { fileName: 'btree.c' },
      cpp: { fileName: 'btree.cpp' },
      python: { fileName: 'btree.py' },
    },
  },
  heap: {
    files: {
      c: { fileName: 'max_heap.c' },
      cpp: { fileName: 'max_heap.cpp' },
      python: { fileName: 'max_heap.py' },
    },
    convenience: {
      cpp: { fileName: 'max_heap_builtin.cpp' },
      python: { fileName: 'max_heap_builtin.py' },
    },
  },
  huffman: {
    files: {
      c: { fileName: 'huffman.c' },
      cpp: { fileName: 'huffman.cpp' },
      python: { fileName: 'huffman.py' },
    },
    convenience: {
      cpp: { fileName: 'huffman_builtin.cpp' },
      python: { fileName: 'huffman_builtin.py' },
    },
  },
  bfs: {
    files: {
      c: { fileName: 'bfs.c' },
      cpp: { fileName: 'bfs.cpp' },
      python: { fileName: 'bfs.py' },
    },
  },
  dfs: {
    files: {
      c: { fileName: 'dfs.c' },
      cpp: { fileName: 'dfs.cpp' },
      python: { fileName: 'dfs.py' },
    },
  },
  dijkstra: {
    files: {
      c: { fileName: 'dijkstra.c' },
      cpp: { fileName: 'dijkstra.cpp' },
      python: { fileName: 'dijkstra.py' },
    },
  },
  'floyd-warshall': {
    files: {
      c: { fileName: 'floyd_warshall.c' },
      cpp: { fileName: 'floyd_warshall.cpp' },
      python: { fileName: 'floyd_warshall.py' },
    },
  },
  'bellman-ford': {
    files: {
      c: { fileName: 'bellman_ford.c' },
      cpp: { fileName: 'bellman_ford.cpp' },
      python: { fileName: 'bellman_ford.py' },
    },
  },
  prim: {
    files: {
      c: { fileName: 'prim.c' },
      cpp: { fileName: 'prim.cpp' },
      python: { fileName: 'prim.py' },
    },
  },
  kruskal: {
    files: {
      c: { fileName: 'kruskal.c' },
      cpp: { fileName: 'kruskal.cpp' },
      python: { fileName: 'kruskal.py' },
    },
  },
  topological: {
    files: {
      c: { fileName: 'topological_sort.c' },
      cpp: { fileName: 'topological_sort.cpp' },
      python: { fileName: 'topological_sort.py' },
    },
  },
  'critical-path': {
    files: {
      c: { fileName: 'critical_path.c' },
      cpp: { fileName: 'critical_path.cpp' },
      python: { fileName: 'critical_path.py' },
    },
  },
  components: {
    files: {
      c: { fileName: 'components.c' },
      cpp: { fileName: 'components.cpp' },
      python: { fileName: 'components.py' },
    },
  },
  scc: {
    files: {
      c: { fileName: 'scc.c' },
      cpp: { fileName: 'scc.cpp' },
      python: { fileName: 'scc.py' },
    },
  },
  linear: {
    files: {
      c: { fileName: 'linear_search.c' },
      cpp: { fileName: 'linear_search.cpp' },
      python: { fileName: 'linear_search.py' },
    },
  },
  'hash-chain': {
    files: {
      c: { fileName: 'hash_chain.c' },
      cpp: { fileName: 'hash_chain.cpp' },
      python: { fileName: 'hash_chain.py' },
    },
    convenience: {
      cpp: { fileName: 'hash_chain_builtin.cpp' },
      python: { fileName: 'hash_chain_builtin.py' },
    },
  },
  'hash-probe': {
    files: {
      c: { fileName: 'hash_probe.c' },
      cpp: { fileName: 'hash_probe.cpp' },
      python: { fileName: 'hash_probe.py' },
    },
    convenience: {
      cpp: { fileName: 'hash_probe_builtin.cpp' },
      python: { fileName: 'hash_probe_builtin.py' },
    },
  },
  kmp: {
    files: {
      c: { fileName: 'kmp.c' },
      cpp: { fileName: 'kmp.cpp' },
      python: { fileName: 'kmp.py' },
    },
    convenience: {
      cpp: { fileName: 'kmp_find_builtin.cpp' },
      python: { fileName: 'kmp_find_builtin.py' },
    },
    convenienceNote: {
      cpp: {
        zh: '便捷示例：std::string::find() 完成相同的“查找全部位置”任务；它只是标准库快捷用法，不保证内部采用 KMP。',
        en: 'Convenience example: std::string::find() performs the same “find every occurrence” task; it is a standard-library shortcut and is not guaranteed to use KMP internally.',
      },
      python: {
        zh: '便捷示例：str.find() 完成相同的“查找全部位置”任务；它只是标准库快捷用法，不保证内部采用 KMP。',
        en: 'Convenience example: str.find() performs the same “find every occurrence” task; it is a standard-library shortcut and is not guaranteed to use KMP internally.',
      },
    },
  },
  'sparse-transpose': {
    files: {
      c: { fileName: 'sparse_transpose.c' },
      cpp: { fileName: 'sparse_transpose.cpp' },
      python: { fileName: 'sparse_transpose.py' },
    },
    convenience: {
      cpp: { fileName: 'sparse_transpose_sort.cpp' },
      python: { fileName: 'sparse_transpose_sort.py' },
    },
    convenienceNote: {
      cpp: {
        zh: '便捷示例：先交换 row/col，再用 std::sort 按 (col,row) 排序。结果与快速转置相同，但时间是 O(t log t)，不是本课的 O(t+c)，也没有使用 num/cpot。',
        en: 'Convenience example: swap row/col, then sort by (col,row) with std::sort. The output matches fast transpose, but this is O(t log t), not the course’s O(t+c), and it does not use num/cpot.',
      },
      python: {
        zh: '便捷示例：先交换 row/col，再用 sorted 按 (col,row) 排序。结果与快速转置相同，但时间是 O(t log t)，不是本课的 O(t+c)，也没有使用 num/cpot。',
        en: 'Convenience example: swap row/col, then sort by (col,row) with sorted. The output matches fast transpose, but this is O(t log t), not the course’s O(t+c), and it does not use num/cpot.',
      },
    },
  },
};

/** All formal courses are covered by verified reference code. */
export const REFERENCE_CODE_BACKLOG: readonly string[] = [];

export const REFERENCE_CODE_ALGORITHMS = Object.keys(REFERENCE_CODE);

const modules = import.meta.glob('./sources/**/*.{c,cpp,py}', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

export function referenceLanguages(algorithmId: string): ReferenceLanguage[] {
  const entry = REFERENCE_CODE[algorithmId];
  if (!entry) return [];
  return REFERENCE_LANGUAGES.filter((language) => Boolean(entry.files[language]));
}

export function hasReferenceCode(algorithmId: string): boolean {
  return referenceLanguages(algorithmId).length > 0;
}

export function referenceFileMeta(
  algorithmId: string,
  language: ReferenceLanguage,
  implementation: ReferenceImplementation = 'principle',
): ReferenceFileMeta | null {
  const entry = REFERENCE_CODE[algorithmId];
  if (!entry) return null;
  const files = implementation === 'principle' ? entry.files : entry.convenience;
  return files?.[language] ?? null;
}

/**
 * Optional teaching note for the convenience implementation. It explains how
 * the shortcut differs from the principle algorithm; no provenance or licence
 * metadata is attached.
 */
export function referenceConvenienceNote(
  algorithmId: string,
  language: ReferenceLanguage,
): LocalizedText | null {
  return (
    REFERENCE_CODE[algorithmId]?.convenienceNote?.[language] ??
    REFERENCE_CONVENIENCE_NOTES[language]
  );
}

/**
 * Language of the comments stored in the source files. All reference code is
 * authored in English, so Chinese pages add a generated teaching header.
 */
export function referenceCommentLanguage(): 'en' {
  return 'en';
}

/** Implementations that actually have a source file for this language. */
export function referenceImplementations(
  algorithmId: string,
  language: ReferenceLanguage,
): ReferenceImplementation[] {
  return REFERENCE_IMPLEMENTATIONS.filter((implementation) =>
    Boolean(referenceFileMeta(algorithmId, language, implementation)),
  );
}

/**
 * Load one raw source file on demand. Vite keeps every source as its own lazy
 * raw module, so the first page bundle does not contain dozens of code files.
 * Shared files opt into a path under sources/ instead of the algorithm directory.
 */
export async function loadReferenceCode(
  algorithmId: string,
  language: ReferenceLanguage,
  implementation: ReferenceImplementation = 'principle',
): Promise<string | null> {
  const meta = referenceFileMeta(algorithmId, language, implementation);
  if (!meta) return null;
  const relativePath = meta.path ?? `${algorithmId}/${meta.fileName}`;
  const key = `./sources/${relativePath}`;
  const loader = modules[key];
  if (!loader) return null;
  return loader();
}
