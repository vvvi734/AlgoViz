import { useI18n } from '../../i18n/I18nProvider';
import type { GraphVisualModel, GraphVisualNode } from '../../domain/visualization/graphModel';

/**
 * Stage 7E graph renderer.
 *
 * This component is intentionally stateless: every node, edge, highlight,
 * frontier badge and visit number below comes from the single GraphVisualModel
 * built from `currentEvent`. There is no animation queue and no second index.
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
  const frontierLabel = model.frontierKind === 'queue' ? t('graphQueue') : t('graphStack');
  const frontierOrder = model.frontierItems.map((item) => item.label).join(' → ');
  const visitLabels = model.visitOrder.map((id) => {
    const node = model.nodes.find((candidate) => candidate.id === id);
    return node?.label ?? id;
  });

  return (
    <div
      className="graph-visual"
      data-testid="graph-visual"
      data-algorithm={model.algorithm}
      data-operation={model.operation}
      data-current-node-id={model.currentNodeId ?? ''}
      data-current-edge-id={model.currentEdgeId ?? ''}
      data-frontier-kind={model.frontierKind}
      data-empty={model.empty ? 'true' : 'false'}
    >
      <header className="graph-head">
        <div className="graph-mode">
          <span className={`graph-mode-badge graph-${model.algorithm}`} data-testid="graph-mode-badge">
            {model.algorithm.toUpperCase()}
          </span>
          <div className="graph-mode-copy">
            <b data-testid="graph-mode-title">
              {model.algorithm === 'bfs' ? t('graphBfsTitle') : t('graphDfsTitle')}
            </b>
            <small>{model.algorithm === 'bfs' ? t('graphBfsSubtitle') : t('graphDfsSubtitle')}</small>
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
          <g className="graph-edges" aria-hidden="true">
            {model.edges.map((edge) => (
              <line
                key={edge.id}
                className={`graph-edge${edge.active ? ' is-active' : ''}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                data-testid="graph-edge"
                data-edge-id={edge.id}
                data-from-id={edge.fromId}
                data-to-id={edge.toId}
                data-active={edge.active ? 'true' : 'false'}
              >
                <title>{`${edge.fromId}–${edge.toId}`}</title>
              </line>
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
            {t('graphLegendVisited')}
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
            {t('graphLegendEdge')}
          </span>
        </div>

        <div className="graph-current-copy" data-testid="graph-current-copy">
          <b>{operationText}</b>
          <span>{hint}</span>
          {currentNode && (
            <span className="graph-current-node" data-testid="graph-current-node">
              {t('graphCurrentNode')}: <code>{currentNode.id}</code>
              {model.neighborNodeId && (
                <span className="graph-neighbor-node" data-testid="graph-neighbor-node">
                  {t('graphNeighborNode')}: <code>{model.neighborNodeId}</code>
                </span>
              )}
            </span>
          )}
        </div>

        <div className="graph-visit-order" data-testid="graph-visit-order">
          <span className="graph-visit-label">{t('graphVisitOrder')}</span>
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
            {t('graphVisitedCount')}: {model.visitedIds.length}/{model.nodes.length}
          </span>
        </div>
      </div>

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
}: {
  node: GraphVisualNode;
  frontierKind: 'queue' | 'stack';
  current: boolean;
  neighbor: boolean;
  radius: number;
}) {
  const stateLabel = node.state;
  return (
    <g
      className={`graph-node graph-node-${stateLabel}${node.start ? ' is-start' : ''}${node.isolated ? ' is-isolated' : ''}${current ? ' is-current' : ''}${neighbor ? ' is-neighbor' : ''}${node.visited ? ' is-visited' : ''}`}
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
      aria-label={`${node.label}: ${stateLabel}${node.visitIndex ? `, ${node.visitIndex}` : ''}`}
    >
      {node.start && (
        <text className="graph-start-tag" y={-radius - 12} textAnchor="middle">
          START
        </text>
      )}
      {current && (
        <circle className="graph-current-ring" r={radius + 7} fill="none" data-testid="graph-current-ring" />
      )}
      {node.isolated && <circle className="graph-isolated-ring" r={radius + 3} fill="none" />}
      <circle className="graph-node-body" r={radius} />
      <text className="graph-node-label" y={4} textAnchor="middle">
        {node.label}
      </text>
      {node.visitIndex !== null && (
        <g className="graph-visit-badge" transform={`translate(${radius - 4} ${-radius + 1})`}>
          <circle r={9} />
          <text y={3} textAnchor="middle">
            {node.visitIndex}
          </text>
        </g>
      )}
      {node.inFrontier && (
        <g className={`graph-frontier-badge graph-frontier-${frontierKind}`} transform={`translate(${radius - 3} ${radius - 3})`}>
          <rect x={-8} y={-8} width={16} height={16} rx={3} />
          <text y={3} textAnchor="middle">
            {frontierKind === 'queue' ? 'Q' : 'S'}
          </text>
        </g>
      )}
    </g>
  );
}
