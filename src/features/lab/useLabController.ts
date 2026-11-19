import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  catalog as baseCatalog,
  defaultInputFor,
  engineNote,
  exampleFor,
  groups,
} from '../../domain/algorithms/examples';
import type { AlgorithmCatalog, AlgorithmEntry, CodeLanguage } from '../../domain/algorithms/types';
import { CODE_LANGUAGES } from '../../domain/algorithms/types';
import type { TraceEvent } from '../../domain/trace/schema';
import { parseTraceDocument } from '../../domain/trace/schema';
import { framesToTraceDocument } from '../../domain/trace/adapter';
import type { VisualRunResult } from '../../domain/trace/types';
import { ExecutionError, formatDiagnostic, type ExecutionDiagnostic } from '../../domain/trace/diagnostic';
import type { GeneratedAlgorithm } from '../../runtime/ai/client';
import { runForLanguage, isVisualResult } from '../../runtime/execute';
import { safeGet, safeSet } from '../../runtime/storage';
import { loadDraft, saveDraft } from '../../runtime/drafts';
import {
  treeValuesFromInput,
  withTreeMode,
  type TreeMode,
} from '../../domain/algorithms/treeTraversalExamples';
import {
  bstPresetInput,
  type BstPresetId,
} from '../../domain/algorithms/bstExamples';
import {
  avlPresetInput,
  type AvlPresetId,
} from '../../domain/algorithms/avlExamples';
import {
  heapPresetInput,
  type HeapPresetId,
} from '../../domain/algorithms/heapExamples';
import {
  huffmanPresetInput,
  type HuffmanPresetId,
} from '../../domain/algorithms/huffmanExamples';
import { useI18n } from '../../i18n/I18nProvider';
import { usePlayback, type Playback } from './usePlayback';

const CODE_LANG_KEY = 'algolens-code-language';
const DRAFT_DEBOUNCE_MS = 600;

function isGraphAlgorithm(id: string): boolean {
  return id === 'bfs' || id === 'dfs' || id === 'dijkstra' || id === 'floyd-warshall' || id === 'bellman-ford' || id === 'prim' || id === 'kruskal' || id === 'topological' || id === 'critical-path' || id === 'components' || id === 'scc';
}

function graphStartOf(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'A';
  const start = (value as { start?: unknown }).start;
  return typeof start === 'string' ? start : 'A';
}

/** Stage 7E: Python uses the rich {start, nodes, edges} contract, while the
 * legacy JS demo keeps reading only {start}. Switching language converts the
 * INPUT visibly; nothing is executed until the user presses Run. */
function graphInputForLanguage(value: unknown, language: CodeLanguage, fallback: unknown): unknown {
  const start = graphStartOf(value);
  if (language === 'js') return { start };
  const parsed = value && typeof value === 'object' && !Array.isArray(value)
    ? value as { nodes?: unknown }
    : null;
  if (parsed && Array.isArray(parsed.nodes)) return value;
  if (!fallback || typeof fallback !== 'object' || Array.isArray(fallback)) return value;
  const graph = JSON.parse(JSON.stringify(fallback)) as { start?: string; nodes?: unknown };
  if (Array.isArray(graph.nodes) && graph.nodes.includes(start)) {
    graph.start = start;
  }
  return graph;
}

export interface StatusMessage {
  text: string;
  error: boolean;
}

export type DraftStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

function storedLanguage(): CodeLanguage {
  const value = safeGet(CODE_LANG_KEY);
  return CODE_LANGUAGES.includes(value as CodeLanguage) ? (value as CodeLanguage) : 'js';
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
  /** Autosave state shown next to the editor. */
  draftStatus: DraftStatus;
  playback: Playback;
  status: StatusMessage;
  engineText: string;
  selectAlgo: (id: string) => void;
  setCodeLang: (lang: CodeLanguage) => void;
  /** User edit: sets the code and schedules a debounced autosave. */
  editCode: (code: string) => void;
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
   * T3: select one official max-heap example (build / push / extract / sort)
   * by rewriting the object input. It never runs code.
   */
  selectHeapPreset: (preset: HeapPresetId) => void;
  /**
   * T4: select one official Huffman example by rewriting the `{preset, symbols}`
   * input. It never runs code; a real Trace still requires Run.
   */
  selectHuffmanPreset: (preset: HuffmanPresetId) => void;
  runVisualization: () => void;
  restorePreset: () => void;
  randomizeInput: () => void;
  loadCustom: (generated: GeneratedAlgorithm) => void;
  /**
   * Stage 4: load a pack course's Python example into the editor **without
   * running it**. Execution still requires the user to press Run, so imported
   * text can never execute implicitly.
   */
  applyCourseExample: (code: string, input: unknown) => void;
  /**
   * Stage 5A: open an imported `.algosession.json` — switch algorithm, load the
   * session's Python example as inert text and stop. Nothing is executed here:
   * the trace only exists after the user presses Run. Returns `false` when the
   * algorithm does not exist.
   */
  openLearningSession: (session: { algorithmId: string; source?: string; input?: unknown }) => boolean;
}

