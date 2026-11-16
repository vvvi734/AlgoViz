import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  catalog as baseCatalog,
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
import { useI18n } from '../../i18n/I18nProvider';
import { usePlayback, type Playback } from './usePlayback';

const CODE_LANG_KEY = 'algolens-code-language';
const DRAFT_DEBOUNCE_MS = 600;

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
  runVisualization: () => void;
  restorePreset: () => void;
  randomizeInput: () => void;
  loadCustom: (generated: GeneratedAlgorithm) => void;
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

  const runVisualizationWith = useCallback(async (code: string, rawInput: string) => {
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
      const output = await runForLanguage('visual', code, input, null, codeLang, {
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
    const code = loadDraft(id, codeLang) ?? exampleFor(id, codeLang);
    location.current = { algo: id, lang: codeLang };
    const rawInput = JSON.stringify(entry.input);
    setCurrentAlgo(id);
    applyCode(code);
    setInputJson(rawInput);
    setDiagnostics([]);
    setStatus({ text: '', error: false });
    void runVisualizationWith(code, rawInput);
  }, [catalog, codeLang, playback, flushCurrent, applyCode, runVisualizationWith]);

  const setCodeLang = useCallback((next: CodeLanguage) => {
    if (next === codeLang) return;
    flushCurrent();
    setCodeLangState(next);
    safeSet(CODE_LANG_KEY, next);
    const code = loadDraft(currentAlgo, next) ?? exampleFor(currentAlgo, next);
    location.current = { algo: currentAlgo, lang: next };
    applyCode(code);
    setDiagnostics([]);
  }, [codeLang, currentAlgo, flushCurrent, applyCode]);

  const restorePreset = useCallback(() => {
    const entry = catalog[currentAlgo];
    if (!entry) return;
    const code = exampleFor(currentAlgo, codeLang);
    const rawInput = JSON.stringify(entry.input);
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
    if (entry.group === 'sort') {
      next = Array.from({ length: 7 }, () => 1 + Math.floor(Math.random() * 15));
    } else if (entry.group === 'search') {
      next = { nums: [1, 3, 5, 7, 9, 11, 13], target: [3, 5, 9, 13][Math.floor(Math.random() * 4)] };
    } else {
      next = entry.input ?? [5, 2, 8, 1];
    }
    setInputJson(JSON.stringify(next));
  }, [catalog, currentAlgo]);

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
    runVisualization,
    restorePreset,
    randomizeInput,
    loadCustom,
  };
}
