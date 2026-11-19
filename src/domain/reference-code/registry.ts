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

export const REFERENCE_LICENSE = 'MIT';

/**
 * Source notes are shared by language, not repeated per algorithm. Every file
 * also carries the same note in its header.
 */
export const REFERENCE_SOURCE_NOTES: Record<ReferenceLanguage, LocalizedText> = {
  c: {
    zh: '原创 C 实现：按严蔚敏《数据结构（C语言版）》的算法思想自行编写，未逐字复制教材代码。',
    en: 'Original C implementation written from the algorithmic ideas in Yan Weimin’s Data Structures (C Language Edition); no textbook code was copied verbatim.',
  },
  cpp: {
    zh: '原创 C++17 实现：核心算法显式编写；标准库仅用于容器、输入输出和优先队列等基础设施。',
    en: 'Original C++17 implementation: the core algorithm is written explicitly; the standard library is used only for containers, I/O and infrastructure such as the priority queue.',
  },
  python: {
    zh: '参考本项目已验证的 Python 教学实现与经典算法步骤编写，并移除 trace(...) 教学追踪调用，保留算法语义与边界行为。',
    en: 'Written from this project’s tested Python teaching implementations and classic algorithm steps, with trace(...) calls removed; semantics and boundary behaviour are preserved.',
  },
};

/**
 * Convenience versions use the language's normal library surface. Their source
 * note intentionally differs from the principle versions above.
 */
export const REFERENCE_CONVENIENCE_SOURCE_NOTES: Record<ReferenceLanguage, LocalizedText> = {
  c: {
    zh: '共享便捷示例：使用 C 标准库 qsort()，完成同样的升序排序；qsort 不保证稳定。',
    en: 'Shared convenience example: C standard-library qsort() performs the same ascending sort; qsort is not guaranteed stable.',
  },
  cpp: {
    zh: '共享便捷示例：使用 std::sort() / std::stable_sort()，完成同样的升序排序；前者不保证稳定，后者稳定。',
    en: 'Shared convenience example: std::sort() / std::stable_sort() perform the same ascending sort; the former is not stable, the latter is stable.',
  },
  python: {
    zh: '共享便捷示例：使用内置 sorted() / list.sort()，完成同样的升序排序；二者都稳定，sorted 返回新列表，list.sort 原地修改。',
    en: 'Shared convenience example: built-in sorted() / list.sort() perform the same ascending sort; both are stable, sorted returns a new list and list.sort mutates in place.',
  },
};

export interface ReferenceFileMeta {
  fileName: string;
  /** Optional path under sources/, used by the shared built-in sorting example. */
  path?: string;
}

export interface ReferenceEntry {
  /** Manual/principle implementation. */
  files: Partial<Record<ReferenceLanguage, ReferenceFileMeta>>;
  /** Optional language-native convenience implementation. */
  convenience?: Partial<Record<ReferenceLanguage, ReferenceFileMeta>>;
}

/**
 * One shared convenience resource serves bubble, selection and insertion.
 * It is not registered as a fourth algorithm; each page links to the same file.
 */
const SHARED_SORTING_FILES: Partial<Record<ReferenceLanguage, ReferenceFileMeta>> = {
  c: { fileName: 'builtin_sorting.c', path: 'shared/builtin_sorting.c' },
  cpp: { fileName: 'builtin_sorting.cpp', path: 'shared/builtin_sorting.cpp' },
  python: { fileName: 'builtin_sorting.py', path: 'shared/builtin_sorting.py' },
};

/**
 * Only algorithms with independently checked code are registered. A missing
 * entry or language is shown as “暂未收录”, never filled with another
 * algorithm’s source.
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
  },
  bubble: {
    files: {
      c: { fileName: 'bubble_sort.c' },
      cpp: { fileName: 'bubble_sort.cpp' },
      python: { fileName: 'bubble_sort.py' },
    },
    convenience: SHARED_SORTING_FILES,
  },
  selection: {
    files: {
      c: { fileName: 'selection_sort.c' },
      cpp: { fileName: 'selection_sort.cpp' },
      python: { fileName: 'selection_sort.py' },
    },
    convenience: SHARED_SORTING_FILES,
  },
  insertion: {
    files: {
      c: { fileName: 'insertion_sort.c' },
      cpp: { fileName: 'insertion_sort.cpp' },
      python: { fileName: 'insertion_sort.py' },
    },
    convenience: SHARED_SORTING_FILES,
  },
  merge: {
    files: {
      c: { fileName: 'merge_sort.c' },
      cpp: { fileName: 'merge_sort.cpp' },
      python: { fileName: 'merge_sort.py' },
    },
  },
  dijkstra: {
    files: {
      c: { fileName: 'dijkstra.c' },
      cpp: { fileName: 'dijkstra.cpp' },
      python: { fileName: 'dijkstra.py' },
    },
  },
};

/** Formal courses that still need a verified three-language reference. */
export const REFERENCE_CODE_BACKLOG = [
  'shell',
  'quick',
  'factorial',
  'stack',
  'queue',
  'seqlist',
  'doubly',
  'circular',
  'inorder',
  'bst',
  'avl',
  'heap',
  'huffman',
  'bfs',
  'dfs',
  'floyd-warshall',
  'bellman-ford',
  'prim',
  'kruskal',
  'topological',
  'critical-path',
  'components',
  'scc',
  'linear',
  'hash-chain',
  'hash-probe',
] as const;

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
