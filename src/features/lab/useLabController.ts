import { useCallback, useEffect, useRef, useState } from 'react';
import {
  catalog as baseCatalog,
  defaultInputFor,
  exampleFor,
  groups,
} from '../../domain/algorithms/examples';
import type { AlgorithmCatalog, CodeLanguage } from '../../domain/algorithms/types';
import type { TraceEvent } from '../../domain/trace/schema';
import { parseTraceDocument } from '../../domain/trace/schema';
import { framesToTraceDocument } from '../../domain/trace/adapter';
import type { VisualRunResult } from '../../domain/trace/types';
import { ExecutionError, formatDiagnostic, type ExecutionDiagnostic } from '../../domain/trace/diagnostic';
import { runForLanguage, isVisualResult } from '../../runtime/execute';
import { safeSet } from '../../runtime/storage';
import { guidedLanguageFor } from '../../domain/algorithms/guidedInput';
import { withTreeMode, type TreeMode } from '../../domain/algorithms/treeTraversalExamples';
import {
  bstPresetInput,
  type BstPresetId,
} from '../../domain/algorithms/bstExamples';
import {
  avlPresetInput,
  type AvlPresetId,
} from '../../domain/algorithms/avlExamples';
import {
  btreePresetInput,
  type BtreePresetId,
} from '../../domain/algorithms/btreeExamples';
import {
  heapPresetInput,
  type HeapPresetId,
} from '../../domain/algorithms/heapExamples';
import {
  huffmanPresetInput,
  type HuffmanPresetId,
} from '../../domain/algorithms/huffmanExamples';
import {
  sequentialListPresetInput,
  type SequentialListPresetId,
} from '../../domain/algorithms/sequentialListExamples';
import { useI18n } from '../../i18n/I18nProvider';
import { usePlayback, type Playback } from './usePlayback';

const CODE_LANG_KEY = 'algolens-code-language';

function isGraphAlgorithm(id: string): boolean {
  return id === 'bfs' || id === 'dfs' || id === 'dijkstra' || id === 'floyd-warshall' || id === 'bellman-ford' || id === 'prim' || id === 'kruskal' || id === 'topological' || id === 'critical-path' || id === 'components' || id === 'scc' || id === 'articulation';
}

export interface StatusMessage {
  text: string;
  error: boolean;
}

export interface LabController {
  catalog: AlgorithmCatalog;
  groups: typeof groups;
  currentAlgo: string;
  codeLang: CodeLanguage;
  editorCode: string;
  inputJson: string;
  /** Validated trace events — the single source of truth for every panel. */
  events: TraceEvent[];
  /** Source-code snapshot that produced `events`. */
  source: string;
  /** True when the editor has diverged from the snapshot used by `events`. */
  traceStale: boolean;
  /** Structured Python diagnostics for the most recent run (empty on success). */
  diagnostics: ExecutionDiagnostic[];
  playback: Playback;
  status: StatusMessage;
  selectAlgo: (id: string) => void;
  setInputJson: (input: string) => void;
  /**
   * Stage 7D: select a traversal mode by rewriting the input object
   * `{mode, tree}`. It never runs code; a real trace still requires Run.
   */
  selectTreeMode: (mode: TreeMode) => void;
  /**
   * T1: select one official BST example by rewriting the input object. It only
   * changes the input; the real trace still requires the user to press Run.
   */
  selectBstPreset: (preset: BstPresetId) => void;
  /**
   * T2: select one official AVL example by rewriting the input object. It only
   * changes the input; the real trace still requires the user to press Run.
   */
  selectAvlPreset: (preset: AvlPresetId) => void;
  /**
   * SEARCH-04: select one official order-4 B-tree example by rewriting the
   * `{preset, operation, tree, target}` input. It never runs code.
   */
  selectBTreePreset: (preset: BtreePresetId) => void;
  /**
   * T3: select one official max-heap example (build / push / extract / sort)
   * by rewriting the object input. It never runs code.
   */
  selectHeapPreset: (preset: HeapPresetId) => void;
  /**
   * T4: select one official Huffman example by rewriting the `{preset, symbols}`
   * input. It never runs code; a real Trace still requires Run.
   */
  selectHuffmanPreset: (preset: HuffmanPresetId) => void;
  /**
   * L1B: select one official sequential-list example by rewriting the
   * `{preset, capacity, values, operation, ...}` input. It never runs code.
   */
  selectSequentialListPreset: (preset: SequentialListPresetId) => void;
  runVisualization: () => void;
  /**
   * INPUT-01: run an already validated object through the same executor as the
   * current algorithm. Used by the guided input panel so a generated animation
   * can never read a stale `inputJson` from a previous render.
   */
  runInput: (input: unknown, language?: CodeLanguage) => void;
  /**
   * INPUT-01: invalidate any in-flight run and clear the old trace before
   * reporting an input error. The canvas must not keep playing frames that
   * belong to different data.
   */
  rejectInput: (message: string) => void;
  restorePreset: () => void;
  randomizeInput: () => void;
}

