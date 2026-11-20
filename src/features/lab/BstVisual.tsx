import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { BstDeleteCase, BstOperation, BstResult } from '../../domain/trace/schema';
import type {
  BstVisualEdge,
  BstVisualModel,
  BstVisualNode,
} from '../../domain/visualization/bstModel';
import { TREE_NODE_H, TREE_NODE_W } from '../../domain/visualization/binaryTreeLayout';

function displayValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const OP_KEY: Record<BstOperation, string> = {
  init: 'bstOpInit',
  inspect: 'bstOpInspect',
  'go-left': 'bstOpLeft',
  'go-right': 'bstOpRight',
  found: 'bstOpFound',
  'not-found': 'bstOpNotFound',
  attach: 'bstOpAttach',
  locate: 'bstOpLocate',
  'delete-leaf': 'bstOpDeleteLeaf',
  'delete-one': 'bstOpDeleteOne',
  'successor-search': 'bstOpSuccessorSearch',
  'successor-found': 'bstOpSuccessorFound',
  'successor-detach': 'bstOpSuccessorDetach',
  transplant: 'bstOpTransplant',
  duplicate: 'bstOpDuplicate',
  done: 'bstOpDone',
};

const RESULT_KEY: Record<BstResult, string> = {
  found: 'bstResultFound',
  'not-found': 'bstResultNotFound',
  inserted: 'bstResultInserted',
  duplicate: 'bstResultDuplicate',
  deleted: 'bstResultDeleted',
  missing: 'bstResultMissing',
};

const CASE_KEY: Record<BstDeleteCase, string> = {
  leaf: 'bstCaseLeaf',
  'one-child': 'bstCaseOne',
  'two-child': 'bstCaseTwo',
};

const COMMAND_KEY = {
  find: 'bstCommandFind',
  insert: 'bstCommandInsert',
  delete: 'bstCommandDelete',
} as const;

const HINT_BY_COMMAND = {
  find: 'bstHintFind',
  insert: 'bstHintInsert',
  delete: 'bstHintDelete',
} as const;

function hintKey(model: BstVisualModel): string {
  if (model.operation === 'done') return 'bstHintDone';
  if (
    model.operation === 'successor-search' ||
    model.operation === 'successor-found' ||
    model.operation === 'successor-detach' ||
    model.operation === 'transplant'
  ) return 'bstHintSuccessor';
  return HINT_BY_COMMAND[model.command];
}

function nodeClass(node: BstVisualNode): string {
  return [
    'tree-node',
    'bst-node',
    node.active ? 'is-current' : '',
    node.compared ? 'is-compared' : '',
    node.onPath ? 'is-on-path' : '',
    node.target ? 'is-target' : '',
    node.successor ? 'is-successor' : '',
    node.inserted ? 'is-inserted' : '',
    node.role === 'root' ? 'is-root' : '',
    node.role === 'leaf' ? 'is-leaf' : '',
  ].filter(Boolean).join(' ');
}

function edgeClass(edge: BstVisualEdge): string {
  return [
    'tree-edge',
    edge.onPath ? 'is-on-path' : '',
    edge.active ? 'is-active' : '',
  ].filter(Boolean).join(' ');
}

function TreeEdge({ edge }: { edge: BstVisualEdge }) {
  return (
    <line
      className={edgeClass(edge)}
      data-testid="bst-edge"
      data-from-id={edge.fromId}
      data-to-id={edge.toId}
      data-side={edge.side}
      data-on-path={String(edge.onPath)}
      data-active={String(edge.active)}
      x1={edge.x1}
      y1={edge.y1}
      x2={edge.x2}
      y2={edge.y2}
      markerEnd="url(#bst-arrowhead)"
    />
  );
}

function SequencePill({
  id,
  index,
  value,
  testId,
}: {
  id: string;
  index: number;
  value: string;
  testId: string;
}) {
  return (
    <span className="bst-seq-pill" data-testid={testId} data-node-id={id} data-order={index + 1}>
      <span className="bst-seq-order">{index + 1}</span>
      <span className="bst-seq-value">{value}</span>
      <span className="bst-seq-id">{id}</span>
    </span>
  );
}

