import { useI18n } from '../../i18n/I18nProvider';
import type {
  SequentialListAction,
  SequentialListError,
  SequentialListOperation,
} from '../../domain/trace/schema';
import type { SequentialListVisualModel } from '../../domain/visualization/sequentialListModel';

const OPERATION_KEYS: Record<SequentialListOperation, string> = {
  init: 'seqOpInit',
  access: 'seqOpAccess',
  search: 'seqOpSearch',
  insert: 'seqOpInsert',
  delete: 'seqOpDelete',
  traverse: 'seqOpTraverse',
  done: 'seqOpDone',
};

const ACTION_KEYS: Record<SequentialListAction, string> = {
  read: 'seqActionRead',
  compare: 'seqActionCompare',
  visit: 'seqActionVisit',
  check: 'seqActionCheck',
  'shift-right': 'seqActionShiftRight',
  write: 'seqActionWrite',
  save: 'seqActionSave',
  'shift-left': 'seqActionShiftLeft',
  clear: 'seqActionClear',
  complete: 'seqActionComplete',
  reject: 'seqActionReject',
};

const ERROR_KEYS: Record<SequentialListError, string> = {
  'index-out-of-range': 'seqErrorIndex',
  'capacity-full': 'seqErrorCapacity',
  'list-empty': 'seqErrorEmpty',
};

