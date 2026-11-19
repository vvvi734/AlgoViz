/**
 * G4 presentation for connected components and Kosaraju SCC.
 *
 * The graph canvas, group tables and stack are all read from the current frame
 * model. Neither view keeps its own playhead or reconstructs algorithm state
 * from messages. Component identity is always printed as `C1`, `C2`, ... in
 * addition to colour, so colour is never the only carrier of meaning.
 */
import { useI18n } from '../../i18n/I18nProvider';
import type { CSSProperties } from 'react';
import type {
  ComponentEdgeVisual,
  ComponentGraphNodeVisual,
  ComponentGroupVisual,
  ComponentNodeState,
  ConnectedComponentsVisualModel,
  SccVisualModel,
} from '../../domain/visualization/componentsModel';

function stateKey(state: ComponentNodeState): string {
  switch (state) {
    case 'undiscovered': return 'g4StateUndiscovered';
    case 'discovered': return 'g4StateDiscovered';
    case 'visited': return 'g4StateVisited';
    case 'finished': return 'g4StateFinished';
    case 'assigned': return 'g4StateAssigned';
    default: return 'g4StateUndiscovered';
  }
}

function componentBadge(id: number | null): string {
  return id === null ? '—' : `C${id}`;
}

function groupStyle(id: number): CSSProperties {
  return { '--g4-component': `var(--g4-c${((id - 1) % 6) + 1})` } as CSSProperties;
}

function GroupChips({ group }: { group: ComponentGroupVisual }) {
  return (
    <span className="g4-group-chips">
      {group.nodeIds.map((nodeId) => (
        <code key={nodeId} className="g4-node-chip" style={groupStyle(group.id)}>{nodeId}</code>
      ))}
    </span>
  );
}

function NodeShape({
  node,
  radius,
  showStackLabel = true,
  rootLabel = 'ROOT',
}: {
  node: ComponentGraphNodeVisual;
  radius: number;
  showStackLabel?: boolean;
  rootLabel?: string;
}) {
  return (
    <g
      className={`mst-node g4-node is-${node.state}${node.current ? ' is-current' : ''}${node.start ? ' is-start' : ''}${
        node.inFrontier ? ' is-on-stack' : ''
      }`}
      transform={`translate(${node.x}, ${node.y})`}
      data-testid="g4-node"
      data-node-id={node.id}
      data-state={node.state}
      data-component-id={node.componentId ?? ''}
      data-current={node.current ? 'true' : 'false'}
      data-start={node.start ? 'true' : 'false'}
      data-in-frontier={node.inFrontier ? 'true' : 'false'}
      data-finish-index={node.finishIndex ?? ''}
      style={node.componentId === null ? undefined : groupStyle(node.componentId)}
    >
      <circle className="mst-node-ring" r={radius + 4} />
      <circle className="mst-node-body" r={radius} />
      <text className="mst-node-label" textAnchor="middle" y="3">{node.label}</text>
      {node.componentId !== null && (
        <g className="g4-component-badge" transform={`translate(${radius - 8}, ${-radius + 2})`}>
          <circle r="11" />
          <text textAnchor="middle" y="4">{`C${node.componentId}`}</text>
        </g>
      )}
      {node.finishIndex !== null && (
        <g className="g4-finish-badge" transform={`translate(${-radius + 2}, ${-radius + 2})`}>
          <circle r="10" />
          <text textAnchor="middle" y="4">{node.finishIndex}</text>
        </g>
      )}
      {node.start && <text className="g4-node-role" textAnchor="middle" y={-radius - 12}>{rootLabel}</text>}
      {showStackLabel && node.inFrontier && (
        <text className="g4-node-role is-stack" textAnchor="middle" y={radius + 18}>STACK</text>
      )}
    </g>
  );
}

