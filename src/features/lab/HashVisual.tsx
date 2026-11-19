import { useI18n } from '../../i18n/I18nProvider';
import type { HashOperation } from '../../domain/trace/schema';
import type { HashVisualModel } from '../../domain/visualization/hashModel';
import '../../styles/f2.css';

const OPERATION_KEYS: Record<HashOperation, string> = {
  init: 'hashOpInit',
  hash: 'hashOpHash',
  bucket: 'hashOpBucket',
  'chain-compare': 'hashOpChainCompare',
  insert: 'hashOpInsert',
  duplicate: 'hashOpDuplicate',
  found: 'hashOpFound',
  'not-found': 'hashOpNotFound',
  'delete-head': 'hashOpDeleteHead',
  'delete-middle': 'hashOpDeleteMiddle',
  'delete-tail': 'hashOpDeleteTail',
  'delete-missing': 'hashOpDeleteMissing',
  'probe-check': 'hashOpProbeCheck',
  'probe-next': 'hashOpProbeNext',
  delete: 'hashOpDelete',
  'table-full': 'hashOpTableFull',
  done: 'hashOpDone',
};

const HINT_KEYS: Record<HashOperation, string> = {
  init: 'hashHintInit',
  hash: 'hashHintHash',
  bucket: 'hashHintBucket',
  'chain-compare': 'hashHintChainCompare',
  insert: 'hashHintInsert',
  duplicate: 'hashHintDuplicate',
  found: 'hashHintFound',
  'not-found': 'hashHintNotFound',
  'delete-head': 'hashHintDeleteHead',
  'delete-middle': 'hashHintDeleteMiddle',
  'delete-tail': 'hashHintDeleteTail',
  'delete-missing': 'hashHintDeleteMissing',
  'probe-check': 'hashHintProbeCheck',
  'probe-next': 'hashHintProbeNext',
  delete: 'hashHintDelete',
  'table-full': 'hashHintTableFull',
  done: 'hashHintDone',
};

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function resultText(model: HashVisualModel, t: (key: string) => string): string | null {
  switch (model.result) {
    case 'inserted':
      return t('hashResultInserted');
    case 'found':
      return t('hashResultFound');
    case 'not-found':
      return t('hashResultNotFound');
    case 'deleted':
      return t('hashResultDeleted');
    case 'missing':
      return t('hashResultMissing');
    case 'duplicate':
      return t('hashResultDuplicate');
    case 'full':
      return t('hashResultFull');
    default:
      return null;
  }
}

function resultTone(model: HashVisualModel): string {
  if (model.found === true || model.result === 'inserted' || model.result === 'deleted') return 'is-ok';
  if (model.result === 'not-found' || model.result === 'missing') return 'is-bad';
  if (model.result === 'duplicate' || model.result === 'full') return 'is-warn';
  return 'is-neutral';
}

/**
 * Dedicated hash-table canvas. Chaining paints bucket rows with real linked
 * nodes and next pointers; probing paints tri-state slots, a probe path and a
 * tombstone. Neither view is a generic array highlight.
 */