function valueText(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function SequentialListVisual({ model }: { model: SequentialListVisualModel }) {
  const { t } = useI18n();
  const shifting =
    model.action === 'shift-right' || model.action === 'shift-left';
  const direction =
    model.sourceIndex !== undefined && model.targetIndex !== undefined
      ? model.targetIndex > model.sourceIndex
        ? t('seqDirectionRight')
        : t('seqDirectionLeft')
      : null;
  const checkedText =
    model.checkedCount > 0
      ? t('seqCheckedCount').replace('{count}', String(model.checkedCount))
      : null;

  return (
    <div
      className="seqlist-visual"
      data-testid="seqlist-visual"
      data-operation={model.operation}
      data-action={model.action}
      data-phase={model.phase}
      data-preset={model.preset ?? ''}
      aria-label={t('seqVisualLabel')}
    >
      <div className="seqlist-toolbar">
        <div className="seqlist-heading">
          <span className="seqlist-op-label">{t(OPERATION_KEYS[model.operation])}</span>
          <span className="seqlist-action-label">{t(ACTION_KEYS[model.action])}</span>
          <span
            className={`seqlist-phase ${model.phase === 'complete' ? 'is-complete' : 'is-intermediate'}`}
            data-testid="seqlist-phase"
          >
            {model.action === 'reject'
              ? t('seqActionReject')
              : model.phase === 'complete'
                ? t('seqComplete')
                : t('seqIntermediate')}
          </span>
        </div>
        <div className="seqlist-counters" data-testid="seqlist-counters">
          <span className="seqlist-counter">
            <b>length</b>
            <strong data-testid="seqlist-length">{model.length}</strong>
          </span>
          <span className="seqlist-counter">
            <b>capacity</b>
            <strong data-testid="seqlist-capacity">{model.capacity}</strong>
          </span>
          {checkedText ? <span className="seqlist-counter-note">{checkedText}</span> : null}
        </div>
      </div>

      <div className="seqlist-legend">
        <span><i className="seqlist-legend-dot occupied" />{t('seqEffective')}</span>
        <span><i className="seqlist-legend-dot free" />{t('seqFree')}</span>
        <span><i className="seqlist-legend-dot temporary" />{t('seqTemporary')}</span>
        {model.full ? <span className="seqlist-state-chip">{t('seqFullHint')}</span> : null}
        {model.empty ? <span className="seqlist-state-chip">{t('seqEmptyHint')}</span> : null}
      </div>

      <div className="seqlist-scroller" data-testid="seqlist-scroller">
        <div className="seqlist-region-labels">
          <span className="seqlist-region effective">
            {t('seqEffective')} [0, {model.length})
          </span>
          <span className="seqlist-region free">
            {t('seqFree')} [{model.length}, {model.capacity})
          </span>
        </div>
        <div
          className="seqlist-track"
          data-testid="seqlist-slots"
          style={{
            gridTemplateColumns: `repeat(${model.capacity}, 68px)`,
            minWidth: `${model.capacity * 68 + (model.capacity - 1) * 8}px`,
          }}
        >
          {model.slots.map((slot) => {
            const classes = [
              'seqlist-slot',
              slot.occupied ? 'is-occupied' : 'is-free',
              slot.temporary ? 'is-temporary' : '',
              slot.focus ? 'is-focus' : '',
              slot.source ? 'is-source' : '',
              slot.target ? 'is-target' : '',
              slot.changed ? 'is-changed' : '',
              slot.checked ? 'is-checked' : '',
              slot.removed ? 'is-removed' : '',
            ].filter(Boolean).join(' ');
            const role = slot.occupied
              ? t('seqEffective')
              : slot.temporary
                ? t('seqTemporary')
                : t('seqFree');
            return (
              <div
                key={slot.index}
                className={classes}
                data-testid={`seqlist-slot-${slot.index}`}
                data-index={slot.index}
                data-value={valueText(slot.value)}
                data-occupied={slot.occupied ? 'true' : 'false'}
                data-focus={slot.focus ? 'true' : 'false'}
                data-source={slot.source ? 'true' : 'false'}
                data-target={slot.target ? 'true' : 'false'}
                data-changed={slot.changed ? 'true' : 'false'}
                data-removed={slot.removed ? 'true' : 'false'}
              >
                <span className="seqlist-slot-index">[{slot.index}]</span>
                <b className="seqlist-slot-value">{valueText(slot.value)}</b>
                <span className="seqlist-slot-role">{role}</span>
                <span className="seqlist-slot-badges">
                  {slot.source ? <i className="seqlist-badge source">{t('seqSource')}</i> : null}
                  {slot.target ? <i className="seqlist-badge target">{t('seqTarget')}</i> : null}
                  {slot.focus ? <i className="seqlist-badge focus">{t('seqCurrent')}</i> : null}
                  {slot.removed ? <i className="seqlist-badge removed">{t('seqRemoved')}</i> : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="seqlist-readout">
        {model.requestedIndex !== undefined ? (
          <span className="seqlist-chip">
            {t('seqRequestedIndex')} <b>{model.requestedIndex}</b>
          </span>
        ) : null}
        {model.focusIndex !== undefined ? (
          <span className="seqlist-chip">
            {t('seqCurrentIndex')} <b>{model.focusIndex}</b>
          </span>
        ) : null}
        {model.searchValue !== undefined ? (
          <span className="seqlist-chip">
            {t('seqSearchValue')} <b>{valueText(model.searchValue)}</b>
          </span>
        ) : null}
        {model.foundIndex !== undefined ? (
          <span className="seqlist-chip is-found">
            {t('seqFoundAt')} <b>{model.foundIndex}</b>
          </span>
        ) : null}
        {direction ? (
          <span className={`seqlist-chip is-shift${shifting ? ' is-active' : ''}`}>
            {direction}
            {model.sourceIndex !== undefined && model.targetIndex !== undefined ? (
              <b>{`[${model.sourceIndex}] → [${model.targetIndex}]`}</b>
            ) : null}
          </span>
        ) : null}
      </div>

      {model.change ? (
        <div className="seqlist-change" data-testid="seqlist-change">
          <span className="seqlist-change-label">{t('seqChangeLabel')}</span>
          <b>{`slots[${model.change.index}]`}</b>
          <span className="seqlist-change-before">{valueText(model.change.before)}</span>
          <span className="seqlist-change-arrow">→</span>
          <span className="seqlist-change-after">{valueText(model.change.after)}</span>
          {shifting ? <small>{t('seqAssignmentNote')}</small> : null}
        </div>
      ) : null}

      {model.error ? (
        <div className="seqlist-error" data-testid="seqlist-error" role="alert">
          <strong>{t('seqRejected')}</strong>
          <span>{t(ERROR_KEYS[model.error])}</span>
        </div>
      ) : null}

      {!model.error && model.found === true ? (
        <div className="seqlist-result is-found" data-testid="seqlist-result">
          <strong>{t('seqFound')}</strong>
          <span>
            {t('seqFoundAt')} <b>{model.foundIndex ?? model.focusIndex}</b>
            {model.result !== undefined ? ` · ${t('seqValue')} ${valueText(model.result)}` : ''}
          </span>
        </div>
      ) : null}
      {!model.error && model.found === false ? (
        <div className="seqlist-result is-miss" data-testid="seqlist-result">
          <strong>{t('seqNotFound')}</strong>
          <span>{t('seqMissNote')}</span>
        </div>
      ) : null}
      {!model.error && model.action === 'complete' && model.operation === 'traverse' ? (
        <div className="seqlist-result is-traverse" data-testid="seqlist-result">
          <strong>{t('seqTraverseDone')}</strong>
          <span>{t('seqCheckedCount').replace('{count}', String(model.checkedCount))}</span>
        </div>
      ) : null}
      {!model.error && model.action === 'complete' && (model.operation === 'insert' || model.operation === 'delete') ? (
        <div className="seqlist-result is-complete" data-testid="seqlist-result">
          <strong>{t('seqActionComplete')}</strong>
          <span>
            length = {model.length} / capacity = {model.capacity}
          </span>
        </div>
      ) : null}

      <div className="seqlist-scroll-hint">{t('seqScrollHint')}</div>
    </div>
  );
}