export function useLabController(): LabController {
  const { t, b } = useI18n();
  const catalog: AlgorithmCatalog = baseCatalog;
  const [currentAlgo, setCurrentAlgo] = useState('bubble');
  // The initial visible course is bubble sort. Its established JavaScript
  // example is the official 25-frame teaching trace, regardless of which
  // language a previous session used for another algorithm.
  const [codeLang, setCodeLangState] = useState<CodeLanguage>('js');
  const [editorCode, setEditorCodeState] = useState(() => exampleFor('bubble', 'js'));
  const [inputJson, setInputJson] = useState(() => JSON.stringify(baseCatalog.bubble.input));
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [source, setSource] = useState('');
  const [diagnostics, setDiagnostics] = useState<ExecutionDiagnostic[]>([]);
  const [status, setStatus] = useState<StatusMessage>({ text: '', error: false });
  const playback = usePlayback(events);
  const runId = useRef(0);

  const runVisualizationWith = useCallback(async (code: string, rawInput: string, language: CodeLanguage = codeLang) => {
    // Invalidate any in-flight run before parsing. Editing and running again
    // must never let a late result from the previous input overwrite the new
    // animation.
    const id = ++runId.current;
    let input: unknown;
    try {
      input = JSON.parse(rawInput);
    } catch {
      playback.stop();
      setEvents([]);
      setSource('');
      setDiagnostics([]);
      setStatus({ text: t('syntax'), error: true });
      return;
    }

    // Clear the previous trace immediately. While Pyodide or the JS worker is
    // running, the canvas and timeline must not keep showing frames that belong
    // to different data.
    playback.stop();
    setEvents([]);
    setSource('');
    setDiagnostics([]);
    setStatus({ text: t('running'), error: false });

    try {
      const output = await runForLanguage('visual', code, input, null, language, {
        jsTimeout: t('workerTimeout'),
        pythonTimeout: b('Python 初始化或执行超时（30 秒）', 'Python initialization/execution timed out (30s)'),
      });
      if (id !== runId.current) return;
      if (!isVisualResult(output)) throw new Error('Expected frames[]');
      const document = framesToTraceDocument((output as VisualRunResult).frames, code);
      const parsed = parseTraceDocument(document);
      if (!parsed.ok) {
        setEvents([]);
        setSource('');
        setDiagnostics([]);
        setStatus({ text: `${t('error')}: ${parsed.errors.join('; ')}`, error: true });
        return;
      }
      setEvents(parsed.document.events);
      setSource(parsed.document.source ?? code);
      setDiagnostics([]);
      setStatus({
        text: parsed.document.events.length ? `${t('loaded')} · ${parsed.document.events.length} frames` : t('noTrace'),
        error: !parsed.document.events.length,
      });
    } catch (error) {
      if (id !== runId.current) return;
      const diagnostic = error instanceof ExecutionError ? error.diagnostic : undefined;
      setEvents([]);
      setSource('');
      setDiagnostics(diagnostic ? [diagnostic] : []);
      const text = diagnostic ? formatDiagnostic(diagnostic) : (error as Error).message;
      setStatus({ text: `${t('error')}: ${text}`, error: true });
    }
  }, [codeLang, t, b, playback]);

  const rejectInput = useCallback((message: string) => {
    // A newer generation supersedes any pending validation or execution.
    ++runId.current;
    playback.stop();
    setEvents([]);
    setSource('');
    setDiagnostics([]);
    setStatus({ text: message, error: true });
  }, [playback]);

  const runInput = useCallback((input: unknown, requestedLanguage?: CodeLanguage) => {
    const entry = catalog[currentAlgo];
    if (!entry) return;
    const language = requestedLanguage ?? guidedLanguageFor(currentAlgo) ?? codeLang;
    const code = language === codeLang ? editorCode : exampleFor(currentAlgo, language);
    const rawInput = JSON.stringify(input);
    if (rawInput === undefined) {
      rejectInput(t('syntax'));
      return;
    }
    if (language !== codeLang) {
      setCodeLangState(language);
      safeSet(CODE_LANG_KEY, language);
    }
    setEditorCodeState(code);
    setInputJson(rawInput);
    setDiagnostics([]);
    setStatus({ text: '', error: false });
    void runVisualizationWith(code, rawInput, language);
  }, [catalog, currentAlgo, codeLang, editorCode, rejectInput, runVisualizationWith, t]);

  const runVisualization = useCallback(() => {
    void runVisualizationWith(editorCode, inputJson);
  }, [runVisualizationWith, editorCode, inputJson]);

  // Mirrors the legacy app: selecting a preset immediately renders its frames.
  useEffect(() => {
    void runVisualizationWith(editorCode, inputJson);
    // Intentionally only on mount: later runs are triggered by user actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectAlgo = useCallback((id: string) => {
    const entry = catalog[id];
    if (!entry) return;
    playback.stop();
    // Stack/queue/linked-list/binary-tree only emit structured frames from the
    // real Python presets. Default those courses to Python; bubble keeps its
    // established JavaScript classroom example, while the remaining simple
    // array courses keep the language already selected. The three dynamic
    // storage courses also emit only structured frames from Python.
    const preferredLang: CodeLanguage =
      id === 'bubble'
        ? 'js'
        : id === 'stack' || id === 'queue' || id === 'linked' || id === 'doubly' || id === 'circular' || id === 'seqlist' || id === 'inorder' || id === 'threaded-inorder' || id === 'bst' || id === 'avl' || id === 'btree' || id === 'heap' || id === 'huffman' || id === 'selection' || id === 'insertion' || id === 'shell' || id === 'quick' || id === 'merge' || id === 'linear' || id === 'binary' || id === 'hash-chain' || id === 'hash-probe' || id === 'kmp' || id === 'bf' || id === 'gl-depth' || id === 'gl-copy' || id === 'sparse-transpose' || id === 'static-linked-list' || id === 'polynomial-add' || id === 'factorial' || id === 'fib' || id === 'free-list' || id === 'buddy-system' || id === 'garbage-collection' || isGraphAlgorithm(id)
          ? 'python'
          : codeLang;
    if (preferredLang !== codeLang) {
      setCodeLangState(preferredLang);
      safeSet(CODE_LANG_KEY, preferredLang);
    }
    const code = exampleFor(id, preferredLang);
    const rawInput = JSON.stringify(defaultInputFor(id));
    setCurrentAlgo(id);
    setEditorCodeState(code);
    setInputJson(rawInput);
    setDiagnostics([]);
    setStatus({ text: '', error: false });
    void runVisualizationWith(code, rawInput, preferredLang);
  }, [catalog, codeLang, playback, runVisualizationWith]);

  const selectTreeMode = useCallback((mode: TreeMode) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(inputJson);
    } catch {
      parsed = null;
    }
    playback.stop();
    setInputJson(JSON.stringify(withTreeMode(parsed, mode)));
    setStatus({ text: '', error: false });
  }, [inputJson, playback]);

  const selectBstPreset = useCallback((preset: BstPresetId) => {
    playback.stop();
    setInputJson(JSON.stringify(bstPresetInput(preset)));
    setStatus({ text: '', error: false });
  }, [playback]);

  const selectAvlPreset = useCallback((preset: AvlPresetId) => {
    playback.stop();
    setInputJson(JSON.stringify(avlPresetInput(preset)));
    setStatus({ text: '', error: false });
  }, [playback]);

  const selectBTreePreset = useCallback((preset: BtreePresetId) => {
    playback.stop();
    setInputJson(JSON.stringify(btreePresetInput(preset)));
    setStatus({ text: '', error: false });
  }, [playback]);

  const selectHeapPreset = useCallback((preset: HeapPresetId) => {
    playback.stop();
    setInputJson(JSON.stringify(heapPresetInput(preset)));
    setStatus({ text: '', error: false });
  }, [playback]);

  const selectHuffmanPreset = useCallback((preset: HuffmanPresetId) => {
    playback.stop();
    setInputJson(JSON.stringify(huffmanPresetInput(preset)));
    setStatus({ text: '', error: false });
  }, [playback]);

  const selectSequentialListPreset = useCallback((preset: SequentialListPresetId) => {
    playback.stop();
    setInputJson(JSON.stringify(sequentialListPresetInput(preset)));
    setStatus({ text: '', error: false });
  }, [playback]);

  const restorePreset = useCallback(() => {
    const entry = catalog[currentAlgo];
    if (!entry) return;
    const code = exampleFor(currentAlgo, codeLang);
    // The legacy JS graph demo still receives its original {start} input; the
    // Python demo uses the richer graph contract from the same Restore action.
    const rawInput = JSON.stringify(
      isGraphAlgorithm(currentAlgo) && codeLang === 'js'
        ? entry.input
        : defaultInputFor(currentAlgo),
    );
    setEditorCodeState(code);
    setInputJson(rawInput);
    setDiagnostics([]);
    void runVisualizationWith(code, rawInput);
  }, [catalog, currentAlgo, codeLang, runVisualizationWith]);

  const randomizeInput = useCallback(() => {
    const entry = catalog[currentAlgo];
    if (!entry) return;
    let next: unknown;
    if (currentAlgo === 'heap') {
      let operation = 'build';
      try {
        const parsed = JSON.parse(inputJson) as { operation?: unknown };
        if (parsed?.operation === 'push' || parsed?.operation === 'extract' || parsed?.operation === 'sort') {
          operation = parsed.operation;
        }
      } catch {
        operation = 'build';
      }
      const values = Array.from({ length: 7 }, () => 1 + Math.floor(Math.random() * 15));
      // Push/extract need a valid starting max heap; build/sort may start from
      // any array. Randomising never silently reuses an official preset id.
      if (operation === 'push' || operation === 'extract') {
        for (let parent = Math.floor(values.length / 2) - 1; parent >= 0; parent -= 1) {
          let current = parent;
          while (true) {
            const left = current * 2 + 1;
            if (left >= values.length) break;
            const right = left + 1;
            const child = right < values.length && values[right] > values[left] ? right : left;
            if (values[current] >= values[child]) break;
            [values[current], values[child]] = [values[child], values[current]];
            current = child;
          }
        }
      }
      next = {
        preset: null,
        operation,
        heap: values,
        value: operation === 'push' ? 1 + Math.floor(Math.random() * 15) : null,
      };
    } else if (currentAlgo === 'kmp') {
      const text = Array.from({ length: 14 }, () => (Math.random() < 0.5 ? 'A' : 'B')).join('');
      const start = Math.floor(Math.random() * 10);
      next = { text, pattern: text.slice(start, start + 4) };
    } else if (currentAlgo === 'sparse-transpose') {
      const rows = 4 + Math.floor(Math.random() * 3);
      const cols = 4 + Math.floor(Math.random() * 3);
      const target = 4 + Math.floor(Math.random() * 4);
      const used = new Set<string>();
      const triples: Array<{ row: number; col: number; value: number }> = [];
      while (triples.length < target) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        const key = `${row}:${col}`;
        if (used.has(key)) continue;
        used.add(key);
        triples.push({ row, col, value: 1 + Math.floor(Math.random() * 9) });
      }
      triples.sort((a, b) => a.row - b.row || a.col - b.col);
      next = { rows, cols, triples };
    } else if (entry.group === 'sort') {
      next = Array.from({ length: 7 }, () => 1 + Math.floor(Math.random() * 15));
    } else if (entry.group === 'search') {
      next = { nums: [1, 3, 5, 7, 9, 11, 13], target: [3, 5, 9, 13][Math.floor(Math.random() * 4)] };
    } else {
      next = defaultInputFor(currentAlgo) ?? [5, 2, 8, 1];
    }
    setInputJson(JSON.stringify(next));
  }, [catalog, currentAlgo, inputJson]);

  const traceStale = source !== '' && editorCode !== source;

  return {
    catalog,
    groups,
    currentAlgo,
    codeLang,
    editorCode,
    inputJson,
    events,
    source,
    traceStale,
    diagnostics,
    playback,
    status,
    selectAlgo,
    setInputJson,
    selectTreeMode,
    selectBstPreset,
    selectAvlPreset,
    selectBTreePreset,
    selectHeapPreset,
    selectHuffmanPreset,
    selectSequentialListPreset,
    runVisualization,
    runInput,
    rejectInput,
    restorePreset,
    randomizeInput,
  };
}