function EdgeLines({
  edges,
  directed,
  markerId,
  testId,
}: {
  edges: ComponentEdgeVisual[];
  directed: boolean;
  markerId?: string;
  testId: string;
}) {
  return (
    <g className="mst-edges">
      {edges.map((edge) => (
        <g
          key={edge.id}
          data-testid={testId}
          data-edge-id={edge.id}
          data-state={edge.state}
          data-reversed={edge.reversed ? 'true' : 'false'}
          data-from={edge.fromId}
          data-to={edge.toId}
        >
          <line
            className={`mst-edge g4-edge is-${edge.state}${edge.reversed ? ' is-reversed' : ''}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            markerEnd={directed && markerId ? `url(#${markerId})` : undefined}
          />
        </g>
      ))}
    </g>
  );
}

function StackPanel({
  model,
  title,
}: {
  model: ConnectedComponentsVisualModel | SccVisualModel;
  title: string;
}) {
  const { t } = useI18n();
  return (
    <section className="mst-panel" data-testid="g4-stack-panel">
      <header className="mst-panel-head">
        <b>{title}</b>
        <small>{t('g4StackNote')}</small>
      </header>
      <div className="g4-stack" data-testid="g4-stack">
        {model.frontierItems.length ? model.frontierItems.map((item, index) => (
          <span
            key={item.id}
            className={`g4-stack-chip${item.added ? ' is-added' : ''}`}
            data-testid="g4-stack-item"
            data-entry-id={item.id}
            data-node-id={item.nodeId}
          >
            <small>{index === model.frontierItems.length - 1 ? t('g4StackTop') : `#${index + 1}`}</small>
            <code>{item.label}</code>
          </span>
        )) : <span className="mst-empty-inline" data-testid="g4-stack-empty">{t('g4StackEmpty')}</span>}
      </div>
      {(model.frontierAdded || model.frontierRemoved) && (
        <footer className="g4-stack-change">
          {model.frontierAdded && <span className="is-added">+ {model.frontierAdded.label}</span>}
          {model.frontierRemoved && <span className="is-removed">− {model.frontierRemoved.label}</span>}
        </footer>
      )}
    </section>
  );
}

function ComponentRow({ group }: { group: ComponentGroupVisual }) {
  const { t } = useI18n();
  return (
    <div
      className={`g4-component-row${group.current ? ' is-current' : ''}${group.complete ? ' is-complete' : ''}`}
      data-testid="g4-component-row"
      data-component-id={group.id}
      data-complete={group.complete ? 'true' : 'false'}
      style={groupStyle(group.id)}
    >
      <span className="g4-component-id">C{group.id}</span>
      <GroupChips group={group} />
      <span className="g4-component-state">
        {group.complete ? t('g4Complete') : group.current ? t('g4Current') : t('g4Pending')}
      </span>
    </div>
  );
}

function ComponentGroupPanel({
  groups,
  count,
}: {
  groups: ComponentGroupVisual[];
  count: number;
}) {
  const { t } = useI18n();
  return (
    <section className="mst-panel" data-testid="g4-component-panel">
      <header className="mst-panel-head">
        <b>{t('g4ComponentsTitle')}</b>
        <small>{t('g4ComponentsNote')}</small>
      </header>
      <div className="g4-component-list">
        {groups.length ? groups.map((group) => <ComponentRow key={group.id} group={group} />)
          : <span className="mst-empty-inline" data-testid="g4-component-empty">{t('g4ComponentsEmpty')}</span>}
      </div>
      <footer className="g4-panel-footer" data-testid="g4-component-count">
        {t('g4CountLabel')}: <b>{count}</b>
      </footer>
    </section>
  );
}

function NodeStateTable({
  nodes,
  title,
}: {
  nodes: ComponentGraphNodeVisual[];
  title: string;
}) {
  const { t } = useI18n();
  return (
    <section className="mst-panel" data-testid="g4-node-state-panel">
      <header className="mst-panel-head">
        <b>{title}</b>
        <small>{t('g4StateNote')}</small>
      </header>
      <div className="g4-table-wrap">
        <table className="g3-table g4-table">
          <thead>
            <tr>
              <th>{t('dagVertex')}</th>
              <th>{t('g4ComponentColumn')}</th>
              <th>{t('g4StateColumn')}</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr
                key={node.id}
                className={node.current ? 'is-current' : ''}
                data-testid="g4-node-row"
                data-node-id={node.id}
                data-state={node.state}
                data-component-id={node.componentId ?? ''}
              >
                <td><code>{node.label}</code>{node.start && <small className="g4-row-mark"> ROOT</small>}</td>
                <td style={node.componentId === null ? undefined : groupStyle(node.componentId)}>
                  {node.componentId === null ? '—' : <span className="g4-inline-component">C{node.componentId}</span>}
                </td>
                <td>{t(stateKey(node.state))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ConnectedComponentsVisual({
  model,
  operationText,
  hint,
}: {
  model: ConnectedComponentsVisualModel;
  operationText: string;
  hint: string;
}) {
  const { t } = useI18n();
  if (model.empty) return <p className="mst-empty" data-testid="g4-empty">{t('g4Empty')}</p>;
  return (
    <article className="mst-stage g4-stage cc-stage" data-testid="cc-stage" data-operation={model.operation}>
      <header className="mst-head">
        <div>
          <div className="eyebrow">{t('g4Kicker')}</div>
          <h2>{t('ccTitle')}</h2>
          <p className="mst-subtitle">{operationText}</p>
        </div>
        <div className="mst-metrics">
          <div className="mst-metric"><span>{t('g4ComponentsTitle')}</span><b>{model.componentCount}</b></div>
          <div className="mst-metric"><span>{t('g4DiscoveredLabel')}</span><b>{model.discoveredIds.length}/{model.nodes.length}</b></div>
          <div className="mst-metric"><span>{t('g4VisitedLabel')}</span><b>{model.visitedIds.length}/{model.nodes.length}</b></div>
        </div>
      </header>

      <div className="mst-layout g4-layout">
        <section className="mst-graph-card">
          <div className="mst-card-head">
            <b>{t('ccGraphTitle')}</b>
            <span className="tag green">{t('ccUndirectedBadge')}</span>
          </div>
          <div className="mst-graph-scroll">
            <svg
              className="mst-graph-svg g4-graph-svg cc-graph-svg"
              viewBox={`0 0 ${model.width} ${model.height}`}
              role="img"
              aria-label="undirected connected components graph"
              data-testid="cc-graph-svg"
              data-node-count={model.nodes.length}
              data-edge-count={model.edges.length}
            >
              <EdgeLines edges={model.edges} directed={false} testId="cc-edge" />
              <g className="mst-nodes">
                {model.nodes.map((node) => <NodeShape key={node.id} node={node} radius={model.nodeRadius} />)}
              </g>
            </svg>
          </div>
          <div className="mst-current-strip" data-testid="cc-current">
            <span className="mst-strip-label">{t('g4CurrentLabel')}</span>
            {model.currentNodeId ? <code>{model.currentNodeId}</code> : <span className="muted">{t('g4NoCurrent')}</span>}
            {model.currentComponentId !== null && <span className="g4-change-pill">{t('g4ComponentBadge')} {componentBadge(model.currentComponentId)}</span>}
            {model.currentEdgeId && <span className="g4-change-pill">{t('g4InspectEdge')}: {model.currentEdgeId}</span>}
            {model.neighborNodeId && <span className="g4-change-pill">{t('g4Neighbor')}: {model.neighborNodeId}</span>}
          </div>
          <p className="mst-hint">{hint}</p>
        </section>

        <aside className="mst-side g4-side">
          <ComponentGroupPanel groups={model.components} count={model.componentCount} />
          <StackPanel model={model} title={t('g4StackTitle')} />
          <NodeStateTable nodes={model.nodes} title={t('g4NodeStateTitle')} />
        </aside>
      </div>

      <footer className="mst-result" data-testid="cc-result">
        <span className="mst-result-kicker">{model.done ? t('mstResultDone') : t('mstResultRunning')}</span>
        <strong>{t('g4FinalGroups')}: {model.components.map((group) => `C${group.id}={${group.nodeIds.join(',')}}`).join(' ')}</strong>
        <span>{t('g4ComponentsTitle')}: {model.componentCount}</span>
        {model.done && <span className="mst-tree-badge">{t('g4CompleteBadge')}</span>}
      </footer>
    </article>
  );
}

function SccOrderBlock({
  nodes,
  label,
  testId,
  activeIndex = null,
}: {
  nodes: string[];
  label: string;
  testId: string;
  activeIndex?: number | null;
}) {
  const { t } = useI18n();
  return (
    <div className="scc-key-order">
      <div className="scc-key-label">
        <span>{label}</span>
        {activeIndex !== null && <em>#{activeIndex + 1}</em>}
      </div>
      <div className="g4-order">
        {nodes.length ? nodes.map((node, index) => (
          <span
            key={`${node}-${index}`}
            className={`g4-order-chip${activeIndex === index ? ' is-current' : ''}`}
            data-testid={testId}
            data-node-id={node}
          >
            <small>{index + 1}</small><code>{node}</code>
          </span>
        )) : <span className="mst-empty-inline">{t('sccOrderEmpty')}</span>}
      </div>
    </div>
  );
}

function SccStackBlock({ model }: { model: SccVisualModel }) {
  const { t } = useI18n();
  return (
    <div className="scc-key-order" data-testid="g4-stack-panel">
      <div className="scc-key-label">
        <span>{t('g4StackTitle')}</span>
        <em>{model.frontierItems.length}</em>
      </div>
      <div className="g4-stack scc-stack" data-testid="g4-stack">
        {model.frontierItems.length ? model.frontierItems.map((item, index) => (
          <span
            key={item.id}
            className={`g4-stack-chip${item.added ? ' is-added' : ''}`}
            data-testid="g4-stack-item"
            data-entry-id={item.id}
            data-node-id={item.nodeId}
          >
            <small>{index === model.frontierItems.length - 1 ? t('g4StackTop') : `#${index + 1}`}</small>
            <code>{item.label}</code>
          </span>
        )) : <span className="mst-empty-inline" data-testid="g4-stack-empty">{t('g4StackEmpty')}</span>}
      </div>
    </div>
  );
}

function SccFinalGroups({ model }: { model: SccVisualModel }) {
  const { t } = useI18n();
  return (
    <footer className="scc-final" data-testid="scc-result">
      <header className="scc-final-head">
        <strong>{t('g4FinalGroups')}</strong>
        <span>{t('sccComponentsTitle')}</span>
        <span data-testid="g4-component-count">{t('g4CountLabel')}: <b>{model.componentCount}</b></span>
        <span className="mst-tree-badge">{t('g4CompleteBadge')}</span>
      </header>
      <div className="scc-final-grid">
        {model.components.map((group) => <ComponentRow key={group.id} group={group} />)}
      </div>
    </footer>
  );
}

function SccKeyRail({ model }: { model: SccVisualModel }) {
  const { t } = useI18n();
  const phaseLabel = t(`g4Phase_${model.phase}` as 'g4Phase_first-pass');
  const phaseNote = t(`sccPhaseNote_${model.phase}` as 'sccPhaseNote_first-pass');
  const latestGroup = model.components.at(-1) ?? null;
  return (
    <aside className="mst-side g4-side scc-side" data-testid="scc-side">
      <section className="scc-key-panel">
        <header className="scc-key-head">
          <b>{t('sccKeyVariables')}</b>
          <span className={`scc-key-phase is-${model.phase}`}>{phaseLabel}</span>
        </header>
        <div className="scc-key-grid">
          <div className="scc-key-metric">
            <small>{t('graphCurrentNode')}</small>
            <b>{model.currentNodeId ?? '—'}</b>
          </div>
          <div className="scc-key-metric">
            <small>{t('sccStackDepth')}</small>
            <b>{model.frontierItems.length}</b>
          </div>
          <div className="scc-key-metric">
            <small>{t('sccFinishProgress')}</small>
            <b>{model.finishOrder.length}/{model.nodes.length}</b>
          </div>
          <div className="scc-key-metric">
            <small>{t('g4SccCount')}</small>
            <b>{model.componentCount}</b>
          </div>
        </div>
        <p className="scc-phase-note" data-testid="scc-phase-note">{phaseNote}</p>

        {model.phase === 'first-pass' && (
          <>
            <SccOrderBlock nodes={model.finishOrder} label={t('sccFirstOrder')} testId="scc-finish-chip" />
            <SccStackBlock model={model} />
            {model.components.length === 0 && (
              <p className="scc-empty" data-testid="g4-component-empty">{t('g4ComponentsEmpty')}</p>
            )}
          </>
        )}

        {model.phase === 'reverse' && (
          <>
            <SccOrderBlock nodes={model.finishOrder} label={t('sccFirstOrder')} testId="scc-finish-chip" />
            <SccOrderBlock nodes={model.secondPassOrder} label={t('sccSecondOrder')} testId="scc-second-chip" />
          </>
        )}

        {model.phase === 'second-pass' && (
          <>
            {latestGroup && <ComponentRow group={latestGroup} />}
            <SccOrderBlock
              nodes={model.secondPassOrder}
              label={t('sccSecondOrder')}
              testId="scc-second-chip"
              activeIndex={model.secondPassIndex}
            />
          </>
        )}

        {model.phase === 'done' && (
          <>
            <SccOrderBlock nodes={model.finishOrder} label={t('sccFirstOrder')} testId="scc-finish-chip" />
            <SccOrderBlock nodes={model.secondPassOrder} label={t('sccSecondOrder')} testId="scc-second-chip" />
          </>
        )}
      </section>
    </aside>
  );
}

export function KosarajuVisual({
  model,
}: {
  model: SccVisualModel;
}) {
  const { t } = useI18n();
  if (model.empty) return <p className="mst-empty" data-testid="g4-empty">{t('g4Empty')}</p>;
  return (
    <article className="mst-stage g4-stage scc-stage" data-testid="scc-stage" data-operation={model.operation} data-phase={model.phase} data-reversed={model.reversed ? 'true' : 'false'}>
      <div className="mst-layout scc-layout">
        <section className="mst-graph-card scc-graph-card">
          <div className="scc-graph-head">
            <div className="scc-graph-id">
              <b>{model.reversed ? t('sccReversedGraphTitle') : t('sccGraphTitle')}</b>
              <span className="tag green">{model.reversed ? t('sccReversedBadge') : t('sccDirectedBadge')}</span>
            </div>
            <div className="g4-phase-track" data-testid="scc-phase-track">
              {(['first-pass', 'reverse', 'second-pass', 'done'] as const).map((phase) => (
                <span key={phase} className={`g4-phase${model.phase === phase ? ' is-current' : ''}`} data-phase={phase}>
                  {t(`g4Phase_${phase}` as 'g4Phase_first-pass')}
                </span>
              ))}
            </div>
          </div>
          <div className="mst-graph-scroll scc-graph-scroll">
            <svg
              className="mst-graph-svg g4-graph-svg scc-graph-svg"
              viewBox={`0 0 ${model.width} ${model.height}`}
              role="img"
              aria-label="Kosaraju strongly connected components directed graph"
              data-testid="scc-graph-svg"
              data-node-count={model.nodes.length}
              data-edge-count={model.edges.length}
              data-reversed={model.reversed ? 'true' : 'false'}
            >
              <defs>
                <marker id="g4-scc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" className="g4-arrow-head" />
                </marker>
              </defs>
              <EdgeLines edges={model.edges} directed markerId="g4-scc-arrow" testId="scc-edge" />
              <g className="mst-nodes">
                {model.nodes.map((node) => (
                  <NodeShape key={node.id} node={node} radius={model.nodeRadius} showStackLabel={false} rootLabel={t('g4RootLabel')} />
                ))}
              </g>
            </svg>
          </div>
        </section>

        <SccKeyRail model={model} />
      </div>

      {model.done && <SccFinalGroups model={model} />}
    </article>
  );
}
