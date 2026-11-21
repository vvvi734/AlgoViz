import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { defaultInputFor } from '../../domain/algorithms/examples';
import { heapPresetFromInput } from '../../domain/algorithms/heapExamples';
import {
  buildGuidedInput,
  defaultGuidedScenario,
  guidedDraftFromInput,
  guidedExecutionLanguage,
  guidedRandomScenarios,
  isArrayGuidedInputAlgorithm,
  isHashGuidedInputAlgorithm,
  isNumsTargetGuidedInputAlgorithm,
  isStructureGuidedInputAlgorithm,
  randomGuidedDraft,
  type GuidedInputAlgorithm,
  type GuidedInputDraft,
  type GuidedInputError,
  type GuidedInputMode,
  type GuidedRandomScenario,
} from '../../domain/algorithms/guidedInput';
import type {
  StructureGuidedInputAlgorithm,
  StructureOperationDraft,
} from '../../domain/algorithms/structureInput';
import { StructureOperationEditor } from './StructureOperationEditor';
import type { LabController } from './useLabController';

function parseInput(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function fieldDraft(id: GuidedInputAlgorithm, input: unknown): GuidedInputDraft {
  return guidedDraftFromInput(id, input);
}

const STRUCTURE_HINT_KEYS: Record<StructureGuidedInputAlgorithm, string> = {
  linked: 'structureHintLinked',
  doubly: 'structureHintDoubly',
  circular: 'structureHintCircular',
  seqlist: 'structureHintSeqlist',
  stack: 'structureHintStack',
  queue: 'structureHintQueue',
};

/**
 * INPUT-01/02: one compact input surface shared by the guided algorithms.
 *
 * Official / Custom / Random describe where the values came from, not three
 * separate execution systems. Every accepted draft is converted by the domain
 * input model and then handed to `lab.runInput`, which calls the same executor
 * and playback controller as the official preset.
 */
export function GuidedInputPanel({ lab }: { lab: LabController }) {
  const { t, b, lang } = useI18n();
  const id = lab.currentAlgo as GuidedInputAlgorithm;
  const [mode, setMode] = useState<GuidedInputMode>('official');
  const [draft, setDraft] = useState<GuidedInputDraft>(() => fieldDraft(id, parseInput(lab.inputJson)));
  const [scenario, setScenario] = useState<string>(() => defaultGuidedScenario(id));
  const [issue, setIssue] = useState<string | null>(null);
  const [randomFilled, setRandomFilled] = useState(false);
  const previousAlgo = useRef(id);
  const previousInput = useRef(lab.inputJson);

  useEffect(() => {
    if (previousAlgo.current === id && previousInput.current === lab.inputJson) return;
    const algorithmChanged = previousAlgo.current !== id;
    // HeapPicker changes inputJson without going through this panel. A genuine
    // official preset must put the panel back into Official mode; custom sort
    // objects have preset=null and therefore never trigger this path.
    const heapPresetSelected = id === 'heap' && heapPresetFromInput(parseInput(lab.inputJson)) !== null;
    const seqlistPreset = id === 'seqlist' ? parseInput(lab.inputJson) : null;
    const seqlistPresetSelected =
      id === 'seqlist' &&
      typeof seqlistPreset === 'object' &&
      seqlistPreset !== null &&
      typeof (seqlistPreset as { preset?: unknown }).preset === 'string';
    previousAlgo.current = id;
    previousInput.current = lab.inputJson;
    setDraft(fieldDraft(id, parseInput(lab.inputJson)));
    setIssue(null);
    setRandomFilled(false);
    if (algorithmChanged || heapPresetSelected || seqlistPresetSelected) {
      setMode('official');
      if (algorithmChanged) setScenario(defaultGuidedScenario(id));
    }
  }, [id, lab.inputJson]);

  const scenarios = guidedRandomScenarios(id);

  const setField = (key: keyof GuidedInputDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMode('custom');
    setIssue(null);
    setRandomFilled(false);
  };

  const setStructureRows = (rows: StructureOperationDraft[]) => {
    setDraft((current) => ({ ...current, rows }));
    setMode('custom');
    setIssue(null);
    setRandomFilled(false);
  };

  const loadOfficial = () => {
    setMode('official');
    setIssue(null);
    setRandomFilled(false);
    lab.runInput(defaultInputFor(id));
  };

  const switchMode = (next: GuidedInputMode) => {
    if (next === 'official') {
      loadOfficial();
      return;
    }
    setMode(next);
    setIssue(null);
    setRandomFilled(false);
  };

  const errorText = (error: GuidedInputError) => {
    const text = t(error.key).replace('{max}', String(error.max ?? ''));
    return error.row === undefined
      ? text
      : `${t('structureRowError').replace('{row}', String(error.row))} ${text}`;
  };

  const generate = () => {
    let input: unknown;
    if (mode === 'official') {
      // Seqlist's official picker writes a selected preset into inputJson,
      // exactly like the heap picker. Official mode must run that selection,
      // while custom sequences never carry a preset id.
      input = id === 'heap' || id === 'seqlist'
        ? (parseInput(lab.inputJson) ?? defaultInputFor(id))
        : defaultInputFor(id);
    } else {
      const built = buildGuidedInput(id, draft);
      if (!built.ok) {
        const message = errorText(built.error);
        setIssue(message);
        setRandomFilled(false);
        // Clearing is deliberate: the previous animation belongs to different
        // data and must not keep playing behind an invalid draft.
        lab.rejectInput(`${t('error')}: ${message}`);
        return;
      }
      input = built.input;
    }
    setIssue(null);
    setRandomFilled(false);
    lab.runInput(input, guidedExecutionLanguage(id, mode) ?? undefined);
  };

  const randomize = () => {
    setDraft(randomGuidedDraft(id, scenario));
    setMode('random');
    setIssue(null);
    setRandomFilled(true);
  };

  const selectScenario = (next: string) => {
    setScenario(next);
    if (mode === 'random') {
      setDraft(randomGuidedDraft(id, next));
      setIssue(null);
      setRandomFilled(true);
    }
  };

  const statusText = issue ?? (randomFilled ? t('guidedRandomFilled') : lab.status.text || t('codeDockReady'));
  const error = issue !== null || lab.status.error;

  return (
    <div className="guided-input" data-testid="guided-input" data-algorithm={id}>
      <div className="guided-mode-row" role="group" aria-label={b('输入方式', 'Input mode')}>
        <div className="guided-modes">
          {(['official', 'custom', 'random'] as const).map((candidate) => (
            <button
              key={candidate}
              className={`guided-mode${mode === candidate ? ' is-active' : ''}`}
              type="button"
              aria-pressed={mode === candidate}
              onClick={() => switchMode(candidate)}
              data-testid={`guided-mode-${candidate}`}
            >
              {t(`guidedMode${candidate[0]!.toUpperCase()}${candidate.slice(1)}`)}
            </button>
          ))}
        </div>
        {mode === 'random' ? (
          <label className="guided-scenario">
            <span>{t('guidedScenarioLabel')}</span>
            <select
              className="input"
              value={scenario}
              onChange={(event) => selectScenario(event.target.value)}
              data-testid="guided-random-scenario"
            >
              {scenarios.map((item: GuidedRandomScenario) => (
                <option key={item.id} value={item.id}>
                  {item.label[lang === 'zh' ? 0 : 1]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {isStructureGuidedInputAlgorithm(id) ? (
        <StructureOperationEditor
          algorithm={id as StructureGuidedInputAlgorithm}
          rows={draft.rows}
          initialValues={draft.values}
          onChangeRows={setStructureRows}
          onChangeInitialValues={(value) => setField('values', value)}
        />
      ) : null}

      {isArrayGuidedInputAlgorithm(id) ? (
        <div className="guided-field-row">
          <label className="guided-field-label" htmlFor="run-input">{t('guidedValuesLabel')}</label>
          <input
            id="run-input"
            className="input code-dock-input"
            data-testid="run-input"
            value={draft.values}
            onChange={(event) => setField('values', event.target.value)}
            placeholder="8, 3, 5, 1, 7"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      ) : null}

      {isNumsTargetGuidedInputAlgorithm(id) ? (
        <div className="guided-field-grid">
          <label className="guided-field">
            <span>{id === 'binary' ? t('guidedBinaryNumsLabel') : t('guidedValuesLabel')}</span>
            <input
              id="run-input"
              className="input code-dock-input"
              data-testid="run-input"
              value={draft.nums}
              onChange={(event) => setField('nums', event.target.value)}
              placeholder={id === 'binary' ? '1, 3, 5, 7, 9' : '6, 3, 9, 2, 7, 4'}
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <label className="guided-field guided-field-target">
            <span>{t('guidedBinaryTargetLabel')}</span>
            <input
              id={id === 'binary' ? 'binary-target' : 'linear-target'}
              className="input code-dock-input"
              data-testid={id === 'binary' ? 'binary-target' : 'linear-target'}
              value={draft.target}
              onChange={(event) => setField('target', event.target.value)}
              placeholder={id === 'binary' ? '9' : '7'}
              inputMode="numeric"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        </div>
      ) : null}

      {isHashGuidedInputAlgorithm(id) ? (
        <label className="guided-hash-field">
          <span>{t('guidedHashOperationsLabel')}</span>
          <textarea
            id="run-input"
            className="input code-dock-input guided-hash-ops"
            data-testid="hash-operations"
            rows={4}
            value={draft.operations}
            onChange={(event) => setField('operations', event.target.value)}
            placeholder={'insert 1\ninsert 8\nfind 8\ndelete 8'}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
      ) : null}

      {id === 'kmp' ? (
        <div className="guided-field-grid">
          <label className="guided-field">
            <span>{t('guidedKmpTextLabel')}</span>
            <input
              id="run-input"
              className="input code-dock-input"
              data-testid="run-input"
              value={draft.text}
              onChange={(event) => setField('text', event.target.value)}
              placeholder="ABABABCABABABC"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <label className="guided-field guided-field-pattern">
            <span>{t('guidedKmpPatternLabel')}</span>
            <input
              id="kmp-pattern"
              className="input code-dock-input"
              data-testid="kmp-pattern"
              value={draft.pattern}
              onChange={(event) => setField('pattern', event.target.value)}
              placeholder="ABABC"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        </div>
      ) : null}

      <p className="guided-hint note muted">
        {isArrayGuidedInputAlgorithm(id)
          ? id === 'bubble'
            ? t('guidedBubbleHint')
            : id === 'heap'
              ? t('guidedHeapHint')
              : t('guidedSortHint')
          : isNumsTargetGuidedInputAlgorithm(id)
            ? id === 'binary'
              ? t('guidedBinaryHint')
              : t('guidedLinearHint')
            : isHashGuidedInputAlgorithm(id)
              ? id === 'hash-chain'
                ? t('guidedChainHint')
                : t('guidedProbeHint')
              : isStructureGuidedInputAlgorithm(id)
                ? t(STRUCTURE_HINT_KEYS[id as StructureGuidedInputAlgorithm])
                : t('guidedKmpHint')}
        {mode === 'official' ? ` ${t('guidedOfficialHint')}` : mode === 'random' ? ` ${t('guidedRandomHint')}` : ''}
      </p>

      <div className="guided-actions">
        <button className="btn small code-dock-random" type="button" onClick={randomize} data-testid="random-btn">
          {t('guidedRandomize')}
        </button>
        <button className="btn primary code-dock-run" type="button" onClick={generate} data-testid="run-btn">
          {t('guidedRun')}
        </button>
      </div>

      <div className={`code-dock-feedback note${error ? ' error' : ' muted'}`} data-testid="run-feedback">
        {statusText}
      </div>
    </div>
  );
}
