import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { AvlDeleteCase, AvlOperation, AvlResult } from '../../domain/trace/schema';
import type {
  AvlVisualEdge,
  AvlVisualModel,
  AvlVisualNode,
} from '../../domain/visualization/avlModel';
import { TREE_NODE_H, TREE_NODE_W } from '../../domain/visualization/binaryTreeLayout';

function displayValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const OP_KEY: Record<AvlOperation, string> = {
  init: 'avlOpInit',
  inspect: 'avlOpInspect',
  'go-left': 'avlOpLeft',
  'go-right': 'avlOpRight',
  attach: 'avlOpAttach',
  height: 'avlOpHeight',
  balance: 'avlOpBalance',
  imbalance: 'avlOpImbalance',
  'rotate-left': 'avlOpRotateLeft',
  'rotate-right': 'avlOpRotateRight',
  duplicate: 'avlOpDuplicate',
  locate: 'avlOpLocate',
  'not-found': 'avlOpNotFound',
  'delete-leaf': 'avlOpDeleteLeaf',
  'delete-one': 'avlOpDeleteOne',
  'successor-search': 'avlOpSuccessorSearch',
  'successor-found': 'avlOpSuccessorFound',
  'successor-detach': 'avlOpSuccessorDetach',
  transplant: 'avlOpTransplant',
  done: 'avlOpDone',
};

const RESULT_KEY: Record<AvlResult, string> = {
  inserted: 'avlResultInserted',
  duplicate: 'avlResultDuplicate',
  deleted: 'avlResultDeleted',
  missing: 'avlResultMissing',
};

const CASE_KEY: Record<AvlDeleteCase, string> = {
  leaf: 'avlCaseLeaf',
  'one-child': 'avlCaseOne',
  'two-child': 'avlCaseTwo',
};

const COMMAND_KEY = {
  insert: 'avlCommandInsert',
  delete: 'avlCommandDelete',
} as const;

const HINT_BY_COMMAND = {
  insert: 'avlHintInsert',
  delete: 'avlHintDelete',
} as const;

function hintKey(model: AvlVisualModel): string {
  if (model.operation === 'done') return 'avlHintDone';
  if (
    model.operation === 'successor-search' ||
    model.operation === 'successor-found' ||
    model.operation === 'successor-detach' ||
    model.operation === 'transplant'
  ) return 'avlHintSuccessor';
  if (model.rotationCase !== null) return 'avlHintRotate';
  return HINT_BY_COMMAND[model.command];
}

function nodeClass(node: AvlVisualNode): string {
  return [
    'tree-node',
    'bst-node',
    'avl-node',
    node.active ? 'is-current' : '',
    node.compared ? 'is-compared' : '',
    node.onPath ? 'is-on-path' : '',
    node.target ? 'is-target' : '',
    node.successor ? 'is-successor' : '',
    node.inserted ? 'is-inserted' : '',
    node.imbalance ? 'is-imbalance' : '',
    node.pivot ? 'is-pivot' : '',
    node.promoted ? 'is-promoted' : '',
    Math.abs(node.balance) > 1 ? 'is-unbalanced' : '',
    node.role === 'root' ? 'is-root' : '',
    node.role === 'leaf' ? 'is-leaf' : '',
  ].filter(Boolean).join(' ');
}

function edgeClass(edge: AvlVisualEdge): string {
  return [
    'tree-edge',
    edge.onPath ? 'is-on-path' : '',
    edge.active ? 'is-active' : '',
    edge.rotating ? 'is-rotating' : '',
  ].filter(Boolean).join(' ');
}

