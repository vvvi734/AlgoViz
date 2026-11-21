import { useI18n } from '../../i18n/I18nProvider';
import {
  GRAPH_INPUT_LIMITS,
  type GraphAlgorithmSpec,
  type GraphEdgeFields,
  type GraphGuidedInputAlgorithm,
  type GraphInputFields,
} from '../../domain/algorithms/graphInput';

const NODE_ALPHABET = 'ABCDEFGHIJKL';

function nextNodeLabel(nodes: readonly string[]): string {
  const used = new Set(nodes);
  for (const letter of NODE_ALPHABET) {
    if (!used.has(letter)) return letter;
  }
  let index = 1;
  while (used.has(`N${index}`)) index += 1;
  return `N${index}`;
}

function nextFreePair(nodes: readonly string[], edges: readonly GraphEdgeFields[], directed: boolean) {
  for (let fromIndex = 0; fromIndex < nodes.length; fromIndex += 1) {
    for (let toIndex = fromIndex + 1; toIndex < nodes.length; toIndex += 1) {
      const from = nodes[fromIndex]!;
      const to = nodes[toIndex]!;
      const exists = edges.some((edge) =>
        directed
          ? edge.from === from && edge.to === to
          : (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from),
      );
      if (!exists) return { from, to };
    }
  }
  return { from: nodes[0] ?? '', to: nodes[1] ?? '' };
}

/**
 * INPUT-06: the shared node/edge table used by every graph lesson.
 *
 * It edits graph data only. Validation and conversion live in `graphInput.ts`;
 * this component never starts a run and never invents visual state.
 */
