import type { Lang } from '../../i18n/types';
import { ALGORITHM_CATALOG, ALGORITHM_GROUPS } from './catalog.generated';
import { LANGUAGE_EXAMPLES } from './languageExamples.generated';
import { KMP_ENTRY } from './kmpExamples';
import { BF_ENTRY } from './bfExamples';
import {
  GL_COPY_ENTRY,
  GL_DEPTH_ENTRY,
} from './generalizedListExamples';
import { SPARSE_TRANSPOSE_ENTRY } from './sparseTransposeExamples';
import { POLYNOMIAL_ADD_ENTRY, STATIC_LINKED_ENTRY } from './chapter2Examples';
import { THREADED_INORDER_ENTRY } from './threadedTreeExamples';
import { ARTICULATION_ENTRY } from './articulationExamples';
import {
  FREE_LIST_ENTRY,
  FREE_LIST_DEFAULT_INPUT,
  FREE_LIST_PYTHON,
} from './freeListExamples';
import {
  BUDDY_ENTRY,
  BUDDY_DEFAULT_INPUT,
  BUDDY_PYTHON,
} from './buddyExamples';
import {
  GARBAGE_COLLECTION_ENTRY,
  GARBAGE_COLLECTION_DEFAULT_INPUT,
  GARBAGE_COLLECTION_PYTHON,
} from './garbageCollectionExamples';
import {
  BLOCK_SEARCH_ENTRY,
  BLOCK_SEARCH_DEFAULT_INPUT,
  BLOCK_SEARCH_PYTHON,
} from './blockSearchExamples';
import {
  BPLUS_TREE_ENTRY,
  BPLUS_TREE_DEFAULT_INPUT,
  BPLUS_TREE_PYTHON,
} from './bplusExamples';
import {
  KEY_TREE_ENTRY,
  KEY_TREE_DEFAULT_INPUT,
  KEY_TREE_PYTHON,
} from './keyTreeExamples';
import {
  TOURNAMENT_ENTRY,
  TOURNAMENT_DEFAULT_INPUT,
  TOURNAMENT_PYTHON,
} from './tournamentExamples';
import {
  RADIX_ENTRY,
  RADIX_DEFAULT_INPUT,
  RADIX_PYTHON,
} from './radixExamples';
import { structureDefaultInput, structurePythonExample } from './structureExamples';
import {
  INFIX_TO_POSTFIX_ENTRY,
  POSTFIX_EVAL_ENTRY,
  expressionDefaultInput,
  expressionPythonExample,
} from './expressionExamples';
import type { AlgorithmCatalog, AlgorithmGroup, CodeLanguage } from './types';

export const catalog: AlgorithmCatalog = {
  ...ALGORITHM_CATALOG,
  bf: BF_ENTRY,
  'gl-depth': GL_DEPTH_ENTRY,
  'gl-copy': GL_COPY_ENTRY,
  kmp: KMP_ENTRY,
  'sparse-transpose': SPARSE_TRANSPOSE_ENTRY,
  'static-linked-list': STATIC_LINKED_ENTRY,
  'polynomial-add': POLYNOMIAL_ADD_ENTRY,
  'threaded-inorder': THREADED_INORDER_ENTRY,
  'infix-to-postfix': INFIX_TO_POSTFIX_ENTRY,
  'postfix-eval': POSTFIX_EVAL_ENTRY,
  articulation: ARTICULATION_ENTRY,
  'free-list': { ...FREE_LIST_ENTRY, input: FREE_LIST_DEFAULT_INPUT },
  'buddy-system': { ...BUDDY_ENTRY, input: BUDDY_DEFAULT_INPUT },
  'garbage-collection': { ...GARBAGE_COLLECTION_ENTRY, input: GARBAGE_COLLECTION_DEFAULT_INPUT },
  'block-search': { ...BLOCK_SEARCH_ENTRY, input: BLOCK_SEARCH_DEFAULT_INPUT },
  'bplus-tree': { ...BPLUS_TREE_ENTRY, input: BPLUS_TREE_DEFAULT_INPUT },
  'key-tree': { ...KEY_TREE_ENTRY, input: KEY_TREE_DEFAULT_INPUT },
  tournament: { ...TOURNAMENT_ENTRY, input: TOURNAMENT_DEFAULT_INPUT },
  radix: { ...RADIX_ENTRY, input: RADIX_DEFAULT_INPUT },
};

