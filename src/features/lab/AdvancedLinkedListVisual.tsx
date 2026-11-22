import { useI18n } from '../../i18n/I18nProvider';
import type {
  AdvancedLinkedNodeModel,
  AdvancedLinkedListVisualModel,
} from '../../domain/visualization/advancedLinkedListModel';

const NODE_W = 96;
const NODE_H = 100;
const GAP = 27;
const LEFT = 20;
const NODE_TOP = 64;
const NEXT_Y = NODE_TOP + 30;
const PREV_Y = NODE_TOP + NODE_H - 24;
const BOTTOM = NODE_TOP + NODE_H + 96;

function displayValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function nodeX(index: number): number {
  return LEFT + index * (NODE_W + GAP);
}

function chainWidth(count: number): number {
  return LEFT * 2 + Math.max(1, count) * NODE_W + Math.max(0, count - 1) * GAP;
}

function nodeClass(node: AdvancedLinkedNodeModel): string {
  return [
    'linked-node',
    'adv-node',
    node.detached ? 'is-detached' : '',
    node.active ? 'is-active' : '',
    node.changed ? 'is-changed' : '',
  ].filter(Boolean).join(' ');
}

function NodeBox({ node, doubly }: { node: AdvancedLinkedNodeModel; doubly: boolean }) {
  const { t } = useI18n();
  return (
    <div
      className={nodeClass(node)}
      data-testid={node.detached ? 'adv-detached-node' : 'adv-node'}
      data-node-id={node.id}
      data-value={displayValue(node.value)}
      data-prev-id={doubly ? (node.prevId ?? 'null') : 'none'}
      data-next-id={node.nextId ?? 'null'}
      data-role={node.role}
      data-active={String(node.active)}
      data-changed={String(node.changed)}
      data-detached={String(node.detached)}
      style={node.detached ? undefined : { left: nodeX(node.index), top: NODE_TOP, width: NODE_W, height: NODE_H }}
      aria-label={`Node ${node.id}, value ${displayValue(node.value)}, prev ${node.prevId ?? 'null'}, next ${node.nextId ?? 'null'}`}
    >
      <span className="linked-node-id">{node.id}</span>
      <div className="linked-node-data">{displayValue(node.value)}</div>
      <div className="adv-node-links">
        {doubly && (
          <span className="adv-node-link adv-node-prev" data-testid="adv-node-prev" data-target-id={node.prevId ?? 'null'}>
            <b>{t('advPrevLabel')}</b> ← {node.prevId ?? t('linkedNullLabel')}
          </span>
        )}
        <span className="adv-node-link adv-node-next" data-testid="adv-node-next" data-target-id={node.nextId ?? 'null'}>
          <b>{t('advNextLabel')}</b> → {node.nextId ?? t('linkedNullLabel')}
        </span>
      </div>
    </div>
  );
}


