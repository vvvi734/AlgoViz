import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  catalog as baseCatalog,
  engineNote,
  exampleFor,
  groups,
} from '../../domain/algorithms/examples';
import type { AlgorithmCatalog, AlgorithmEntry, CodeLanguage } from '../../domain/algorithms/types';
import { CODE_LANGUAGES } from '../../domain/algorithms/types';
import type { TraceFrame, VisualRunResult } from '../../domain/trace/types';
import { isTraceFrame } from '../../domain/trace/types';
import type { GeneratedAlgorithm } from '../../runtime/ai/client';
import { runForLanguage, isVisualResult } from '../../runtime/execute';
import { safeGet, safeSet } from '../../runtime/storage';
import { useI18n } from '../../i18n/I18nProvider';
import { usePlayback, type Playback } from './usePlayback';

const CODE_LANG_KEY = 'algolens-code-language';

export interface StatusMessage {
  text: string;
  error: boolean;
}

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
  frames: TraceFrame[];
  playback: Playback;
  status: StatusMessage;
  engineText: string;
  selectAlgo: (id: string) => void;
  setCodeLang: (lang: CodeLanguage) => void;
  setEditorCode: (code: string) => void;
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
  const [editorCode, setEditorCode] = useState(() => exampleFor('bubble', storedLanguage()));
  const [inputJson, setInputJson] = useState(() => JSON.stringify(baseCatalog.bubble.input));
  const [frames, setFrames] = useState<TraceFrame[]>([]);
  const [status, setStatus] = useState<StatusMessage>({ text: '', error: false });
  const playback = usePlayback(frames);
  const savedCodes = useRef<Record<string, string>>({});
  const runId = useRef(0);

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
    try {
      const output = await runForLanguage('visual', code, input, null, codeLang, {
        jsTimeout: t('workerTimeout'),
        pythonTimeout: b('Python 初始化或执行超时（30 秒）', 'Python initialization/execution timed out (30s)'),
      });
      if (id !== runId.current) return;
      if (!isVisualResult(output)) throw new Error('Expected frames[]');
      const nextFrames = (output as VisualRunResult).frames.filter(isTraceFrame);
      setFrames(nextFrames);
      setStatus({
        text: nextFrames.length ? `${t('loaded')} · ${nextFrames.length} frames` : t('noTrace'),
        error: !nextFrames.length,
      });
    } catch (error) {
      if (id !== runId.current) return;
      setFrames([]);
      setStatus({ text: `${t('error')}: ${(error as Error).message}`, error: true });
    }
  }, [codeLang, currentAlgo, t, b]);

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
    const code = savedCodes.current[`${id}:${codeLang}`] ?? exampleFor(id, codeLang);
    const rawInput = JSON.stringify(entry.input);
    setCurrentAlgo(id);
    setEditorCode(code);
    setInputJson(rawInput);
    setStatus({ text: '', error: false });
    void runVisualizationWith(code, rawInput);
  }, [catalog, codeLang, playback, runVisualizationWith]);

  const setCodeLang = useCallback((next: CodeLanguage) => {
    savedCodes.current[`${currentAlgo}:${codeLang}`] = editorCode;
    setCodeLangState(next);
    safeSet(CODE_LANG_KEY, next);
    setEditorCode(savedCodes.current[`${currentAlgo}:${next}`] ?? exampleFor(currentAlgo, next));
  }, [currentAlgo, codeLang, editorCode]);

  const restorePreset = useCallback(() => {
    const entry = catalog[currentAlgo];
    if (!entry) return;
    const code = exampleFor(currentAlgo, codeLang);
    const rawInput = JSON.stringify(entry.input);
    setEditorCode(code);
    setInputJson(rawInput);
    void runVisualizationWith(code, rawInput);
  }, [catalog, currentAlgo, codeLang, runVisualizationWith]);

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
    setCurrentAlgo('custom');
    setCodeLangState('js');
    safeSet(CODE_LANG_KEY, 'js');
    setEditorCode(generated.code);
    setInputJson(JSON.stringify(generated.input));
    setFrames([]);
    setStatus({ text: t('generated'), error: false });
  }, [b, t]);

  return {
    catalog,
    groups,
    currentAlgo,
    codeLang,
    editorCode,
    inputJson,
    frames,
    playback,
    status,
    engineText: engineNote(codeLang, lang),
    selectAlgo,
    setCodeLang,
    setEditorCode,
    setInputJson,
    runVisualization,
    restorePreset,
    randomizeInput,
    loadCustom,
  };
}
