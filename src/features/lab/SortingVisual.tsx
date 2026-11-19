import { useI18n } from '../../i18n/I18nProvider';
import type { SortingVisualModel } from '../../domain/visualization/sortingModel';
import type { SortingOperation } from '../../domain/trace/schema';
import '../../styles/s1.css';

const OPERATION_KEYS: Record<SortingOperation, string> = {
  init: 'sortingOpInit',
  'select-start': 'sortingOpSelectStart',
  'select-compare': 'sortingOpSelectCompare',
  'select-candidate': 'sortingOpSelectCandidate',
  'select-swap': 'sortingOpSelectSwap',
  'select-done': 'sortingOpSelectDone',
  'insert-key': 'sortingOpInsertKey',
  'insert-compare': 'sortingOpInsertCompare',
  'insert-shift': 'sortingOpInsertShift',
  'insert-place': 'sortingOpInsertPlace',
  'gap-change': 'sortingOpGapChange',
  'shell-compare': 'sortingOpShellCompare',
  'shell-shift': 'sortingOpShellShift',
  'shell-place': 'sortingOpShellPlace',
  'gap-done': 'sortingOpGapDone',
  'quick-range': 'sortingOpQuickRange',
  'quick-compare': 'sortingOpQuickCompare',
  'quick-swap': 'sortingOpQuickSwap',
  'quick-place': 'sortingOpQuickPlace',
  'quick-return': 'sortingOpQuickReturn',
  'merge-range': 'sortingOpMergeRange',
  'merge-split': 'sortingOpMergeSplit',
  'merge-return': 'sortingOpMergeReturn',
  'merge-start': 'sortingOpMergeStart',
  'merge-compare': 'sortingOpMergeCompare',
  'merge-write': 'sortingOpMergeWrite',
  'merge-copy': 'sortingOpMergeCopy',
  'merge-writeback': 'sortingOpMergeWriteback',
  'merge-range-done': 'sortingOpMergeRangeDone',
  done: 'sortingOpDone',
};

const HINT_KEYS: Record<SortingOperation, string> = {
  init: 'sortingHintInit',
  'select-start': 'sortingHintSelectStart',
  'select-compare': 'sortingHintSelectCompare',
  'select-candidate': 'sortingHintSelectCandidate',
  'select-swap': 'sortingHintSelectSwap',
  'select-done': 'sortingHintSelectDone',
  'insert-key': 'sortingHintInsertKey',
  'insert-compare': 'sortingHintInsertCompare',
  'insert-shift': 'sortingHintInsertShift',
  'insert-place': 'sortingHintInsertPlace',
  'gap-change': 'sortingHintGapChange',
  'shell-compare': 'sortingHintShellCompare',
  'shell-shift': 'sortingHintShellShift',
  'shell-place': 'sortingHintShellPlace',
  'gap-done': 'sortingHintGapDone',
  'quick-range': 'sortingHintQuickRange',
  'quick-compare': 'sortingHintQuickCompare',
  'quick-swap': 'sortingHintQuickSwap',
  'quick-place': 'sortingHintQuickPlace',
  'quick-return': 'sortingHintQuickReturn',
  'merge-range': 'sortingHintMergeRange',
  'merge-split': 'sortingHintMergeSplit',
  'merge-return': 'sortingHintMergeReturn',
  'merge-start': 'sortingHintMergeStart',
  'merge-compare': 'sortingHintMergeCompare',
  'merge-write': 'sortingHintMergeWrite',
  'merge-copy': 'sortingHintMergeCopy',
  'merge-writeback': 'sortingHintMergeWriteback',
  'merge-range-done': 'sortingHintMergeRangeDone',
  done: 'sortingHintDone',
};

/**
 * One shared array renderer for S1 selection/insertion/Shell and S2
 * quick/merge sort. It reads only the pure `sorting` model built from the
 * current Trace frame; it keeps no playhead and never reconstructs a state
 * from the operation name.
 */
