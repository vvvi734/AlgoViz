import type { Lang } from '../../i18n/types';
import { ALGORITHM_CATALOG, ALGORITHM_GROUPS } from './catalog.generated';
import { LANGUAGE_EXAMPLES } from './languageExamples.generated';
import { KMP_ENTRY } from './kmpExamples';
import { BF_ENTRY } from './bfExamples';
import { SPARSE_TRANSPOSE_ENTRY } from './sparseTransposeExamples';
import { POLYNOMIAL_ADD_ENTRY, STATIC_LINKED_ENTRY } from './chapter2Examples';
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
  kmp: KMP_ENTRY,
  'sparse-transpose': SPARSE_TRANSPOSE_ENTRY,
  'static-linked-list': STATIC_LINKED_ENTRY,
  'polynomial-add': POLYNOMIAL_ADD_ENTRY,
  'infix-to-postfix': INFIX_TO_POSTFIX_ENTRY,
  'postfix-eval': POSTFIX_EVAL_ENTRY,
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

/** Returns the preset source for an algorithm in a given teaching language. */
export function exampleFor(algoId: string, language: CodeLanguage): string {
  const entry = catalog[algoId];
  if (language === 'js') return entry?.code ?? '';
  const expressionPreset = expressionPythonExample(algoId);
  if (expressionPreset) return expressionPreset;
  const structurePreset = structurePythonExample(algoId);
  if (structurePreset) return structurePreset;
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
