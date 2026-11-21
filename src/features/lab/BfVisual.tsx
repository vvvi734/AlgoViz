import { useI18n } from '../../i18n/I18nProvider';
import type { BfCellModel, BfVisualModel } from '../../domain/visualization/bfModel';
import '../../styles/str01.css';
import '../../styles/str02.css';

const OPERATION_KEYS: Record<BfVisualModel['operation'], string> = {
  init: 'bfOpInit',
  'candidate-start': 'bfOpCandidate',
  compare: 'bfOpCompare',
  advance: 'bfOpAdvance',
  mismatch: 'bfOpMismatch',
  'match-found': 'bfOpMatchFound',
  done: 'bfOpDone',
};

const CELL_STEP = 40;

/**
 * BF 的单主图：主串与模式串共用一条字符坐标系，只移动模式串的对齐位置。
 * 每个主串格子显示累计比较次数，超过 1 次就明确标成“被重新扫描”。
 */
export function BfVisual({ model }: { model: BfVisualModel }) {
  const { t } = useI18n();
  const boardWidth = Math.max(model.boardColumns * CELL_STEP - 6, 260);
  const status = buildStatus(model, t);
  const statusTone =
    model.operation === 'mismatch' || (model.operation === 'compare' && model.matched === false)
      ? 'is-bad'
      : model.operation === 'match-found' || (model.operation === 'compare' && model.matched === true)
        ? 'is-good'
        : 'is-neutral';

  return (
    <div
      className="kmp-visual bf-visual"
      data-testid="bf-visual"
      data-operation={model.operation}
      data-start={model.start ?? ''}
      data-j={model.j ?? ''}
      data-compare-index={model.compareIndex ?? ''}
      data-alignment={model.alignment}
      data-match-count={model.matches.length}
      data-matches={model.matches.join(',')}
      data-checked={model.checkedCandidates}
      data-comparisons={model.comparisonCount}
      role="group"
      aria-label={t('bfVisualLabel')}
    >
      <div className="kmp-op-row">
        <span className="kmp-op" data-testid="bf-operation">
          {t(OPERATION_KEYS[model.operation])}
        </span>
        <span className="kmp-phase-chip" data-testid="bf-candidate">
          {model.start === null
            ? t('bfNoCandidate')
            : t('bfCandidate').replace('{start}', String(model.start))}
        </span>
        {model.matched !== null && (
          <span className={`kmp-result-chip ${model.matched ? 'is-match' : 'is-mismatch'}`} data-testid="bf-result">
            {t(model.matched ? 'bfMatched' : 'bfMismatched')}
          </span>
        )}
        <span className="kmp-live-pointer" data-testid="bf-start">
          s = {model.start ?? '—'}
        </span>
        <span className="kmp-live-pointer" data-testid="bf-j">
          j = {model.j ?? '—'}
        </span>
        <span className="kmp-live-pointer" data-testid="bf-checked">
          {t('bfChecked')
            .replace('{checked}', String(model.checkedCandidates))
            .replace('{total}', String(model.totalCandidates))}
        </span>
        <span className="kmp-live-pointer" data-testid="bf-comparisons">
          {t('bfComparisons').replace('{count}', String(model.comparisonCount))}
        </span>
      </div>

      <div className="kmp-board-scroll">
        <div className="kmp-board" style={{ width: `${boardWidth}px` }}>
          <div className="kmp-track-head">
            <span className="kmp-track-name">{t('bfText')}</span>
            <span className="kmp-track-meta">n = {model.text.length}</span>
          </div>
          <div
            className="kmp-cell-row"
            style={{ gridTemplateColumns: `repeat(${Math.max(model.boardColumns, 1)}, 34px)` }}
            data-testid="bf-text-row"
          >
            {model.textCells.map((cell) => (
              <BfCell
                key={`t-${cell.index}`}
                cell={cell}
                pointer={cell.index === model.start ? 's' : null}
                testPrefix="bf-text-cell"
              />
            ))}
          </div>

          <div
            className="kmp-track-head kmp-pattern-head"
            style={{ marginLeft: `${model.alignment * CELL_STEP}px` }}
          >
            <span className="kmp-track-name">{t('bfPattern')}</span>
            <span className="kmp-track-meta">
              {t('bfAlignedAt').replace('{start}', String(model.alignment))}
            </span>
          </div>
          <div
            className="kmp-cell-row kmp-pattern-row kmp-slide-row"
            style={{
              marginLeft: `${model.alignment * CELL_STEP}px`,
              gridTemplateColumns: `repeat(${Math.max(model.pattern.length, 1)}, 34px)`,
            }}
            data-testid="bf-pattern-row"
          >
            {model.patternCells.map((cell) => (
              <BfCell
                key={`p-${cell.index}`}
                cell={cell}
                pointer={cell.index === model.j ? 'j' : null}
                testPrefix="bf-pattern-cell"
              />
            ))}
          </div>
        </div>
      </div>

      <p className={`bf-status ${statusTone}`} data-testid="bf-status">
        {status}
        {model.operation === 'mismatch' && model.nextStart !== null && (
          <span className="bf-next">
            {model.nextStartValid
              ? t('bfNextStart').replace('{start}', String(model.nextStart))
              : t('bfNoNextStart')}
          </span>
        )}
      </p>

      {model.operation === 'match-found' && model.currentMatchStart !== null && (
        <p className="kmp-match-banner" data-testid="bf-match-banner">
          {t('bfMatchAt').replace('{start}', String(model.currentMatchStart))}
        </p>
      )}

      <div className="kmp-matches" data-testid="bf-matches">
        <span className="kmp-matches-label">{t('bfMatchStarts')}</span>
        {model.matches.length === 0 ? (
          <span className="kmp-match-empty">
            {model.emptyText ? t('bfEmptyText') : t('bfNoMatches')}
          </span>
        ) : (
          model.matches.map((start) => (
            <span
              key={start}
              className={`kmp-match-chip${start === model.currentMatchStart ? ' is-current' : ''}`}
              data-testid="bf-match-chip"
              data-start={start}
            >
              s = {start}
            </span>
          ))
        )}
      </div>

      <p className="kmp-foot-note">{t('bfFootNote')}</p>
    </div>
  );
}

