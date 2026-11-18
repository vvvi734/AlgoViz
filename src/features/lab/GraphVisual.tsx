import { useI18n } from '../../i18n/I18nProvider';
import type {
  GraphVisualFrontierKind,
  GraphVisualModel,
  GraphVisualNode,
} from '../../domain/visualization/graphModel';

function formatDistance(distance: number | null | undefined): string {
  if (distance === null || distance === undefined) return '∞';
  if (Number.isInteger(distance)) return String(distance);
  return distance.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * Stage 7E/7F graph renderer.
 *
 * This component is intentionally stateless: every node, edge, highlight,
 * weighted distance, previous pointer, heap entry and path below comes from
 * the single GraphVisualModel built from `currentEvent`. There is no animation
 * queue and no second index.
 */
export function GraphVisual({
  model,
  operationText,
  hint,
}: {
  model: GraphVisualModel;
  operationText: string;
  hint: string;
}) {
  const { t, lang } = useI18n();
  const currentNode = model.nodes.find((node) => node.id === model.currentNodeId);
  const weighted = model.weighted === true;
  const frontierLabel =
    model.frontierKind === 'queue'
      ? t('graphQueue')
      : model.frontierKind === 'stack'
        ? t('graphStack')
        : t('graphPriorityQueue');
  const frontierOrder = model.frontierItems
    .map((item) =>
      weighted
        ? `(${formatDistance(item.distance)}, ${item.label})${item.stale ? ' ×' : ''}`
        : item.label,
    )
    .join(' → ');
  const visitLabels = model.visitOrder.map((id) => {
    const node = model.nodes.find((candidate) => candidate.id === id);
    return node?.label ?? id;
  });
  const title =
    model.algorithm === 'bfs'
      ? t('graphBfsTitle')
      : model.algorithm === 'dfs'
        ? t('graphDfsTitle')
        : t('graphDijkstraTitle');
  const subtitle =
    model.algorithm === 'bfs'
      ? t('graphBfsSubtitle')
      : model.algorithm === 'dfs'
        ? t('graphDfsSubtitle')
        : t('graphDijkstraSubtitle');
  const relax = model.relax;
  const targetNode = model.targetNodeId
    ? model.nodes.find((node) => node.id === model.targetNodeId)
    : undefined;

  return (
    <div
      className={`graph-visual${weighted ? ' is-weighted' : ''}`}
      data-testid="graph-visual"
      data-algorithm={model.algorithm}
      data-operation={model.operation}
      data-current-node-id={model.currentNodeId ?? ''}
      data-current-edge-id={model.currentEdgeId ?? ''}
      data-frontier-kind={model.frontierKind}
      data-empty={model.empty ? 'true' : 'false'}
      data-directed={model.directed ? 'true' : 'false'}
      data-path-distance={model.pathDistance ?? ''}
    >
      <header className="graph-head">
        <div className="graph-mode">
          <span className={`graph-mode-badge graph-${model.algorithm}`} data-testid="graph-mode-badge">
            {model.algorithm.toUpperCase()}
          </span>
          <div className="graph-mode-copy">
            <b data-testid="graph-mode-title">{title}</b>
            <small>{subtitle}</small>
          </div>
        </div>
        <div className="graph-frontier-summary" data-testid="graph-frontier-summary">
          <span className="graph-frontier-label">
            {frontierLabel} · {model.frontierItems.length}
          </span>
          <span className="graph-frontier-order" data-testid="graph-frontier-order">
            {model.frontierItems.length ? frontierOrder : t('graphFrontierEmpty')}
          </span>
        </div>
      </header>

      {weighted && relax && (
        <div className="graph-relax-strip" data-testid="dijkstra-relax-strip">
          <span className="graph-relax-arrow">↘</span>
          <span>
            {t('graphRelaxLabel')} <b>{relax.nodeId}</b>
          </span>
          <code data-testid="dijkstra-relax-old">{formatDistance(relax.oldDistance)}</code>
          <span className="graph-relax-arrow">→</span>
          <code className="is-new" data-testid="dijkstra-relax-new">{formatDistance(relax.newDistance)}</code>
          <span className="graph-relax-previous">
            {t('graphPreviousShort')}: {relax.oldPreviousId ?? '—'} → {relax.newPreviousId}
          </span>
        </div>
      )}

      <div className="graph-canvas-scroll" tabIndex={0} aria-label={t('graphCanvasLabel')}>
        <svg
          className="graph-svg"
          viewBox={`0 0 ${model.width} ${model.height}`}
          width={model.width}
          height={model.height}
          role="img"
          aria-label={`${model.algorithm.toUpperCase()} ${t('graphCanvasLabel')}`}
          data-testid="graph-svg"
          data-node-count={model.nodes.length}
          data-edge-count={model.edges.length}
        >
          {model.directed && (
            <defs>
              <marker id="graph-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
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
                  data-testid="graph-edge"
                  data-edge-id={edge.id}
                  data-from-id={edge.fromId}
                  data-to-id={edge.toId}
                  data-weight={edge.weight ?? ''}
                  data-active={edge.active ? 'true' : 'false'}
                  data-on-path={edge.onPath ? 'true' : 'false'}
                  data-directed={edge.directed ? 'true' : 'false'}
                  markerEnd={edge.directed ? 'url(#graph-arrow)' : undefined}
                >
                  <title>{`${edge.fromId}${edge.directed ? '→' : '–'}${edge.toId}${
                    edge.weight !== undefined ? `, ${edge.weight}` : ''
                  }`}</title>
                </line>
                {edge.weight !== undefined && (
                  <g
                    className="graph-edge-weight"
                    transform={`translate(${(edge.x1 + edge.x2) / 2} ${(edge.y1 + edge.y2) / 2})`}
                    data-testid="graph-edge-weight"
                    data-edge-id={edge.id}
                  >
                    <rect x={-15} y={-10} width={30} height={19} rx={7} />
                    <text y={4} textAnchor="middle">
                      {edge.weight}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </g>
          <g className="graph-nodes">
            {model.nodes.map((node) => (
              <NodeGlyph
                key={node.id}
                node={node}
                frontierKind={model.frontierKind}
                current={node.id === model.currentNodeId}
                neighbor={node.id === model.neighborNodeId}
                radius={model.nodeRadius}
                weighted={weighted}
                target={node.id === model.targetNodeId}
              />
            ))}
          </g>
          {model.empty && (
            <g className="graph-empty-glyph" data-testid="graph-empty">
              <rect x={model.width / 2 - 118} y={model.height / 2 - 52} width={236} height={104} rx={14} />
              <text x={model.width / 2} y={model.height / 2 - 8} textAnchor="middle">
                {model.label}
              </text>
              <text x={model.width / 2} y={model.height / 2 + 20} textAnchor="middle">
                {t('graphEmptyHint')}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="graph-status">
        <div className="graph-legend" data-testid="graph-legend" aria-label={t('graphLegendLabel')}>
          <span className="graph-legend-item">
            <i className="graph-swatch graph-swatch-current" aria-hidden="true" />
            {t('graphLegendCurrent')}
          </span>
          <span className="graph-legend-item">
            <i className="graph-swatch graph-swatch-visited" aria-hidden="true" />
            {weighted ? t('graphLegendSettled') : t('graphLegendVisited')}
          </span>
          <span className="graph-legend-item">
            <i className="graph-swatch graph-swatch-pending" aria-hidden="true" />
            {t('graphLegendPending')}
          </span>
          <span className="graph-legend-item">
            <i className="graph-swatch graph-swatch-undiscovered" aria-hidden="true" />
            {t('graphLegendUndiscovered')}
          </span>
          <span className="graph-legend-item">
            <i className="graph-swatch graph-swatch-edge" aria-hidden="true" />
            {weighted ? t('graphLegendWeightedEdge') : t('graphLegendEdge')}
          </span>
          {weighted && (
            <>
              <span className="graph-legend-item">
                <i className="graph-swatch graph-swatch-target" aria-hidden="true" />
                {t('graphLegendTarget')}
              </span>
              <span className="graph-legend-item">
                <i className="graph-swatch graph-swatch-path" aria-hidden="true" />
                {t('graphLegendPath')}
              </span>
            </>
          )}
        </div>

        <div className="graph-current-copy" data-testid="graph-current-copy">
          <b>{operationText}</b>
          <span>{hint}</span>
          {currentNode && (
            <span className="graph-current-node" data-testid="graph-current-node">
              {t('graphCurrentNode')}: <code>{currentNode.id}</code>
              {weighted && (
                <span className="graph-current-distance" data-testid="graph-current-distance">
                  {t('graphDistanceShort')}: <code>{formatDistance(currentNode.distance)}</code>
                </span>
              )}
              {model.neighborNodeId && (
                <span className="graph-neighbor-node" data-testid="graph-neighbor-node">
                  {t('graphNeighborNode')}: <code>{model.neighborNodeId}</code>
                </span>
              )}
            </span>
          )}
          {weighted && targetNode && (
            <span className="graph-target-node" data-testid="graph-target-node">
              {t('graphTargetNode')}: <code>{targetNode.id}</code>
            </span>
          )}
        </div>

        <div className="graph-visit-order" data-testid="graph-visit-order">
          <span className="graph-visit-label">
            {weighted ? t('graphSettledOrder') : t('graphVisitOrder')}
          </span>
          {visitLabels.length ? (
            <ol className="graph-visit-list" data-testid="graph-visit-list">
              {visitLabels.map((label, index) => (
                <li key={`${label}-${index}`} data-visit-index={index + 1} data-node-label={label}>
                  <span>{index + 1}</span>
                  <b>{label}</b>
                </li>
              ))}
            </ol>
          ) : (
            <span className="graph-visit-empty">{t('graphVisitEmpty')}</span>
          )}
          <span className="graph-visit-count" data-testid="graph-visit-count">
            {weighted ? t('graphSettledCount') : t('graphVisitedCount')}: {model.visitedIds.length}/
            {model.nodes.length}
          </span>
        </div>
      </div>

      {weighted && !model.empty && (
        <section className="dijkstra-distance-table" data-testid="dijkstra-distance-table">
          <header className="dijkstra-table-head">
            <b>{t('graphDistanceTable')}</b>
            <small>{t('graphDistanceTableNote')}</small>
          </header>
          <div className="dijkstra-table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">{t('graphDistanceColumnNode')}</th>
                  <th scope="col">{t('graphDistanceColumnDistance')}</th>
                  <th scope="col">{t('graphDistanceColumnPrevious')}</th>
                  <th scope="col">{t('graphDistanceColumnSettled')}</th>
                </tr>
              </thead>
              <tbody>
                {model.nodes.map((node) => {
                  const rowState = node.settled ? 'settled' : node.inFrontier ? 'frontier' : node.distance !== null ? 'reached' : 'unreached';
                  return (
                    <tr
                      key={node.id}
                      className={`dijkstra-distance-row is-${rowState}`}
                      data-testid="dijkstra-distance-row"
                      data-node-id={node.id}
                      data-distance={node.distance ?? ''}
                      data-previous-id={node.previousId ?? ''}
                      data-settled={node.settled ? 'true' : 'false'}
                      data-row-state={rowState}
                    >
                      <td>
                        <code>{node.id}</code>
                      </td>
                      <td className="dijkstra-distance-value">{formatDistance(node.distance)}</td>
                      <td>{node.previousId ?? '—'}</td>
                      <td>{node.settled ? '✓' : '·'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {weighted && model.operation === 'done' && (
        <section className="dijkstra-path-summary" data-testid="dijkstra-path-summary">
          <b>{t('graphPathTitle')}</b>
          {model.pathNodeIds && model.pathNodeIds.length ? (
            <div className="dijkstra-path-line" data-testid="dijkstra-path">
              {model.pathNodeIds.map((id, index) => (
                <span key={`${id}-${index}`} className="dijkstra-path-node" data-node-id={id}>
                  {id}
                  {index < model.pathNodeIds!.length - 1 && <i aria-hidden="true">→</i>}
                </span>
              ))}
            </div>
          ) : (
            <span className="dijkstra-path-empty" data-testid="dijkstra-path-empty">
              {t('graphPathUnreachable')}
            </span>
          )}
          {model.pathDistance !== null && model.pathDistance !== undefined && (
            <span className="dijkstra-path-distance" data-testid="dijkstra-path-distance">
              {t('graphPathTotal')}: <code>{formatDistance(model.pathDistance)}</code>
            </span>
          )}
        </section>
      )}

      {!model.empty && (
        <p className="graph-scroll-hint" data-testid="graph-scroll-hint">
          {lang === 'zh'
            ? '画布可横向滚动查看宽带图；页面本身不会横向溢出。'
            : 'Scroll inside the canvas for wide graphs; the page itself does not overflow horizontally.'}
        </p>
      )}
    </div>
  );
}

function NodeGlyph({
  node,
  frontierKind,
  current,
  neighbor,
  radius,
  weighted,
  target,
}: {
  node: GraphVisualNode;
  frontierKind: GraphVisualFrontierKind;
  current: boolean;
  neighbor: boolean;
  radius: number;
  weighted: boolean;
  target: boolean;
}) {
  const stateLabel = node.state;
  const frontierBadge =
    frontierKind === 'queue' ? 'Q' : frontierKind === 'stack' ? 'S' : 'H';
  const distanceLabel = formatDistance(node.distance);
  return (
    <g
      className={`graph-node graph-node-${stateLabel}${node.start ? ' is-start' : ''}${node.isolated ? ' is-isolated' : ''}${current ? ' is-current' : ''}${neighbor ? ' is-neighbor' : ''}${node.visited ? ' is-visited' : ''}${node.settled ? ' is-settled' : ''}${target ? ' is-target' : ''}${node.onPath ? ' is-on-path' : ''}`}
      transform={`translate(${node.x} ${node.y})`}
      data-testid="graph-node"
      data-node-id={node.id}
      data-label={node.label}
      data-state={stateLabel}
      data-start={node.start ? 'true' : 'false'}
      data-isolated={node.isolated ? 'true' : 'false'}
      data-in-frontier={node.inFrontier ? 'true' : 'false'}
      data-visited={node.visited ? 'true' : 'false'}
      data-visit-index={node.visitIndex ?? ''}
      data-current={current ? 'true' : 'false'}
      data-neighbor={neighbor ? 'true' : 'false'}
      data-distance={weighted ? (node.distance ?? '') : ''}
      data-previous-id={weighted ? (node.previousId ?? '') : ''}
      data-settled={weighted ? (node.settled ? 'true' : 'false') : ''}
      data-target={target ? 'true' : 'false'}
      data-on-path={node.onPath ? 'true' : 'false'}
      aria-label={`${node.label}: ${stateLabel}${node.visitIndex ? `, ${node.visitIndex}` : ''}${
        weighted ? `, distance ${distanceLabel}` : ''
      }`}
    >
      {node.start && (
        <text className="graph-start-tag" y={-radius - 12} textAnchor="middle">
          START
        </text>
      )}
      {target && (
        <text className="graph-target-tag" y={-radius - (node.start ? 27 : 12)} textAnchor="middle">
          TARGET
        </text>
      )}
      {current && (
        <circle className="graph-current-ring" r={radius + 7} fill="none" data-testid="graph-current-ring" />
      )}
      {node.isolated && <circle className="graph-isolated-ring" r={radius + 3} fill="none" />}
      {target && <circle className="graph-target-ring" r={radius + 3} fill="none" />}
      <circle className="graph-node-body" r={radius} />
      <text className="graph-node-label" y={weighted ? -2 : 4} textAnchor="middle">
        {node.label}
      </text>
      {weighted && (
        <text className="graph-distance-tag" y={11} textAnchor="middle" data-testid="graph-node-distance">
          d={distanceLabel}
        </text>
      )}
      {node.visitIndex !== null && (
        <g className="graph-visit-badge" transform={`translate(${radius - 4} ${-radius + 1})`}>
          <circle r={9} />
          <text y={3} textAnchor="middle">
            {node.visitIndex}
          </text>
        </g>
      )}
      {node.inFrontier && (
        <g
          className={`graph-frontier-badge graph-frontier-${frontierKind}`}
          transform={`translate(${radius - 3} ${radius - 3})`}
          data-testid="graph-node-heap-badge"
        >
          <rect x={-8} y={-8} width={16} height={16} rx={3} />
          <text y={3} textAnchor="middle">
            {frontierBadge}
          </text>
        </g>
      )}
    </g>
  );
}
