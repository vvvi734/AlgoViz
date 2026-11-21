import { useI18n } from '../../i18n/I18nProvider';
import type {
  ArticulationEdgeVisual,
  ArticulationNodeVisual,
  ArticulationVisualModel,
} from '../../domain/visualization/articulationModel';

export const ARTICULATION_OPERATION_KEYS: Record<ArticulationVisualModel['operation'], string> = {
  init: 'apOpInit',
  'start-root': 'apOpStartRoot',
  discover: 'apOpDiscover',
  'inspect-edge': 'apOpInspect',
  'tree-edge': 'apOpTreeEdge',
  'back-edge': 'apOpBackEdge',
  'update-low': 'apOpUpdateLow',
  'cut-vertex': 'apOpCut',
  bridge: 'apOpBridge',
  'root-confirm': 'apOpRootConfirm',
  'root-check': 'apOpRootCheck',
  'finish-node': 'apOpFinish',
  done: 'apOpDone',
};

export const ARTICULATION_HINT_KEYS: Record<ArticulationVisualModel['operation'], string> = {
  init: 'apHintInit',
  'start-root': 'apHintStartRoot',
  discover: 'apHintDiscover',
  'inspect-edge': 'apHintInspect',
  'tree-edge': 'apHintTreeEdge',
  'back-edge': 'apHintBackEdge',
  'update-low': 'apHintUpdateLow',
  'cut-vertex': 'apHintCut',
  bridge: 'apHintBridge',
  'root-confirm': 'apHintRootConfirm',
  'root-check': 'apHintRootCheck',
  'finish-node': 'apHintFinish',
  done: 'apHintDone',
};

function nodeStateKey(state: ArticulationNodeVisual['state']): string {
  if (state === 'discovered') return 'apStateOnStack';
  if (state === 'finished') return 'apStateFinished';
  return 'apStateUndiscovered';
}

function edgeClass(edge: ArticulationEdgeVisual): string {
  return `ap-edge is-${edge.state}${edge.active ? ' is-current' : ''}`;
}

function NodeShape({
  node,
  radius,
  t,
}: {
  node: ArticulationNodeVisual;
  radius: number;
  t: (key: string) => string;
}) {
  return (
    <g
      className={`ap-node is-${node.state}${node.current ? ' is-current' : ''}${node.cut ? ' is-cut' : ''}${
        node.root ? ' is-root' : ''
      }`}
      transform={`translate(${node.x}, ${node.y})`}
      data-testid="ap-node"
      data-node-id={node.id}
      data-state={node.state}
      data-cut={node.cut ? 'true' : 'false'}
      data-root={node.root ? 'true' : 'false'}
      data-current={node.current ? 'true' : 'false'}
      data-disc={node.disc}
      data-low={node.low}
    >
      <circle className="mst-node-ring" r={radius + 5} />
      <circle className="mst-node-body" r={radius} />
      <text className="mst-node-label" textAnchor="middle" y="4">{node.label}</text>
      {node.root && (
        <text className="ap-node-role is-root" textAnchor="middle" y={-radius - 13}>
          ROOT
        </text>
      )}
      {node.cut && (
        <g className="ap-cut-badge" transform={`translate(${radius - 4}, ${-radius + 3})`}>
          <circle r="11" />
          <text textAnchor="middle" y="4">AP</text>
        </g>
      )}
      <g className="ap-disc-low" transform={`translate(0, ${radius + 15})`}>
        <rect x="-29" y="-9" width="58" height="18" rx="5" />
        <text textAnchor="middle" y="4">{`d${node.disc} · l${node.low}`}</text>
      </g>
      <title>{`${node.label} · ${t('apDisc')}=${node.disc} · ${t('apLow')}=${node.low}`}</title>
    </g>
  );
}

function EdgeLines({ edges }: { edges: ArticulationEdgeVisual[] }) {
  return (
    <g className="ap-edges">
      {edges.map((edge) => (
        <g
          key={edge.id}
          data-testid="ap-edge"
          data-edge-id={edge.id}
          data-state={edge.state}
          data-current={edge.active ? 'true' : 'false'}
          data-bridge={edge.bridge ? 'true' : 'false'}
        >
          <line
            className={edgeClass(edge)}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
          />
        </g>
      ))}
    </g>
  );
}

