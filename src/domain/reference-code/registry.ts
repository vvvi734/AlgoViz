import type { LocalizedText } from '../lessons/types';

export type ReferenceLanguage = 'c' | 'cpp' | 'python';

export const REFERENCE_LANGUAGES: readonly ReferenceLanguage[] = ['c', 'cpp', 'python'];

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
    zh: '参考本项目已通过测试的 Python 教学实现编写，并移除 trace(...) 教学追踪调用，保留算法语义与边界行为。',
    en: 'Written from this project’s tested Python teaching implementations with trace(...) calls removed; algorithm semantics and boundary behaviour are preserved.',
  },
};

export interface ReferenceFileMeta {
  fileName: string;
}

export interface ReferenceEntry {
  files: Partial<Record<ReferenceLanguage, ReferenceFileMeta>>;
}

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
  'bubble',
  'selection',
  'insertion',
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
): ReferenceFileMeta | null {
  return REFERENCE_CODE[algorithmId]?.files[language] ?? null;
}

/**
 * Load one raw source file on demand. Vite keeps every source as its own lazy
 * raw module, so the first page bundle does not contain dozens of code files.
 */
export async function loadReferenceCode(
  algorithmId: string,
  language: ReferenceLanguage,
): Promise<string | null> {
  const meta = referenceFileMeta(algorithmId, language);
  if (!meta) return null;
  const key = `./sources/${algorithmId}/${meta.fileName}`;
  const loader = modules[key];
  if (!loader) return null;
  return loader();
}