export function AdvancedLinkedListVisual({ model }: { model: AdvancedLinkedListVisualModel }) {
  const { t } = useI18n();
  const doubly = model.kind === 'doubly-linked-list';
  const width = chainWidth(Math.max(model.nodes.length, 1));
  const lastIndex = Math.max(0, model.nodes.length - 1);
  const headX = nodeX(0);
  const headNode = model.nodes[0];
  const tailNode = model.nodes.find((node) => node.id === model.tailId) ?? model.nodes[lastIndex];
  const tailX = tailNode ? nodeX(tailNode.index) : nodeX(lastIndex);
  const indexById = new Map(model.nodes.map((node, index) => [node.id, index]));
  const circularEdge = model.edges.find((edge) => edge.circular);
  const circleFromX = circularEdge ? nodeX(indexById.get(circularEdge.fromId) ?? 0) : 0;
  const changeText = model.change
    ? `${model.change.nodeId}.${model.change.field}: ${model.change.beforeId ?? t('linkedNullLabel')} → ${model.change.afterId ?? t('linkedNullLabel')}`
    : '';

  return (
    <div
      className={`linked-visual adv-linked-visual${doubly ? ' is-doubly' : ' is-circular'}`}
      data-testid="adv-linked-visual"
      data-kind={model.kind}
      data-operation={model.operation}
      data-phase={model.phase}
      data-head-id={model.headId ?? ''}
      data-tail-id={model.tailId ?? ''}
      data-node-count={String(model.nodes.length)}
      role="img"
      aria-label={t(doubly ? 'advDoublyVisualLabel' : 'advCircularVisualLabel')}
    >
      <div className="linked-toolbar">
        <span className="linked-op-label" data-testid="adv-linked-op-label">
          {model.operation.toUpperCase()}
        </span>
        <span className="linked-legend">
          <span className="linked-legend-dot head" /> {t('advHeadLabel')}
          <span className={`adv-legend-line ${doubly ? 'prev' : 'next'}`} />
          {doubly ? t('advPrevLabel') : t('advReturnEdgeLabel')}
          <span className="adv-legend-line next" /> {t('advNextLabel')}
          <span className={`adv-phase ${model.phase === 'complete' ? 'complete' : 'intermediate'}`} data-testid="adv-phase">
            {t(model.phase === 'complete' ? 'advComplete' : 'advIntermediate')}
          </span>
        </span>
      </div>

      {(model.change || model.operation === 'found' || model.operation === 'not-found') && (
        <div className="adv-status-row">
          {model.change && (
            <div className="linked-change adv-change" data-testid="adv-linked-change" data-node-id={model.change.nodeId} data-field={model.change.field}>
              <strong>{model.change.nodeId}</strong>
              <span className="linked-change-label">{t('advChangeLabel')}</span>
              <span>{model.change.field}</span>
              <span>{model.change.beforeId ?? t('linkedNullLabel')}</span>
              <span className="linked-change-arrow">→</span>
              <span>{model.change.afterId ?? t('linkedNullLabel')}</span>
              <span className="adv-change-text">{changeText}</span>
            </div>
          )}
          {(model.operation === 'found' || model.operation === 'not-found') && (
            <div
              className={`adv-search-result ${model.found ? 'found' : 'miss'}`}
              data-testid="adv-search-result"
              data-found={String(Boolean(model.found))}
              data-search-value={String(model.searchValue)}
            >
              {t('advSearchLabel')} <b>{String(model.searchValue)}</b> ·{' '}
              {model.found ? `${t('advSearchFound')} ${model.targetId ?? ''}` : t('advSearchMiss')}
            </div>
          )}
        </div>
      )}

      {model.nodes.length > 4 && (
        <div className="linked-scroll-hint" data-testid="adv-scroll-hint">{t('advScrollHint')}</div>
      )}

      <div className="linked-scroller">
        <div className="linked-chain adv-chain" style={{ width, minHeight: BOTTOM }}>
          {model.nodes.length > 0 && (
            <div
              className="linked-head adv-marker adv-head-marker"
              data-testid="adv-head-marker"
              data-node-id={headNode.id}
              style={{ left: headX, top: 2 }}
            >
              {model.single ? t('advHeadTailLabel') : t('advHeadLabel')} <span className="linked-head-arrow">↓</span>
            </div>
          )}
          {model.nodes.length > 1 && (
            <div
              className="adv-marker adv-tail-marker"
              data-testid="adv-tail-marker"
              data-node-id={tailNode.id}
              style={{ left: tailX, top: 2 }}
            >
              {t('advTailLabel')} <span className="linked-head-arrow">↓</span>
            </div>
          )}

          <svg
            className="linked-edges adv-edges"
            width={width}
            height={BOTTOM}
            viewBox={`0 0 ${width} ${BOTTOM}`}
            aria-hidden="true"
          >
            <defs>
              <marker id="adv-arrow-next" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" />
              </marker>
              <marker id="adv-arrow-prev" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" />
              </marker>
              <marker id="adv-arrow-circle" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" />
              </marker>
            </defs>

            {model.nodes.length > 0 && (
              <line
                className="linked-head-line"
                data-testid="adv-head-arrow"
                data-node-id={headNode.id}
                x1={headX + NODE_W / 2}
                y1={24}
                x2={headX + NODE_W / 2}
                y2={NODE_TOP}
                markerEnd="url(#adv-arrow-next)"
              />
            )}

            {doubly && model.edges.filter((edge) => edge.field === 'prev').map((edge) => {
              const index = indexById.get(edge.fromId);
              const prevIndex = indexById.get(edge.toId);
              if (index === undefined || prevIndex === undefined) return null;
              const x1 = nodeX(index) - 2;
              const x2 = nodeX(prevIndex) + NODE_W + 4;
              return (
                <g key={edge.id}>
                  <line
                    className={`adv-edge adv-prev-edge${edge.changed ? ' is-changed' : ''}`}
                    data-testid="adv-prev-edge"
                    data-from-id={edge.fromId}
                    data-to-id={edge.toId}
                    x1={x1}
                    y1={PREV_Y}
                    x2={x2}
                    y2={PREV_Y}
                    markerEnd="url(#adv-arrow-prev)"
                  />
                </g>
              );
            })}

            {model.edges.filter((edge) => edge.field === 'next' && !edge.circular).map((edge) => {
              const index = indexById.get(edge.fromId);
              const nextIndex = indexById.get(edge.toId);
              if (index === undefined || nextIndex === undefined) return null;
              const nextX = nodeX(nextIndex);
              return (
                <g key={edge.id}>
                  <line
                    className={`adv-edge adv-next-edge${edge.changed ? ' is-changed' : ''}`}
                    data-testid="adv-next-edge"
                    data-from-id={edge.fromId}
                    data-to-id={edge.toId}
                    x1={nodeX(index) + NODE_W + 2}
                    y1={NEXT_Y}
                    x2={nextX - 5}
                    y2={NEXT_Y}
                    markerEnd="url(#adv-arrow-next)"
                  />
                </g>
              );
            })}

            {model.nodes.length > 0 && model.nodes[lastIndex]!.nextId === null && (
              <>
                <line
                  className="adv-null-edge"
                  x1={nodeX(lastIndex) + NODE_W + 2}
                  y1={NEXT_Y}
                  x2={nodeX(lastIndex) + NODE_W + 28}
                  y2={NEXT_Y}
                  markerEnd="url(#adv-arrow-next)"
                />
                <text className="adv-null-text" x={width - 38} y={NEXT_Y + 4}>NULL</text>
              </>
            )}

            {!doubly && circularEdge && tailNode && (
              <CircularReturnEdge
                count={model.nodes.length}
                fromId={circularEdge.fromId}
                toId={circularEdge.toId}
                fromX={circleFromX}
                toX={headX}
                single={circularEdge.selfLoop}
                changed={circularEdge.changed}
                label={t(circularEdge.selfLoop ? 'advSelfLoopLabel' : 'advReturnEdgeLabel')}
              />
            )}
          </svg>

          {model.nodes.map((node) => <NodeBox key={node.id} node={node} doubly={doubly} />)}

          {model.nodes.length === 0 && (
            <div className="linked-empty adv-empty" data-testid="adv-empty">
              <span className="linked-empty-head">{t('advHeadLabel')}</span>
              <span className="linked-empty-arrow">→</span>
              <span className="linked-empty-null">{t('linkedNullLabel')}</span>
              <span className="linked-empty-head">{t('advTailLabel')}</span>
              <span className="linked-empty-arrow">→</span>
              <span className="linked-empty-null">{t('linkedNullLabel')}</span>
              <span className="linked-empty-text">
                {t(doubly ? 'advEmptyDoubly' : 'advEmptyCircular')}
              </span>
            </div>
          )}
        </div>
      </div>

      {model.detachedNodes.length > 0 && (
        <div className="linked-detached-region" data-testid="adv-detached-region">
          <div className="linked-detached-label">{t('advDetached')}</div>
          <div className="linked-detached-list">
            {model.detachedNodes.map((node) => (
              <div
                key={node.id}
                className={`linked-detached-node adv-detached-node${node.changed ? ' is-changed' : ''}`}
                data-testid="adv-detached-card"
                data-node-id={node.id}
                data-next-id={node.nextId ?? 'null'}
                data-prev-id={doubly ? (node.prevId ?? 'null') : 'none'}
              >
                <span className="linked-node-id">{node.id}</span>
                <span className="linked-detached-value">{displayValue(node.value)}</span>
                {doubly && <span className="linked-detached-next">prev → {node.prevId ?? t('linkedNullLabel')}</span>}
                <span className="linked-detached-next">next → {node.nextId ?? t('linkedNullLabel')}</span>
                <span className="linked-detached-note">{t('advDetached')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CircularReturnEdge({
  count,
  fromId,
  toId,
  fromX,
  toX,
  single,
  changed,
  label,
}: {
  count: number;
  fromId: string;
  toId: string;
  fromX: number;
  toX: number;
  single: boolean;
  changed: boolean;
  label: string;
}) {
  if (single) {
    const startX = fromX + NODE_W;
    const startY = NODE_TOP + NODE_H - 18;
    const r = 44;
    const path = `M ${startX} ${startY} C ${startX + r} ${startY + r}, ${toX - r} ${startY + r}, ${toX} ${startY}`;
    return (
      <g>
        <path
          className={`adv-edge adv-circular-edge${changed ? ' is-changed' : ''}`}
          data-testid="adv-circular-edge"
          data-from-id={fromId}
          data-to-id={toId}
          d={path}
          markerEnd="url(#adv-arrow-circle)"
        />
        <text className="adv-edge-label circular" x={toX + NODE_W / 2} y={NODE_TOP + NODE_H + 54} textAnchor="middle">
          {label}
        </text>
      </g>
    );
  }
  const startX = fromX + NODE_W + 2;
  const startY = NODE_TOP + NODE_H - 12;
  const endX = toX - 2;
  const endY = NODE_TOP + NODE_H - 12;
  const bottomY = NODE_TOP + NODE_H + 58;
  const path = `M ${startX} ${startY} C ${startX + 48} ${bottomY}, ${endX - 48} ${bottomY}, ${endX} ${endY}`;
  return (
    <g>
      <path
        className={`adv-edge adv-circular-edge${changed ? ' is-changed' : ''}`}
        data-testid="adv-circular-edge"
        data-from-id={fromId}
        data-to-id={toId}
        data-count={count}
        d={path}
        markerEnd="url(#adv-arrow-circle)"
      />
      <text
        className="adv-edge-label circular"
        x={(startX + endX) / 2}
        y={bottomY + 2}
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}