export function BstVisual({ model }: { model: BstVisualModel }) {
  const { t } = useI18n();
  const current = model.nodes.find((node) => node.id === model.currentNodeId);
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

  const scale = model.width > 0 && availableWidth > 0
    ? Math.min(1, Math.max(0.72, availableWidth / model.width))
    : 1;
  const canvasWidth = Math.round(model.width * scale);
  const canvasHeight = Math.round(model.height * scale);
  const removed = model.removed;
  const rootChanged = model.oldRootId !== null && model.rootId !== model.oldRootId;
  const pointerVisible =
    model.operation === 'attach' ||
    model.operation === 'delete-leaf' ||
    model.operation === 'delete-one' ||
    model.operation === 'successor-detach' ||
    model.operation === 'transplant';
  const rootBefore = model.oldRootId ? `${model.oldRootId} · ${labels.get(model.oldRootId) ?? model.oldRootId}` : null;
  const rootAfter = model.rootId ? `${model.rootId} · ${labels.get(model.rootId) ?? model.rootId}` : '∅';
  const rootValue = model.rootId ? labels.get(model.rootId) ?? model.rootId : '∅';

  return (
    <div
      className="bst-visual"
      data-testid="bst-visual"
      data-command={model.command}
      data-operation={model.operation}
      data-result={model.result ?? ''}
      data-delete-case={model.deleteCase ?? ''}
      data-root-id={model.rootId ?? ''}
      data-current-id={model.currentNodeId ?? ''}
      data-successor-id={model.successorId ?? ''}
      data-removed-id={model.removed?.id ?? ''}
      role="img"
      aria-label={t('bstVisualLabel')}
    >
      <div className="tree-toolbar bst-toolbar">
        <div className="tree-op-group">
          <span className="bst-command" data-testid="bst-command">
            {t('bstCommandLabel')} · {t(COMMAND_KEY[model.command])}
          </span>
          <span className="tree-op-label" data-testid="bst-op-label">
            {t(OP_KEY[model.operation])}
          </span>
        </div>
        <span className="tree-legend bst-legend">
          <span className="tree-legend-dot current" /> {t('treeCurrentLabel')}
          <span className="tree-legend-dot compared" /> {t('bstComparedLabel')}
          <span className="tree-legend-dot path" /> {t('bstPathLabel')}
        </span>
      </div>

      <div className="bst-metrics">
        <div className="bst-metric" data-testid="bst-target">
          <span className="bst-metric-label">{t('bstTargetLabel')}</span>
          <b>{displayValue(model.targetValue)}</b>
        </div>
        <div className="bst-metric" data-testid="bst-result" data-result={model.result ?? ''}>
          <span className="bst-metric-label">{t('bstResultLabel')}</span>
          <b className={model.result ? `bst-result is-${model.result}` : 'bst-result'}>
            {model.result ? t(RESULT_KEY[model.result]) : t('bstResultPending')}
          </b>
        </div>
        <div className="bst-metric" data-testid="bst-root">
          <span className="bst-metric-label">ROOT</span>
          <b>{model.rootId ?? '∅'} · {rootValue}</b>
        </div>
        {model.command === 'delete' && (
          <div className="bst-metric bst-case-group" data-testid="bst-delete-cases">
            <span className="bst-metric-label">{t('bstDeleteLegend')}</span>
            <div className="bst-cases">
              {(['leaf', 'one-child', 'two-child'] as const).map((item) => (
                <span
                  key={item}
                  className={`bst-case${model.deleteCase === item ? ' is-active' : ''}`}
                  data-testid={`bst-case-${item}`}
                  data-active={String(model.deleteCase === item)}
                >
                  {t(CASE_KEY[item])}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bst-sequences">
        <div className="bst-sequence" data-testid="bst-path" data-current-id={model.currentNodeId ?? ''}>
          <span className="tree-summary-label">{t('bstPathLabel')}</span>
          {model.pathIds.length === 0 ? (
            <span className="tree-summary-empty">{t('bstNoPath')}</span>
          ) : (
            model.pathIds.map((id, index) => (
              <span key={id} className="tree-path-item" data-node-id={id}>
                {index > 0 && <span className="tree-path-arrow">→</span>}
                <span className="tree-path-value">{labels.get(id) ?? id}</span>
                <span className="tree-path-id">{id}</span>
              </span>
            ))
          )}
          {current && (
            <span className="bst-depth" data-testid="bst-depth">
              depth {current.depth}
            </span>
          )}
        </div>

        <div className="bst-sequence" data-testid="bst-compared" data-compared-ids={model.visitedIds.join(',')}>
          <span className="tree-summary-label">{t('bstComparedLabel')}</span>
          {model.visitedIds.length === 0 ? (
            <span className="tree-summary-empty">{t('bstNoCompared')}</span>
          ) : (
            model.visitedIds.map((id, index) => (
              <SequencePill key={id} id={id} index={index} value={labels.get(id) ?? id} testId="bst-compared-item" />
            ))
          )}
        </div>

        <div className="bst-sequence" data-testid="bst-inorder" data-inorder-ids={model.inorderIds.join(',')}>
          <span className="tree-summary-label">{t('bstInorderLabel')}</span>
          {model.inorderIds.length === 0 ? (
            <span className="tree-summary-empty">∅</span>
          ) : (
            model.inorderIds.map((id, index) => (
              <SequencePill key={id} id={id} index={index} value={labels.get(id) ?? id} testId="bst-inorder-item" />
            ))
          )}
        </div>
      </div>

      <p className="bst-hint" data-testid="bst-hint">{t(hintKey(model))}</p>

      {model.nodes.length > 1 && (
        <div className="tree-scroll-hint" data-testid="bst-scroll-hint">{t('treeScrollHint')}</div>
      )}

      {model.empty ? (
        <div className="tree-empty bst-empty" data-testid="bst-empty">
          <span className="tree-empty-mark">∅</span>
          <span>{t('bstEmpty')}</span>
        </div>
      ) : (
        <div className="tree-scroller" data-testid="bst-scroller" ref={scrollerRef} data-scale={scale.toFixed(3)}>
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
              <svg
                className="tree-edges"
                width={model.width}
                height={model.height}
                viewBox={`0 0 ${model.width} ${model.height}`}
                aria-hidden="true"
              >
                <defs>
                  <marker id="bst-arrowhead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
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
                  data-testid="bst-node"
                  data-node-id={node.id}
                  data-value={displayValue(node.value)}
                  data-depth={node.depth}
                  data-active={String(node.active)}
                  data-compared={String(node.compared)}
                  data-on-path={String(node.onPath)}
                  data-target={String(node.target)}
                  data-successor={String(node.successor)}
                  data-inserted={String(node.inserted)}
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
                  {node.target && <span className="bst-node-tag target">{t('bstTargetTag')}</span>}
                  {node.successor && <span className="bst-node-tag successor">{t('bstSuccessorTag')}</span>}
                  {node.inserted && <span className="bst-node-tag inserted">{t('bstInsertedTag')}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(removed || pointerVisible || rootChanged) && (
        <div className="bst-details">
          {removed && (
            <section className="bst-detail" data-testid="bst-removed" data-removed-id={removed.id} data-role={removed.role}>
              <span className="bst-detail-label">{t('bstRemovedLabel')}</span>
              <b>{removed.id} · {displayValue(removed.value)}</b>
              <span className="bst-detail-note">
                {removed.role === 'target' ? t('bstRemovedTarget') : t('bstRemovedSuccessor')}
                {removed.parentId ? ` · parent ${removed.parentId}` : ' · root'}
                {removed.side ? ` · ${removed.side}` : ''}
              </span>
            </section>
          )}

          {pointerVisible && (
            <section className="bst-detail" data-testid="bst-pointer">
              <span className="bst-detail-label">{t('bstPointerChange')}</span>
              {removed ? (
                <span className="bst-detail-note">
                  parent {removed.parentId ?? '∅'} · {removed.side ?? 'root'} →{' '}
                  {removed.replacementId
                    ? `${removed.replacementId} · ${labels.get(removed.replacementId) ?? removed.replacementId}`
                    : '∅'}
                </span>
              ) : (
                <span className="bst-detail-note">
                  {model.parentId
                    ? `${model.parentId} · ${labels.get(model.parentId) ?? model.parentId}`
                    : 'root'} · {model.side ?? 'root'} →{' '}
                  {model.insertedId
                    ? `${model.insertedId} · ${labels.get(model.insertedId) ?? model.insertedId}`
                    : '∅'}
                </span>
              )}
              {model.replacementId && (
                <span className="bst-detail-note" data-testid="bst-replacement">
                  {t('bstReplacementLabel')}: {model.replacementId} · {labels.get(model.replacementId) ?? model.replacementId}
                </span>
              )}
            </section>
          )}

          {rootChanged && (
            <section className="bst-detail" data-testid="bst-root-change" data-old-root={model.oldRootId ?? ''} data-new-root={model.rootId ?? ''}>
              <span className="bst-detail-label">{t('bstRootChange')}</span>
              <span className="bst-root-change">
                <span>{t('bstRootBefore')} <b>{rootBefore}</b></span>
                <span className="tree-path-arrow">→</span>
                <span>{t('bstRootAfter')} <b>{rootAfter}</b></span>
              </span>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
