/**
 * Teaching languages.
 *
 * Python is the primary teaching language; JavaScript remains as the frontend
 * implementation language that also powers the existing 12-algorithm demo set.
 * C and C++ were removed from the roadmap (see docs/STAGE1_REPORT.md) and no
 * longer appear in any user-facing entry point.
 */
export type CodeLanguage = 'js' | 'python';

/** Groups currently shipped by the catalog. `custom` is created by AI import. */
export type AlgorithmGroup = 'sort' | 'search' | 'ds' | 'graph' | 'tree' | 'custom';

export interface AlgorithmEntry {
  group: string;
  icon: string;
  name: string[];
  desc: string[];
  time: string;
  space: string;
  input: unknown;
  code: string;
}

export type AlgorithmCatalog = Record<string, AlgorithmEntry>;

export const CODE_LANGUAGES: CodeLanguage[] = ['js', 'python'];

export const CODE_LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  js: 'JavaScript',
  python: 'Python',
};