export function HashVisual({ model }: { model: HashVisualModel }) {
  const { t } = useI18n();
  const formula =
    model.key === null || model.hashIndex === null
      ? null
      : fill(t('hashFunctionValue'), {
          key: model.key,
          size: model.tableSize,
          index: model.hashIndex,
        });
  const result = resultText(model, t);
  const isChaining = model.algorithm === 'chaining';
  const removed = model.removed;
  const hint = model.operation === 'insert' && !isChaining
    ? t('hashHintInsertProbe')
    : t(HINT_KEYS[model.operation]);

  return (
    <div
      className={`hash-visual hash-visual-${model.algorithm}`}
      data-testid="hash-visual"
      data-algorithm={model.algorithm}
      data-operation={model.operation}
      data-phase={model.phase}
      data-table-size={model.tableSize}
      data-key={model.key ?? ''}
      data-hash-index={model.hashIndex ?? ''}
      data-bucket-index={model.bucketIndex ?? ''}
      data-current-node={model.currentNodeId ?? ''}
      data-current-index={model.currentIndex ?? ''}
      data-conflict={model.conflict === null ? '' : String(model.conflict)}
      data-result={model.result ?? ''}
      data-found={model.found === null ? '' : String(model.found)}
      data-count={model.elementCount}
      data-load-factor={model.loadFactor.toFixed(3)}
      data-reused-deleted={String(model.reusedDeleted)}
      role="group"
      aria-label={t('hashVisualLabel')}
    >
      <div className="sorting-op-row hash-op-row">
        <span className="sorting-op" data-testid="hash-operation">
          {t(model.operation === 'insert' && !isChaining ? 'hashOpInsertProbe' : OPERATION_KEYS[model.operation])}
        </span>
        <span className="hash-algorithm-name">
          {t(isChaining ? 'hashChainingName' : 'hashProbingName')}
        </span>
      </div>

      <div className="hash-key-row">
        <span className="hash-key-card" data-testid="hash-key">
          {model.key === null
            ? t('hashTableSize').replace('{size}', String(model.tableSize))
            : t('hashKeyLabel').replace('{key}', String(model.key))}
        </span>
        {formula && (
          <span className="hash-formula" data-testid="hash-formula">
            <span className="hash-formula-label">{t('hashFunctionLabel')}</span>
            <code>{formula}</code>
          </span>
        )}
        {model.conflict !== null && (
          <span
            className={`hash-conflict-chip${model.conflict ? ' is-conflict' : ' is-clear'}`}
            data-testid="hash-conflict"
          >
            {model.conflict
              ? isChaining
                ? t('hashConflictBucket').replace('{index}', String(model.bucketIndex ?? model.hashIndex ?? '—'))
                : t('hashConflictSlot').replace('{index}', String(model.currentIndex ?? model.hashIndex ?? '—'))
              : t('hashNoConflict')}
          </span>
        )}
        {model.conflict === null && model.key !== null && model.hashIndex !== null && (
          <span className="hash-hash-index" data-testid="hash-index">
            h → {model.hashIndex}
          </span>
        )}
      </div>

      <div className="sorting-meta hash-meta" data-testid="hash-meta">
        <span className="sorting-meta-chip hash-chip is-table">
          {t('hashTableSize').replace('{size}', String(model.tableSize))}
        </span>
        <span className="sorting-meta-chip hash-chip is-count" data-testid="hash-count">
          {t('hashElementCount')
            .replace('{count}', String(model.elementCount))
            .replace('{size}', String(model.tableSize))}
        </span>
        <span className="sorting-meta-chip hash-chip is-load" data-testid="hash-load-factor">
          {t('hashLoadFactor').replace('{value}', model.loadFactor.toFixed(3))}
        </span>
        {model.bucketIndex !== null && isChaining && (
          <span className="sorting-meta-chip hash-chip is-bucket" data-testid="hash-bucket-chip">
            {t('hashBucketLabel').replace('{index}', String(model.bucketIndex))}
          </span>
        )}
        {model.currentIndex !== null && !isChaining && (
          <span className="sorting-meta-chip hash-chip is-slot" data-testid="hash-slot-chip">
            {t('hashProbeCheck').replace('{index}', String(model.currentIndex))}
          </span>
        )}
        {removed && (
          <span className="sorting-meta-chip hash-chip is-removed" data-testid="hash-removed-chip">
            {removed.position
              ? t('hashRemovedNode')
                  .replace('{key}', String(removed.key))
                  .replace('{position}', t(`hashPosition${removed.position[0].toUpperCase()}${removed.position.slice(1)}`))
              : removed.index !== undefined
                ? t('hashRemovedSlot').replace('{index}', String(removed.index)).replace('{key}', String(removed.key))
                : null}
          </span>
        )}
        {result && (
          <span className={`hash-result-chip ${resultTone(model)}`} data-testid="hash-result">
            {t('hashResultLabel')}: {result}
          </span>
        )}
      </div>

      {model.elementCount === 0 && model.operation === 'init' && (
        <div className="hash-empty-note" data-testid="hash-empty-note">
          {t('hashEmptyTable').replace('{size}', String(model.tableSize))}
        </div>
      )}

      {isChaining ? (
        <div className="hash-bucket-list" data-testid="hash-buckets" role="list">
          {model.buckets.map((bucket) => (
            <div
              className={`hash-bucket-row${bucket.active ? ' is-active' : ''}${
                bucket.nodes.length === 0 ? ' is-empty' : ''
              }`}
              key={bucket.index}
              data-testid="hash-bucket"
              data-index={bucket.index}
              data-active={String(bucket.active)}
              data-head-id={bucket.headId ?? ''}
              role="listitem"
            >
              <div className="hash-bucket-index">
                <span>{t('hashBucketLabel').replace('{index}', String(bucket.index))}</span>
                <small>[{bucket.index}]</small>
              </div>
              <div className="hash-chain" data-testid="hash-chain">
                {bucket.nodes.length === 0 ? (
                  <span className="hash-null" data-testid="hash-bucket-empty">
                    {t('hashBucketEmpty')}
                  </span>
                ) : (
                  bucket.nodes.map((node) => (
                    <span className="hash-node-piece" key={node.id}>
                      <span
                        className={`hash-node is-${node.status} is-${node.position}`}
                        data-testid="hash-node"
                        data-id={node.id}
                        data-key={node.key}
                        data-next={node.nextId ?? ''}
                        data-position={node.position}
                        data-status={node.status}
                      >
                        <span className="hash-node-key">{node.key}</span>
                        <span className="hash-node-id">{node.id}</span>
                      </span>
                      {node.nextId !== null ? (
                        <span className="hash-arrow" aria-hidden="true">
                          →
                        </span>
                      ) : (
                        <span className="hash-arrow is-null" aria-hidden="true">
                          ∅
                        </span>
                      )}
                    </span>
                  ))
                )}
                {bucket.nodes.length > 0 && bucket.nodes[bucket.nodes.length - 1].nextId !== null && (
                  <span className="hash-null is-tail">{t('hashTailNull')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="hash-probe-area">
          <div className="hash-slot-grid" data-testid="hash-slots" role="list">
            {model.slots.map((slot) => (
              <div
                className={`hash-slot is-${slot.state}${slot.marks.includes('probe') ? ' is-probe' : ''}${
                  slot.marks.includes('current') ? ' is-current' : ''
                }${slot.marks.includes('reused') ? ' is-reused' : ''}`}
                key={slot.index}
                data-testid="hash-slot"
                data-index={slot.index}
                data-state={slot.state}
                data-key={slot.key ?? ''}
                data-id={slot.id ?? ''}
                data-marks={slot.marks.join(',')}
                role="listitem"
              >
                <span className="hash-slot-index">[{slot.index}]</span>
                <span className="hash-slot-state">{t(`hashSlot${slot.state[0].toUpperCase()}${slot.state.slice(1)}`)}</span>
                {slot.state === 'occupied' ? (
                  <>
                    <span className="hash-slot-key" data-testid="hash-slot-key">
                      {slot.key}
                    </span>
                    <span className="hash-slot-id">{slot.id}</span>
                  </>
                ) : slot.state === 'deleted' ? (
                  <span className="hash-slot-tombstone" aria-hidden="true">
                    ×
                  </span>
                ) : (
                  <span className="hash-slot-null" aria-hidden="true">
                    ·
                  </span>
                )}
                {slot.marks.includes('current') && <span className="hash-slot-mark">PTR</span>}
                {slot.marks.includes('reused') && (
                  <span className="hash-slot-mark is-reused">{t('hashReusedDeleted').replace('{index}', String(slot.index))}</span>
                )}
              </div>
            ))}
          </div>

          <div className="hash-probe-footer">
            <div className="hash-probe-path" data-testid="hash-probe-path">
              <span className="hash-probe-label">{t('hashProbePath')}</span>
              {model.probePath.length === 0 ? (
                <span className="hash-probe-empty">—</span>
              ) : (
                model.probePath.map((index, step) => (
                  <span className="hash-probe-piece" key={`${index}-${step}`}>
                    <span
                      className={`hash-probe-chip${
                        model.currentIndex === index && step === model.probePath.length - 1 ? ' is-current' : ''
                      }`}
                      data-testid="hash-probe-chip"
                      data-index={index}
                      data-step={step}
                    >
                      {index}
                    </span>
                    {step < model.probePath.length - 1 && <span className="hash-probe-arrow">→</span>}
                  </span>
                ))
              )}
            </div>
            {model.reusedDeleted && (
              <div className="hash-reuse-note" data-testid="hash-reuse-note">
                {t('hashReusedDeleted').replace('{index}', String(model.currentIndex ?? '—'))}
              </div>
            )}
          </div>
          <div className="hash-tombstone-note" data-testid="hash-tombstone-note">
            <b>DELETED</b> {t('hashDeletedNote')}
          </div>
        </div>
      )}

      {removed && (
        <div className="hash-removed-row" data-testid="hash-removed">
          <span className="hash-removed-label">
            {removed.position
              ? t('hashRemovedNode')
                  .replace('{key}', String(removed.key))
                  .replace('{position}', t(`hashPosition${removed.position[0].toUpperCase()}${removed.position.slice(1)}`))
              : t('hashRemovedSlot').replace('{index}', String(removed.index ?? '—')).replace('{key}', String(removed.key))}
          </span>
          <span className="hash-removed-node">{removed.key}</span>
          <span className="hash-removed-id">{removed.id}</span>
        </div>
      )}

      <div className="sorting-footer">
        <div className="sorting-hint" data-testid="hash-hint">
          <b>{hint}</b>
        </div>
        <div className="sorting-legend hash-legend" aria-label={t('hashLegendTitle')}>
          {isChaining ? (
            <>
              <span className="sorting-legend-item hash-legend-item is-bucket">
                {t('hashLegendBucket')}
              </span>
              <span className="sorting-legend-item hash-legend-item is-current">
                {t('hashLegendCurrentNode')}
              </span>
              <span className="sorting-legend-item hash-legend-item is-previous">
                {t('hashLegendPreviousNode')}
              </span>
              <span className="sorting-legend-item hash-legend-item is-inserted">
                {t('hashLegendInserted')}
              </span>
            </>
          ) : (
            <>
              <span className="sorting-legend-item hash-legend-item is-empty-slot">
                {t('hashLegendEmptySlot')}
              </span>
              <span className="sorting-legend-item hash-legend-item is-deleted-slot">
                {t('hashLegendDeletedSlot')}
              </span>
              <span className="sorting-legend-item hash-legend-item is-probe">
                {t('hashLegendProbe')}
              </span>
              <span className="sorting-legend-item hash-legend-item is-current">
                {t('hashLegendCurrentSlot')}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
