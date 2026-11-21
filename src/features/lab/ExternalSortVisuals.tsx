import { useI18n } from '../../i18n/I18nProvider';
import type {
  ExternalRecordView,
  MultiwayVisualModel,
  OptimalVisualModel,
  ReplacementVisualModel,
} from '../../domain/visualization/externalSortModel';
import '../../styles/externalSort.css';

const MULTIWAY_OP_KEY: Record<MultiwayVisualModel['operation'], string> = {
  init: 'multiwayOpInit',
  read: 'multiwayOpRead',
  compare: 'multiwayOpCompare',
  select: 'multiwayOpSelect',
  output: 'multiwayOpOutput',
  flush: 'multiwayOpFlush',
  done: 'multiwayOpDone',
};

const REPLACEMENT_OP_KEY: Record<ReplacementVisualModel['operation'], string> = {
  init: 'replacementOpInit',
  select: 'replacementOpSelect',
  output: 'replacementOpOutput',
  read: 'replacementOpRead',
  freeze: 'replacementOpFreeze',
  'segment-end': 'replacementOpSegmentEnd',
  advance: 'replacementOpAdvance',
  done: 'replacementOpDone',
};

const OPTIMAL_OP_KEY: Record<OptimalVisualModel['operation'], string> = {
  init: 'optimalOpInit',
  combine: 'optimalOpCombine',
  done: 'optimalOpDone',
};

function RecordChip({
  record,
  className = '',
  testId,
  showOrder,
}: {
  record: ExternalRecordView;
  className?: string;
  testId?: string;
  showOrder?: number;
}) {
  return (
    <span
      className={`ext-chip ${className}`.trim()}
      data-testid={testId}
      data-record-id={record.id}
      data-value={record.value}
      data-state={record.state}
    >
      {showOrder !== undefined ? <span className="ext-order">{showOrder}</span> : null}
      <strong>{record.value}</strong>
      <span className="ext-id">{record.label}</span>
    </span>
  );
}

