import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { defaultInputFor } from '../../domain/algorithms/examples';
import { bstPresetFromInput } from '../../domain/algorithms/bstExamples';
import { avlPresetFromInput } from '../../domain/algorithms/avlExamples';
import { btreePresetFromInput } from '../../domain/algorithms/btreeExamples';
import { heapPresetFromInput } from '../../domain/algorithms/heapExamples';
import { huffmanPresetFromInput } from '../../domain/algorithms/huffmanExamples';
import type { TreeGuidedInputAlgorithm } from '../../domain/algorithms/treeInput';
import type { GraphGuidedInputAlgorithm, GraphInputFields } from '../../domain/algorithms/graphInput';
import type { SparseInputFields } from '../../domain/algorithms/sparseInput';
import {
  buildGuidedInput,
  defaultGuidedScenario,
  guidedDraftFromInput,
  guidedExecutionLanguage,
  guidedGraphSpec,
  guidedRandomScenarios,
  isArrayGuidedInputAlgorithm,
  isBuddyGuidedInputAlgorithm,
  isExpressionGuidedInputAlgorithm,
  isFreeListGuidedInputAlgorithm,
  isGarbageCollectionGuidedInputAlgorithm,
  isGeneralizedListGuidedInputAlgorithm,
  isGraphAlgorithmGuidedInput,
  isHashGuidedInputAlgorithm,
  isHeapGuidedInputAlgorithm,
  isHuffmanGuidedInputAlgorithm,
  isNumsTargetGuidedInputAlgorithm,
  isRecursionGuidedInputAlgorithm,
  isStringPairGuidedInputAlgorithm,
  isStructureGuidedInputAlgorithm,
  isSparseGuidedInputAlgorithm,
  isTreeGuidedInputAlgorithm,
  isStaticLinkedGuidedInputAlgorithm,
  isPolynomialGuidedInputAlgorithm,
  randomGuidedDraft,
  type GuidedInputAlgorithm,
  type GuidedInputDraft,
  type GuidedInputError,
  type GuidedInputMode,
  type GuidedRandomScenario,
} from '../../domain/algorithms/guidedInput';
import type { ExpressionGuidedInputAlgorithm } from '../../domain/algorithms/expressionInput';
import { ExpressionInputEditor } from './ExpressionInputEditor';
import { emptySparseDraft } from '../../domain/algorithms/sparseInput';
import {
  type StaticLinkedInputFields,
} from '../../domain/algorithms/chapter2Input';
import type {
  PolynomialTermRow,
} from '../../domain/algorithms/chapter2Input';
import type {
  StructureGuidedInputAlgorithm,
  StructureOperationDraft,
  StructureStorage,
} from '../../domain/algorithms/structureInput';
import { StructureOperationEditor } from './StructureOperationEditor';
import { TreeInputEditor } from './TreeInputEditor';
import { HeapInputEditor } from './HeapInputEditor';
import { HuffmanInputEditor } from './HuffmanInputEditor';
import { GraphInputEditor } from './GraphInputEditor';
import { SparseInputEditor } from './SparseInputEditor';
import { RecursionInputEditor } from './RecursionInputEditor';
import { StaticLinkedInputEditor } from './StaticLinkedInputEditor';
import { PolynomialInputEditor } from './PolynomialInputEditor';
import { GeneralizedListInputEditor } from './GeneralizedListInputEditor';
import {
  BuddyInputEditor,
  FreeListInputEditor,
  GarbageCollectionInputEditor,
} from './MemoryInputEditors';
import type { FreeListInputDraft } from '../../domain/algorithms/freeListInput';
import type { BuddyInputDraft } from '../../domain/algorithms/buddyInput';
import type { GarbageInputDraft } from '../../domain/algorithms/garbageInput';
import type { RecursionGuidedInputAlgorithm } from '../../domain/algorithms/recursionInput';
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const TREE_HINT_KEYS: Record<TreeGuidedInputAlgorithm, string> = {
  inorder: 'treeHintTraversal',
  'threaded-inorder': 'treeHintThreaded',
  bst: 'treeHintBst',
  avl: 'treeHintAvl',
  btree: 'treeHintBtree',
};

