export type CodeLanguage = 'js' | 'python' | 'cpp' | 'c';

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

export const CODE_LANGUAGES: CodeLanguage[] = ['js', 'python', 'cpp', 'c'];

export const CODE_LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  js: 'JavaScript',
  python: 'Python',
  cpp: 'C++17',
  c: 'C11',
};

/**
 * Local execution is available for JavaScript (Worker) and Python (Pyodide).
 * C/C++ require an external sandboxed executor which is NOT shipped here.
 * See docs/ARCHITECTURE.md and Issue 08.
 */
export const LOCALLY_EXECUTABLE: Record<CodeLanguage, boolean> = {
  js: true,
  python: true,
  cpp: false,
  c: false,
};