export function SortingVisual({ model }: { model: SortingVisualModel }) {
  const { t } = useI18n();
  const resultClass = `sorting-visual is-${model.algorithm} is-phase-${model.phase}`;
  const isShell = model.algorithm === 'shell';
  const isQuick = model.algorithm === 'quick';
  const isMerge = model.algorithm === 'merge';
  const isDivide = isQuick || isMerge;
  const pivotValue = model.pivot === null ? null : model.cells[model.pivot]?.value ?? null;
  const bufferCapacity = model.range === null ? 0 : Math.max(0, model.range.high - model.range.low + 1);

  if (model.empty) {
    return (
      <div
        className={resultClass}
        data-testid="sorting-visual"
        data-algorithm={model.algorithm}
        data-operation={model.operation}
        data-phase={model.phase}
        data-total="0"
        data-empty="true"
        role="group"
        aria-label={t('sortingVisualLabel')}
      >
        <div className="sorting-op-row">
          <span className="sorting-op">{t(OPERATION_KEYS[model.operation])}</span>
          <span className="sorting-op-count">{t('sortingRoundValue').replace('{round}', String(model.round))}</span>
        </div>
        <div className="sorting-empty" data-testid="sorting-empty">
          <span className="sorting-empty-icon" aria-hidden="true">▭</span>
          <span>{t('sortingEmpty')}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={resultClass}
      data-testid="sorting-visual"
      data-algorithm={model.algorithm}
      data-operation={model.operation}
      data-phase={model.phase}
      data-total={String(model.total)}
      data-round={String(model.round)}
      data-sorted-from={String(model.sortedFrom)}
      data-sorted-count={String(model.sortedCount)}
      data-unsorted-count={String(model.unsortedCount)}
      data-candidate={model.candidate ?? ''}
      data-compare={model.compare ?? ''}
      data-gap={model.gap ?? ''}
      data-lane={model.lane ?? ''}
      data-inserted-at={model.insertedAt ?? ''}
      data-range-low={model.range?.low ?? ''}
      data-range-high={model.range?.high ?? ''}
      data-pivot={model.pivot ?? ''}
      data-boundary={model.boundary ?? ''}
      data-split={model.split ?? ''}
      data-left={model.left ?? ''}
      data-right={model.right ?? ''}
      data-finalized-count={String(model.finalized.length)}
      data-buffer-length={String(model.buffer.length)}
      data-write-at={model.writeAt ?? ''}
      data-empty="false"
      role="group"
      aria-label={t('sortingVisualLabel')}
    >
      <div className="sorting-op-row">
        <span className="sorting-op" data-testid="sorting-operation">{t(OPERATION_KEYS[model.operation])}</span>
        <span className="sorting-op-count" data-testid="sorting-round">
          {isShell
            ? `${t('sortingGapPass')} ${t('sortingGapPassValue')
                .replace('{round}', String(model.round))
                .replace('{total}', String(model.gapSequence.length))}`
            : isQuick
              ? t('sortingPartitionValue').replace('{round}', String(model.round))
              : isMerge
                ? t('sortingCallValue').replace('{round}', String(model.round))
                : t('sortingRoundValue').replace('{round}', String(model.round))}
        </span>
      </div>

      <div className="sorting-meta" data-testid="sorting-meta">
        <span className="sorting-meta-chip is-sorted">
          {isDivide
            ? t('sortingFinalCount')
                .replace('{count}', String(model.sortedCount))
                .replace('{total}', String(model.total))
            : t('sortingSortedPrefix')
                .replace('{count}', String(model.sortedCount))
                .replace('{total}', String(model.total))}
        </span>
        {isShell ? (
          <>
            <span className="sorting-meta-chip is-gap" data-testid="sorting-gap">
              {t('sortingGapLabel')}: <b>{model.gap ?? '—'}</b>
            </span>
            <span className="sorting-meta-chip">
              {t('sortingGapSequence')}: <code>{model.gapSequence.join(' → ')}</code>
            </span>
            {model.lane !== null && (
              <span className="sorting-meta-chip is-lane" data-testid="sorting-lane">
                {t('sortingLaneLabel')}: <b>{model.lane}</b>
              </span>
            )}
          </>
        ) : isDivide ? (
          <span className="sorting-meta-chip is-range" data-testid="sorting-range">
            {t('sortingRangeLabel')}:{' '}
            <b>
              {model.range && model.range.low <= model.range.high
                ? t('sortingRangeValue')
                    .replace('{low}', String(model.range.low))
                    .replace('{high}', String(model.range.high))
                : t('sortingRangeEmpty')}
            </b>
          </span>
        ) : (
          <span className="sorting-meta-chip">
            {t('sortingUnsortedSuffix').replace('{count}', String(model.unsortedCount))}
          </span>
        )}
        {isQuick && model.pivot !== null && (
          <span className="sorting-meta-chip is-pivot" data-testid="sorting-pivot">
            {t('sortingPivotLabel')}: <b>p{model.pivot}</b>
            {pivotValue !== null && <code> = {pivotValue}</code>}
          </span>
        )}
        {isQuick && model.boundary !== null && (
          <span className="sorting-meta-chip is-boundary" data-testid="sorting-boundary">
            {t('sortingBoundaryLabel')}: <b>i = {model.boundary}</b>
          </span>
        )}
        {isDivide && model.swapped && (
          <span className="sorting-meta-chip is-swap" data-testid="sorting-swap">
            {t('sortingSwapLabel')}: <b>p{model.swapped[0]} ⇄ p{model.swapped[1]}</b>
          </span>
        )}
        {isMerge && model.split !== null && (
          <span className="sorting-meta-chip is-split" data-testid="sorting-split">
            {t('sortingSplitLabel')}: <b>mid = {model.split}</b>
          </span>
        )}
        {isMerge && model.left !== null && (
          <span className="sorting-meta-chip is-left" data-testid="sorting-left">
            {t('sortingLeftLabel')}: <b>p{model.left}</b>
          </span>
        )}
        {isMerge && model.right !== null && (
          <span className="sorting-meta-chip is-right" data-testid="sorting-right">
            {t('sortingRightLabel')}: <b>p{model.right}</b>
          </span>
        )}
        {isMerge && (
          <span className="sorting-meta-chip is-buffer" data-testid="sorting-buffer-count">
            {t('sortingBufferLabel')}: <b>{model.buffer.length} / {bufferCapacity}</b>
          </span>
        )}
        {model.candidate !== null && (
          <span className="sorting-meta-chip is-candidate" data-testid="sorting-candidate">
            {t('sortingCandidateLabel')}: <b>p{model.candidate}</b>
          </span>
        )}
        {model.compare !== null && (
          <span className="sorting-meta-chip is-compare" data-testid="sorting-compare">
            {t('sortingCompareLabel')}: <b>p{model.compare}</b>
          </span>
        )}
      </div>

      {model.key && (
        <div className="sorting-key-card" data-testid="sorting-key" data-origin={model.key.origin} data-value={model.key.value}>
          <span className="sorting-key-card-label">{t('sortingKeyLabel')}</span>
          <b>{model.key.value}</b>
          <span>{t('sortingKeyAt').replace('{origin}', String(model.key.origin))}</span>
        </div>
      )}

      {isMerge && model.range && (
        <div className="sorting-buffer-panel" data-testid="sorting-buffer" data-length={model.buffer.length} data-capacity={bufferCapacity}>
          <div className="sorting-buffer-head">
            <span className="sorting-buffer-title">{t('sortingBufferLabel')}</span>
            <span className="sorting-buffer-note" data-testid="sorting-buffer-note">
              {model.bufferWrite
                ? t('sortingBufferWrite')
                    .replace('{index}', String(model.bufferWrite.index))
                    .replace('{value}', String(model.bufferWrite.value))
                : model.buffer.length === 0
                  ? t('sortingBufferEmpty')
                  : `${model.buffer.length} / ${bufferCapacity}`}
            </span>
          </div>
          <div
            className="sorting-buffer-slots"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, bufferCapacity)}, minmax(0, 1fr))` }}
            role="list"
            aria-label={t('sortingBufferLabel')}
          >
            {Array.from({ length: Math.max(1, bufferCapacity) }, (_, slot) => {
              const filled = slot < model.buffer.length;
              const written = model.bufferWrite?.index === slot;
              const source = written ? model.bufferWrite?.source : null;
              return (
                <div
                  className={`sorting-buffer-slot${filled ? ' is-filled' : ''}${written ? ' is-written' : ''}`}
                  key={`buffer-${slot}`}
                  data-testid="sorting-buffer-slot"
                  data-index={slot}
                  data-filled={filled ? 'true' : 'false'}
                  data-written={written ? 'true' : 'false'}
                  data-value={filled ? String(model.buffer[slot]) : ''}
                  role="listitem"
                >
                  <span className="sorting-buffer-index">b{slot}</span>
                  <b className="sorting-buffer-value">{filled ? String(model.buffer[slot]) : '·'}</b>
                  <span className="sorting-buffer-source">
                    {source !== null ? t('sortingBufferSource').replace('{source}', String(source)) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(isQuick || isMerge) && model.mergedRanges.length > 0 && (
        <div className="sorting-range-chips" data-testid="sorting-merged-ranges" aria-label={t('sortingLegendMerged')}>
          {model.mergedRanges.map((range, index) => (
            <span className="sorting-range-chip" key={`merged-${index}`}>
              [{range.low}, {range.high}]
            </span>
          ))}
        </div>
      )}

      <div className="sorting-array-wrap">
        <div className="bars sorting-bars" data-testid="sorting-array" role="list">
          {model.cells.map((cell) => {
            const marks = cell.marks;
            const isSorted = marks.includes('sorted');
            const isCompare = marks.includes('compare');
            const isCandidate = marks.includes('candidate');
            const isKey = marks.includes('key-origin');
            const isShiftSource = marks.includes('shift-source');
            const isShiftTarget = marks.includes('shift-target');
            const isPlaced = marks.includes('placed');
            const isLane = marks.includes('lane');
            const isSwap = marks.includes('swap');
            const isRange = marks.includes('range');
            const isRangeStart = marks.includes('range-start');
            const isRangeEnd = marks.includes('range-end');
            const isPivot = marks.includes('pivot');
            const isFinal = marks.includes('final');
            const isMerged = marks.includes('merged');
            const isLeft = marks.includes('left');
            const isRight = marks.includes('right');
            const isBufferSource = marks.includes('buffer-source');
            const isWriteTarget = marks.includes('write-target');
            const isBoundary = model.boundary === cell.index;
            return (
              <div
                className={`bar-item sorting-bar-item${isRange ? ' is-range' : ''}${isRangeStart ? ' is-range-start' : ''}${
                  isRangeEnd ? ' is-range-end' : ''
                }${isPivot ? ' is-pivot' : ''}${isBoundary ? ' is-boundary' : ''}${
                  isBufferSource ? ' is-buffer-source' : ''
                }${isWriteTarget ? ' is-write-target' : ''}`}
                key={cell.id}
                data-testid="sorting-bar"
                data-id={cell.id}
                data-index={cell.index}
                data-value={cell.value}
                data-marks={marks.join(',')}
                data-sorted={isSorted ? 'true' : 'false'}
                data-candidate={isCandidate ? 'true' : 'false'}
                data-compare={isCompare ? 'true' : 'false'}
                data-key={isKey ? 'true' : 'false'}
                data-shift-source={isShiftSource ? 'true' : 'false'}
                data-shift-target={isShiftTarget ? 'true' : 'false'}
                data-placed={isPlaced ? 'true' : 'false'}
                data-lane={isLane ? 'true' : 'false'}
                data-swap={isSwap ? 'true' : 'false'}
                data-range={isRange ? 'true' : 'false'}
                data-pivot={isPivot ? 'true' : 'false'}
                data-final={isFinal ? 'true' : 'false'}
                data-merged={isMerged ? 'true' : 'false'}
                data-left={isLeft ? 'true' : 'false'}
                data-right={isRight ? 'true' : 'false'}
              >
                <div className="sorting-bar-marks">
                  {isCandidate && <span className="sorting-mark is-candidate">MIN</span>}
                  {isCompare && <span className="sorting-mark is-compare">CMP</span>}
                  {isPivot && <span className="sorting-mark is-pivot">PIV</span>}
                  {isLeft && <span className="sorting-mark is-left">L</span>}
                  {isRight && <span className="sorting-mark is-right">R</span>}
                  {isKey && <span className="sorting-mark is-key">KEY</span>}
                  {isPlaced && !isFinal && <span className="sorting-mark is-placed">✓</span>}
                  {isFinal && <span className="sorting-mark is-final">✓</span>}
                  {isBufferSource && <span className="sorting-mark is-buffer-source">B</span>}
                  {isWriteTarget && <span className="sorting-mark is-write-target">↓</span>}
                  {isSwap && <span className="sorting-mark is-swap">⇄</span>}
                  {isShiftTarget && <span className="sorting-mark is-shift">→</span>}
                </div>
                {isBoundary && (
                  <span className="sorting-boundary-tag" aria-hidden="true">
                    i
                  </span>
                )}
                <div
                  className={`bar sorting-bar${isSorted ? ' is-sorted' : ''}${isCompare ? ' is-compare' : ''}${
                    isCandidate ? ' is-candidate' : ''
                  }${isKey ? ' is-key' : ''}${isShiftTarget ? ' is-shift-target' : ''}${
                    isPlaced ? ' is-placed' : ''
                  }${isLane ? ' is-lane' : ''}${isRange ? ' is-range' : ''}${isPivot ? ' is-pivot' : ''}${
                    isFinal ? ' is-final' : ''
                  }${isMerged ? ' is-merged' : ''}${isLeft ? ' is-left' : ''}${isRight ? ' is-right' : ''}${
                    isBufferSource ? ' is-buffer-source' : ''
                  }${isWriteTarget ? ' is-write-target' : ''}`}
                  style={{ height: `${cell.height}px` }}
                  role="listitem"
                  aria-label={`${cell.value} at p${cell.index}${isSorted ? ', sorted' : ''}${
                    isFinal ? ', final' : ''
                  }`}
                >
                  <span>{String(cell.value)}</span>
                </div>
                <span className="bar-label">p{cell.index}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sorting-footer">
        <div className="sorting-hint" data-testid="sorting-hint">
          <b>{t(OPERATION_KEYS[model.operation])}</b>
          <span>{t(HINT_KEYS[model.operation])}</span>
        </div>
        <div className="sorting-legend" data-testid="sorting-legend" aria-label={t('sortingLegendTitle')}>
          <span className="sorting-legend-title">{t('sortingLegendTitle')}</span>
          <span className="sorting-legend-item is-sorted">{t('sortingLegendSorted')}</span>
          {isDivide && <span className="sorting-legend-item is-range">{t('sortingLegendRange')}</span>}
          {isQuick && <span className="sorting-legend-item is-pivot">{t('sortingLegendPivot')}</span>}
          {isQuick && <span className="sorting-legend-item is-boundary">{t('sortingLegendBoundary')}</span>}
          {isQuick && <span className="sorting-legend-item is-final">{t('sortingLegendFinal')}</span>}
          {isMerge && <span className="sorting-legend-item is-left-right">{t('sortingLegendLeftRight')}</span>}
          {isMerge && <span className="sorting-legend-item is-merged">{t('sortingLegendMerged')}</span>}
          {isMerge && <span className="sorting-legend-item is-buffer">{t('sortingLegendBuffer')}</span>}
          <span className="sorting-legend-item is-compare">{t('sortingLegendCompare')}</span>
          {model.algorithm === 'selection' && (
            <span className="sorting-legend-item is-candidate">{t('sortingLegendCandidate')}</span>
          )}
          {(model.algorithm === 'insertion' || model.algorithm === 'shell') && (
            <span className="sorting-legend-item is-key">{t('sortingLegendKey')}</span>
          )}
          {model.algorithm === 'shell' && (
            <span className="sorting-legend-item is-lane">{t('sortingLegendLane')}</span>
          )}
          {!isMerge && <span className="sorting-legend-item is-shift">{t('sortingLegendShift')}</span>}
        </div>
      </div>
    </div>
  );
}
