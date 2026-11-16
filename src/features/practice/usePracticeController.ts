import { useCallback, useMemo, useState } from 'react';
import { CODE_LANGUAGES, type CodeLanguage } from '../../domain/algorithms/types';
import { problems, findProblem, practiceTemplate } from '../../domain/problems/examples';
import { problemCategoryLabel, type PracticeProblem } from '../../domain/problems/types';
import type { TestCaseResult } from '../../domain/trace/types';
import { askAi, type AiReply } from '../../runtime/ai/client';
import { runForLanguage } from '../../runtime/execute';
import { safeGet, safeSet } from '../../runtime/storage';
import { useI18n } from '../../i18n/I18nProvider';
import type { StatusMessage } from '../lab/useLabController';

const PRACTICE_LANG_KEY = 'algolens-practice-language';
const solvedKey = (id: string) => `algolens-solved-${id}`;

function storedLanguage(): CodeLanguage {
  const value = safeGet(PRACTICE_LANG_KEY);
  return CODE_LANGUAGES.includes(value as CodeLanguage) ? (value as CodeLanguage) : 'js';
}

export type ProblemFilter = 'all' | 'university' | 'postgrad';

/** A single sample run: the input and the function's actual output. */
export interface SampleOutput {
  input: unknown;
  output: unknown;
}