function Legend({ t }: { t: (key: string) => string }) {
  return (
    <div className="ap-legend" data-testid="ap-legend">
      <span><i className="is-tree" />{t('apLegendTree')}</span>
      <span><i className="is-back" />{t('apLegendBack')}</span>
      <span><i className="is-bridge" />{t('apLegendBridge')}</span>
      <span><i className="is-cut" />{t('apLegendCut')}</span>
    </div>
  );
}

function StackPanel({ model, t }: { model: ArticulationVisualModel; t: (key: string) => string }) {
  return (
    <section className="mst-panel" data-testid="ap-stack-panel">
      <header className="mst-panel-head">
        <b>{t('apStackTitle')}</b>
        <small>{t('apStackNote')}</small>
      </header>
      <div className="g4-stack" data-testid="ap-stack">
        {model.frontierItems.length ? model.frontierItems.map((item, index) => (
          <span
            key={item.id}
            className={`g4-stack-chip${item.added ? ' is-added' : ''}`}
            data-testid="ap-stack-item"
            data-entry-id={item.id}
            data-node-id={item.nodeId}
          >
            <small>{index === model.frontierItems.length - 1 ? t('apStackTop') : `#${index + 1}`}</small>
            <code>{item.label}</code>
          </span>
        )) : <span className="mst-empty-inline" data-testid="ap-stack-empty">{t('apStackEmpty')}</span>}
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

function CurrentStatePanel({ model, t }: { model: ArticulationVisualModel; t: (key: string) => string }) {
  const current = model.nodes.find((node) => node.id === model.currentNodeId) ?? null;
  return (
    <section className="mst-panel ap-state-panel" data-testid="ap-state-panel">
      <header className="mst-panel-head">
        <b>{t('apCurrentStateTitle')}</b>
        <small>{t('apCurrentStateNote')}</small>
      </header>
      {current ? (
        <div className="ap-current-grid">
          <div><span>{t('apVertex')}</span><b>{current.label}</b></div>
          <div><span>{t('apDisc')}</span><b>{current.disc}</b></div>
          <div><span>{t('apLow')}</span><b>{current.low}</b></div>
          <div><span>{t('apParent')}</span><b>{current.parentId ?? t('apNone')}</b></div>
          <div><span>{t('apRootChildren')}</span><b>{current.root ? model.rootChildCount : t('apNotRoot')}</b></div>
          <div><span>{t('apRole')}</span><b>{current.cut ? t('apRoleCut') : current.root ? t('apRoleRoot') : t('apRoleNormal')}</b></div>
        </div>
      ) : <span className="mst-empty-inline">{t('apNoCurrent')}</span>}
      {model.decision && (
        <footer className="ap-decision" data-testid="ap-decision" data-decision={model.decision}>
          {t(`apDecision_${model.decision}`)}
        </footer>
      )}
    </section>
  );
}

function NodeTable({ model, t }: { model: ArticulationVisualModel; t: (key: string) => string }) {
  return (
    <section className="mst-panel" data-testid="ap-node-table-panel">
      <header className="mst-panel-head">
        <b>{t('apNodeTableTitle')}</b>
        <small>{t('apNodeTableNote')}</small>
      </header>
      <div className="g4-table-wrap">
        <table className="g3-table g4-table ap-table">
          <thead>
            <tr>
              <th>{t('apVertex')}</th>
              <th>{t('apDisc')}</th>
              <th>{t('apLow')}</th>
              <th>{t('apParent')}</th>
              <th>{t('apState')}</th>
              <th>{t('apRole')}</th>
            </tr>
          </thead>
          <tbody>
            {model.nodes.map((node) => (
              <tr
                key={node.id}
                className={node.current ? 'is-current' : ''}
                data-testid="ap-node-row"
                data-node-id={node.id}
                data-cut={node.cut ? 'true' : 'false'}
              >
                <td><code>{node.label}</code></td>
                <td>{node.disc || '—'}</td>
                <td>{node.low || '—'}</td>
                <td>{node.parentId ?? '—'}</td>
                <td>{t(nodeStateKey(node.state))}</td>
                <td>{node.cut ? t('apRoleCut') : node.root ? t('apRoleRoot') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ArticulationVisual({
  model,
  operationText,
  hint,
}: {
  model: ArticulationVisualModel;
  operationText: string;
  hint: string;
}) {
  const { t } = useI18n();
  if (model.empty) return <p className="mst-empty" data-testid="ap-empty">{t('apEmpty')}</p>;
  return (
    <article
      className="mst-stage g4-stage ap-stage"
      data-testid="ap-stage"
      data-operation={model.operation}
      data-articulation-count={model.articulationIds.length}
    >
      <header className="mst-head">
        <div>
          <div className="eyebrow">{t('apKicker')}</div>
          <h2>{t('apTitle')}</h2>
          <p className="mst-subtitle">{operationText}</p>
        </div>
        <div className="mst-metrics">
          <div className="mst-metric"><span>{t('apArticulationMetric')}</span><b>{model.articulationIds.length}</b></div>
          <div className="mst-metric"><span>{t('apBridgeMetric')}</span><b>{model.bridgeIds.length}</b></div>
          <div className="mst-metric"><span>{t('apTreeMetric')}</span><b>{model.edges.filter((edge) => edge.tree).length}</b></div>
          <div className="mst-metric"><span>{t('apStackMetric')}</span><b>{model.frontierItems.length}</b></div>
        </div>
      </header>

      <div className="mst-layout g4-layout">
        <section className="mst-graph-card">
          <div className="mst-card-head">
            <b>{t('apGraphTitle')}</b>
            <span className="tag green">{t('apUndirectedBadge')}</span>
          </div>
          <div className="mst-graph-scroll">
            <svg
              className="mst-graph-svg g4-graph-svg ap-graph-svg"
              viewBox={`0 0 ${model.width} ${model.height}`}
              role="img"
              aria-label="undirected articulation-point graph"
              data-testid="ap-graph-svg"
              data-node-count={model.nodes.length}
              data-edge-count={model.edges.length}
            >
              <EdgeLines edges={model.edges} />
              <g className="mst-nodes">
                {model.nodes.map((node) => (
                  <NodeShape key={node.id} node={node} radius={model.nodeRadius} t={t} />
                ))}
              </g>
            </svg>
          </div>
          <Legend t={t} />
          <div className="mst-current-strip" data-testid="ap-current">
            <span className="mst-strip-label">{t('apCurrentLabel')}</span>
            {model.currentNodeId ? <code>{model.currentNodeId}</code> : <span className="muted">{t('apNoCurrent')}</span>}
            {model.currentEdgeId && <span className="g4-change-pill">{t('apEdgeBadge')}: {model.currentEdgeId}</span>}
            {model.neighborNodeId && <span className="g4-change-pill">{t('apNeighbor')}: {model.neighborNodeId}</span>}
            {model.rootId && <span className="g4-change-pill">{t('apRootBadge')}: {model.rootId}</span>}
          </div>
          <p className="mst-hint">{hint}</p>
        </section>

        <aside className="mst-side g4-side">
          <CurrentStatePanel model={model} t={t} />
          <StackPanel model={model} t={t} />
          <NodeTable model={model} t={t} />
        </aside>
      </div>

      <footer className="mst-result" data-testid="ap-result">
        <span className="mst-result-kicker">{model.done ? t('mstResultDone') : t('mstResultRunning')}</span>
        <strong>{t('apFinalArticulation')}: {model.articulationIds.length ? model.articulationIds.join(', ') : t('apNone')}</strong>
        <span>{t('apFinalBridges')}: {model.bridgeIds.length ? model.bridgeIds.join(', ') : t('apNone')}</span>
        {model.rootId && <span>{t('apRootBadge')}: {model.rootId} ({t('apRootChildren')}={model.rootChildCount})</span>}
        {model.done && <span className="mst-tree-badge">{t('apDoneBadge')}</span>}
      </footer>
    </article>
  );
}