export const algorithmIds = (): string[] => Object.keys(catalog);

export function localizedName(id: string, lang: Lang): string {
  const pair = catalog[id]?.name;
  if (!pair) return id;
  return pair[lang === 'zh' ? 0 : 1] ?? pair[0];
}

export function localizedText(pair: string[], lang: Lang): string {
  return pair[lang === 'zh' ? 0 : 1] ?? pair[0] ?? '';
}

export function groupLabel(group: AlgorithmGroup | string, lang: Lang): string {
  const labels: Record<string, [string, string]> = {
    sort: ['排序算法', 'SORTING'],
    search: ['查找算法', 'SEARCHING'],
    ds: ['基础数据结构', 'DATA STRUCTURES'],
    graph: ['图算法', 'GRAPHS'],
    tree: ['树算法', 'TREES'],
    recursion: ['递归', 'RECURSION'],
    custom: ['自定义', 'CUSTOM'],
  };
  const pair = labels[group];
  return pair ? pair[lang === 'zh' ? 0 : 1] : group.toUpperCase();
}

export const groups: Array<[AlgorithmGroup, string]> = ALGORITHM_GROUPS as Array<[AlgorithmGroup, string]>;

/** Python presets authored for the three dynamic-storage modules. */
export function memoryPythonExample(algoId: string): string | null {
  if (algoId === 'free-list') return FREE_LIST_PYTHON;
  if (algoId === 'buddy-system') return BUDDY_PYTHON;
  if (algoId === 'garbage-collection') return GARBAGE_COLLECTION_PYTHON;
  return null;
}

/** Python presets authored for TEXTBOOK-09 search modules. */
export function searchPythonExample(algoId: string): string | null {
  if (algoId === 'block-search') return BLOCK_SEARCH_PYTHON;
  if (algoId === 'bplus-tree') return BPLUS_TREE_PYTHON;
  if (algoId === 'key-tree') return KEY_TREE_PYTHON;
  return null;
}

/** Python presets authored for the two new TEXTBOOK-10 sorting courses. */
export function sorting10PythonExample(algoId: string): string | null {
  if (algoId === 'tournament') return TOURNAMENT_PYTHON;
  if (algoId === 'radix') return RADIX_PYTHON;
  return null;
}

/** Returns the preset source for an algorithm in a given teaching language. */
export function exampleFor(algoId: string, language: CodeLanguage): string {
  const entry = catalog[algoId];
  if (language === 'js') return entry?.code ?? '';
  const expressionPreset = expressionPythonExample(algoId);
  if (expressionPreset) return expressionPreset;
  const structurePreset = structurePythonExample(algoId);
  if (structurePreset) return structurePreset;
  const memoryPreset = memoryPythonExample(algoId);
  if (memoryPreset) return memoryPreset;
  const searchPreset = searchPythonExample(algoId);
  if (searchPreset) return searchPreset;
  const sortingPreset = sorting10PythonExample(algoId);
  if (sortingPreset) return sortingPreset;
  const preset = LANGUAGE_EXAMPLES[language]?.[algoId];
  if (preset) return preset;
  const name = entry?.name[1] ?? algoId;
  return `# ${name}: write Python code and call trace(state, message).\n# Input is available as variable: input\ntrace({'type':'array','values': [1,2,3]}, 'Example frame')`;
}

/** Stage 7B default operations; does not mutate the legacy catalogue or frame oracle. */
export function defaultInputFor(algoId: string): unknown {
  return expressionDefaultInput(algoId) ?? structureDefaultInput(algoId) ?? catalog[algoId]?.input ?? null;
}

export function engineNote(language: CodeLanguage, lang: Lang): string {
  const b = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  if (language === 'js') {
    return b('JavaScript：浏览器 Worker 本地执行，可离线演示。', 'JavaScript: runs locally inside a browser Worker.');
  }
  return b(
    'Python 首次使用需联网加载 Pyodide；之后可逐帧展示 trace() 状态，并同步变量与代码行。',
    'Python needs a one-time Pyodide download; trace() frames play locally with variables and source lines.',
  );
}