const GRAPH_HINT_KEYS: Record<GraphGuidedInputAlgorithm, string> = {
  bfs: 'graphHintBfs',
  dfs: 'graphHintDfs',
  components: 'graphHintComponents',
  scc: 'graphHintScc',
  articulation: 'graphHintArticulation',
  dijkstra: 'graphHintDijkstra',
  'floyd-warshall': 'graphHintFloyd',
  'bellman-ford': 'graphHintBellman',
  prim: 'graphHintPrim',
  kruskal: 'graphHintKruskal',
  topological: 'graphHintTopological',
  'critical-path': 'graphHintCritical',
};

function hintKeyFor(id: GuidedInputAlgorithm): string {
  if (isFreeListGuidedInputAlgorithm(id)) return 'guidedMemoryHint';
  if (isBuddyGuidedInputAlgorithm(id)) return 'guidedBuddyHint';
  if (isGarbageCollectionGuidedInputAlgorithm(id)) return 'guidedGcHint';
  if (isExpressionGuidedInputAlgorithm(id)) {
    return id === 'infix-to-postfix' ? 'expressionHintInfix' : 'expressionHintPostfix';
  }
  if (isGeneralizedListGuidedInputAlgorithm(id)) return 'guidedGLHint';
  if (isStaticLinkedGuidedInputAlgorithm(id)) return 'staticLinkedHint';
  if (isPolynomialGuidedInputAlgorithm(id)) return 'polynomialHint';
  if (isRecursionGuidedInputAlgorithm(id)) {
    return id === 'factorial' ? 'guidedFactorialHint' : 'guidedFibHint';
  }
  if (isArrayGuidedInputAlgorithm(id)) return id === 'bubble' ? 'guidedBubbleHint' : 'guidedSortHint';
  if (isNumsTargetGuidedInputAlgorithm(id)) {
    return id === 'binary' ? 'guidedBinaryHint' : 'guidedLinearHint';
  }
  if (isHashGuidedInputAlgorithm(id)) {
    return id === 'hash-chain' ? 'guidedChainHint' : 'guidedProbeHint';
  }
  if (isGraphAlgorithmGuidedInput(id)) {
    return GRAPH_HINT_KEYS[id];
  }
  if (isSparseGuidedInputAlgorithm(id)) {
    return 'sparseHint';
  }
  if (isStructureGuidedInputAlgorithm(id)) {
    return STRUCTURE_HINT_KEYS[id as StructureGuidedInputAlgorithm];
  }
  if (isTreeGuidedInputAlgorithm(id)) {
    return TREE_HINT_KEYS[id as TreeGuidedInputAlgorithm];
  }
  if (isHeapGuidedInputAlgorithm(id)) return 'guidedHeapHint';
  if (isHuffmanGuidedInputAlgorithm(id)) return 'guidedHuffmanHint';
  if (id === 'bf') return 'guidedBfHint';
  return 'guidedKmpHint';
}

