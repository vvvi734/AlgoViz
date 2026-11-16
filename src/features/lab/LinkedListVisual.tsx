import { useI18n } from '../../i18n/I18nProvider';
import type { LinkedListVisualModel, LinkedListNodeVisual } from '../../domain/visualization/linkedListModel';

const NODE_W = 88;
const NODE_H = 78;
const GAP = 34;
const NODE_TOP = 58;
const SVG_H = 150;

function displayValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function chainWidth(count: number): number {
  if (count === 0) return 240;
  return count * NODE_W + (count - 1) * GAP + 72;
}

function nodeClass(node: LinkedListNodeVisual): string {
  return [
    'linked-node',
    node.status === 'temporary' ? 'is-temporary' : '',
    node.status === 'detached' ? 'is-detached' : '',
    node.active ? 'is-active' : '',
    node.changed ? 'is-changed' : '',
  ].filter(Boolean).join(' ');
}

function NodeBox({ node }: { node: LinkedListNodeVisual }) {
  const nextLabel = node.nextId ?? 'NULL';
  return (
    <div
      className={nodeClass(node)}
      data-testid="linked-node"
      data-node-id={node.id}
      data-value={displayValue(node.value)}
      data-next-id={node.nextId ?? 'null'}
      data-role={node.role}
      data-reachable={String(node.reachable)}
      data-status={node.status}
      data-active={String(node.active)}
      data-changed={String(node.changed)}
      style={{ left: node.index * (NODE_W + GAP), top: NODE_TOP, width: NODE_W, height: NODE_H }}
      aria-label={`Node ${node.id}, value ${displayValue(node.value)}, next ${nextLabel}`}
    >
      <span className="linked-node-id">{node.id}</span>
      <div className="linked-node-data">{displayValue(node.value)}</div>
      <div
        className="linked-node-next"
        data-testid="linked-next"
        data-target-id={node.nextId ?? 'null'}
      >
        <span>next</span>
        <span className="linked-node-next-target">→ {nextLabel}</span>
      </div>
    </div>
  );
}

