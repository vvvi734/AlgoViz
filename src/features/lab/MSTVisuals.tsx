/**
 * G2 presentation for Prim and Kruskal.
 *
 * Both views paint the SAME frame model as the playback: no local playhead,
 * no interval, no message parsing. Prim's distinctive panel is its heapq
 * frontier; Kruskal's is the sorted edge stream plus the live union-find table.
 */
import { useI18n } from '../../i18n/I18nProvider';
import {
  computeMstViewBox,
  type KruskalVisualModel,
  type PrimEdgeVisual,
  type PrimVisualModel,
  type KruskalEdgeVisual,
} from '../../domain/visualization/mstModel';

function weightText(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function edgeName(fromId: string, toId: string): string {
  return `${fromId}–${toId}`;
}

function viewBoxFor(model: PrimVisualModel | KruskalVisualModel): string {
  const box = computeMstViewBox(model);
  return `${box.x} ${box.y} ${box.width} ${box.height}`;
}

const WEIGHT_HALF_WIDTH = 17;
/**
 * The collision box is taller than the 18-unit background chip: the painted
 * weight glyph extends above and below the rect on narrow viewports.
 * Reserving 34 units vertically keeps the real rendered labels apart, not just
 * their rounded backgrounds.
 */
const WEIGHT_HALF_HEIGHT = 17;

type WeightPoint = { x: number; y: number };
type WeightBox = { left: number; right: number; top: number; bottom: number };

function weightBox(point: WeightPoint): WeightBox {
  return {
    left: point.x - WEIGHT_HALF_WIDTH,
    right: point.x + WEIGHT_HALF_WIDTH,
    top: point.y - WEIGHT_HALF_HEIGHT,
    bottom: point.y + WEIGHT_HALF_HEIGHT,
  };
}

function boxesOverlap(a: WeightBox, b: WeightBox): boolean {
  return Math.min(a.right, b.right) > Math.max(a.left, b.left)
    && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
}

/**
 * Keep the weight chip on the edge unless a node or an earlier weight chip
 * already occupies that spot. The candidate points are functions of the fixed
 * graph geometry only, so scrubbing cannot make a label jump between frames.
 *
 * A dense five-node graph on a 390px phone cannot always fit six labels
 * without collisions; choosing the least crowded candidate keeps labels apart
 * without enlarging the canvas or shrinking the type.
 */
function computeWeightLabels(
  edges: ReadonlyArray<PrimEdgeVisual | KruskalEdgeVisual>,
  nodes: ReadonlyArray<{ x: number; y: number }>,
  radius: number,
): Map<string, WeightPoint> {
  const placed: WeightBox[] = [];

  const collisions = (point: WeightPoint): { nodes: number; labels: number } => {
    const box = weightBox(point);
    const nodeHits = nodes.filter((node) => {
      const nx = Math.max(box.left, Math.min(node.x, box.right));
      const ny = Math.max(box.top, Math.min(node.y, box.bottom));
      return Math.hypot(node.x - nx, node.y - ny) < radius + 10;
    }).length;
    const labelHits = placed.filter((other) => boxesOverlap(box, other)).length;
    return { nodes: nodeHits, labels: labelHits };
  };

  return new Map(edges.map((edge) => {
    const midX = (edge.x1 + edge.x2) / 2;
    const midY = (edge.y1 + edge.y2) / 2;
    const candidates: WeightPoint[] = [{ x: midX, y: midY }];
    for (let ring = 1; ring <= 12; ring += 1) {
      const radiusDistance = ring * 8;
      for (let step = 0; step < 16; step += 1) {
        const angle = (step * Math.PI) / 8;
        candidates.push({
          x: midX + Math.cos(angle) * radiusDistance,
          y: midY + Math.sin(angle) * radiusDistance,
        });
      }
    }
    const scored = candidates.map((point) => ({ point, ...collisions(point) }));
    const best = scored.find((item) => item.nodes === 0 && item.labels === 0)
      ?? scored.reduce((a, b) => {
        const scoreA = a.nodes * 4 + a.labels;
        const scoreB = b.nodes * 4 + b.labels;
        return scoreB < scoreA ? b : a;
      });
    placed.push(weightBox(best.point));
    return [edge.id, best.point] as const;
  }));
}

function Legend({ states }: { states: Array<{ state: string; label: string }> }) {
  return (
    <div className="mst-legend" aria-label="edge state legend">
      {states.map((item) => (
        <span className="mst-legend-item" key={item.state}>
          <i className={`mst-legend-line is-${item.state}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function PrimGraph({ model }: { model: PrimVisualModel }) {
  const weightLabels = computeWeightLabels(model.edges, model.nodes, model.nodeRadius);
  return (
    <div className="mst-graph-scroll">
      <svg
        className="mst-graph-svg prim-graph-svg"
        viewBox={viewBoxFor(model)}
        role="img"
        aria-label="Prim weighted undirected graph"
        data-testid="prim-graph-svg"
        data-node-count={model.nodes.length}
        data-edge-count={model.edges.length}
      >
        <g className="mst-edges">
          {model.edges.map((edge) => {
            const label = weightLabels.get(edge.id) ?? { x: (edge.x1 + edge.x2) / 2, y: (edge.y1 + edge.y2) / 2 };
            return (
              <g
                key={edge.id}
                data-testid="mst-edge"
                data-edge-id={edge.id}
                data-state={edge.state}
                data-current={edge.current ? 'true' : 'false'}
              >
                <line
                  className={`mst-edge is-${edge.state}${edge.current ? ' is-current' : ''}`}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                />
                <g className={`mst-edge-weight is-${edge.state}`} transform={`translate(${label.x}, ${label.y})`}>
                  <rect x="-17" y="-9" width="34" height="18" rx="5" />
                  <text textAnchor="middle" y="3.5">{weightText(edge.weight)}</text>
                </g>
              </g>
            );
          })}
        </g>
        <g className="mst-nodes">
          {model.nodes.map((node) => (
            <g
              key={node.id}
              className={`mst-node${node.inTree ? ' is-tree' : ''}${node.inComponent ? ' is-component' : ''}${
                node.start ? ' is-start' : ''
              }${node.isNew ? ' is-new' : ''}`}
              transform={`translate(${node.x}, ${node.y})`}
              data-testid="mst-node"
              data-node-id={node.id}
              data-in-tree={node.inTree ? 'true' : 'false'}
              data-in-component={node.inComponent ? 'true' : 'false'}
            >
              <circle className="mst-node-ring" r={model.nodeRadius + 4} />
              <circle className="mst-node-body" r={model.nodeRadius} />
              <text className="mst-node-label" textAnchor="middle" y="4">{node.label}</text>
              {node.start && <text className="mst-node-start" textAnchor="middle" y={-model.nodeRadius - 10}>S</text>}
              {node.isNew && (
                <text className="mst-node-new" textAnchor="middle" y={model.nodeRadius + 18}>+</text>
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function KruskalGraph({ model }: { model: KruskalVisualModel }) {
  const weightLabels = computeWeightLabels(model.edges, model.nodes, model.nodeRadius);
  return (
    <div className="mst-graph-scroll">
      <svg
        className="mst-graph-svg kruskal-graph-svg"
        viewBox={viewBoxFor(model)}
        role="img"
        aria-label="Kruskal weighted undirected graph"
        data-testid="kruskal-graph-svg"
        data-node-count={model.nodes.length}
        data-edge-count={model.edges.length}
      >
        <g className="mst-edges">
          {model.edges.map((edge: KruskalEdgeVisual) => {
            const label = weightLabels.get(edge.id) ?? { x: (edge.x1 + edge.x2) / 2, y: (edge.y1 + edge.y2) / 2 };
            return (
              <g
                key={edge.id}
                data-testid="mst-edge"
                data-edge-id={edge.id}
                data-state={edge.state}
                data-rank={edge.rank ?? ''}
                data-current={edge.current ? 'true' : 'false'}
              >
                <line
                  className={`mst-edge is-${edge.state}${edge.current ? ' is-current' : ''}`}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                />
                <g className={`mst-edge-weight is-${edge.state}`} transform={`translate(${label.x}, ${label.y})`}>
                  <rect x="-17" y="-9" width="34" height="18" rx="5" />
                  <text textAnchor="middle" y="3.5">{weightText(edge.weight)}</text>
                </g>
              </g>
            );
          })}
        </g>
        <g className="mst-nodes">
          {model.nodes.map((node) => (
            <g
              key={node.id}
              className={`mst-node kruskal-node group-${node.groupIndex % 5}${
                node.endpoint ? ' is-endpoint' : ''
              }`}
              transform={`translate(${node.x}, ${node.y})`}
              data-testid="mst-node"
              data-node-id={node.id}
              data-root={node.rootId}
            >
              <circle className="mst-node-ring" r={model.nodeRadius + 4} />
              <circle className="mst-node-body" r={model.nodeRadius} />
              <text className="mst-node-label" textAnchor="middle" y="4">{node.label}</text>
              <text className="mst-node-root" textAnchor="middle" y={model.nodeRadius + 18}>↳{node.rootId}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function PrimResult({ model }: { model: PrimVisualModel }) {
  const { t } = useI18n();
  if (model.empty) {
    return <p className="mst-empty" data-testid="prim-empty">{t('mstEmpty')}</p>;
  }
  // `forest` is a property of the input graph. During Prim's first component it
  // is already true, but the *result* is only a forest once every component has
  // been grown; the warning therefore appears only on the `done` frame.
  const showForest = model.done && model.forest;
  return (
    <footer className={`mst-result${showForest ? ' is-forest' : ''}`} data-testid="prim-result">
      <span className="mst-result-kicker">{model.done ? t('mstResultDone') : t('mstResultRunning')}</span>
      <strong data-testid="prim-total-weight">
        {t('mstTotalWeightLabel')} {weightText(model.totalWeight)}
      </strong>
      <span>{t('mstSelectedCount')}: {model.selectedCount}</span>
      <span>{t('mstTreeCount')}: {model.treeNodeIds.length} / {model.nodes.length}</span>
      <span>
        {t('mstComponentLabel')}: {model.componentIndex + 1} / {model.componentCount}
      </span>
      {showForest && (
        <span className="mst-forest-warning" data-testid="prim-forest-alert">
          {t('mstForestWarning')}
        </span>
      )}
      {model.done && !model.forest && <span className="mst-tree-badge">{t('mstOneTreeBadge')}</span>}
    </footer>
  );
}

export function PrimVisual({
  model,
  operationText,
}: {
  model: PrimVisualModel;
  operationText: string;
}) {
  const { t } = useI18n();
  const current = model.currentEdge;
  const currentSkipped = Boolean(current && model.skippedEdgeIds.includes(current.edgeId));
  return (
    <article
      className="mst-stage prim-stage"
      data-testid="prim-stage"
      data-operation={model.operation}
      data-forest={model.forest ? 'true' : 'false'}
    >
      <header className="mst-head">
        <div>
          <div className="eyebrow">{t('mstKicker')}</div>
          <h2>{t('primTitle')}</h2>
          <p className="mst-subtitle">{operationText}</p>
        </div>
        <div className="mst-metrics">
          <div className="mst-metric">
            <span>{t('mstTotalWeightLabel')}</span>
            <b>{weightText(model.totalWeight)}</b>
          </div>
          <div className="mst-metric">
            <span>{t('mstTreeCount')}</span>
            <b>{model.treeNodeIds.length}</b>
          </div>
          <div className="mst-metric">
            <span>{t('mstComponentLabel')}</span>
            <b>{model.componentIndex + 1}/{model.componentCount}</b>
          </div>
        </div>
      </header>

      <div className="mst-layout">
        <section className="mst-graph-card">
          <div className="mst-card-head">
            <Legend
              states={[
                { state: 'idle', label: t('mstEdgeIdle') },
                { state: 'candidate', label: t('mstEdgeCandidate') },
                { state: 'current', label: t('mstEdgeCurrent') },
                { state: 'selected', label: t('mstEdgeSelected') },
                { state: 'skipped', label: t('mstEdgeSkipped') },
              ]}
            />
            <span className="tag green">{t('mstUndirectedBadge')}</span>
          </div>
          <PrimGraph model={model} />
          <div
            className={`mst-current-strip${model.selectedEdge ? ' is-success' : ''}${currentSkipped ? ' is-skip' : ''}`}
            data-testid="prim-current-edge"
            data-edge-id={current?.edgeId ?? ''}
            data-weight={current?.weight ?? ''}
          >
            <span className="mst-strip-label">{t('primCurrentEdge')}</span>
            {current ? (
              <>
                <code>{edgeName(current.fromId, current.toId)}</code>
                <span className="mst-weight-pill">w={weightText(current.weight)}</span>
                {currentSkipped && <span className="mst-cycle-badge is-skip">{t('mstEdgeSkipped')}</span>}
              </>
            ) : (
              <span className="muted">{t('primNoCurrent')}</span>
            )}
            {model.selectedEdge && (
              <span className="mst-new-node" data-testid="prim-selected-edge">
                {t('primSelectedEdge')}: {edgeName(model.selectedEdge.fromId, model.selectedEdge.toId)}
                {' '}→ {model.selectedEdge.newNodeId}
              </span>
            )}
          </div>
        </section>

        <aside className="mst-side">
          <section className="mst-panel" data-testid="prim-frontier">
            <header className="mst-panel-head">
              <b>{t('primFrontierTitle')}</b>
              <small>{t('primFrontierNote')}</small>
            </header>
            {model.frontierItems.length ? (
              <ol className="mst-pq-list">
                {model.frontierItems.map((entry, index) => (
                  <li
                    key={entry.id}
                    className={`mst-pq-entry${entry.minimum ? ' is-minimum' : ''}${
                      entry.active ? ' is-added' : ''
                    }`}
                    data-testid="prim-pq-entry"
                    data-entry-id={entry.id}
                    data-weight={entry.weight}
                  >
                    <span className="mst-pq-rank">{index + 1}</span>
                    <code>{edgeName(entry.fromId, entry.toId)}</code>
                    <b>{weightText(entry.weight)}</b>
                    {entry.minimum && <span className="mst-pq-min">{t('primMinBadge')}</span>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mst-empty-inline" data-testid="prim-frontier-empty">{t('primFrontierEmpty')}</p>
            )}
            <footer className="mst-panel-foot">
              <span>{t('primFrontierSize')}: {model.frontierItems.length}</span>
              <span>{t('mstSkippedCount')}: {model.skippedCount}</span>
            </footer>
          </section>

          <section className="mst-panel">
            <header className="mst-panel-head">
              <b>{t('mstSelectedEdgesTitle')}</b>
              <small>{t('primSelectedNote')}</small>
            </header>
            {model.selectedEdgeIds.length ? (
              <div className="mst-chip-list" data-testid="prim-selected-edges">
                {model.edges.filter((edge: PrimEdgeVisual) => edge.state === 'selected').map((edge) => (
                  <span className="mst-edge-chip is-selected" key={edge.id}>
                    {edgeName(edge.fromId, edge.toId)}
                    <b>{weightText(edge.weight)}</b>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mst-empty-inline">{t('primNoSelected')}</p>
            )}
            <footer className="mst-panel-foot">
              <span>{t('primVisitOrder')}: {model.visitOrder.join(' → ') || '—'}</span>
            </footer>
          </section>
        </aside>
      </div>

      <PrimResult model={model} />
    </article>
  );
}

function KruskalResult({ model }: { model: KruskalVisualModel }) {
  const { t } = useI18n();
  if (model.empty) {
    return <p className="mst-empty" data-testid="kruskal-empty">{t('mstEmpty')}</p>;
  }
  // Kruskal's component count is the live Union-Find count. It is > 1 while the
  // algorithm is still merging even on a connected input, so a forest warning
  // must wait for the final frame.
  const showForest = model.done && model.forest;
  return (
    <footer className={`mst-result${showForest ? ' is-forest' : ''}`} data-testid="kruskal-result">
      <span className="mst-result-kicker">{model.done ? t('mstResultDone') : t('mstResultRunning')}</span>
      <strong data-testid="kruskal-total-weight">
        {t('mstTotalWeightLabel')} {weightText(model.totalWeight)}
      </strong>
      <span>{t('mstSelectedCount')}: {model.selectedCount}</span>
      <span>{t('mstRejectedCount')}: {model.rejectedCount}</span>
      <span>{t('mstComponentLabel')}: {model.componentCount}</span>
      {showForest && (
        <span className="mst-forest-warning" data-testid="kruskal-forest-alert">
          {t('mstForestWarning')}
        </span>
      )}
      {model.done && !model.forest && <span className="mst-tree-badge">{t('mstOneTreeBadge')}</span>}
    </footer>
  );
}

export function KruskalVisual({
  model,
  operationText,
}: {
  model: KruskalVisualModel;
  operationText: string;
}) {
  const { t } = useI18n();
  const current = model.currentEdge;
  return (
    <article
      className="mst-stage kruskal-stage"
      data-testid="kruskal-stage"
      data-operation={model.operation}
      data-forest={model.forest ? 'true' : 'false'}
    >
      <header className="mst-head">
        <div>
          <div className="eyebrow">{t('mstKicker')}</div>
          <h2>{t('kruskalTitle')}</h2>
          <p className="mst-subtitle">{operationText}</p>
        </div>
        <div className="mst-metrics">
          <div className="mst-metric">
            <span>{t('mstTotalWeightLabel')}</span>
            <b>{weightText(model.totalWeight)}</b>
          </div>
          <div className="mst-metric">
            <span>{t('mstSelectedCount')}</span>
            <b>{model.selectedCount}</b>
          </div>
          <div className="mst-metric">
            <span>{t('mstComponentLabel')}</span>
            <b>{model.componentCount}</b>
          </div>
        </div>
      </header>

      <div className="mst-layout kruskal-layout">
        <section className="mst-graph-card">
          <div className="mst-card-head">
            <Legend
              states={[
                { state: 'idle', label: t('mstEdgeIdle') },
                { state: 'current', label: t('mstEdgeCurrent') },
                { state: 'selected', label: t('mstEdgeSelected') },
                { state: 'rejected', label: t('mstEdgeRejected') },
              ]}
            />
            <span className="tag green">{t('mstUndirectedBadge')}</span>
          </div>
          <KruskalGraph model={model} />
          <div
            className={`mst-current-strip${model.formsCycle ? ' is-reject' : ''}`}
            data-testid="kruskal-current-edge"
            data-edge-id={current?.edgeId ?? ''}
            data-weight={current?.weight ?? ''}
          >
            <span className="mst-strip-label">{t('kruskalCurrentEdge')}</span>
            {current ? (
              <>
                <code>{edgeName(current.fromId, current.toId)}</code>
                <span className="mst-weight-pill">w={weightText(current.weight)}</span>
                <span className="mst-rank-pill">#{current.rank}</span>
              </>
            ) : (
              <span className="muted">{t('kruskalNoCurrent')}</span>
            )}
            {current && (
              <span
                className={`mst-cycle-badge${model.formsCycle ? ' is-cycle' : ' is-safe'}`}
                data-testid="kruskal-cycle-badge"
                data-cycle={model.formsCycle ? 'true' : 'false'}
              >
                {model.formsCycle ? t('kruskalFormsCycle') : t('kruskalSafeEdge')}
              </span>
            )}
          </div>
        </section>

        <aside className="mst-side">
          <section className="mst-panel" data-testid="kruskal-sorted-panel">
            <header className="mst-panel-head">
              <b>{t('kruskalSortedTitle')}</b>
              <small>{t('kruskalSortedNote')}</small>
            </header>
            {model.sortedEdges.length ? (
              <ol className="mst-sorted-list">
                {model.sortedEdges.map((edge) => (
                  <li
                    key={edge.edgeId}
                    className={`mst-sorted-entry is-${edge.state}${edge.current ? ' is-current' : ''}`}
                    data-testid="kruskal-sorted-edge"
                    data-rank={edge.rank}
                    data-state={edge.state}
                    data-edge-id={edge.edgeId}
                  >
                    <span className="mst-sorted-rank">{edge.rank}</span>
                    <code>{edgeName(edge.fromId, edge.toId)}</code>
                    <b>{weightText(edge.weight)}</b>
                    <span className="mst-sorted-state">
                      {edge.state === 'selected' ? t('kruskalAcceptedShort') :
                        edge.state === 'rejected' ? t('kruskalRejectedShort') :
                        edge.state === 'current' ? t('mstEdgeCurrent') : t('kruskalQueued')}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mst-empty-inline" data-testid="kruskal-sorted-empty">{t('kruskalSortedEmpty')}</p>
            )}
            <footer className="mst-panel-foot">
              <span>{t('kruskalPointer')}: {model.sortedEdges.length ? model.currentIndex + 1 : 0} / {model.sortedEdges.length}</span>
            </footer>
          </section>

          <section className="mst-panel" data-testid="kruskal-union-panel">
            <header className="mst-panel-head">
              <b>{t('kruskalUnionTitle')}</b>
              <small>{t('kruskalUnionNote')}</small>
            </header>
            {model.union ? (
              <div className="mst-union-change" data-testid="kruskal-union">
                <code>{model.union.rootA}</code>
                <span>∪</span>
                <code>{model.union.rootB}</code>
                <span>→</span>
                <code className="is-root">{model.union.mergedRoot}</code>
                <span className="muted">
                  {t('mstComponentLabel')} {model.union.componentCountBefore} → {model.union.componentCountAfter}
                </span>
              </div>
            ) : current ? (
              <div className="mst-roots" data-testid="kruskal-current-roots">
                <span>{t('kruskalRootsLabel')}</span>
                <code>{model.parent.find((row) => row.nodeId === current.fromId)?.rootId}</code>
                <span>/</span>
                <code>{model.parent.find((row) => row.nodeId === current.toId)?.rootId}</code>
              </div>
            ) : (
              <p className="mst-empty-inline">{t('kruskalNoUnion')}</p>
            )}

            <div className="mst-components" data-testid="kruskal-components">
              {model.components.map((component) => (
                <span
                  className={`mst-component-chip group-${component.index % 5}`}
                  key={component.rootId}
                  data-testid="kruskal-component"
                  data-root={component.rootId}
                  data-size={component.size}
                >
                  <b>{component.rootId}</b>
                  <small>{component.nodeIds.join(' ')}</small>
                </span>
              ))}
            </div>

            <div className="mst-parent-table-wrap">
              <table className="mst-parent-table">
                <thead>
                  <tr>
                    <th>{t('kruskalNodeLabel')}</th>
                    <th>{t('kruskalParentLabel')}</th>
                    <th>{t('kruskalRankLabel')}</th>
                    <th>{t('kruskalRootLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {model.parent.map((row) => (
                    <tr
                      key={row.nodeId}
                      data-testid="kruskal-parent-row"
                      data-node-id={row.nodeId}
                      data-parent={row.parentId}
                      data-root={row.rootId}
                      data-rank={row.rank}
                    >
                      <td>{row.nodeId}</td>
                      <td>{row.parentId}{row.root ? ' ★' : ''}</td>
                      <td>{row.rank}</td>
                      <td><code>{row.rootId}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </aside>
      </div>

      <KruskalResult model={model} />
    </article>
  );
}