function TreeEdge({ edge }: { edge: AvlVisualEdge }) {
  return (
    <line
      className={edgeClass(edge)}
      data-testid="avl-edge"
      data-from-id={edge.fromId}
      data-to-id={edge.toId}
      data-side={edge.side}
      data-on-path={String(edge.onPath)}
      data-active={String(edge.active)}
      data-rotating={String(edge.rotating)}
      x1={edge.x1}
      y1={edge.y1}
      x2={edge.x2}
      y2={edge.y2}
      markerEnd="url(#avl-arrowhead)"
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

export function AvlVisual({ model }: { model: AvlVisualModel }) {
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

  // Keep the root in view when a narrow tree canvas is wider than its scroller.
  // Only model identity (not an arbitrary frame) triggers this, so a user's
  // manual horizontal scroll survives ordinary scrubbing.
  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;
    element.scrollLeft = Math.max(0, (element.scrollWidth - element.clientWidth) / 2);
  }, [model.rootId, model.nodes.length, model.empty, availableWidth]);

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
  const rotationActive = model.rotationCase !== null;
  const phaseLabel = model.rotationPhase === 'before'
    ? t('avlPhaseBefore')
    : model.rotationPhase === 'after'
      ? t('avlPhaseAfter')
      : t('avlPhaseDetect');
  const pivotLabel = model.pivotId
    ? `${model.pivotId} · ${labels.get(model.pivotId) ?? model.pivotId}`
    : '∅';
  const promotedLabel = model.promotedId
    ? `${model.promotedId} · ${labels.get(model.promotedId) ?? model.promotedId}`
    : '∅';
  const imbalanceLabel = model.imbalanceId
    ? `${model.imbalanceId} · ${labels.get(model.imbalanceId) ?? model.imbalanceId}`
    : '∅';

  return (
    <div
      className="bst-visual avl-visual"
      data-testid="avl-visual"
      data-command={model.command}
      data-operation={model.operation}
      data-result={model.result ?? ''}
      data-delete-case={model.deleteCase ?? ''}
      data-root-id={model.rootId ?? ''}
      data-current-id={model.currentNodeId ?? ''}
      data-imbalance-id={model.imbalanceId ?? ''}
      data-pivot-id={model.pivotId ?? ''}
      data-promoted-id={model.promotedId ?? ''}
      data-rotation-case={model.rotationCase ?? ''}
      data-rotation-phase={model.rotationPhase ?? ''}
      role="img"
      aria-label={t('avlVisualLabel')}
    >
      <div className="tree-toolbar bst-toolbar">
        <div className="tree-op-group">
          <span className="bst-command" data-testid="avl-command">
            {t('avlCommandLabel')} · {t(COMMAND_KEY[model.command])}
          </span>
          <span className="tree-op-label" data-testid="avl-op-label">
            {t(OP_KEY[model.operation])}
          </span>
          {rotationActive && (
            <span className="avl-rotation-chip" data-testid="avl-rotation-chip" data-case={model.rotationCase ?? ''}>
              {model.rotationCase} · {phaseLabel}
              {model.rotationStep !== null && model.rotationTotal !== null
                ? ` · ${model.rotationStep}/${model.rotationTotal}`
                : ''}
            </span>
          )}
        </div>
        <span className="tree-legend bst-legend">
          <span className="tree-legend-dot current" /> {t('treeCurrentLabel')}
          <span className="tree-legend-dot compared" /> {t('avlComparedLabel')}
          <span className="tree-legend-dot path" /> {t('avlPathLabel')}
          <span className="tree-legend-dot imbalance" /> {t('avlImbalanceLabel')}
        </span>
      </div>

      <div className="bst-metrics">
        <div className="bst-metric" data-testid="avl-target">
          <span className="bst-metric-label">{t('avlTargetLabel')}</span>
          <b>{displayValue(model.targetValue)}</b>
        </div>
        <div className="bst-metric" data-testid="avl-result" data-result={model.result ?? ''}>
          <span className="bst-metric-label">{t('avlResultLabel')}</span>
          <b className={model.result ? `bst-result is-${model.result}` : 'bst-result'}>
            {model.result ? t(RESULT_KEY[model.result]) : t('avlResultPending')}
          </b>
        </div>
        <div className="bst-metric" data-testid="avl-root">
          <span className="bst-metric-label">ROOT</span>
          <b>{model.rootId ?? '∅'} · {rootValue}</b>
        </div>
        <div className="bst-metric avl-current-metric" data-testid="avl-current-height" data-node-id={current?.id ?? ''}>
          <span className="bst-metric-label">{t('avlCurrentNodeLabel')}</span>
          <b>{current ? `${current.id} · ${displayValue(current.value)}` : '∅'}</b>
          {current && (
            <span className="avl-height-pill">
              h={current.height} · bf={current.balance >= 0 ? `+${current.balance}` : current.balance}
            </span>
          )}
        </div>
        {model.command === 'delete' && (
          <div className="bst-metric bst-case-group" data-testid="avl-delete-cases">
            <span className="bst-metric-label">{t('avlDeleteLegend')}</span>
            <div className="bst-cases">
              {(['leaf', 'one-child', 'two-child'] as const).map((item) => (
                <span
                  key={item}
                  className={`bst-case${model.deleteCase === item ? ' is-active' : ''}`}
                  data-testid={`avl-case-${item}`}
                  data-active={String(model.deleteCase === item)}
                >
                  {t(CASE_KEY[item])}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {rotationActive && (
        <div className="avl-rotation-panel" data-testid="avl-rotation" data-case={model.rotationCase ?? ''} data-phase={model.rotationPhase ?? ''}>
          <div className="avl-rotation-item">
            <span className="avl-rotation-label">{t('avlImbalanceLabel')}</span>
            <b>{imbalanceLabel}</b>
          </div>
          <div className="avl-rotation-item">
            <span className="avl-rotation-label">{t('avlPivotLabel')}</span>
            <b>{pivotLabel}</b>
          </div>
          <div className="avl-rotation-item">
            <span className="avl-rotation-label">{t('avlPromotedLabel')}</span>
            <b>{promotedLabel}</b>
          </div>
          <div className="avl-rotation-item avl-rotation-case">
            <span className="avl-rotation-label">{t('avlRotationLabel')}</span>
            <b>{model.rotationCase} · {phaseLabel}{model.rotationStep !== null ? ` (${model.rotationStep}/${model.rotationTotal})` : ''}</b>
          </div>
        </div>
      )}

      <div className="bst-sequences">
        <div className="bst-sequence" data-testid="avl-path" data-current-id={model.currentNodeId ?? ''}>
          <span className="tree-summary-label">{t('avlPathLabel')}</span>
          {model.pathIds.length === 0 ? (
            <span className="tree-summary-empty">{t('avlNoPath')}</span>
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
            <span className="bst-depth" data-testid="avl-depth">
              depth {current.depth} · h {current.height} · bf {current.balance >= 0 ? `+${current.balance}` : current.balance}
            </span>
          )}
        </div>

        <div className="bst-sequence" data-testid="avl-compared" data-compared-ids={model.visitedIds.join(',')}>
          <span className="tree-summary-label">{t('avlComparedLabel')}</span>
          {model.visitedIds.length === 0 ? (
            <span className="tree-summary-empty">{t('avlNoCompared')}</span>
          ) : (
            model.visitedIds.map((id, index) => (
              <SequencePill key={id} id={id} index={index} value={labels.get(id) ?? id} testId="avl-compared-item" />
            ))
          )}
        </div>

        <div className="bst-sequence" data-testid="avl-inorder" data-inorder-ids={model.inorderIds.join(',')}>
          <span className="tree-summary-label">{t('avlInorderLabel')}</span>
          {model.inorderIds.length === 0 ? (
            <span className="tree-summary-empty">∅</span>
          ) : (
            model.inorderIds.map((id, index) => (
              <SequencePill key={id} id={id} index={index} value={labels.get(id) ?? id} testId="avl-inorder-item" />
            ))
          )}
        </div>
      </div>

      <p className="bst-hint" data-testid="avl-hint">{t(hintKey(model))}</p>

      {model.nodes.length > 1 && (
        <div className="tree-scroll-hint" data-testid="avl-scroll-hint">{t('treeScrollHint')}</div>
      )}

      {model.empty ? (
        <div className="tree-empty bst-empty" data-testid="avl-empty">
          <span className="tree-empty-mark">∅</span>
          <span>{t('avlEmpty')}</span>
        </div>
      ) : (
        <div className="tree-scroller" data-testid="avl-scroller" ref={scrollerRef} data-scale={scale.toFixed(3)}>
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
                  <marker id="avl-arrowhead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
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
                  data-testid="avl-node"
                  data-node-id={node.id}
                  data-value={displayValue(node.value)}
                  data-depth={node.depth}
                  data-height={node.height}
                  data-balance={node.balance}
                  data-active={String(node.active)}
                  data-compared={String(node.compared)}
                  data-on-path={String(node.onPath)}
                  data-target={String(node.target)}
                  data-successor={String(node.successor)}
                  data-inserted={String(node.inserted)}
                  data-imbalance={String(node.imbalance)}
                  data-pivot={String(node.pivot)}
                  data-promoted={String(node.promoted)}
                  data-role={node.role}
                  style={{
                    left: `${node.x - TREE_NODE_W / 2}px`,
                    top: `${node.y - TREE_NODE_H / 2}px`,
                    width: `${TREE_NODE_W}px`,
                    height: `${TREE_NODE_H}px`,
                  }}
                  aria-label={`AVL node ${node.id}, value ${displayValue(node.value)}, height ${node.height}, balance ${node.balance}`}
                >
                  <span className="tree-node-value">{displayValue(node.value)}</span>
                  <span className="avl-node-badge" data-testid="avl-node-badge">
                    h{node.height} · {node.balance >= 0 ? `+${node.balance}` : node.balance}
                  </span>
                  {node.target && <span className="bst-node-tag target">{t('avlTargetTag')}</span>}
                  {node.successor && <span className="bst-node-tag successor">{t('avlSuccessorTag')}</span>}
                  {node.inserted && <span className="bst-node-tag inserted">{t('avlInsertedTag')}</span>}
                  {node.imbalance && !node.pivot && <span className="bst-node-tag imbalance">{t('avlImbalanceTag')}</span>}
                  {node.pivot && <span className="bst-node-tag pivot">{t('avlPivotTag')}</span>}
                  {node.promoted && <span className="bst-node-tag promoted">{t('avlPromotedTag')}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(removed || pointerVisible || rootChanged) && (
        <div className="bst-details">
          {removed && (
            <section className="bst-detail" data-testid="avl-removed" data-removed-id={removed.id} data-role={removed.role}>
              <span className="bst-detail-label">{t('avlRemovedLabel')}</span>
              <b>{removed.id} · {displayValue(removed.value)}</b>
              <span className="bst-detail-note">
                {removed.role === 'target' ? t('avlRemovedTarget') : t('avlRemovedSuccessor')}
                {removed.parentId ? ` · parent ${removed.parentId}` : ' · root'}
                {removed.side ? ` · ${removed.side}` : ''}
              </span>
            </section>
          )}

          {pointerVisible && (
            <section className="bst-detail" data-testid="avl-pointer">
              <span className="bst-detail-label">{t('avlPointerChange')}</span>
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
                <span className="bst-detail-note" data-testid="avl-replacement">
                  {t('avlReplacementLabel')}: {model.replacementId} · {labels.get(model.replacementId) ?? model.replacementId}
                </span>
              )}
            </section>
          )}

          {rootChanged && (
            <section className="bst-detail" data-testid="avl-root-change" data-old-root={model.oldRootId ?? ''} data-new-root={model.rootId ?? ''}>
              <span className="bst-detail-label">{t('avlRootChange')}</span>
              <span className="bst-root-change">
                <span>{t('avlRootBefore')} <b>{rootBefore}</b></span>
                <span className="tree-path-arrow">→</span>
                <span>{t('avlRootAfter')} <b>{rootAfter}</b></span>
              </span>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