export function useLabController(): LabController {
  const { t, b, lang } = useI18n();
  const [customEntry, setCustomEntry] = useState<AlgorithmEntry | null>(null);
  const catalog = useMemo<AlgorithmCatalog>(
    () => (customEntry ? { ...baseCatalog, custom: customEntry } : baseCatalog),
    [customEntry],
  );
  const [currentAlgo, setCurrentAlgo] = useState('bubble');
  const [codeLang, setCodeLangState] = useState<CodeLanguage>(storedLanguage);
  const [editorCode, setEditorCodeState] = useState(() => {
    const initialLang = storedLanguage();
    return loadDraft('bubble', initialLang) ?? exampleFor('bubble', initialLang);
  });
  const [inputJson, setInputJson] = useState(() => JSON.stringify(baseCatalog.bubble.input));
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [source, setSource] = useState('');
  const [diagnostics, setDiagnostics] = useState<ExecutionDiagnostic[]>([]);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('saved');
  const [status, setStatus] = useState<StatusMessage>({ text: '', error: false });
  const playback = usePlayback(events);
  const runId = useRef(0);

  // Latest-value refs so async / debounced callbacks always write the right key.
  const location = useRef<{ algo: string; lang: CodeLanguage }>({ algo: 'bubble', lang: storedLanguage() });
  const codeRef = useRef(editorCode);
  useEffect(() => {
    codeRef.current = editorCode;
  }, [editorCode]);

  const saveTimer = useRef<number | null>(null);
  const clearSaveTimer = useCallback(() => {
    if (saveTimer.current != null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  }, []);

  const writeDraft = useCallback((algo: string, langId: CodeLanguage, code: string) => {
    setDraftStatus('saving');
    const ok = saveDraft(algo, langId, code);
    setDraftStatus(ok ? 'saved' : 'error');
    return ok;
  }, []);

  // Programmatic change (load / restore / language swap): flush any pending save
  // and swap the value WITHOUT triggering an autosave.
  const applyCode = useCallback((code: string) => {
    clearSaveTimer();
    setEditorCodeState(code);
    setDraftStatus('saved');
  }, [clearSaveTimer]);

  // User edit: update immediately, autosave after a short debounce.
  const editCode = useCallback((code: string) => {
    setEditorCodeState(code);
    setDraftStatus('dirty');
    clearSaveTimer();
    const loc = location.current;
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      writeDraft(loc.algo, loc.lang, code);
    }, DRAFT_DEBOUNCE_MS);
  }, [clearSaveTimer, writeDraft]);

  // Persist the in-flight draft of the current location before moving on.
  const flushCurrent = useCallback(() => {
    clearSaveTimer();
    writeDraft(location.current.algo, location.current.lang, codeRef.current);
  }, [clearSaveTimer, writeDraft]);

  // Flush the pending debounced save when the page unloads so a refresh keeps
  // the most recent keystrokes.
  useEffect(() => {
    const flush = () => {
      if (saveTimer.current != null) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
        saveDraft(location.current.algo, location.current.lang, codeRef.current);
      }
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  const runVisualizationWith = useCallback(async (code: string, rawInput: string, language: CodeLanguage = codeLang) => {
    let input: unknown;
    try {
      input = JSON.parse(rawInput);
    } catch {
      setStatus({ text: t('syntax'), error: true });
      return;
    }
    const id = ++runId.current;
    setStatus({ text: t('running'), error: false });
    setDiagnostics([]);
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
  }, [codeLang, t, b]);

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
    flushCurrent();
    // Stack/queue/linked-list/binary-tree only emit structured frames from the
    // real Python presets. Default those courses to Python; the user can still
    // switch to JS (legacy frames remain available).
    const preferredLang: CodeLanguage =
      id === 'stack' || id === 'queue' || id === 'linked' || id === 'inorder' || id === 'bst' || id === 'avl' || id === 'heap' || id === 'huffman' || id === 'selection' || id === 'insertion' || id === 'shell' || id === 'quick' || id === 'merge' || id === 'linear' || id === 'binary' || isGraphAlgorithm(id) ? 'python' : codeLang;
    if (preferredLang !== codeLang) {
      setCodeLangState(preferredLang);
      safeSet(CODE_LANG_KEY, preferredLang);
    }
    const code = loadDraft(id, preferredLang) ?? exampleFor(id, preferredLang);
    location.current = { algo: id, lang: preferredLang };
    const rawInput = JSON.stringify(defaultInputFor(id));
    setCurrentAlgo(id);
    applyCode(code);
    setInputJson(rawInput);
    setDiagnostics([]);
    setStatus({ text: '', error: false });
    void runVisualizationWith(code, rawInput, preferredLang);
  }, [catalog, codeLang, playback, flushCurrent, applyCode, runVisualizationWith]);

  const setCodeLang = useCallback((next: CodeLanguage) => {
    if (next === codeLang) return;
    flushCurrent();
    setCodeLangState(next);
    safeSet(CODE_LANG_KEY, next);
    const code = loadDraft(currentAlgo, next) ?? exampleFor(currentAlgo, next);
    location.current = { algo: currentAlgo, lang: next };
    applyCode(code);
    // The legacy JS inorder preset reads a level-order array. If the learner
    // selected a tree mode, switch back to that array shape so switching
    // languages never feeds JS an object it cannot read.
    if (currentAlgo === 'inorder' && next === 'js') {
      let parsed: unknown;
      try {
        parsed = JSON.parse(inputJson);
      } catch {
        parsed = null;
      }
      setInputJson(JSON.stringify(treeValuesFromInput(parsed)));
    }
    if (isGraphAlgorithm(currentAlgo)) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(inputJson);
      } catch {
        parsed = null;
      }
      setInputJson(JSON.stringify(graphInputForLanguage(parsed, next, defaultInputFor(currentAlgo))));
    }
    setDiagnostics([]);
  }, [codeLang, currentAlgo, flushCurrent, applyCode, inputJson]);

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
    applyCode(code);
    writeDraft(currentAlgo, codeLang, code);
    setInputJson(rawInput);
    setDiagnostics([]);
    void runVisualizationWith(code, rawInput);
  }, [catalog, currentAlgo, codeLang, applyCode, writeDraft, runVisualizationWith]);

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
    } else if (entry.group === 'sort') {
      next = Array.from({ length: 7 }, () => 1 + Math.floor(Math.random() * 15));
    } else if (entry.group === 'search') {
      next = { nums: [1, 3, 5, 7, 9, 11, 13], target: [3, 5, 9, 13][Math.floor(Math.random() * 4)] };
    } else {
      next = defaultInputFor(currentAlgo) ?? [5, 2, 8, 1];
    }
    setInputJson(JSON.stringify(next));
  }, [catalog, currentAlgo, inputJson]);

  // Stage 4: a pack course example is loaded as inert text — it is NOT executed
  // here. Execution still requires the user to press "Run", so text imported
  // from a pack never runs implicitly.
  const applyCourseExample = useCallback((code: string, sampleInput: unknown) => {
    flushCurrent();
    setCodeLangState('python');
    safeSet(CODE_LANG_KEY, 'python');
    location.current = { algo: currentAlgo, lang: 'python' };
    applyCode(code);
    const raw = JSON.stringify(sampleInput ?? catalog[currentAlgo]?.input ?? null);
    setInputJson(raw);
    writeDraft(currentAlgo, 'python', code);
    setDiagnostics([]);
    setStatus({ text: t('lessonExampleLoaded'), error: false });
  }, [applyCode, catalog, currentAlgo, flushCurrent, t, writeDraft]);

  // Stage 5A: apply an imported learning session. Switching algorithm normally
  // runs its preset, but an *import* must not execute anything — the session is
  // an intent, so this path clears the frames and waits for the user's Run.
  const openLearningSession = useCallback((session: { algorithmId: string; source?: string; input?: unknown }) => {
    const entry = catalog[session.algorithmId];
    if (!entry) return false;
    playback.stop();
    flushCurrent();
    const targetLang: CodeLanguage = session.source ? 'python' : codeLang;
    if (targetLang !== codeLang) {
      setCodeLangState(targetLang);
      safeSet(CODE_LANG_KEY, targetLang);
    }
    location.current = { algo: session.algorithmId, lang: targetLang };
    setCurrentAlgo(session.algorithmId);
    const code = session.source ?? loadDraft(session.algorithmId, targetLang) ?? exampleFor(session.algorithmId, targetLang);
    applyCode(code);
    setInputJson(JSON.stringify(session.input ?? defaultInputFor(session.algorithmId) ?? null));
    if (session.source) writeDraft(session.algorithmId, 'python', session.source);
    setEvents([]);
    setSource('');
    setDiagnostics([]);
    setStatus({ text: t('sessionAppliedShort'), error: false });
    return true;
  }, [applyCode, catalog, codeLang, flushCurrent, playback, t, writeDraft]);

  const loadCustom = useCallback((generated: GeneratedAlgorithm) => {

    const note = b(
      'AI 生成的可视化算法，请检查代码安全性与正确性。',
      'AI-generated visualization; review code for safety and correctness.',
    );
    setCustomEntry({
      group: 'custom', icon: '✦',
      name: [generated.title, generated.title],
      desc: [note, note],
      time: '—', space: '—',
      input: generated.input,
      code: generated.code,
    });
    flushCurrent();
    location.current = { algo: 'custom', lang: 'js' };
    setCurrentAlgo('custom');
    setCodeLangState('js');
    safeSet(CODE_LANG_KEY, 'js');
    applyCode(generated.code);
    setInputJson(JSON.stringify(generated.input));
    setEvents([]);
    setSource('');
    setDiagnostics([]);
    setStatus({ text: t('generated'), error: false });
  }, [b, t, flushCurrent, applyCode]);

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
    draftStatus,
    playback,
    status,
    engineText: engineNote(codeLang, lang),
    selectAlgo,
    setCodeLang,
    editCode,
    setInputJson,
    selectTreeMode,
    selectBstPreset,
    selectAvlPreset,
    selectHeapPreset,
    selectHuffmanPreset,
    runVisualization,
    restorePreset,
    randomizeInput,
    loadCustom,
    applyCourseExample,
    openLearningSession,
  };
}