function BfCell({
  cell,
  pointer,
  testPrefix,
}: {
  cell: BfCellModel;
  pointer: 's' | 'j' | null;
  testPrefix: string;
}) {
  return (
    <div
      className={`kmp-cell bf-cell${cell.tone === 'none' ? '' : ` is-${cell.tone}`}`}
      data-testid={testPrefix}
      data-index={cell.index}
      data-char={cell.char}
      data-tone={cell.tone}
      data-seen={cell.seenCount}
      title={`${cell.index}: ${cell.char}`}
    >
      <span className="kmp-pointer-slot">
        {pointer === 's' && <span className="kmp-pointer kmp-pointer-i">s</span>}
        {pointer === 'j' && <span className="kmp-pointer kmp-pointer-j">j</span>}
      </span>
      {cell.seenCount > 1 && (
        <span className="bf-seen-badge" data-testid="bf-seen-badge" aria-label={`${cell.seenCount}`}>
          ×{cell.seenCount}
        </span>
      )}
      <span className="kmp-char">{cell.char}</span>
      <span className="kmp-index">{cell.index}</span>
    </div>
  );
}

function buildStatus(model: BfVisualModel, t: (key: string) => string): string {
  if (model.operation === 'init') return t('bfStatusInit');
  if (model.operation === 'done') {
    if (model.emptyText) return t('bfStatusEmpty');
    if (model.matches.length === 0) return t('bfStatusDoneNone');
    return t('bfStatusDone').replace('{count}', String(model.matches.length));
  }
  if (model.operation === 'candidate-start') {
    return t('bfStatusCandidate').replace('{start}', String(model.start ?? '—'));
  }
  if (model.operation === 'compare' && model.compareIndex !== null) {
    const result = t(model.matched ? 'bfSameChars' : 'bfDifferentChars')
      .replace('{textIndex}', String(model.compareIndex))
      .replace('{patternIndex}', String(model.j ?? '—'));
    const seen = model.textCells[model.compareIndex]?.seenCount ?? 0;
    return seen > 1
      ? `${result}${t('bfRechecked').replace('{count}', String(seen))}`
      : result;
  }
  if (model.operation === 'advance') {
    return t('bfStatusAdvance').replace('{j}', String(model.j ?? '—'));
  }
  if (model.operation === 'mismatch' && model.compareIndex !== null) {
    return t('bfStatusMismatch')
      .replace('{textIndex}', String(model.compareIndex))
      .replace('{patternIndex}', String(model.j ?? '—'))
      .replace('{start}', String(model.start ?? '—'));
  }
  if (model.operation === 'match-found') {
    return t('bfStatusFound').replace('{start}', String(model.start ?? '—'));
  }
  return '';
}
