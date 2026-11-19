import { useI18n } from '../../i18n/I18nProvider';
import type { SearchOperation } from '../../domain/trace/schema';
import type { SearchVisualModel } from '../../domain/visualization/searchModel';
import '../../styles/s1.css';
import '../../styles/f1.css';

const OPERATION_KEYS: Record<SearchOperation, string> = {
  init: 'searchOpInit',
  'scan-start': 'searchOpScanStart',
  'scan-compare': 'searchOpScanCompare',
  'scan-next': 'searchOpScanNext',
  found: 'searchOpFound',
  'not-found': 'searchOpNotFound',
  'binary-init': 'searchOpBinaryInit',
  'binary-mid': 'searchOpBinaryMid',
  'binary-compare': 'searchOpBinaryCompare',
  'binary-exclude-right': 'searchOpBinaryExcludeRight',
  'binary-exclude-left': 'searchOpBinaryExcludeLeft',
  'binary-found': 'searchOpBinaryFound',
  'binary-not-found': 'searchOpBinaryNotFound',
  invalid: 'searchOpInvalid',
};

const HINT_KEYS: Record<SearchOperation, string> = {
  init: 'searchHintInit',
  'scan-start': 'searchHintScanStart',
  'scan-compare': 'searchHintScanCompare',
  'scan-next': 'searchHintScanNext',
  found: 'searchHintFound',
  'not-found': 'searchHintNotFound',
  'binary-init': 'searchHintBinaryInit',
  'binary-mid': 'searchHintBinaryMid',
  'binary-compare': 'searchHintBinaryCompare',
  'binary-exclude-right': 'searchHintBinaryExcludeRight',
  'binary-exclude-left': 'searchHintBinaryExcludeLeft',
  'binary-found': 'searchHintBinaryFound',
  'binary-not-found': 'searchHintBinaryNotFound',
  invalid: 'searchHintInvalid',
};

/**
 * Dedicated search array view. It shares the array bars from S1/S2 but has its
 * own scan/range semantics: linear search dims checked and pending slots, while
 * binary search paints the live [left, right] interval and derives every
 * excluded cell from that real range.
 */
