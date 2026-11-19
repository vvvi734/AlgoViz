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
  done: 'sortingHintDone',
};

/**
 * One shared array renderer for all three S1 algorithms. It reads only the pure
 * `sorting` model built from the current Trace frame; it keeps no playhead and
 * does not reconstruct a state from the operation name.
 */
export function SortingVisual({ model }: { model: SortingVisualModel }) {
  const { t } = useI18n();
  const resultClass = `sorting-visual is-${model.algorithm} is-phase-${model.phase}`;

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
      data-empty="false"
      role="group"
      aria-label={t('sortingVisualLabel')}
    >
      <div className="sorting-op-row">
        <span className="sorting-op" data-testid="sorting-operation">{t(OPERATION_KEYS[model.operation])}</span>
        <span className="sorting-op-count" data-testid="sorting-round">
          {model.algorithm === 'shell'
            ? `${t('sortingGapPass')} ${t('sortingGapPassValue')
                .replace('{round}', String(model.round))
                .replace('{total}', String(model.gapSequence.length))}`
            : t('sortingRoundValue').replace('{round}', String(model.round))}
        </span>
      </div>

      <div className="sorting-meta" data-testid="sorting-meta">
        <span className="sorting-meta-chip is-sorted">
          {t('sortingSortedPrefix')
            .replace('{count}', String(model.sortedCount))
            .replace('{total}', String(model.total))}
        </span>
        {model.algorithm === 'shell' ? (
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
        ) : (
          <span className="sorting-meta-chip">
            {t('sortingUnsortedSuffix').replace('{count}', String(model.unsortedCount))}
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
            return (
              <div
                className="bar-item sorting-bar-item"
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
              >
                <div className="sorting-bar-marks">
                  {isCandidate && <span className="sorting-mark is-candidate">MIN</span>}
                  {isCompare && <span className="sorting-mark is-compare">CMP</span>}
                  {isKey && <span className="sorting-mark is-key">KEY</span>}
                  {isPlaced && <span className="sorting-mark is-placed">✓</span>}
                  {isSwap && <span className="sorting-mark is-swap">⇄</span>}
                  {isShiftTarget && <span className="sorting-mark is-shift">→</span>}
                </div>
                <div
                  className={`bar sorting-bar${isSorted ? ' is-sorted' : ''}${isCompare ? ' is-compare' : ''}${
                    isCandidate ? ' is-candidate' : ''
                  }${isKey ? ' is-key' : ''}${isShiftTarget ? ' is-shift-target' : ''}${
                    isPlaced ? ' is-placed' : ''
                  }${isLane ? ' is-lane' : ''}`}
                  style={{ height: `${cell.height}px` }}
                  role="listitem"
                  aria-label={`${cell.value} at p${cell.index}${isSorted ? ', sorted' : ''}`}
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
          <span className="sorting-legend-item is-shift">{t('sortingLegendShift')}</span>
        </div>
      </div>
    </div>
  );
}
