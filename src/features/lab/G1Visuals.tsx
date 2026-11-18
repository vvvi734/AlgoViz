import type { ShortestPathNodeVisual } from '../../domain/visualization/shortestPathModel';
import type {
  BellmanVisualModel,
  FloydVisualModel,
} from '../../domain/visualization/shortestPathModel';
import { useI18n } from '../../i18n/I18nProvider';

function formatDistance(value: number | null | undefined): string {
  if (value === null || value === undefined) return '∞';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function GraphCanvas({
  model,
  markerId,
  showDistance,
}: {
  model: FloydVisualModel | BellmanVisualModel;
  markerId: string;
  showDistance?: boolean;
}) {
  return (
    <div className="g1-graph-scroll" tabIndex={0}>
      <svg
        className="graph-svg g1-graph-svg"
        viewBox={`0 0 ${model.width} ${model.height}`}
        width={model.width}
        height={model.height}
        role="img"
        aria-label={model.algorithm}
        data-testid="g1-graph-svg"
        data-node-count={model.nodes.length}
        data-edge-count={model.edges.length}
      >
        {model.directed && (
          <defs>
            <marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" className="graph-arrow-head" />
            </marker>
          </defs>
        )}
        <g className="graph-edges" aria-hidden="true">
          {model.edges.map((edge) => (
            <g key={edge.id} className="graph-edge-group">
              <line
                className={`graph-edge${edge.active ? ' is-active' : ''}${edge.onPath ? ' is-path' : ''}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                data-testid="g1-graph-edge"
                data-edge-id={edge.id}
                data-active={edge.active ? 'true' : 'false'}
                data-on-path={edge.onPath ? 'true' : 'false'}
                markerEnd={edge.directed ? `url(#${markerId})` : undefined}
              >
                <title>{`${edge.fromId}${edge.directed ? '→' : '–'}${edge.toId}, ${edge.weight}`}</title>
              </line>
              <g
                className="graph-edge-weight"
                transform={`translate(${(edge.x1 + edge.x2) / 2} ${(edge.y1 + edge.y2) / 2})`}
              >
                <rect x={-15} y={-10} width={30} height={19} rx={7} />
                <text y={4} textAnchor="middle">
                  {edge.weight}
                </text>
              </g>
            </g>
          ))}
        </g>
        <g className="graph-nodes">
          {model.nodes.map((node) => (
            <NodeGlyph
              key={node.id}
              node={node}
              radius={model.nodeRadius}
              showDistance={showDistance}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

function NodeGlyph({
  node,
  radius,
  showDistance,
}: {
  node: ShortestPathNodeVisual;
  radius: number;
  showDistance?: boolean;
}) {
  const className = [
    'g1-node',
    node.role ? `is-${node.role}` : '',
    node.current ? 'is-current' : '',
    node.neighbor ? 'is-neighbor' : '',
    node.start ? 'is-start' : '',
    node.target ? 'is-target' : '',
    node.onPath ? 'is-path' : '',
    node.cycle ? 'is-cycle' : '',
  ].filter(Boolean).join(' ');
  return (
    <g
      className={className}
      data-testid="g1-node"
      data-node-id={node.id}
      data-role={node.role ?? ''}
      data-distance={node.distance ?? ''}
    >
      <circle cx={node.x} cy={node.y} r={radius} />
      <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle">
        {node.label}
      </text>
      {node.role && (
        <g transform={`translate(${node.x + radius - 4} ${node.y - radius + 4})`}>
          <circle r="8" className={`g1-role-badge is-${node.role}`} />
          <text textAnchor="middle" dominantBaseline="middle" className="g1-role-text">
            {node.role.toUpperCase()}
          </text>
        </g>
      )}
      {showDistance && (
        <text
          x={node.x}
          y={node.y + radius + 13}
          textAnchor="middle"
          className="g1-node-distance"
          data-testid="g1-node-distance"
        >
          {formatDistance(node.distance)}
        </text>
      )}
    </g>
  );
}

function FloydCompare({ model }: { model: FloydVisualModel }) {
  const { t } = useI18n();
  if (!model.compare) {
    return (
      <div className="g1-current-strip is-idle" data-testid="floyd-current-strip">
        <span>{t('floydCurrentIdle')}</span>
      </div>
    );
  }
  const compare = model.compare;
  return (
    <div className="g1-current-strip" data-testid="floyd-current-strip" data-updated={compare.updated ? 'true' : 'false'}>
      <span className="g1-strip-k">
        {t('floydCurrentK')} <b>{compare.kNodeId}</b>
      </span>
      <span>
        {t('floydCurrentPair')} <b>{compare.iNodeId} → {compare.jNodeId}</b>
      </span>
      <code data-testid="floyd-through">
        {formatDistance(compare.throughIK)} + {formatDistance(compare.throughKJ)} = {formatDistance(compare.candidate)}
      </code>
      <span className={compare.updated ? 'g1-improved' : 'g1-stable'} data-testid="floyd-compare-result">
        {compare.updated ? t('floydUpdating') : t('floydNoUpdate')}
      </span>
      <span className="g1-old-new">
        {formatDistance(compare.oldDistance)} → {formatDistance(compare.newDistance)}
      </span>
    </div>
  );
}

export function FloydVisual({
  model,
  operationText,
  hint,
}: {
  model: FloydVisualModel;
  operationText: string;
  hint: string;
}) {
  const { t } = useI18n();
  const cycle = model.negativeCycle?.hasCycle === true;
  return (
    <section className="g1-stage floyd-stage" data-testid="floyd-stage" data-operation={model.operation}>
      <header className="g1-head">
        <div>
          <span className="g1-kicker">FLOYD-WARSHALL</span>
          <b>{t('floydTitle')}</b>
          <small className="g1-op-line" data-testid="floyd-operation-text">
            <strong>{operationText}</strong> · {hint}
          </small>
        </div>
        <div className="g1-head-state">
          <span>{t('floydKLabel')}: <b>{model.kNodeId ?? '—'}</b></span>
          <span>{t('floydPairLabel')}: <b>{model.iNodeId ?? '—'} → {model.jNodeId ?? '—'}</b></span>
          {model.directed && <span className="g1-badge">{t('floydDirected')}</span>}
        </div>
      </header>
      <div className="g1-workbench">
        <div className="g1-graph-panel">
          <GraphCanvas model={model} markerId="floyd-arrow" />
        </div>
        <div className="floyd-matrix-panel">
          <header className="g1-panel-head">
            <b>{t('floydMatrixTitle')}</b>
            <small>{t('floydMatrixNote')}</small>
          </header>
          {model.empty ? (
            <p className="g1-empty">{t('floydEmpty')}</p>
          ) : (
            <div className="floyd-matrix-scroll">
              <table className="floyd-matrix" data-testid="floyd-matrix">
                <thead>
                  <tr>
                    <th scope="col">i \ j</th>
                    {model.rows.map((row) => (
                      <th
                        key={row.rowNodeId}
                        scope="col"
                        className={row.rowNodeId === model.kNodeId ? 'is-k-column' : ''}
                        data-column-node-id={row.rowNodeId}
                      >
                        {row.rowNodeId}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.rows.map((row) => (
                    <tr
                      key={row.rowNodeId}
                      className={row.currentRow ? 'is-current-row' : ''}
                      data-testid="floyd-matrix-row"
                      data-row-node-id={row.rowNodeId}
                    >
                      <th scope="row" className={row.rowNodeId === model.kNodeId ? 'is-k-row' : ''}>
                        {row.rowNodeId}
                      </th>
                      {row.cells.map((cell) => (
                        <td
                          key={`${cell.rowNodeId}-${cell.columnNodeId}`}
                          className={[
                            cell.current ? 'is-current' : '',
                            cell.updated ? 'is-updated' : '',
                            cell.diagonal ? 'is-diagonal' : '',
                            cell.value === null ? 'is-unreachable' : '',
                          ].filter(Boolean).join(' ')}
                          data-testid="floyd-cell"
                          data-row-node-id={cell.rowNodeId}
                          data-column-node-id={cell.columnNodeId}
                          data-value={cell.value ?? ''}
                          data-previous-id={cell.previousId ?? ''}
                          title={`${cell.rowNodeId} → ${cell.columnNodeId}: ${formatDistance(cell.value)}${
                            cell.previousId ? ` · ${t('floydPreviousShort')} ${cell.previousId}` : ''
                          }`}
                        >
                          {cell.current && cell.updated && cell.oldValue !== cell.newValue ? (
                            <span className="g1-cell-change">
                              <s>{formatDistance(cell.oldValue)}</s>
                              <b>{formatDistance(cell.newValue)}</b>
                            </span>
                          ) : (
                            formatDistance(cell.value)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <FloydCompare model={model} />
        </div>
      </div>
      {cycle && (
        <div className="g1-alert is-danger" data-testid="floyd-negative-cycle">
          <b>{t('floydNegativeCycle')}</b>
          <span>{model.negativeCycle?.nodeIds.join(' · ')}</span>
        </div>
      )}
      {model.operation === 'done' && (
      <div className="g1-path" data-testid="floyd-path">
        <b>{t('floydPathTitle')}</b>
        {model.pathNodeIds.length ? (
          <>
            <span className="g1-path-flow">
              {model.pathNodeIds.map((id, index) => (
                <span key={`${id}-${index}`} data-node-id={id}>
                  {id}
                  {index < model.pathNodeIds.length - 1 && <i aria-hidden="true">→</i>}
                </span>
              ))}
            </span>
            <span className="g1-path-weight">
              {t('floydPathWeight')}: {formatDistance(model.pathDistance)}
            </span>
          </>
        ) : (
          <span className={cycle ? 'g1-unreachable' : ''}>
            {cycle ? t('floydPathUndefined') : t('floydPathUnreachable')}
          </span>
        )}
      </div>
      )}
    </section>
  );
}

export function BellmanFordVisual({
  model,
  operationText,
  hint,
}: {
  model: BellmanVisualModel;
  operationText: string;
  hint: string;
}) {
  const { t } = useI18n();
  const cycle = model.negativeCycle?.hasCycle === true;
  const relax = model.relax;
  return (
    <section className="g1-stage bellman-stage" data-testid="bellman-stage" data-operation={model.operation}>
      <header className="g1-head">
        <div>
          <span className="g1-kicker">BELLMAN-FORD</span>
          <b>{t('bellmanTitle')}</b>
          <small className="g1-op-line" data-testid="bellman-operation-text">
            <strong>{operationText}</strong> · {hint}
          </small>
        </div>
        <div className="g1-head-state">
          <span>{t('bellmanRound')}: <b>{model.round}/{model.maxRounds}</b></span>
          {model.earlyExit && <span className="g1-badge is-good" data-testid="bellman-early-exit">{t('bellmanEarlyExit')}</span>}
          {cycle && <span className="g1-badge is-danger">{t('bellmanCycleBadge')}</span>}
        </div>
      </header>
      <div className="g1-workbench">
        <div className="g1-graph-panel">
          <GraphCanvas model={model} markerId="bellman-arrow" showDistance />
        </div>
        <div className="bellman-table-panel">
          <header className="g1-panel-head">
            <b>{t('bellmanTableTitle')}</b>
            <small>{t('bellmanTableNote')}</small>
          </header>
          {model.empty ? (
            <p className="g1-empty">{t('bellmanEmpty')}</p>
          ) : (
            <div className="bellman-table-scroll">
              <table className="bellman-table" data-testid="bellman-distance-table">
                <thead>
                  <tr>
                    <th scope="col">{t('bellmanColumnNode')}</th>
                    <th scope="col">{t('bellmanColumnDistance')}</th>
                    <th scope="col">{t('bellmanColumnPrevious')}</th>
                  </tr>
                </thead>
                <tbody>
                  {model.distances.map((row) => (
                    <tr
                      key={row.nodeId}
                      className={[
                        row.current ? 'is-current' : '',
                        row.neighbor ? 'is-neighbor' : '',
                        row.updated ? 'is-updated' : '',
                        row.cycle ? 'is-cycle' : '',
                      ].filter(Boolean).join(' ')}
                      data-testid="bellman-distance-row"
                      data-node-id={row.nodeId}
                      data-distance={row.distance ?? ''}
                      data-previous-id={row.previousId ?? ''}
                    >
                      <td><code>{row.nodeId}</code></td>
                      <td className="bellman-distance-value">{formatDistance(row.distance)}</td>
                      <td>{row.previousId ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="g1-current-strip" data-testid="bellman-current-edge">
            {model.currentEdgeId ? (
              <>
                <span>{t('bellmanCurrentEdge')}</span>
                <code>{model.currentNodeId} → {model.neighborNodeId}</code>
                <span>{t('bellmanRoundProgress')}: {model.round}/{model.maxRounds}</span>
              </>
            ) : (
              <span>{model.operation === 'early-exit' ? t('bellmanEarlyExitHint') : t('bellmanNoEdge')}</span>
            )}
          </div>
          {relax && (
            <div className="g1-relax-strip" data-testid="bellman-relax-strip">
              <span>{t('bellmanRelax')}</span>
              <b>{relax.nodeId}</b>
              <code>{formatDistance(relax.oldDistance)}</code>
              <span>→</span>
              <code className="is-new">{formatDistance(relax.newDistance)}</code>
              <span>{t('bellmanPrevious')}: {relax.oldPreviousId ?? '—'} → {relax.newPreviousId}</span>
            </div>
          )}
        </div>
      </div>
      {cycle && (
        <div className="g1-alert is-danger" data-testid="bellman-negative-cycle">
          <b>{t('bellmanNegativeCycle')}</b>
          <span>{model.negativeCycle?.nodeIds.join(' · ')}</span>
          <small>{t('bellmanNegativeCycleNote')}</small>
        </div>
      )}
      {model.operation === 'done' && (
      <div className="g1-path" data-testid="bellman-path">
        <b>{t('bellmanPathTitle')}</b>
        {model.pathNodeIds.length ? (
          <>
            <span className="g1-path-flow">
              {model.pathNodeIds.map((id, index) => (
                <span key={`${id}-${index}`} data-node-id={id}>
                  {id}
                  {index < model.pathNodeIds.length - 1 && <i aria-hidden="true">→</i>}
                </span>
              ))}
            </span>
            <span className="g1-path-weight">
              {t('bellmanPathWeight')}: {formatDistance(model.pathDistance)}
            </span>
          </>
        ) : (
          <span className={cycle ? 'g1-unreachable' : ''}>
            {cycle ? t('bellmanPathUndefined') : t('bellmanPathUnreachable')}
          </span>
        )}
      </div>
      )}
    </section>
  );
}