export function GraphInputEditor({
  algorithm,
  spec,
  draft,
  onChange,
}: {
  algorithm: GraphGuidedInputAlgorithm;
  spec: GraphAlgorithmSpec;
  draft: GraphInputFields;
  onChange: (next: GraphInputFields) => void;
}) {
  const { t, b } = useI18n();
  const directed =
    spec.direction === 'directed' ? true : spec.direction === 'undirected' ? false : draft.directed;

  const setEdges = (edges: GraphEdgeFields[]) => onChange({ ...draft, edges });

  const addNode = () => {
    if (draft.nodes.length >= spec.maxNodes) return;
    const node = nextNodeLabel(draft.nodes);
    onChange({
      ...draft,
      nodes: [...draft.nodes, node],
      start: spec.needsStart && draft.start === '' ? node : draft.start,
      target: spec.needsTarget && draft.target === '' ? node : draft.target,
    });
  };

  const removeNode = (index: number) => {
    const node = draft.nodes[index]!;
    onChange({
      ...draft,
      nodes: draft.nodes.filter((_, candidate) => candidate !== index),
      edges: draft.edges.filter((edge) => edge.from !== node && edge.to !== node),
      start: draft.start === node ? '' : draft.start,
      target: draft.target === node ? '' : draft.target,
    });
  };

  const renameNode = (index: number, next: string) => {
    const previous = draft.nodes[index]!;
    onChange({
      ...draft,
      nodes: draft.nodes.map((node, candidate) => (candidate === index ? next : node)),
      edges: draft.edges.map((edge) => ({
        ...edge,
        from: edge.from === previous ? next : edge.from,
        to: edge.to === previous ? next : edge.to,
      })),
      start: draft.start === previous ? next : draft.start,
      target: draft.target === previous ? next : draft.target,
    });
  };

  const addEdge = () => {
    if (draft.nodes.length < 2 || draft.edges.length >= spec.maxEdges) return;
    const pair = nextFreePair(draft.nodes, draft.edges, directed);
    setEdges([
      ...draft.edges,
      { from: pair.from, to: pair.to, weight: spec.weighted ? '1' : '' },
    ]);
  };

  const updateEdge = (index: number, patch: Partial<GraphEdgeFields>) => {
    setEdges(draft.edges.map((edge, candidate) => (candidate === index ? { ...edge, ...patch } : edge)));
  };

  const removeEdge = (index: number) => {
    setEdges(draft.edges.filter((_, candidate) => candidate !== index));
  };

  const weightPlaceholder =
    spec.weightKind === 'signed' ? '-2' : spec.weightKind === 'duration' ? '3' : '0';

  return (
    <div className="graph-input-editor" data-testid="graph-input-editor" data-algorithm={algorithm}>
      <div className="graph-input-summary" data-testid="graph-input-summary">
        <span className="graph-input-chip" data-testid="graph-directed-mode">
          {directed ? t('graphDirected') : t('graphUndirected')}
        </span>
        <span className="graph-input-chip">
          {spec.weighted ? t('graphWeighted') : t('graphUnweighted')}
        </span>
        <span className="graph-input-limit">
          {t('graphLimitNote')
            .replace('{nodes}', String(spec.maxNodes))
            .replace('{edges}', String(spec.maxEdges))}
        </span>
      </div>

      {spec.direction === 'optional' ? (
        <label className="graph-direction-toggle">
          <input
            type="checkbox"
            checked={draft.directed}
            onChange={(event) => onChange({ ...draft, directed: event.target.checked })}
            data-testid="graph-directed"
          />
          <span>{b('有向图（按箭头方向遍历）', 'Directed graph (follow the arrows)')}</span>
        </label>
      ) : null}

      <div className="graph-input-block">
        <div className="graph-input-block-head">
          <span className="graph-input-block-title">{t('graphNodesLabel')}</span>
          <button
            className="btn small graph-add-button"
            type="button"
            onClick={addNode}
            disabled={draft.nodes.length >= spec.maxNodes}
            data-testid="graph-add-node"
          >
            {t('graphAddNode')}
          </button>
        </div>
        <div className="graph-node-table" role="table" aria-label={t('graphNodesLabel')}>
          <div className="graph-node-head" role="row">
            <span role="columnheader">#</span>
            <span role="columnheader">{t('graphNodeIdLabel')}</span>
            <span role="columnheader" className="graph-row-action-label">
              {t('graphRowAction')}
            </span>
          </div>
          {draft.nodes.length === 0 ? (
            <p className="graph-table-empty note muted">{t('graphNoNodes')}</p>
          ) : (
            draft.nodes.map((node, index) => (
              <div className="graph-node-row" role="row" key={`node-${index}`}>
                <span className="graph-row-index" role="cell">
                  {index + 1}
                </span>
                <input
                  id={index === 0 ? 'run-input' : undefined}
                  className="input graph-node-input"
                  data-testid="graph-node-input"
                  role="cell"
                  aria-label={`${t('graphNodeIdLabel')} ${index + 1}`}
                  value={node}
                  maxLength={GRAPH_INPUT_LIMITS.NODE_LABEL_MAX}
                  onChange={(event) => renameNode(index, event.target.value)}
                  placeholder="A"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  className="btn small graph-row-remove"
                  type="button"
                  onClick={() => removeNode(index)}
                  aria-label={`${t('graphRemoveNode')} ${index + 1}`}
                  title={t('graphRemoveNode')}
                  data-testid="graph-node-remove"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="graph-input-block">
        <div className="graph-input-block-head">
          <span className="graph-input-block-title">{t('graphEdgesLabel')}</span>
          <button
            className="btn small graph-add-button"
            type="button"
            onClick={addEdge}
            disabled={draft.nodes.length < 2 || draft.edges.length >= spec.maxEdges}
            data-testid="graph-add-edge"
          >
            {t('graphAddEdge')}
          </button>
        </div>
        <div
          className={`graph-edge-table${spec.weighted ? ' is-weighted' : ''}`}
          role="table"
          aria-label={t('graphEdgesLabel')}
        >
          <div className="graph-edge-head" role="row">
            <span role="columnheader">#</span>
            <span role="columnheader">{t('graphEdgeFrom')}</span>
            <span role="columnheader">{t('graphEdgeTo')}</span>
            {spec.weighted ? (
              <span role="columnheader">
                {spec.weightLabel === 'duration'
                  ? t('graphDurationLabel')
                  : t('graphWeightLabel')}
              </span>
            ) : null}
            <span role="columnheader" className="graph-row-action-label">
              {t('graphRowAction')}
            </span>
          </div>
          {draft.edges.length === 0 ? (
            <p className="graph-table-empty note muted">{t('graphNoEdges')}</p>
          ) : (
            draft.edges.map((edge, index) => (
              <div className="graph-edge-row" role="row" key={`edge-${index}`}>
                <span className="graph-row-index" role="cell">
                  {index + 1}
                </span>
                <select
                  className="input graph-edge-select"
                  data-testid="graph-edge-from"
                  role="cell"
                  aria-label={`${t('graphEdgeFrom')} ${index + 1}`}
                  value={edge.from}
                  onChange={(event) => updateEdge(index, { from: event.target.value })}
                >
                  {draft.nodes.map((node, nodeIndex) => (
                    <option key={`from-${nodeIndex}`} value={node}>
                      {node === '' ? '∅' : node}
                    </option>
                  ))}
                </select>
                <select
                  className="input graph-edge-select"
                  data-testid="graph-edge-to"
                  role="cell"
                  aria-label={`${t('graphEdgeTo')} ${index + 1}`}
                  value={edge.to}
                  onChange={(event) => updateEdge(index, { to: event.target.value })}
                >
                  {draft.nodes.map((node, nodeIndex) => (
                    <option key={`to-${nodeIndex}`} value={node}>
                      {node === '' ? '∅' : node}
                    </option>
                  ))}
                </select>
                {spec.weighted ? (
                  <input
                    className="input graph-edge-weight"
                    data-testid="graph-input-edge-weight"
                    role="cell"
                    aria-label={`${
                      spec.weightLabel === 'duration'
                        ? t('graphDurationLabel')
                        : t('graphWeightLabel')
                    } ${index + 1}`}
                    value={edge.weight}
                    onChange={(event) => updateEdge(index, { weight: event.target.value })}
                    placeholder={weightPlaceholder}
                    inputMode="decimal"
                    spellCheck={false}
                    autoComplete="off"
                  />
                ) : null}
                <button
                  className="btn small graph-row-remove"
                  type="button"
                  onClick={() => removeEdge(index)}
                  aria-label={`${t('graphRemoveEdge')} ${index + 1}`}
                  title={t('graphRemoveEdge')}
                  data-testid="graph-edge-remove"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {spec.needsStart || spec.needsTarget ? (
        <div className="graph-endpoint-row">
          {spec.needsStart ? (
            <label className="graph-endpoint-field">
              <span>{t('graphStartLabel')}</span>
              <select
                className="input"
                data-testid="graph-start"
                value={draft.start}
                onChange={(event) => onChange({ ...draft, start: event.target.value })}
              >
                <option value="">{t('graphSelectPlaceholder')}</option>
                {draft.nodes.map((node, index) => (
                  <option key={`start-${index}`} value={node}>
                    {node}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {spec.needsTarget ? (
            <label className="graph-endpoint-field">
              <span>{t('graphTargetLabel')}</span>
              <select
                className="input"
                data-testid="graph-target"
                value={draft.target}
                onChange={(event) => onChange({ ...draft, target: event.target.value })}
              >
                <option value="">{t('graphSelectPlaceholder')}</option>
                {draft.nodes.map((node, index) => (
                  <option key={`target-${index}`} value={node}>
                    {node}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