export interface PracticeController {
  filteredProblems: PracticeProblem[];
  currentProblem: PracticeProblem;
  practiceLang: CodeLanguage;
  practiceCode: string;
  filter: ProblemFilter;
  solved: Set<string>;
  status: StatusMessage;
  engineText: string;
  categoryLabel: (cat: PracticeProblem['cat']) => string;
  setFilter: (filter: ProblemFilter) => void;
  setPracticeLang: (lang: CodeLanguage) => void;
  setPracticeCode: (code: string) => void;
  selectProblem: (id: string) => void;
  resetScaffold: () => void;
  showHint: () => void;
  runSamples: () => Promise<void>;
  toggleSolved: () => void;
  reviewCode: (apiUrl: string) => Promise<void>;
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function usePracticeController(): PracticeController {
  const { t, b, lang } = useI18n();
  const [practiceLang, setLangState] = useState<CodeLanguage>(storedLanguage);
  const [currentProblem, setCurrentProblem] = useState<PracticeProblem>(() => problems[0]);
  const [practiceCode, setPracticeCode] = useState(() => practiceTemplate(problems[0], storedLanguage()));
  const [hintIndex, setHintIndex] = useState(0);
  const [lastOutputs, setLastOutputs] = useState<SampleOutput[] | null>(null);
  const [status, setStatus] = useState<StatusMessage>({ text: '', error: false });
  const [filter, setFilter] = useState<ProblemFilter>('all');
  const [solved, setSolved] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const problem of problems) if (safeGet(solvedKey(problem.id))) initial.add(problem.id);
    return initial;
  });

  const filteredProblems = useMemo(
    () => problems.filter((p) => filter === 'all' || p.cat === filter),
    [filter],
  );

  const engineText = useMemo(() => {
    if (practiceLang === 'js') return b('JavaScript 示例题：本地运行并查看输出。', 'JavaScript: run locally and inspect output.');
    return b('Python 首次使用需联网加载 Pyodide；示例在本地运行并查看输出。', 'Python needs a one-time Pyodide download; samples run locally.');
  }, [practiceLang, b]);

  const selectProblem = useCallback((id: string) => {
    const problem = findProblem(id);
    setCurrentProblem(problem);
    setPracticeCode(practiceTemplate(problem, practiceLang));
    setHintIndex(0);
    setLastOutputs(null);
    setStatus({ text: '', error: false });
  }, [practiceLang]);

  const setPracticeLang = useCallback((next: CodeLanguage) => {
    setLangState(next);
    safeSet(PRACTICE_LANG_KEY, next);
    setPracticeCode(practiceTemplate(currentProblem, next));
    setHintIndex(0);
    setLastOutputs(null);
    setStatus({ text: '', error: false });
  }, [currentProblem]);

  const resetScaffold = useCallback(() => selectProblem(currentProblem.id), [selectProblem, currentProblem.id]);

  const showHint = useCallback(() => {
    const index = Math.min(hintIndex, currentProblem.hints.length - 1);
    const text = currentProblem.hints[index][lang === 'zh' ? 0 : 1];
    setStatus({ text: `${t('hintIntro')} ${index + 1}/${currentProblem.hints.length}\n${text}`, error: false });
    setHintIndex(Math.min(hintIndex + 1, currentProblem.hints.length));
  }, [hintIndex, currentProblem, lang, t]);

  // Runs solve() over the sample inputs and shows input → output. This is a
  // learning aid ("run and inspect output"), NOT an auto-grader: no pass/fail
  // verdict, no automatic completion marking.
  const runSamples = useCallback(async () => {
    setStatus({ text: t('running'), error: false });
    try {
      const output = await runForLanguage('test', practiceCode, null, currentProblem.tests, practiceLang, {
        jsTimeout: t('workerTimeout'),
        pythonTimeout: b('Python 初始化或执行超时（30 秒）', 'Python initialization/execution timed out (30s)'),
      });
      if (!('result' in output)) throw new Error('Expected result[]');
      const results: TestCaseResult[] = output.result;
      const outputs = currentProblem.tests.map(([input], index): SampleOutput => ({
        input,
        output: results[index]?.actual,
      }));
      setLastOutputs(outputs);
      const message = outputs
        .map((item, index) => `样例 ${index + 1}\n  输入: ${formatValue(item.input)}\n  输出: ${formatValue(item.output)}`)
        .join('\n');
      setStatus({ text: message.trim(), error: false });
    } catch (error) {
      setLastOutputs(null);
      setStatus({ text: `${t('error')}: ${(error as Error).message}`, error: true });
    }
  }, [practiceCode, currentProblem, practiceLang, t, b]);

  // Completion is a user-driven learning record, persisted locally.
  const toggleSolved = useCallback(() => {
    setSolved((previous) => {
      const next = new Set(previous);
      if (next.has(currentProblem.id)) {
        next.delete(currentProblem.id);
        safeSet(solvedKey(currentProblem.id), '');
      } else {
        next.add(currentProblem.id);
        safeSet(solvedKey(currentProblem.id), '1');
      }
      return next;
    });
  }, [currentProblem.id]);

  const applyAiText = useCallback((reply: AiReply) => {
    if (reply.kind !== 'text') return;
    setStatus({ text: `${reply.reply}\n\n${t('answerWarn')}`, error: false });
  }, [t]);

  const localFallback = useCallback(() => {
    const index = Math.min(hintIndex, currentProblem.hints.length - 1);
    return currentProblem.hints[index][lang === 'zh' ? 0 : 1];
  }, [hintIndex, currentProblem, lang]);

  const reviewCode = useCallback(async (apiUrl: string) => {
    setStatus({ text: b('请求中……', 'Requesting…'), error: false });
    try {
      const reply = await askAi({
        url: apiUrl,
        action: 'review_code',
        language: lang,
        payload: {
          problem: { name: currentProblem.name[0], description: currentProblem.desc[0] },
          code: practiceCode,
          sampleOutputs: lastOutputs,
          instruction: 'Use Socratic questions, identify a likely bug, and give incremental hints. Never provide a full corrected solution.',
        },
      });
      applyAiText(reply);
    } catch (error) {
      setStatus({
        text: `${t('aiUnavailable')}\n${localFallback()}\n\n${t('failed')}: ${(error as Error).message}`,
        error: true,
      });
    }
  }, [lang, currentProblem, practiceCode, lastOutputs, applyAiText, localFallback, t, b]);

  return {
    filteredProblems,
    currentProblem,
    practiceLang,
    practiceCode,
    filter,
    solved,
    status,
    engineText,
    categoryLabel: (cat) => problemCategoryLabel(cat, lang),
    setFilter,
    setPracticeLang,
    setPracticeCode,
    selectProblem,
    resetScaffold,
    showHint,
    runSamples,
    toggleSolved,
    reviewCode,
  };
}
