import type { Lang } from '../../i18n/types';
import { ALGORITHM_CATALOG, ALGORITHM_GROUPS } from './catalog.generated';
import { LANGUAGE_EXAMPLES } from './languageExamples.generated';
import type { AlgorithmCatalog, AlgorithmGroup, CodeLanguage } from './types';
import { CODE_LANGUAGE_LABELS } from './types';

export const catalog: AlgorithmCatalog = ALGORITHM_CATALOG;

export const algorithmIds = (): string[] => Object.keys(catalog);

export function localizedName(id: string, lang: Lang): string {
  const pair = catalog[id]?.name;
  if (!pair) return id;
  return pair[lang === 'zh' ? 0 : 1] ?? pair[0];
}

export function localizedText(pair: string[], lang: Lang): string {
  return pair[lang === 'zh' ? 0 : 1] ?? pair[0] ?? '';
}

export function labelForLanguage(lang: CodeLanguage): string {
  return CODE_LANGUAGE_LABELS[lang];
}

export function groupLabel(group: AlgorithmGroup | string, lang: Lang): string {
  const labels: Record<string, [string, string]> = {
    sort: ['排序算法', 'SORTING'],
    search: ['查找算法', 'SEARCHING'],
    ds: ['基础数据结构', 'DATA STRUCTURES'],
    graph: ['图算法', 'GRAPHS'],
    tree: ['树算法', 'TREES'],
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
  const preset = LANGUAGE_EXAMPLES[language]?.[algoId];
  if (preset) return preset;
  const name = entry?.name[1] ?? algoId;
  if (language === 'python') {
    return `# ${name}: write Python code and call trace(state, message).\n# Input is available as variable: input\ntrace({'type':'array','values': [1,2,3]}, 'Example frame')`;
  }
  return `// ${name}: implement this algorithm in ${labelForLanguage(language)}.\n// Emit lines prefixed with TRACE followed by JSON snapshots.\n// A configured isolated /api/execute backend is required.\n`;
}

export function engineNote(language: CodeLanguage, lang: Lang): string {
  const b = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  if (language === 'js') {
    return b('JavaScript：浏览器 Worker 本地执行，可离线演示。', 'JavaScript: runs locally inside a browser Worker.');
  }
  if (language === 'python') {
    return b(
      'Python 首次使用需联网加载 Pyodide；之后可逐帧展示 trace() 状态。',
      'Python needs a one-time Pyodide download; trace() frames play locally.',
    );
  }
  return b(
    'C/C++ 需要安全执行后端 /api/execute；当前仓库不提供该服务，静态页面不会假装编译本地代码。',
    'C/C++ require a sandboxed /api/execute backend; this repo does not ship one.',
  );
}
