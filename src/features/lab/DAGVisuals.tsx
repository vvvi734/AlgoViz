/**
 * G3 presentation for Kahn topological sort and AOE critical path.
 *
 * Both views paint the SAME frame model as the playback. There is no local
 * playhead, interval or message parsing. Topological sort adds an indegree
 * table + FIFO queue; AOE adds ve/vl, activity slack and every critical path.
 */
import { useI18n } from '../../i18n/I18nProvider';
import type {
  CriticalActivityVisual,
  CriticalEdgeVisual,
  CriticalNodeVisual,
  CriticalVisualModel,
  TopologicalEdgeVisual,
  TopologicalNodeVisual,
  TopologicalVisualModel,
} from '../../domain/visualization/dagModel';

function numberText(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function edgeName(fromId: string, toId: string): string {
  return `${fromId}→${toId}`;
}

function PathText({ path }: { path: string[] }) {
  return <>{path.join(' → ')}</>;
}

function Legend({ states }: { states: Array<{ state: string; label: string }> }) {
  return (
    <div className="mst-legend g3-legend" aria-label="directed edge state legend">
      {states.map((item) => (
        <span className="mst-legend-item" key={item.state} data-state={item.state}>
          <i className={`mst-legend-line is-${item.state}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function TopoGraph({ model }: { model: TopologicalVisualModel }) {
  return (
    <div className="mst-graph-scroll">
      <svg
        className="mst-graph-svg g3-graph-svg topo-graph-svg"
        viewBox={`0 0 ${model.width} ${model.height}`}
        role="img"
        aria-label="Kahn topological sort directed graph"
        data-testid="topo-graph-svg"
        data-node-count={model.nodes.length}
        data-edge-count={model.edges.length}
      >
        <defs>
          <marker id="g3-topo-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="g3-arrow-head" />
          </marker>
        </defs>
        <g className="mst-edges">
          {model.edges.map((edge: TopologicalEdgeVisual) => (
            <g
              key={edge.id}
              data-testid="topo-edge"
              data-edge-id={edge.id}
              data-state={edge.state}
              data-current={edge.current ? 'true' : 'false'}
              data-removed={edge.removed ? 'true' : 'false'}
            >
              <line
                className={`mst-edge g3-directed-edge is-${edge.state}${edge.current ? ' is-current' : ''}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                markerEnd="url(#g3-topo-arrow)"
              />
            </g>
          ))}
        </g>
        <g className="mst-nodes">
          {model.nodes.map((node: TopologicalNodeVisual) => (
            <g
              key={node.id}
              className={`mst-node g3-node${node.current ? ' is-current' : ''}${node.inQueue ? ' is-queued' : ''}${
                node.processed ? ' is-processed' : ''
              }${node.cycle ? ' is-cycle' : ''}`}
              transform={`translate(${node.x}, ${node.y})`}
              data-testid="topo-node"
              data-node-id={node.id}
              data-indegree={node.indegree}
              data-in-queue={node.inQueue ? 'true' : 'false'}
              data-processed={node.processed ? 'true' : 'false'}
              data-cycle={node.cycle ? 'true' : 'false'}
            >
              <circle className="mst-node-ring" r={model.nodeRadius + 4} />
              <circle className="mst-node-body" r={model.nodeRadius} />
              <text className="mst-node-label" textAnchor="middle" y="3">{node.label}</text>
              <g className="g3-indegree-badge" transform={`translate(${model.nodeRadius - 2}, ${-model.nodeRadius + 2})`}>
                <circle r="10" />
                <text textAnchor="middle" y="4">{node.indegree}</text>
              </g>
              {node.source && <text className="g3-node-role" textAnchor="middle" y={-model.nodeRadius - 11}>S</text>}
              {node.sink && <text className="g3-node-role is-sink" textAnchor="middle" y={model.nodeRadius + 17}>T</text>}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export function TopologicalSortVisual({
  model,
  operationText,
  hint,
}: {
  model: TopologicalVisualModel;
  operationText: string;
  hint: string;
}) {
  const { t } = useI18n();
  const currentEdge = model.currentEdgeId ? model.edges.find((edge) => edge.id === model.currentEdgeId) : null;
  if (model.empty) {
    return <p className="mst-empty" data-testid="topo-empty">{t('dagEmpty')}</p>;
  }
  return (
    <article
      className="mst-stage g3-stage topo-stage"
      data-testid="topo-stage"
      data-operation={model.operation}
      data-cycle={model.hasCycle ? 'true' : 'false'}
    >
      <header className="mst-head">
        <div>
          <div className="eyebrow">{t('dagKicker')}</div>
          <h2>{t('topoTitle')}</h2>
          <p className="mst-subtitle">{operationText}</p>
        </div>
        <div className="mst-metrics">
          <div className="mst-metric">
            <span>{t('topoOrderCount')}</span>
            <b>{model.topologicalOrder.length}/{model.nodes.length}</b>
          </div>
          <div className="mst-metric">
            <span>{t('topoQueueSize')}</span>
            <b>{model.queue.length}</b>
          </div>
          <div className="mst-metric">
            <span>{t('topoCycleLabel')}</span>
            <b data-testid="topo-cycle-value">{model.hasCycle ? t('topoCycleYes') : t('topoCycleNo')}</b>
          </div>
        </div>
      </header>

      <div className="mst-layout g3-layout">
        <section className="mst-graph-card">
          <div className="mst-card-head">
            <b>{t('topoGraphTitle')}</b>
            <span className="tag green">{t('dagDirectedBadge')}</span>
          </div>
          <Legend
            states={[
              { state: 'idle', label: t('topoEdgeIdle') },
              { state: 'current', label: t('topoEdgeCurrent') },
              { state: 'removed', label: t('topoEdgeRemoved') },
            ]}
          />
          <TopoGraph model={model} />
          <div className="mst-current-strip" data-testid="topo-current">
            <span className="mst-strip-label">{t('topoCurrentLabel')}</span>
            {currentEdge ? (
              <>
                <code>{edgeName(currentEdge.fromId, currentEdge.toId)}</code>
                {model.indegreeChange && (
                  <span className="g3-change-pill" data-testid="topo-indegree-change">
                    {model.indegreeChange.nodeId}: {model.indegreeChange.before} → {model.indegreeChange.after}
                  </span>
                )}
              </>
            ) : model.currentNodeId ? (
              <>
                <code>{model.currentNodeId}</code>
                {model.operation === 'dequeue' && <span className="g3-change-pill">{t('topoDequeuedBadge')}</span>}
                {model.operation === 'enqueue-node' && <span className="g3-change-pill">{t('topoEnqueuedBadge')}</span>}
              </>
            ) : (
              <span className="muted">{t('topoNoCurrent')}</span>
            )}
          </div>
          <p className="mst-hint">{hint}</p>
        </section>

        <aside className="mst-side g3-side">
          <section className="mst-panel" data-testid="topo-indegree-panel">
            <header className="mst-panel-head">
              <b>{t('topoIndegreeTitle')}</b>
              <small>{t('topoIndegreeNote')}</small>
            </header>
            <div className="g3-table-wrap">
              <table className="g3-table">
                <thead>
                  <tr>
                    <th>{t('dagVertex')}</th>
                    <th>{t('topoIndegreeColumn')}</th>
                    <th>{t('topoStateColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {model.nodes.map((node) => (
                    <tr
                      key={node.id}
                      data-testid="topo-indegree-row"
                      data-node-id={node.id}
                      data-indegree={node.indegree}
                      className={node.current ? 'is-current' : node.cycle ? 'is-cycle' : ''}
                    >
                      <td><code>{node.label}</code>{node.source ? ' S' : ''}{node.sink ? ' T' : ''}</td>
                      <td><b>{node.indegree}</b></td>
                      <td>
                        {node.cycle ? t('topoCannotResolve') :
                          node.current ? t('topoProcessing') :
                          node.processed ? t('topoProcessed') :
                          node.inQueue ? t('topoInQueue') : t('topoWaiting')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mst-panel" data-testid="topo-queue-panel">
            <header className="mst-panel-head">
              <b>{t('topoQueueTitle')}</b>
              <small>{t('topoQueueNote')}</small>
            </header>
            <div className="g3-queue" data-testid="topo-queue">
              {model.queue.length ? model.queue.map((item, index) => (
                <span
                  key={item.id}
                  className={`g3-queue-chip${item.added ? ' is-added' : ''}`}
                  data-testid="topo-queue-item"
                  data-entry-id={item.id}
                  data-node-id={item.nodeId}
                >
                  <small>{index === 0 ? t('topoQueueFront') : `#${index + 1}`}</small>
                  <code>{item.label}</code>
                </span>
              )) : <span className="mst-empty-inline" data-testid="topo-queue-empty">{t('topoQueueEmpty')}</span>}
            </div>
            {(model.queueAdded || model.queueRemoved) && (
              <footer className="g3-queue-change">
                {model.queueAdded && <span className="is-added">+ {model.queueAdded.label}</span>}
                {model.queueRemoved && <span className="is-removed">− {model.queueRemoved.label}</span>}
              </footer>
            )}
          </section>

          <section className="mst-panel" data-testid="topo-order-panel">
            <header className="mst-panel-head">
              <b>{t('topoOrderTitle')}</b>
              <small>{t('topoOrderNote')}</small>
            </header>
            <div className="g3-order" data-testid="topo-order">
              {model.topologicalOrder.length ? model.topologicalOrder.map((node, index) => (
                <span className="g3-order-chip" key={`${node}-${index}`} data-testid="topo-order-chip" data-node-id={node}>
                  <small>{index + 1}</small>
                  <code>{node}</code>
                </span>
              )) : <span className="mst-empty-inline">{t('topoOrderEmpty')}</span>}
            </div>
          </section>
        </aside>
      </div>

      <footer className={`mst-result${model.hasCycle ? ' is-forest' : ''}`} data-testid="topo-result">
        <span className="mst-result-kicker">{model.done ? t('mstResultDone') : t('mstResultRunning')}</span>
        {model.hasCycle ? (
          <>
            <strong data-testid="topo-cycle-alert">{t('topoCycleWarning')}</strong>
            <span>{t('topoCycleNodes')}: {model.cycleNodeIds.join(' ') || '—'}</span>
          </>
        ) : (
          <>
            <strong data-testid="topo-final-order">
              {t('topoFinalOrder')}: {model.topologicalOrder.join(' → ') || '—'}
            </strong>
            <span>{t('topoOrderCount')}: {model.topologicalOrder.length}/{model.nodes.length}</span>
            {model.done && <span className="mst-tree-badge">{t('topoValidBadge')}</span>}
          </>
        )}
      </footer>
    </article>
  );
}

function CriticalGraph({ model }: { model: CriticalVisualModel }) {
  return (
    <div className="mst-graph-scroll">
      <svg
        className="mst-graph-svg g3-graph-svg critical-graph-svg"
        viewBox={`0 0 ${model.width} ${model.height}`}
        role="img"
        aria-label="AOE activity-on-edge network"
        data-testid="critical-graph-svg"
        data-node-count={model.nodes.length}
        data-edge-count={model.edges.length}
      >
        <defs>
          <marker id="g3-critical-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="g3-arrow-head" />
          </marker>
        </defs>
        <g className="mst-edges">
          {model.edges.map((edge: CriticalEdgeVisual) => {
            const midX = (edge.x1 + edge.x2) / 2;
            const midY = (edge.y1 + edge.y2) / 2;
            return (
              <g
                key={edge.id}
                data-testid="critical-edge"
                data-edge-id={edge.id}
                data-state={edge.state}
                data-critical={edge.critical ? 'true' : 'false'}
                data-on-path={edge.onPath ? 'true' : 'false'}
                data-duration={edge.duration}
              >
                <line
                  className={`mst-edge g3-directed-edge is-${edge.state}${edge.current ? ' is-current' : ''}`}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  markerEnd="url(#g3-critical-arrow)"
                />
                <g className={`mst-edge-weight is-${edge.state}`} transform={`translate(${midX}, ${midY})`}>
                  <rect x="-17" y="-9" width="34" height="18" rx="5" />
                  <text textAnchor="middle" y="3.5">{numberText(edge.duration)}</text>
                </g>
              </g>
            );
          })}
        </g>
        <g className="mst-nodes">
          {model.nodes.map((node: CriticalNodeVisual) => (
            <g
              key={node.id}
              className={`mst-node g3-node${node.current ? ' is-current' : ''}${node.inTopo ? ' is-processed' : ''}${
                node.cycle ? ' is-cycle' : ''
              }`}
              transform={`translate(${node.x}, ${node.y})`}
              data-testid="critical-node"
              data-node-id={node.id}
              data-ve={node.ve ?? ''}
              data-vl={node.vl ?? ''}
              data-current={node.current ? 'true' : 'false'}
            >
              <circle className="mst-node-ring" r={model.nodeRadius + 4} />
              <circle className="mst-node-body" r={model.nodeRadius} />
              <text className="mst-node-label" textAnchor="middle" y="3">{node.label}</text>
              {node.source && <text className="g3-node-role" textAnchor="middle" y={-model.nodeRadius - 11}>S</text>}
              {node.sink && <text className="g3-node-role is-sink" textAnchor="middle" y={model.nodeRadius + 17}>T</text>}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function phaseLabel(phase: CriticalVisualModel['phase'], t: (key: string) => string): string {
  const keys: Record<CriticalVisualModel['phase'], string> = {
    init: 'criticalPhaseInit',
    topo: 'criticalPhaseTopo',
    ve: 'criticalPhaseVe',
    vl: 'criticalPhaseVl',
    activity: 'criticalPhaseActivity',
    cycle: 'criticalPhaseCycle',
    done: 'criticalPhaseDone',
  };
  return t(keys[phase]);
}

function activityState(row: CriticalActivityVisual, t: (key: string) => string): string {
  if (row.e === null || row.l === null || row.slack === null) return t('criticalNotComputed');
  return row.critical ? t('criticalZeroSlack') : t('criticalPositiveSlack');
}

export function CriticalPathVisual({
  model,
  operationText,
  hint,
}: {
  model: CriticalVisualModel;
  operationText: string;
  hint: string;
}) {
  const { t } = useI18n();
  const currentEdge = model.currentEdgeId ? model.edges.find((edge) => edge.id === model.currentEdgeId) : null;
  const currentActivity = currentEdge?.activity ?? null;
  const currentEvent = model.currentNodeId ? model.nodes.find((node) => node.id === model.currentNodeId) : null;
  if (model.empty) {
    return <p className="mst-empty" data-testid="critical-empty">{t('dagEmpty')}</p>;
  }
  return (
    <article
      className="mst-stage g3-stage critical-stage"
      data-testid="critical-stage"
      data-operation={model.operation}
      data-phase={model.phase}
      data-cycle={model.hasCycle ? 'true' : 'false'}
    >
      <header className="mst-head">
        <div>
          <div className="eyebrow">{t('dagKicker')}</div>
          <h2>{t('criticalTitle')}</h2>
          <p className="mst-subtitle">{operationText}</p>
        </div>
        <div className="mst-metrics">
          <div className="mst-metric">
            <span>{t('criticalDurationLabel')}</span>
            <b data-testid="critical-duration">{numberText(model.projectDuration)}</b>
          </div>
          <div className="mst-metric">
            <span>{t('criticalActivitiesLabel')}</span>
            <b>{model.criticalEdgeIds.length}/{model.edges.length}</b>
          </div>
          <div className="mst-metric">
            <span>{t('criticalPathsLabel')}</span>
            <b data-testid="critical-path-count">{model.criticalPaths.length}</b>
          </div>
        </div>
      </header>

      <div className="mst-layout g3-layout">
        <section className="mst-graph-card">
          <div className="mst-card-head">
            <b>{t('criticalGraphTitle')}</b>
            <span className="tag green">{t('criticalAoeBadge')}</span>
          </div>
          <Legend
            states={[
              { state: 'idle', label: t('criticalEdgeIdle') },
              { state: 'current', label: t('criticalEdgeCurrent') },
              { state: 'critical', label: t('criticalEdgeCritical') },
              { state: 'slack', label: t('criticalEdgeSlack') },
              { state: 'path', label: t('criticalEdgePath') },
            ]}
          />
          <CriticalGraph model={model} />
          <div className="mst-current-strip" data-testid="critical-current">
            <span className="mst-strip-label">{t('criticalCurrentLabel')}</span>
            {currentActivity ? (
              <>
                <code>{edgeName(currentActivity.fromId, currentActivity.toId)}</code>
                <span className="mst-weight-pill">e={numberText(currentActivity.e)}</span>
                <span className="mst-weight-pill">l={numberText(currentActivity.l)}</span>
                <span className="g3-change-pill">l−e={numberText(currentActivity.slack)}</span>
              </>
            ) : currentEvent ? (
              <>
                <code>{currentEvent.label}</code>
                <span className="mst-weight-pill">ve={numberText(currentEvent.ve)}</span>
                <span className="mst-weight-pill">vl={numberText(currentEvent.vl)}</span>
                {model.timeChange && (
                  <span className="g3-change-pill" data-testid="critical-time-change">
                    {model.timeChange.nodeId}: {numberText(model.timeChange.previousTime)} → {numberText(model.timeChange.newTime)}
                  </span>
                )}
              </>
            ) : (
              <span className="muted">{t('criticalNoCurrent')}</span>
            )}
          </div>
          <p className="mst-hint">{hint}</p>
        </section>

        <aside className="mst-side g3-side">
          <section className="mst-panel" data-testid="critical-phase-panel">
            <header className="mst-panel-head">
              <b>{t('criticalPhaseTitle')}</b>
              <small>{t('criticalPhaseNote')}</small>
            </header>
            <div className="g3-phase-track">
              {(['topo', 've', 'vl', 'activity'] as const).map((phase) => (
                <span
                  key={phase}
                  className={`g3-phase${model.phase === phase ? ' is-active' : ''}`}
                  data-testid="critical-phase-step"
                  data-phase={phase}
                  data-active={model.phase === phase ? 'true' : 'false'}
                >
                  {phaseLabel(phase, t)}
                </span>
              ))}
            </div>
            <p className="g3-phase-current" data-testid="critical-phase-current">{phaseLabel(model.phase, t)}</p>
          </section>

          <section className="mst-panel" data-testid="critical-event-panel">
            <header className="mst-panel-head">
              <b>{t('criticalEventTitle')}</b>
              <small>{t('criticalEventNote')}</small>
            </header>
            <div className="g3-table-wrap">
              <table className="g3-table g3-event-table">
                <thead>
                  <tr>
                    <th>{t('dagEvent')}</th>
                    <th>{t('criticalVeColumn')}</th>
                    <th>{t('criticalVlColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {model.nodes.map((node) => (
                    <tr
                      key={node.id}
                      data-testid="critical-event-row"
                      data-node-id={node.id}
                      data-ve={node.ve ?? ''}
                      data-vl={node.vl ?? ''}
                      className={node.current ? 'is-current' : ''}
                    >
                      <td><code>{node.label}</code>{node.source ? ' S' : ''}{node.sink ? ' T' : ''}</td>
                      <td><b>{numberText(node.ve)}</b></td>
                      <td><b>{numberText(node.vl)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mst-panel" data-testid="critical-activity-panel">
            <header className="mst-panel-head">
              <b>{t('criticalActivityTitle')}</b>
              <small>{t('criticalActivityNote')}</small>
            </header>
            <div className="g3-table-wrap">
              <table className="g3-table g3-activity-table">
                <thead>
                  <tr>
                    <th>{t('criticalActivityColumn')}</th>
                    <th>{t('criticalDurationColumn')}</th>
                    <th>e</th>
                    <th>l</th>
                    <th>l−e</th>
                    <th>{t('criticalStatusColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {model.activities.map((row) => (
                    <tr
                      key={row.edgeId}
                      data-testid="critical-activity-row"
                      data-edge-id={row.edgeId}
                      data-slack={row.slack ?? ''}
                      data-critical={row.critical ? 'true' : 'false'}
                      className={`${row.critical ? 'is-critical' : ''}${row.current ? ' is-current' : ''}`}
                    >
                      <td><code>{edgeName(row.fromId, row.toId)}</code></td>
                      <td>{numberText(row.duration)}</td>
                      <td>{numberText(row.e)}</td>
                      <td>{numberText(row.l)}</td>
                      <td><b>{numberText(row.slack)}</b></td>
                      <td>{activityState(row, t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mst-panel" data-testid="critical-paths-panel">
            <header className="mst-panel-head">
              <b>{t('criticalPathsTitle')}</b>
              <small>{t('criticalPathsNote')}</small>
            </header>
            {model.criticalPaths.length ? (
              <ol className="g3-paths">
                {model.criticalPaths.map((path, index) => (
                  <li key={path.join('>')} data-testid="critical-path-item" data-path={path.join('>')}>
                    <span>{index + 1}</span>
                    <code><PathText path={path} /></code>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mst-empty-inline" data-testid="critical-paths-empty">{t('criticalPathsEmpty')}</p>
            )}
            {model.hasCycle && <p className="g3-cycle-note">{t('criticalCycleWarning')}</p>}
          </section>
        </aside>
      </div>

      <footer className={`mst-result${model.hasCycle ? ' is-forest' : ''}`} data-testid="critical-result">
        <span className="mst-result-kicker">{model.done ? t('mstResultDone') : t('mstResultRunning')}</span>
        {model.hasCycle ? (
          <>
            <strong>{t('criticalNoMst')}</strong>
            <span>{t('topoCycleNodes')}: {model.cycleNodeIds.join(' ') || '—'}</span>
          </>
        ) : (
          <>
            <strong>{t('criticalDurationLabel')}: {numberText(model.projectDuration)}</strong>
            <span>{t('criticalCriticalCount')}: {model.criticalEdgeIds.length}</span>
            <span>{t('criticalPathsLabel')}: {model.criticalPaths.length}</span>
            {model.done && <span className="mst-tree-badge">{t('criticalLongestBadge')}</span>}
          </>
        )}
      </footer>
    </article>
  );
}
