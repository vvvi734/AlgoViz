import { useI18n } from '../../i18n/I18nProvider';
import type { TournamentVisualModel } from '../../domain/visualization/tournamentModel';
import type { RadixVisualModel } from '../../domain/visualization/radixModel';
import '../../styles/sorting10.css';

const TOURNAMENT_OP_KEY: Record<TournamentVisualModel['operation'], string> = {
  init: 'tournamentOpInit',
  build: 'tournamentOpBuild',
  select: 'tournamentOpSelect',
  output: 'tournamentOpOutput',
  update: 'tournamentOpUpdate',
  done: 'tournamentOpDone',
};

const RADIX_OP_KEY: Record<RadixVisualModel['operation'], string> = {
  init: 'radixOpInit',
  'digit-start': 'radixOpDigitStart',
  distribute: 'radixOpDistribute',
  collect: 'radixOpCollect',
  'pass-end': 'radixOpPassEnd',
  done: 'radixOpDone',
};

export function TournamentVisual({ model }: { model: TournamentVisualModel }) {
  const { t } = useI18n();
  const byId = new Map(model.nodes.map((node) => [node.id, node]));
  return (
    <div
      className="tournament-visual"
      data-testid="tournament-visual"
      data-operation={model.operation}
      data-result={model.result ?? ''}
    >
      <div className="sort10-head">
        <span className="sort10-op">{t(TOURNAMENT_OP_KEY[model.operation])}</span>
        <span className="sort10-meta">{t('tournamentActiveCount')} {model.activeCount}</span>
        {model.winnerId ? (
          <span className="sort10-meta">{t('tournamentRootWinner')} <strong>{model.winnerId}</strong></span>
        ) : null}
      </div>

      <section className="sort10-records" aria-label={t('tournamentInputLabel')}>
        <h4>{t('tournamentInputLabel')}</h4>
        <div className="sort10-chip-row">
          {model.records.map((record) => (
            <span
              key={record.id}
              className={`sort10-chip is-${record.state}`}
              data-testid="tournament-record"
              data-record-id={record.id}
              data-value={record.value}
              data-original-index={record.originalIndex}
              data-active={String(record.active)}
              data-state={record.state}
            >
              <strong>{record.value}</strong>
              <span>{record.label}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="sort10-tree-panel" aria-label={t('tournamentTreeLabel')}>
        <h4>{t('tournamentTreeLabel')}</h4>
        <svg
          className="sort10-tree"
          viewBox={`0 0 ${model.width} ${model.stageHeight}`}
          role="img"
          aria-label={t('tournamentTreeLabel')}
        >
          {model.edges.map((edge) => {
            const from = byId.get(edge.fromId);
            const to = byId.get(edge.toId);
            if (!from || !to) return null;
            const active = model.affectedNodeIds.includes(edge.fromId) &&
              model.affectedNodeIds.includes(edge.toId);
            return (
              <line
                key={edge.id}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={active ? 'is-affected' : ''}
              />
            );
          })}
          {model.nodes.map((node) => (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className={`sort10-node is-${node.state}${node.filled ? '' : ' is-padding'}`}
              data-testid="tournament-node"
              data-node-id={node.id}
              data-level={node.level}
              data-record-id={node.recordId ?? ''}
              data-state={node.state}
            >
              <rect x={-29} y={-19} width={58} height={38} rx={7} />
              {node.filled ? (
                <>
                  <text className="sort10-node-key" y={-2}>{node.value}</text>
                  <text className="sort10-node-id" y={13}>{node.label}</text>
                </>
              ) : (
                <text className="sort10-node-id" y={4}>—</text>
              )}
            </g>
          ))}
        </svg>
      </section>

      <section className="sort10-output" aria-label={t('tournamentOutputLabel')}>
        <h4>{t('tournamentOutputLabel')} <span>{model.output.length} / {model.records.length}</span></h4>
        <div className="sort10-chip-row" data-testid="tournament-output">
          {model.output.map((record, index) => (
            <span key={record.id} className="sort10-chip is-output" data-record-id={record.id}>
              <span className="sort10-order">{index + 1}</span>
              <strong>{record.value}</strong>
              <span>{record.label}</span>
            </span>
          ))}
          {!model.output.length ? <span className="sort10-empty">{t('tournamentEmpty')}</span> : null}
        </div>
      </section>

      <div className="sort10-legend">
        <span className="sort10-legend-item is-current">{t('tournamentLegendCurrent')}</span>
        <span className="sort10-legend-item is-compare">{t('tournamentLegendCompare')}</span>
        <span className="sort10-legend-item is-affected">{t('tournamentLegendAffected')}</span>
        <span className="sort10-legend-item is-removed">{t('tournamentLegendRemoved')}</span>
      </div>
      <p className="sort10-hint">{t('tournamentHint')}</p>
    </div>
  );
}

export function RadixVisual({ model }: { model: RadixVisualModel }) {
  const { t } = useI18n();
  return (
    <div
      className="radix-visual"
      data-testid="radix-visual"
      data-operation={model.operation}
      data-pass={model.pass}
      data-digit={model.currentDigit ?? ''}
      data-result={model.result ?? ''}
    >
      <div className="sort10-head">
        <span className="sort10-op">{t(RADIX_OP_KEY[model.operation])}</span>
        <span className="sort10-meta">
          {t('radixPass')
            .replace('{pass}', String(model.pass + 1))
            .replace('{total}', String(model.maxDigits))}
        </span>
        <span className="sort10-meta">
          {t('radixDigitPower').replace('{power}', String(model.pass))}
        </span>
        {model.currentDigit !== null ? (
          <span className="sort10-meta">
            {t('radixCurrentDigit')} <strong>{model.currentDigit}</strong>
          </span>
        ) : null}
        <span className="sort10-meta">{t('radixTitle')}</span>
      </div>

      <section className="sort10-records" aria-label={t('radixSequenceLabel')}>
        <h4>{t('radixSequenceLabel')}</h4>
        <div className="sort10-chip-row" data-testid="radix-order">
          {model.order.map((record, index) => (
            <span
              key={record.id}
              className={`sort10-chip is-${record.state}`}
              data-testid="radix-record"
              data-record-id={record.id}
              data-value={record.value}
              data-original-index={record.originalIndex}
              data-digit={record.digit ?? ''}
              data-state={record.state}
            >
              <span className="sort10-order">{index + 1}</span>
              <strong>{record.value}</strong>
              <span>{record.label}</span>
            </span>
          ))}
          {!model.order.length ? <span className="sort10-empty">{t('radixEmpty')}</span> : null}
        </div>
      </section>

      <section className="sort10-buckets-panel" aria-label={t('radixBucketsLabel')}>
        <h4>{t('radixBucketsLabel')}</h4>
        <div className="sort10-buckets" data-testid="radix-buckets">
          {model.buckets.map((bucket) => (
            <div
              key={bucket.digit}
              className={`sort10-bucket${bucket.active ? ' is-active' : ''}`}
              data-testid="radix-bucket"
              data-bucket={bucket.digit}
              data-active={String(bucket.active)}
            >
              <span className="sort10-bucket-head">{bucket.digit}</span>
              <div className="sort10-bucket-body">
                {bucket.records.length ? bucket.records.map((record) => (
                  <span
                    key={record.id}
                    className={`sort10-bucket-chip is-${record.state}`}
                    data-record-id={record.id}
                  >
                    <strong>{record.value}</strong>
                    <span>{record.label}</span>
                  </span>
                )) : <span className="sort10-bucket-empty">{t('radixBucketEmpty')}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sort10-collected" aria-label={t('radixCollectedLabel')}>
        <h4>{t('radixCollectedLabel')} <span>{model.collected.length} / {model.records.length}</span></h4>
        <div className="sort10-chip-row" data-testid="radix-collected">
          {model.collected.map((record) => (
            <span key={record.id} className="sort10-chip is-collected" data-record-id={record.id}>
              <strong>{record.value}</strong>
              <span>{record.label}</span>
            </span>
          ))}
        </div>
      </section>

      {model.operation === 'done' ? (
        <p className="sort10-result" data-testid="radix-result">
          {t('radixResultLabel')}: {model.order.map((record) => `${record.value}·${record.label}`).join(' → ')}
        </p>
      ) : null}
      <p className="sort10-hint">{t('radixHint')}</p>
    </div>
  );
}
