import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { ThreadedTreeOperation } from '../../domain/trace/schema';
import type { ThreadedNodeModel, ThreadedTreeVisualModel } from '../../domain/visualization/threadedTreeModel';
import { TREE_NODE_H, TREE_NODE_W } from '../../domain/visualization/binaryTreeLayout';

const OP_KEY: Record<ThreadedTreeOperation, string> = {
  init: 'threadedOpInit',
  enter: 'threadedOpEnter',
  'thread-left': 'threadedOpThreadLeft',
  'thread-right': 'threadedOpThreadRight',
  'thread-last': 'threadedOpThreadLast',
  return: 'threadedOpReturn',
  'thread-complete': 'threadedOpThreadComplete',
  start: 'threadedOpStart',
  visit: 'threadedOpVisit',
  'follow-thread': 'threadedOpFollowThread',
  'descend-left': 'threadedOpDescendLeft',
  done: 'threadedOpDone',
};

const PHASE_KEY: Record<ThreadedTreeVisualModel['phase'], string> = {
  thread: 'threadedPhaseThread',
  traverse: 'threadedPhaseTraverse',
  done: 'threadedPhaseDone',
};

function displayValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function nodeClass(node: ThreadedNodeModel): string {
  return [
    'threaded-node',
    `is-${node.tone}`,
    node.role === 'root' ? 'is-root' : '',
    node.role === 'leaf' ? 'is-leaf' : '',
  ].filter(Boolean).join(' ');
}

function nodeAria(node: ThreadedNodeModel): string {
  return `Node ${node.id}, value ${displayValue(node.value)}, ltag ${node.ltag}, rtag ${node.rtag}`;
}

