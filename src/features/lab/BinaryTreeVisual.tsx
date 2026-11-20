import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { BinaryTreeOperation, BinaryTreeTraversal } from '../../domain/trace/schema';
import type {
  BinaryTreeVisualEdge,
  BinaryTreeVisualModel,
  BinaryTreeVisualNode,
} from '../../domain/visualization/binaryTreeModel';
import { TREE_NODE_H, TREE_NODE_W } from '../../domain/visualization/binaryTreeLayout';

function displayValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const OP_KEY: Record<BinaryTreeOperation, string> = {
  init: 'treeOpInit',
  enter: 'treeOpEnter',
  visit: 'treeOpVisit',
  left: 'treeOpLeft',
  right: 'treeOpRight',
  return: 'treeOpReturn',
  done: 'treeOpDone',
};

const MODE_KEY: Record<BinaryTreeTraversal, string> = {
  preorder: 'treeModePreorder',
  inorder: 'treeModeInorder',
  postorder: 'treeModePostorder',
};

function nodeClass(node: BinaryTreeVisualNode): string {
  return [
    'tree-node',
    node.active ? 'is-current' : '',
    node.visited ? 'is-visited' : '',
    node.onPath ? 'is-on-path' : '',
    node.role === 'root' ? 'is-root' : '',
    node.role === 'leaf' ? 'is-leaf' : '',
  ].filter(Boolean).join(' ');
}

function edgeClass(edge: BinaryTreeVisualEdge): string {
  return [
    'tree-edge',
    edge.onPath ? 'is-on-path' : '',
    edge.active ? 'is-active' : '',
  ].filter(Boolean).join(' ');
}

function TreeEdge({ edge }: { edge: BinaryTreeVisualEdge }) {
  return (
    <line
      className={edgeClass(edge)}
      data-testid="tree-edge"
      data-from-id={edge.fromId}
      data-to-id={edge.toId}
      data-side={edge.side}
      data-on-path={String(edge.onPath)}
      data-active={String(edge.active)}
      x1={edge.x1}
      y1={edge.y1}
      x2={edge.x2}
      y2={edge.y2}
      markerEnd="url(#tree-arrowhead)"
    />
  );
}

export function BinaryTreeVisual({ model }: { model: BinaryTreeVisualModel }) {
  const { t } = useI18n();
  const current = model.nodes.find((node) => node.id === model.currentNodeId);
  const depth = current ? current.depth : null;
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
  }, [model.empty]);

  // A 7-node tree is 728px wide: wider than the desktop split column but well
  // inside a 1024 single column. Shrink to fit down to 75%, then let the
  // scroller take over. This keeps the default tree whole without turning a
  // 40-node tree into unreadable stamps.
  const scale = model.width > 0 && availableWidth > 0
    ? Math.min(1, Math.max(0.75, availableWidth / model.width))
    : 1;
  const canvasWidth = Math.round(model.width * scale);
  const canvasHeight = Math.round(model.height * scale);

  return (
    <div
      className="tree-visual"
      data-testid="tree-visual"
      data-traversal={model.traversal}
      data-operation={model.operation}
      data-root-id={model.rootId ?? ''}
      data-current-id={model.currentNodeId ?? ''}
      data-next-child-id={model.nextChildId ?? ''}
      role="img"
      aria-label={t('treeVisualLabel')}
    >
      <div className="tree-toolbar">
        <div className="tree-op-group">
          <span className="tree-op-label" data-testid="tree-op-label">
            {t(OP_KEY[model.operation])}
          </span>
          <span className="tree-traversal-label" data-testid="tree-mode-label">
            {t(MODE_KEY[model.traversal])}
          </span>
        </div>
      </div>

      <div className="tree-summary-row">
        <div className="tree-path" data-testid="tree-path" data-current-id={model.currentNodeId ?? ''}>
          <span className="tree-summary-label">{t('treePathLabel')}</span>
          {model.pathIds.length === 0 ? (
            <span className="tree-summary-empty">∅</span>
          ) : (
            model.pathIds.map((id, index) => (
              <span key={id} className="tree-path-item" data-node-id={id}>
                {index > 0 && <span className="tree-path-arrow">→</span>}
                <span className="tree-path-value">{labels.get(id) ?? id}</span>
                <span className="tree-path-id">{id}</span>
              </span>
            ))
          )}
          {depth !== null && (
            <span className="tree-depth" data-testid="tree-depth">
              {t('treeDepthLabel')} {depth}
            </span>
          )}
        </div>

        <div className="tree-visited" data-testid="tree-visited-sequence" data-visited-ids={model.visitedIds.join(',')}>
          <span className="tree-summary-label">{t('treeVisitedSequence')}</span>
          {model.visitedIds.length === 0 ? (
            <span className="tree-summary-empty">{t('treeNoVisitYet')}</span>
          ) : (
            model.visitedIds.map((id, index) => (
              <span
                key={id}
                className="tree-visited-item"
                data-testid="tree-visited-item"
                data-node-id={id}
                data-order={index + 1}
              >
                <span className="tree-visited-order">{index + 1}</span>
                {labels.get(id) ?? id}
              </span>
            ))
          )}
        </div>
      </div>

      {model.nodes.length > 1 && (
        <div className="tree-scroll-hint" data-testid="tree-scroll-hint">
          {t('treeScrollHint')}
        </div>
      )}

      {model.empty ? (
        <div className="tree-empty" data-testid="tree-empty">
          <span className="tree-empty-mark">∅</span>
          <span>{t('treeEmpty')}</span>
        </div>
      ) : (
        <div
          className="tree-scroller"
          data-testid="tree-scroller"
          ref={scrollerRef}
          data-scale={scale.toFixed(3)}
        >
          <div
            className="tree-canvas"
            style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
          >
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
              <svg
                className="tree-edges"
                width={model.width}
                height={model.height}
                viewBox={`0 0 ${model.width} ${model.height}`}
                aria-hidden="true"
              >
                <defs>
                  <marker
                    id="tree-arrowhead"
                    markerWidth="7"
                    markerHeight="7"
                    refX="6"
                    refY="3.5"
                    orient="auto"
                  >
                    <path d="M0,0 L7,3.5 L0,7 Z" />
                  </marker>
                </defs>
                {model.edges.map((edge) => (
                  <TreeEdge key={`${edge.fromId}-${edge.toId}`} edge={edge} />
                ))}
              </svg>

              {model.nodes.map((node) => (
                <div
                  key={node.id}
                  className={nodeClass(node)}
                  data-testid="tree-node"
                  data-node-id={node.id}
                  data-value={displayValue(node.value)}
                  data-depth={node.depth}
                  data-active={String(node.active)}
                  data-visited={String(node.visited)}
                  data-order={node.visitOrder ?? ''}
                  data-on-path={String(node.onPath)}
                  data-role={node.role}
                  style={{
                    left: `${node.x - TREE_NODE_W / 2}px`,
                    top: `${node.y - TREE_NODE_H / 2}px`,
                    width: `${TREE_NODE_W}px`,
                    height: `${TREE_NODE_H}px`,
                  }}
                  aria-label={`Node ${node.id}, value ${displayValue(node.value)}, depth ${node.depth}`}
                >
                  <span className="tree-node-value">{displayValue(node.value)}</span>
                  {node.visitOrder !== null && (
                    <span className="tree-node-order" data-testid="tree-node-order">
                      {node.visitOrder}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