const STRUCTURE_HINT_KEYS: Record<StructureGuidedInputAlgorithm, string> = {
  linked: 'structureHintLinked',
  doubly: 'structureHintDoubly',
  circular: 'structureHintCircular',
  seqlist: 'structureHintSeqlist',
  stack: 'structureHintStackStored',
  queue: 'structureHintQueueStored',
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
    const parsed = parseInput(lab.inputJson);
    // Official pickers write their preset into inputJson without going
    // through this panel. They still use the real Python program and must
    // put the panel back into Official mode; custom inputs carry preset:null.
    const presetSelected =
      (id === 'heap' && heapPresetFromInput(parsed) !== null) ||
      (id === 'bst' && bstPresetFromInput(parsed) !== null) ||
      (id === 'avl' && avlPresetFromInput(parsed) !== null) ||
      (id === 'btree' && btreePresetFromInput(parsed) !== null) ||
      (id === 'huffman' && huffmanPresetFromInput(parsed) !== null);
    const seqlistPreset = id === 'seqlist' ? parsed : null;
    const seqlistPresetSelected =
      id === 'seqlist' &&
      typeof seqlistPreset === 'object' &&
      seqlistPreset !== null &&
      typeof (seqlistPreset as { preset?: unknown }).preset === 'string';
    // The traversal mode picker changes `{mode, tree}` in inputJson. When
    // the user has already edited a custom tree, only adopt that mode and
    // keep the draft tree, otherwise the picker would silently replace it.
    const traversalModeChange =
      id === 'inorder' &&
      !algorithmChanged &&
      isRecord(parsed) &&
      typeof parsed.mode === 'string' &&
      Array.isArray(parsed.tree);

    previousAlgo.current = id;
    previousInput.current = lab.inputJson;
    if (traversalModeChange) {
      setDraft((current) => ({ ...current, mode: fieldDraft(id, parsed).mode }));
    } else {
      setDraft(fieldDraft(id, parsed));
    }
    setIssue(null);
    setRandomFilled(false);
    if (algorithmChanged || presetSelected || seqlistPresetSelected) {
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

  const setStructureStorage = (storage: StructureStorage) => {
    setDraft((current) => ({ ...current, storage }));
    setMode('custom');
    setIssue(null);
    setRandomFilled(false);
  };

  const setGeneralized = (fields: { expression?: string }) => {
    setDraft((current) => ({
      ...current,
      generalized: {
        expression: fields.expression ?? current.generalized?.expression ?? '(a, (b, c), ((d), e))',
      },
    }));
    setMode('custom');
    setIssue(null);
    setRandomFilled(false);
  };

  const setGraph = (graph: GraphInputFields) => {
    setDraft((current) => ({ ...current, graph }));
    setMode('custom');
    setIssue(null);
    setRandomFilled(false);
  };

  const setSparse = (sparse: SparseInputFields) => {
    setDraft((current) => ({ ...current, sparse }));
    setMode('custom');
    setIssue(null);
    setRandomFilled(false);
  };

  const setStaticLinked = (fields: StaticLinkedInputFields) => {
    setDraft((current) => ({
      ...current,
      capacity: fields.capacity,
      values: fields.values,
      staticOperations: fields.operations,
    }));
    setMode('custom');
    setIssue(null);
    setRandomFilled(false);
  };

  const setPolynomial = (a: PolynomialTermRow[], b: PolynomialTermRow[]) => {
    setDraft((current) => ({ ...current, polynomialA: a, polynomialB: b }));
    setMode('custom');
    setIssue(null);
    setRandomFilled(false);
  };

  const setFreeList = (freeList: FreeListInputDraft) => {
    setDraft((current) => ({ ...current, freeList }));
    setMode('custom');
    setIssue(null);
    setRandomFilled(false);
  };

  const setBuddy = (buddy: BuddyInputDraft) => {
    setDraft((current) => ({ ...current, buddy }));
    setMode('custom');
    setIssue(null);
    setRandomFilled(false);
  };

  const setGarbage = (garbage: GarbageInputDraft) => {
    setDraft((current) => ({ ...current, garbage }));
    setMode('custom');
    setIssue(null);
    setRandomFilled(false);
  };

  const loadOfficial = () => {
    const official = defaultInputFor(id);
    setMode('official');
    setIssue(null);
    setRandomFilled(false);
    // Restore the field immediately. After a rejected custom run the trace is
    // cleared and `inputJson` may still hold the old official value, so the
    // effect below cannot be relied on to rewrite the visible draft.
    setDraft(fieldDraft(id, official));
    lab.runInput(official);
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
    if (error.triple !== undefined) {
      return `${t('sparseTripleRowError').replace('{row}', String(error.triple))} ${text}`;
    }
    if (error.edge !== undefined) {
      return `${t('graphEdgeRowError').replace('{row}', String(error.edge))} ${text}`;
    }
    if (error.node !== undefined) {
      return `${t('graphNodeRowError').replace('{row}', String(error.node))} ${text}`;
    }
    return error.row === undefined
      ? text
      : `${t('structureRowError').replace('{row}', String(error.row))} ${text}`;
  };

  const generate = () => {
    let input: unknown;
    if (mode === 'official') {
      // Picker-backed official examples write their selection into inputJson.
      // Official mode must run that selection, not a stale default.
      input = id === 'heap' || id === 'seqlist' || id === 'inorder' || id === 'bst' || id === 'avl' ||
        id === 'btree' || id === 'huffman' || isGraphAlgorithmGuidedInput(id) ||
        isSparseGuidedInputAlgorithm(id)
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

  const randomDraft = (nextScenario: string, current: GuidedInputDraft): GuidedInputDraft => {
    const generated = randomGuidedDraft(id, nextScenario);
    // Traversal scenarios choose a tree shape, not a mode. Keep the mode the
    // student picked in the stage control strip.
    return id === 'inorder' ? { ...generated, mode: current.mode } : generated;
  };

  const randomize = () => {
    setDraft((current) => randomDraft(scenario, current));
    setMode('random');
    setIssue(null);
    setRandomFilled(true);
  };

  const selectScenario = (next: string) => {
    setScenario(next);
    if (mode === 'random') {
      setDraft((current) => randomDraft(next, current));
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

      {isExpressionGuidedInputAlgorithm(id) ? (
        <ExpressionInputEditor
          algorithm={id as ExpressionGuidedInputAlgorithm}
          value={draft.text}
          onChange={(value) => setField('text', value)}
        />
      ) : null}

      {isGeneralizedListGuidedInputAlgorithm(id) ? (
        <GeneralizedListInputEditor
          algorithm={id}
          value={draft.generalized ?? { expression: '(a, (b, c), ((d), e))' }}
          onChange={setGeneralized}
        />
      ) : null}

      {isRecursionGuidedInputAlgorithm(id) ? (
        <RecursionInputEditor
          algorithm={id as RecursionGuidedInputAlgorithm}
          draft={draft}
          onChange={setField}
        />
      ) : null}

      {isStructureGuidedInputAlgorithm(id) ? (
        <StructureOperationEditor
          algorithm={id as StructureGuidedInputAlgorithm}
          rows={draft.rows}
          initialValues={draft.values}
          storage={draft.storage}
          onChangeRows={setStructureRows}
          onChangeInitialValues={(value) => setField('values', value)}
          onChangeStorage={setStructureStorage}
        />
      ) : null}

      {isTreeGuidedInputAlgorithm(id) ? (
        <TreeInputEditor
          algorithm={id as TreeGuidedInputAlgorithm}
          draft={draft}
          onChange={setField}
        />
      ) : null}

      {isHeapGuidedInputAlgorithm(id) ? (
        <HeapInputEditor draft={draft} onChange={setField} />
      ) : null}

      {isHuffmanGuidedInputAlgorithm(id) ? (
        <HuffmanInputEditor draft={draft} onChange={setField} />
      ) : null}

      {isGraphAlgorithmGuidedInput(id) ? (
        <GraphInputEditor
          algorithm={id}
          spec={guidedGraphSpec(id)!}
          draft={draft.graph ?? { nodes: ['A'], edges: [], directed: false, start: 'A', target: '' }}
          onChange={setGraph}
        />
      ) : null}

      {isSparseGuidedInputAlgorithm(id) ? (
        <SparseInputEditor
          draft={draft.sparse ?? emptySparseDraft()}
          onChange={setSparse}
        />
      ) : null}

      {isStaticLinkedGuidedInputAlgorithm(id) ? (
        <StaticLinkedInputEditor
          fields={{
            capacity: draft.capacity ?? '8',
            values: draft.values,
            operations: draft.staticOperations ?? [],
          }}
          onChange={setStaticLinked}
        />
      ) : null}

      {isPolynomialGuidedInputAlgorithm(id) ? (
        <PolynomialInputEditor
          a={draft.polynomialA ?? []}
          b={draft.polynomialB ?? []}
          onChange={setPolynomial}
        />
      ) : null}

      {isFreeListGuidedInputAlgorithm(id) ? (
        <FreeListInputEditor
          draft={draft.freeList ?? { capacity: '64', policy: 'first-fit', rows: [] }}
          onChange={setFreeList}
        />
      ) : null}

      {isBuddyGuidedInputAlgorithm(id) ? (
        <BuddyInputEditor
          draft={draft.buddy ?? { capacity: '32', rows: [] }}
          onChange={setBuddy}
        />
      ) : null}

      {isGarbageCollectionGuidedInputAlgorithm(id) ? (
        <GarbageCollectionInputEditor
          draft={
            draft.garbage ?? {
              mode: 'mark-sweep',
              capacity: '96',
              roots: 'A',
              objects: [],
            }
          }
          onChange={setGarbage}
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

      {isStringPairGuidedInputAlgorithm(id) ? (
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
              id={id === 'bf' ? 'bf-pattern' : 'kmp-pattern'}
              className="input code-dock-input"
              data-testid={id === 'bf' ? 'bf-pattern' : 'kmp-pattern'}
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
        {t(hintKeyFor(id))}
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