export function ThreadedTreeVisual({ model }: { model: ThreadedTreeVisualModel }) {
  const { t } = useI18n();
  const labels = new Map(model.nodes.map((node) => [node.id, displayValue(node.value)]));
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;
    const measure = () => setAvailableWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = model.width > 0 && availableWidth > 0
    ? Math.min(1, Math.max(0.75, availableWidth / model.width))
    : 1;
  const canvasWidth = Math.round(model.width * scale);
  const canvasHeight = Math.round(model.height * scale);

  return (
    <div
      className="threaded-visual"
      data-testid="threaded-tree-visual"
      data-phase={model.phase}
      data-operation={model.operation}
      data-root-id={model.rootId ?? ''}
      data-current-id={model.currentNodeId ?? ''}
      data-prev-id={model.prevId ?? ''}
      data-threaded-count={model.threadedCount}
      role="img"
      aria-label={t('threadedVisualLabel')}
    >
      <div className="threaded-toolbar">
        <div className="threaded-op-group">
          <span className="threaded-op-label" data-testid="threaded-op-label">
            {t(OP_KEY[model.operation])}
          </span>
          <span className="threaded-phase" data-testid="threaded-phase">
            {t(PHASE_KEY[model.phase])}
          </span>
        </div>
        <div className="threaded-legend" aria-hidden="true">
          <span className="threaded-legend-item"><span className="threaded-legend-child" />{t('threadedLegendChild')}</span>
          <span className="threaded-legend-item"><span className="threaded-legend-thread" />{t('threadedLegendThread')}</span>
        </div>
      </div>

      <div className="threaded-summary-row">
        <div className="threaded-metric" data-testid="threaded-count" data-count={model.threadedCount}>
          <span className="threaded-summary-label">{t('threadedTaggedLabel')}</span>
          <strong>{model.threadedCount}</strong>
        </div>
        <div className="threaded-metric" data-testid="threaded-prev" data-node-id={model.prevId ?? ''}>
          <span className="threaded-summary-label">{t('threadedPrevLabel')}</span>
          {model.prevId ? (
            <span className="threaded-value-chip">{labels.get(model.prevId) ?? model.prevId}<small>{model.prevId}</small></span>
          ) : <span className="threaded-summary-empty">∅</span>}
        </div>
        <div className="threaded-metric" data-testid="threaded-current" data-node-id={model.currentNodeId ?? ''}>
          <span className="threaded-summary-label">{t('threadedCurrentLabel')}</span>
          {model.currentNodeId ? (
            <span className="threaded-value-chip">{labels.get(model.currentNodeId) ?? model.currentNodeId}<small>{model.currentNodeId}</small></span>
          ) : <span className="threaded-summary-empty">∅</span>}
        </div>
        <div className="threaded-metric threaded-metric-wide" data-testid="threaded-visited" data-visited-ids={model.visitedIds.join(',')}>
          <span className="threaded-summary-label">{t('treeVisitedSequence')}</span>
          {model.visitedIds.length === 0 ? (
            <span className="threaded-summary-empty">{t('treeNoVisitYet')}</span>
          ) : model.visitedIds.map((id, index) => (
            <span key={id} className="threaded-visited-item" data-node-id={id} data-order={index + 1}>
              {labels.get(id) ?? id}
            </span>
          ))}
        </div>
      </div>

      <div className="tree-scroll-hint" data-testid="threaded-scroll-hint">{t('treeScrollHint')}</div>

      <div className="tree-scroller threaded-scroller" data-testid="threaded-scroller" ref={scrollerRef}>
        <div className="tree-canvas" style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
          <div
            className="tree-canvas-inner"
            style={{
              width: `${model.width}px`,
              height: `${model.height}px`,
              transform: `scale(${scale})`,
              '--tree-font-floor': `${14 / Math.max(scale, 0.01)}px`,
              '--tree-title-floor': `${18 / Math.max(scale, 0.01)}px`,
            } as CSSProperties}
          >
            <svg className="threaded-edges" width={model.width} height={model.height} viewBox={`0 0 ${model.width} ${model.height}`} aria-hidden="true">
              <defs>
                <marker id="threaded-arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" />
                </marker>
              </defs>
              {model.childEdges.map((edge) => (
                <line
                  key={`child-${edge.fromId}-${edge.toId}`}
                  className="threaded-child-edge"
                  data-testid="threaded-child-edge"
                  data-from-id={edge.fromId}
                  data-to-id={edge.toId}
                  data-side={edge.side}
                  x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
                />
              ))}
              {model.threadEdges.map((edge) => (
                <g key={`thread-${edge.fromId}-${edge.side}`}>
                  <line
                    className={edge.stub ? 'threaded-thread-edge is-stub' : 'threaded-thread-edge'}
                    data-testid="threaded-thread-edge"
                    data-from-id={edge.fromId}
                    data-to-id={edge.toId ?? ''}
                    data-side={edge.side}
                    data-stub={String(edge.stub)}
                    x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
                    markerEnd={edge.stub ? undefined : 'url(#threaded-arrowhead)'}
                  />
                  {edge.stub && (
                    <text className="threaded-stub-mark" x={edge.x2 + (edge.side === 'left' ? -3 : 3)} y={edge.y2} textAnchor={edge.side === 'left' ? 'end' : 'start'}>
                      ∅
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {model.nodes.map((node) => (
              <div
                key={node.id}
                className={nodeClass(node)}
                data-testid="threaded-node"
                data-node-id={node.id}
                data-value={displayValue(node.value)}
                data-ltag={node.ltag}
                data-rtag={node.rtag}
                data-tone={node.tone}
                data-role={node.role}
                style={{
                  left: `${node.x - TREE_NODE_W / 2}px`,
                  top: `${node.y - TREE_NODE_H / 2}px`,
                  width: `${TREE_NODE_W}px`,
                  height: `${TREE_NODE_H}px`,
                }}
                aria-label={nodeAria(node)}
              >
                <span className="threaded-tag threaded-tag-left" data-testid="threaded-ltag">{node.ltag}</span>
                <span className="tree-node-value">{displayValue(node.value)}</span>
                <span className="threaded-tag threaded-tag-right" data-testid="threaded-rtag">{node.rtag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