export function LinkedListVisual({ model }: { model: LinkedListVisualModel }) {
  const { t } = useI18n();
  const width = chainWidth(model.nodes.length);
  const nullX = model.nodes.length
    ? (model.nodes.length - 1) * (NODE_W + GAP) + NODE_W + GAP
    : 0;

  return (
    <div
      className="linked-visual"
      data-testid="linked-visual"
      data-operation={model.operation}
      data-head-id={model.headId ?? ''}
      role="img"
      aria-label={t('linkedVisualLabel')}
    >
      <div className="linked-toolbar">
        <span className="linked-op-label" data-testid="linked-op-label">
          {model.operation.toUpperCase()}
        </span>
        <span className="linked-legend">
          <span className="linked-legend-dot head" /> {t('linkedHeadLabel')}
          <span className="linked-legend-dot next" /> {t('linkedNextLabel')}
          <span className="linked-legend-dot null" /> {t('linkedNullLabel')}
        </span>
      </div>

      {model.change && (
        <div
          className="linked-change"
          data-testid="linked-change"
          data-node-id={model.change.nodeId}
          data-before-next-id={model.change.beforeNextId ?? 'null'}
          data-after-next-id={model.change.afterNextId ?? 'null'}
        >
          <strong>{model.change.nodeId}</strong>
          <span className="linked-change-label">{t('linkedChangeLabel')}</span>
          <span>{t('linkedBefore')}: {model.change.beforeNextId ?? t('linkedNullLabel')}</span>
          <span className="linked-change-arrow">→</span>
          <span>{t('linkedAfter')}: {model.change.afterNextId ?? t('linkedNullLabel')}</span>
        </div>
      )}

      {model.nodes.length > 3 && (
        <div className="linked-scroll-hint" data-testid="linked-scroll-hint">
          {t('linkedScrollHint')}
        </div>
      )}

      <div className="linked-scroller">
        <div className="linked-chain" style={{ width }}>
          {model.nodes.length > 0 && (
            <div
              className="linked-head"
              data-testid="linked-head"
              data-node-id={model.nodes[0].id}
              style={{ left: 0, top: 4 }}
            >
              {t('linkedHeadLabel')} <span className="linked-head-arrow">↓</span>
            </div>
          )}

          <svg
            className="linked-edges"
            width={width}
            height={SVG_H}
            viewBox={`0 0 ${width} ${SVG_H}`}
            aria-hidden="true"
          >
            <defs>
              <marker id="linked-arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" />
              </marker>
            </defs>
            {model.nodes.length > 0 && (
              <line
                className="linked-head-line"
                data-testid="linked-head-arrow"
                data-node-id={model.nodes[0].id}
                x1={NODE_W / 2}
                y1={26}
                x2={NODE_W / 2}
                y2={NODE_TOP}
                markerEnd="url(#linked-arrowhead)"
              />
            )}
            {model.edges.map((edge) => {
              const fromIndex = model.nodes.findIndex((node) => node.id === edge.fromId);
              const toIndex = model.nodes.findIndex((node) => node.id === edge.toId);
              if (fromIndex < 0 || toIndex < 0) return null;
              const y = NODE_TOP + NODE_H / 2;
              return (
                <line
                  key={`${edge.fromId}-${edge.toId}`}
                  className={`linked-edge${edge.changed ? ' is-changed' : ''}`}
                  data-testid="linked-edge"
                  data-from-id={edge.fromId}
                  data-to-id={edge.toId}
                  data-changed={String(edge.changed)}
                  x1={fromIndex * (NODE_W + GAP) + NODE_W}
                  y1={y}
                  x2={toIndex * (NODE_W + GAP)}
                  y2={y}
                  markerEnd="url(#linked-arrowhead)"
                />
              );
            })}
            {model.nodes.length > 0 && (
              <line
                className="linked-null-line"
                data-testid="linked-null-arrow"
                data-from-id={model.nodes[model.nodes.length - 1].id}
                x1={(model.nodes.length - 1) * (NODE_W + GAP) + NODE_W}
                y1={NODE_TOP + NODE_H / 2}
                x2={nullX}
                y2={NODE_TOP + NODE_H / 2}
                markerEnd="url(#linked-arrowhead)"
              />
            )}
          </svg>

          {model.nodes.map((node) => <NodeBox key={node.id} node={node} />)}

          {model.nodes.length > 0 && (
            <div
              className="linked-null"
              data-testid="linked-null"
              style={{ left: nullX + 6, top: NODE_TOP + 18 }}
            >
              {t('linkedNullLabel')}
            </div>
          )}

          {model.nodes.length === 0 && (
            <div className="linked-empty" data-testid="linked-empty">
              <span className="linked-empty-head">{t('linkedHeadLabel')}</span>
              <span className="linked-empty-arrow">→</span>
              <span className="linked-empty-null">{t('linkedNullLabel')}</span>
              <span className="linked-empty-text">{model.label}</span>
            </div>
          )}
        </div>
      </div>

      {model.detachedNodes.length > 0 && (
        <div className="linked-detached-region" data-testid="linked-detached-region">
          <div className="linked-detached-label">{t('linkedDetached')}</div>
          <div className="linked-detached-list">
            {model.detachedNodes.map((node) => (
              <div
                key={node.id}
                className={`linked-detached-node${node.status === 'temporary' ? ' is-temporary' : ''}${node.changed ? ' is-changed' : ''}`}
                data-testid="linked-detached-node"
                data-node-id={node.id}
                data-value={displayValue(node.value)}
                data-next-id={node.nextId ?? 'null'}
                data-status={node.status}
                data-changed={String(node.changed)}
              >
                <span className="linked-node-id">{node.id}</span>
                <span className="linked-detached-value">{displayValue(node.value)}</span>
                <span className="linked-detached-next" data-testid="linked-detached-next" data-target-id={node.nextId ?? 'null'}>
                  next → {node.nextId ?? t('linkedNullLabel')}
                </span>
                <span className="linked-detached-note">
                  {node.status === 'temporary' ? t('linkedTemporary') : t('linkedDetached')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