export function MultiwayVisual({ model }: { model: MultiwayVisualModel }) {
  const { t } = useI18n();
  return (
    <div
      className="external-visual multiway-visual"
      data-testid="multiway-visual"
      data-operation={model.operation}
      data-result={model.result ?? ''}
      data-k={model.k}
    >
      <div className="sort10-head ext-head">
        <span className="sort10-op">{t(MULTIWAY_OP_KEY[model.operation])}</span>
        <span className="sort10-meta">{t('multiwayKLabel')} <strong>{model.k}</strong></span>
        <span className="sort10-meta">{t('multiwayBufferLabel')} <strong>{model.bufferCapacity}</strong></span>
        <span className="sort10-meta">{t('multiwayBlockLabel')} <strong>{model.blockSize}</strong></span>
        <span className="sort10-meta">{t('multiwayPassesLabel')} <strong>{model.mergePasses}</strong></span>
        {model.winnerId ? (
          <span className="sort10-meta">
            {t('multiwayWinnerLabel')} <strong>{model.winnerId}</strong>
          </span>
        ) : null}
      </div>

      <div className="ext-io-strip" aria-label={t('multiwayIoLabel')}>
        <div><span>{t('multiwayReadBlocks')}</span><strong>{model.readBlocks}</strong></div>
        <div><span>{t('multiwayWriteBlocks')}</span><strong>{model.writeBlocks}</strong></div>
        <div><span>{t('multiwayMergePasses')}</span><strong>{model.mergePasses}</strong></div>
        <small>{t('multiwayIoNote')}</small>
      </div>

      <section className="ext-panel" aria-label={t('multiwayRunsLabel')}>
        <h4>{t('multiwayRunsLabel')}</h4>
        <div className="ext-run-list" data-testid="multiway-runs">
          {model.runs.map((run) => (
            <div className="ext-run" key={run.id} data-testid="multiway-run" data-run-id={run.id}>
              <div className="ext-run-head">
                <b>{run.label}</b>
                <span>
                  {t('multiwayRunCursor')
                    .replace('{cursor}', String(run.cursor))
                    .replace('{total}', String(run.records.length))}
                </span>
                <span className={run.exhausted ? 'is-done' : ''}>
                  {run.exhausted ? t('multiwayRunExhausted') : t('multiwayRunActive')}
                </span>
              </div>
              <div className="ext-run-track">
                {run.records.length ? run.records.map((record) => (
                  <RecordChip
                    key={record.id}
                    record={record}
                    className={`is-${record.state}${record.id === run.currentId ? ' is-run-head' : ''}`}
                    testId="multiway-record"
                  />
                )) : <span className="ext-empty">{t('multiwayEmptyRun')}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="ext-merge-row">
        <section className="ext-panel ext-candidates" aria-label={t('multiwayCandidatesLabel')}>
          <h4>{t('multiwayCandidatesLabel')}</h4>
          <div className="ext-chip-row" data-testid="multiway-candidates">
            {model.candidates.map((record) => (
              <div
                key={record.id}
                className={`ext-candidate${record.id === model.winnerId ? ' is-winner' : ''}`}
                data-testid="multiway-candidate"
                data-record-id={record.id}
              >
                <span>R{record.runIndex === null ? '?' : record.runIndex + 1}</span>
                <strong>{record.value}</strong>
                <small>{record.label}</small>
              </div>
            ))}
            {!model.candidates.length ? <span className="ext-empty">{t('multiwayNoCandidates')}</span> : null}
          </div>
          <p className="ext-note">{t('multiwayCandidateNote')}</p>
        </section>

        <div className="ext-flow" aria-hidden="true">
          <span>{model.winnerId ? t('multiwayChoose') : t('multiwayWait')}</span>
          <b>→</b>
        </div>

        <section className="ext-panel ext-output-buffer" aria-label={t('multiwayOutputBufferLabel')}>
          <h4>{t('multiwayOutputBufferLabel')}</h4>
          <div className="ext-bucket" data-testid="multiway-output-buffer">
            {Array.from({ length: model.bufferCapacity }).map((_, index) => {
              const record = model.outputBuffer[index];
              return record ? (
                <RecordChip key={record.id} record={record} className="is-output-buffer" testId="multiway-output-buffer-record" />
              ) : (
                <span className="ext-slot is-empty" key={`slot-${index}`}>—</span>
              );
            })}
          </div>
          <p className="ext-note">
            {t('multiwayBufferFill').replace('{count}', String(model.outputBuffer.length)).replace('{cap}', String(model.bufferCapacity))}
          </p>
        </section>
      </div>

      <section className="ext-panel" aria-label={t('multiwayOutputLabel')}>
        <h4>{t('multiwayOutputLabel')} <span>{model.output.length}</span></h4>
        <div className="ext-chip-row" data-testid="multiway-output">
          {model.output.map((record, index) => (
            <RecordChip key={record.id} record={record} className="is-output" showOrder={index + 1} />
          ))}
          {!model.output.length ? <span className="ext-empty">{t('multiwayOutputEmpty')}</span> : null}
        </div>
      </section>

      <div className="sort10-legend">
        <span className="sort10-legend-item is-consumed">{t('multiwayLegendConsumed')}</span>
        <span className="sort10-legend-item is-buffered">{t('multiwayLegendBuffered')}</span>
        <span className="sort10-legend-item is-current">{t('multiwayLegendCurrent')}</span>
        <span className="sort10-legend-item is-winner">{t('multiwayLegendWinner')}</span>
      </div>
      <p className="sort10-hint">{t('multiwayHint')}</p>
    </div>
  );
}

export function ReplacementVisual({ model }: { model: ReplacementVisualModel }) {
  const { t } = useI18n();
  return (
    <div
      className="external-visual replacement-visual"
      data-testid="replacement-visual"
      data-operation={model.operation}
      data-result={model.result ?? ''}
      data-workspace-capacity={model.workspaceCapacity}
    >
      <div className="sort10-head ext-head">
        <span className="sort10-op">{t(REPLACEMENT_OP_KEY[model.operation])}</span>
        <span className="sort10-meta">{t('replacementCapacityLabel')} <strong>{model.workspaceCapacity}</strong></span>
        <span className="sort10-meta">{t('replacementInputIndexLabel')} <strong>{model.inputIndex}</strong></span>
        <span className="sort10-meta">
          {t('replacementLastOutputLabel')} <strong>{model.lastOutput ?? '—'}</strong>
        </span>
        {model.currentId ? (
          <span className="sort10-meta">{t('replacementCurrentLabel')} <strong>{model.currentId}</strong></span>
        ) : null}
      </div>

      <section className="ext-panel" aria-label={t('replacementInputLabel')}>
        <h4>{t('replacementInputLabel')} <span>{model.inputIndex} / {model.records.length}</span></h4>
        <div className="ext-input-tape" data-testid="replacement-input">
          {model.records.map((record) => (
            <span
              key={record.id}
              className={`ext-tape-record is-${record.state}`}
              data-testid="replacement-input-record"
              data-record-id={record.id}
              data-state={record.state}
            >
              <b>{record.value}</b>
              <small>{record.label}</small>
            </span>
          ))}
        </div>
        <div className="ext-input-progress">
          <span>{t('replacementLoadedPrefix')}</span>
          <div className="ext-progress-line">
            <i style={{ width: `${(model.inputIndex / Math.max(1, model.records.length)) * 100}%` }} />
          </div>
        </div>
      </section>

      <div className="ext-replacement-main">
        <section className="ext-panel ext-workspace-panel" aria-label={t('replacementWorkspaceLabel')}>
          <h4>{t('replacementWorkspaceLabel')}</h4>
          <div className="ext-workspace" data-testid="replacement-workspace">
            {model.workspace.map((slot, index) => (
              <div className="ext-workspace-slot" key={`slot-${index}`} data-testid="replacement-slot">
                <span className="ext-slot-index">{index + 1}</span>
                {slot.record ? (
                  <RecordChip
                    record={slot.record}
                    className={`is-${slot.state === 'frozen' ? 'frozen' : 'eligible'}`}
                    testId="replacement-workspace-record"
                  />
                ) : <span className="ext-slot is-empty">{t('replacementSlotEmpty')}</span>}
                <small>
                  {slot.state === 'empty'
                    ? t('replacementSlotEmptyTag')
                    : slot.state === 'frozen'
                      ? t('replacementSlotFrozenTag')
                      : t('replacementSlotEligibleTag')}
                </small>
              </div>
            ))}
          </div>
          <p className="ext-note">{t('replacementWorkspaceNote')}</p>
        </section>

        <div className="ext-flow" aria-hidden="true">
          <span>{t('replacementPickMin')}</span>
          <b>→</b>
        </div>

        <section className="ext-panel ext-current-run" aria-label={t('replacementCurrentRunLabel')}>
          <h4>{t('replacementCurrentRunLabel')} <span>{model.currentRun.length}</span></h4>
          <div className="ext-chip-row" data-testid="replacement-current-run">
            {model.currentRun.map((record) => (
              <RecordChip key={record.id} record={record} className="is-current-run" />
            ))}
            {!model.currentRun.length ? <span className="ext-empty">{t('replacementRunEmpty')}</span> : null}
          </div>
          <p className="ext-note">{t('replacementCurrentRunNote')}</p>
        </section>
      </div>

      <section className="ext-panel" aria-label={t('replacementRunsLabel')}>
        <h4>{t('replacementRunsLabel')} <span>{model.runs.length}</span></h4>
        <div className="ext-runs-stack" data-testid="replacement-runs">
          {model.runs.map((run, index) => (
            <div className="ext-finished-run" key={`run-${index}`} data-testid="replacement-run">
              <div className="ext-run-head">
                <b>{t('replacementRunName').replace('{index}', String(index + 1))}</b>
                <span>{t('replacementRunLength').replace('{length}', String(run.length))}</span>
              </div>
              <div className="ext-chip-row">
                {run.map((record) => (
                  <RecordChip key={record.id} record={record} className="is-completed" />
                ))}
              </div>
            </div>
          ))}
          {!model.runs.length ? <span className="ext-empty">{t('replacementNoRuns')}</span> : null}
        </div>
      </section>

      <div className="sort10-legend">
        <span className="sort10-legend-item is-eligible">{t('replacementLegendEligible')}</span>
        <span className="sort10-legend-item is-frozen">{t('replacementLegendFrozen')}</span>
        <span className="sort10-legend-item is-current">{t('replacementLegendCurrent')}</span>
        <span className="sort10-legend-item is-completed">{t('replacementLegendCompleted')}</span>
      </div>
      <p className="sort10-hint">{t('replacementHint')}</p>
    </div>
  );
}

export function OptimalMergeTreeVisual({ model }: { model: OptimalVisualModel }) {
  const { t } = useI18n();
  const byId = new Map(model.nodes.map((node) => [node.id, node]));
  const selected = model.selectedIds
    .map((id) => byId.get(id))
    .filter((node): node is NonNullable<typeof node> => node !== undefined);
  return (
    <div
      className="external-visual optimal-visual"
      data-testid="optimal-visual"
      data-operation={model.operation}
      data-result={model.result ?? ''}
      data-total-cost={model.totalCost}
      data-k={model.k}
      data-virtual-count={model.virtualCount}
    >
      <div className="sort10-head ext-head">
        <span className="sort10-op">{t(OPTIMAL_OP_KEY[model.operation])}</span>
        <span className="sort10-meta">{t('optimalKLabel')} <strong>{model.k}</strong></span>
        <span className="sort10-meta">{t('optimalRealSegments')} <strong>{model.segmentWeights.length}</strong></span>
        <span className="sort10-meta">{t('optimalVirtualLabel')} <strong>{model.virtualCount}</strong></span>
        <span className="sort10-meta">{t('optimalTotalCostLabel')} <strong>{model.totalCost}</strong></span>
      </div>

      <div className="ext-optimal-grid">
        <section className="ext-panel ext-tree-panel" aria-label={t('optimalTreeLabel')}>
          <h4>{t('optimalTreeLabel')}</h4>
          <div className="ext-tree-scroll">
            <svg
              className="ext-tree"
              viewBox={`0 0 ${model.width} ${model.height}`}
              role="img"
              aria-label={t('optimalTreeLabel')}
              data-testid="optimal-tree"
            >
              {model.edges.map((edge) => {
                const from = byId.get(edge.fromId);
                const to = byId.get(edge.toId);
                if (!from || !to) return null;
                return (
                  <line
                    key={edge.id}
                    x1={from.x}
                    y1={from.y + 20}
                    x2={to.x}
                    y2={to.y - 20}
                    className={edge.selected ? 'is-selected' : ''}
                  />
                );
              })}
              {model.nodes.map((node) => (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className={`ext-node${node.leaf ? ' is-leaf' : ' is-internal'}${node.virtual ? ' is-virtual' : ''}${node.selected ? ' is-selected' : ''}${node.isNew ? ' is-new' : ''}`}
                  data-testid="optimal-node"
                  data-node-id={node.id}
                  data-weight={node.weight}
                  data-leaf={String(node.leaf)}
                  data-virtual={String(node.virtual)}
                  data-selected={String(node.selected)}
                >
                  <rect x={-29} y={-20} width={58} height={40} rx={7} />
                  <text className="ext-node-weight" y={-2}>{node.weight}</text>
                  <text className="ext-node-id" y={14}>{node.id}</text>
                  {node.virtual ? (
                    <text className="ext-node-badge" y={29}>{t('optimalVirtualShort')}</text>
                  ) : null}
                </g>
              ))}
            </svg>
          </div>
          <div className="ext-tree-roots">
            <span>{t('optimalForestRoots')}</span>
            {model.roots.map((id) => <b key={id}>{id}</b>)}
          </div>
        </section>

        <aside className="ext-cost-column">
          <section className="ext-panel ext-cost-panel" aria-label={t('optimalCostLabel')}>
            <h4>{t('optimalCostLabel')}</h4>
            <div className="ext-cost-selected">
              <span>{t('optimalSelectedLabel')}</span>
              <div className="ext-chip-row">
                {selected.map((node) => (
                  <span className="ext-weight-chip" key={node.id}>
                    <strong>{node.weight}</strong><small>{node.id}</small>
                  </span>
                ))}
                {!selected.length ? <span className="ext-empty">{t('optimalNoneSelected')}</span> : null}
              </div>
            </div>
            <div className="ext-cost-numbers">
              <div><span>{t('optimalCostAddedLabel')}</span><strong>+{model.costAdded}</strong></div>
              <div><span>{t('optimalTotalCostLabel')}</span><strong>{model.totalCost}</strong></div>
              <div><span>{t('optimalCombinesLabel')}</span><strong>{model.combines}</strong></div>
            </div>
          </section>

          <section className="ext-panel ext-weights-panel" aria-label={t('optimalWeightsLabel')}>
            <h4>{t('optimalWeightsLabel')}</h4>
            <div className="ext-weight-list" data-testid="optimal-real-weights">
              {model.segmentWeights.map((weight, index) => (
                <span className="ext-weight-chip" key={`segment-${index}`}>
                  <strong>{weight}</strong><small>S{index}</small>
                </span>
              ))}
            </div>
            {model.virtualCount ? (
              <div className="ext-virtual-note" data-testid="optimal-virtual-note">
                <b>{t('optimalVirtualNoteTitle')}</b>
                <span>
                  {t('optimalVirtualNote')
                    .replace('{count}', String(model.virtualCount))
                    .replace('{k}', String(model.k))}
                </span>
              </div>
            ) : null}
          </section>
        </aside>
      </div>

      <div className="sort10-legend">
        <span className="sort10-legend-item is-eligible">{t('optimalLegendSelected')}</span>
        <span className="sort10-legend-item is-current">{t('optimalLegendNew')}</span>
        <span className="sort10-legend-item is-frozen">{t('optimalLegendVirtual')}</span>
      </div>
      <p className="sort10-hint">{t('optimalHint')}</p>
    </div>
  );
}