export function SearchVisual({ model }: { model: SearchVisualModel }) {
  const { t } = useI18n();
  const isLinear = model.algorithm === 'linear';
  const invalid = model.operation === 'invalid';
  const resultText =
    model.found === true && model.result !== null
      ? t('searchFoundAt').replace('{index}', String(model.result))
      : model.found === false
        ? t('searchMissing')
        : null;

  return (
    <div
      className="sorting-visual search-visual"
      data-testid="search-visual"
      data-algorithm={model.algorithm}
      data-operation={model.operation}
      data-phase={model.phase}
      data-total={String(model.total)}
      data-target={String(model.target)}
      data-index={model.index ?? ''}
      data-left={model.left ?? ''}
      data-right={model.right ?? ''}
      data-mid={model.mid ?? ''}
      data-result={model.result ?? ''}
      data-found={model.found === null ? '' : String(model.found)}
      data-checked-count={String(model.checkedCount)}
      data-excluded-count={String(model.excludedCount)}
      data-range-low={model.range?.low ?? ''}
      data-range-high={model.range?.high ?? ''}
      role="group"
      aria-label={t('searchVisualLabel')}
    >
      <div className="sorting-op-row">
        <span className="sorting-op" data-testid="search-operation">
          {t(OPERATION_KEYS[model.operation])}
        </span>
        <span className="search-algorithm-name">
          {t(isLinear ? 'searchLinearName' : 'searchBinaryName')}
        </span>
      </div>

      <div className="search-target-row">
        <span className="search-target-card" data-testid="search-target">
          {t('searchTarget').replace('{target}', String(model.target))}
        </span>
        {resultText && (
          <span
            className={`search-result-chip ${model.found ? 'is-found' : 'is-missing'}`}
            data-testid="search-result"
          >
            {resultText}
          </span>
        )}
      </div>

      <div className="sorting-meta" data-testid="search-meta">
        {isLinear && (
          <span className="sorting-meta-chip search-chip is-checked" data-testid="search-checked-count">
            {t('searchCheckedCount')
              .replace('{count}', String(model.checkedCount))
              .replace('{total}', String(model.total))}
          </span>
        )}
        {!isLinear && !invalid && (
          <>
            <span className="sorting-meta-chip search-chip is-excluded" data-testid="search-excluded-count">
              {t('searchExcludedCount')
                .replace('{count}', String(model.excludedCount))
                .replace('{total}', String(model.total))}
            </span>
            <span className="sorting-meta-chip search-chip is-remaining" data-testid="search-remaining-count">
              {t('searchRemainingCount').replace('{count}', String(model.remainingCount))}
            </span>
          </>
        )}
        {model.range && (
          <span className="sorting-meta-chip search-chip is-range" data-testid="search-range">
            {t('searchRangeLabel')}{' '}
            {t('searchRangeValue')
              .replace('{low}', String(model.range.low))
              .replace('{right}', String(model.range.high))}
          </span>
        )}
        {!isLinear && model.operation === 'binary-not-found' && (
          <span className="sorting-meta-chip search-chip is-empty" data-testid="search-range-empty">
            {t('searchEmptyRange')}
          </span>
        )}
        {model.left !== null && (
          <span className="sorting-meta-chip search-chip is-left" data-testid="search-left">
            {t('searchLeft').replace('{left}', String(model.left))}
          </span>
        )}
        {model.right !== null && (
          <span className="sorting-meta-chip search-chip is-right" data-testid="search-right">
            {t('searchRight').replace('{right}', String(model.right))}
          </span>
        )}
        {model.mid !== null && (
          <span className="sorting-meta-chip search-chip is-mid" data-testid="search-mid">
            {t('searchMid').replace('{mid}', String(model.mid))}
          </span>
        )}
      </div>

      {invalid && (
        <div className="search-invalid" data-testid="search-invalid" role="status">
          {t('searchInvalidUnsorted')}
        </div>
      )}

      {model.total === 0 ? (
        <div className="search-empty" data-testid="search-empty">
          {t('searchEmpty')}
        </div>
      ) : (
        <div className="sorting-array-wrap">
          <div className="bars sorting-bars search-bars" data-testid="search-array" role="list">
            {model.cells.map((cell) => {
              const checked = cell.marks.includes('checked');
              const current = cell.marks.includes('current');
              const found = cell.marks.includes('found');
              const excluded = cell.marks.includes('excluded');
              const liveRange = cell.marks.includes('range');
              const left = cell.marks.includes('left');
              const right = cell.marks.includes('right');
              const mid = cell.marks.includes('mid');
              const rangeStart = cell.marks.includes('range-start');
              const rangeEnd = cell.marks.includes('range-end');
              const singleBoundary = left && right && model.left === model.right;
              return (
                <div
                  className={`bar-item sorting-bar-item search-bar-item${checked ? ' is-checked' : ''}${
                    current ? ' is-current' : ''
                  }${found ? ' is-found' : ''}${excluded ? ' is-excluded' : ''}${
                    liveRange ? ' is-range' : ''
                  }${rangeStart ? ' is-range-start' : ''}${rangeEnd ? ' is-range-end' : ''}${
                    left ? ' is-left' : ''
                  }${right ? ' is-right' : ''}${mid ? ' is-mid' : ''}`}
                  key={cell.id}
                  data-testid="search-bar"
                  data-id={cell.id}
                  data-index={cell.index}
                  data-value={cell.value}
                  data-marks={cell.marks.join(',')}
                  role="listitem"
                >
                  <div className="sorting-bar-marks search-bar-marks">
                    {found ? (
                      <span className="sorting-mark search-mark is-found">✓</span>
                    ) : (
                      <>
                        {mid && <span className="sorting-mark search-mark is-mid">MID</span>}
                        {!mid && singleBoundary && (
                          <span className="sorting-mark search-mark is-left">L=R</span>
                        )}
                        {!singleBoundary && left && <span className="sorting-mark search-mark is-left">L</span>}
                        {!singleBoundary && right && <span className="sorting-mark search-mark is-right">R</span>}
                        {current && <span className="sorting-mark search-mark is-current">CMP</span>}
                        {checked && <span className="sorting-mark search-mark is-checked">✓</span>}
                      </>
                    )}
                  </div>
                  <div
                    className={`bar sorting-bar search-bar${checked ? ' is-checked' : ''}${
                      current ? ' is-current' : ''
                    }${found ? ' is-found' : ''}${excluded ? ' is-excluded' : ''}${
                      liveRange ? ' is-range' : ''
                    }${left ? ' is-left' : ''}${right ? ' is-right' : ''}${mid ? ' is-mid' : ''}`}
                    style={{ height: `${cell.height}px` }}
                  >
                    {cell.value}
                  </div>
                  <div className="search-index-label" aria-hidden="true">
                    p{cell.index}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="sorting-footer">
        <div className="sorting-hint" data-testid="search-hint">
          <b>{t(HINT_KEYS[model.operation])}</b>
        </div>
        <div className="sorting-legend search-legend" aria-label={t('searchLegendTitle')}>
          <span className="sorting-legend-item search-legend-item is-checked">
            {t('searchLegendChecked')}
          </span>
          <span className="sorting-legend-item search-legend-item is-current">
            {t('searchLegendCurrent')}
          </span>
          {isLinear && (
            <span className="sorting-legend-item search-legend-item is-pending">
              {t('searchLegendPending')}
            </span>
          )}
          <span className="sorting-legend-item search-legend-item is-found">
            {t('searchLegendFound')}
          </span>
          {!isLinear && (
            <>
              <span className="sorting-legend-item search-legend-item is-excluded">
                {t('searchLegendExcluded')}
              </span>
              <span className="sorting-legend-item search-legend-item is-range">
                {t('searchLegendRange')}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
