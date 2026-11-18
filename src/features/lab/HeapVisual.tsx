import { useI18n } from '../../i18n/I18nProvider';
import type { CSSProperties } from 'react';
import type { HeapVisualModel } from '../../domain/visualization/heapModel';
import type { MaxHeapOperation } from '../../domain/trace/schema';

const OP_KEY: Record<MaxHeapOperation, string> = {
  init: 'heapOpInit',
  'build-start': 'heapOpBuildStart',
  'heapify-node': 'heapOpHeapify',
  'compare-parent-child': 'heapOpCompareParent',
  'compare-children': 'heapOpCompareChildren',
  swap: 'heapOpSwap',
  'build-done': 'heapOpBuildDone',
  'push-append': 'heapOpPushAppend',
  'extract-select': 'heapOpExtractSelect',
  'replace-root': 'heapOpReplaceRoot',
  'sort-select': 'heapOpSortSelect',
  'swap-to-end': 'heapOpSwapEnd',
  done: 'heapOpDone',
};

const COMMAND_KEY = {
  build: 'heapCommandBuild',
  push: 'heapCommandPush',
  extract: 'heapCommandExtract',
  sort: 'heapCommandSort',
} as const;

const HINT_KEY = {
  build: 'heapHintBuild',
  push: 'heapHintPush',
  extract: 'heapHintExtract',
  sort: 'heapHintSort',
} as const;

function displayValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function nodeClass(node: HeapVisualModel['nodes'][number]): string {
  return [
    'heap-node',
    node.root ? 'is-root' : '',
    node.active ? 'is-active' : '',
    node.onPath ? 'is-on-path' : '',
    node.compareParent || node.compareChild ? 'is-compared' : '',
    node.swapping ? 'is-swapping' : '',
    node.added ? 'is-added' : '',
  ].filter(Boolean).join(' ');
}

function slotClass(slot: HeapVisualModel['slots'][number]): string {
  return [
    'heap-slot',
    slot.inHeap ? '' : 'is-outside',
    slot.root ? 'is-root' : '',
    slot.active ? 'is-active' : '',
    slot.onPath ? 'is-on-path' : '',
    slot.compareParent || slot.compareChild ? 'is-compared' : '',
    slot.swapping ? 'is-swapping' : '',
    slot.added ? 'is-added' : '',
    slot.sorted ? 'is-sorted' : '',
  ].filter(Boolean).join(' ');
}

function edgeClass(edge: HeapVisualModel['edges'][number], model: HeapVisualModel): string {
  const pathSet = new Set(model.pathSlots);
  const onPath = pathSet.has(edge.parentSlot) && pathSet.has(edge.childSlot);
  const active = edge.parentSlot === model.activeSlot || edge.childSlot === model.activeSlot;
  return ['heap-edge', onPath ? 'is-on-path' : '', active ? 'is-active' : ''].filter(Boolean).join(' ');
}

export function HeapVisual({ model }: { model: HeapVisualModel }) {
  const { t } = useI18n();
  const nodesBySlot = new Map(model.nodes.map((node) => [node.slot, node]));
  const sortedDividerSlot = model.sortedFrom;
  const opText = t(OP_KEY[model.operation]);
  const hint = t(HINT_KEY[model.command]);
  const wideStyle = model.wide
    ? ({
        '--heap-wide-width': `${Math.ceil(model.layoutWidth)}px`,
        '--heap-wide-height': `${Math.ceil(model.layoutHeight)}px`,
      } as CSSProperties)
    : undefined;
  const valueSize = Math.max(11, Math.round(model.nodeRadius * 0.62));
  const idSize = Math.max(7, Math.round(model.nodeRadius * 0.3));
  const slotSize = Math.max(8, Math.round(model.nodeRadius * 0.32));

  return (
    <div
      className="heap-visual"
      data-testid="heap-visual"
      data-command={model.command}
      data-operation={model.operation}
      data-preset={model.preset ?? ''}
      data-total={model.totalSize}
      data-heap-size={model.heapSize}
      data-sorted-from={model.sortedFrom ?? ''}
      data-layout-width={Math.round(model.layoutWidth)}
      data-layout-height={Math.round(model.layoutHeight)}
      role="img"
      aria-label={t('heapVisualLabel')}
    >
      <div className="heap-topbar">
        <div className="heap-op-group">
          <span className="heap-command" data-testid="heap-command">{t(COMMAND_KEY[model.command])}</span>
          <span className="heap-op" data-testid="heap-op">{opText}</span>
        </div>
        <div className="heap-metrics">
          <span className="heap-metric" data-testid="heap-size">
            <span>{t('heapSizeLabel')}</span><b>{model.heapSize}/{model.totalSize}</b>
          </span>
          <span className="heap-metric" data-testid="heap-root">
            <span>ROOT</span><b>{model.rootSlot === null ? '∅' : `#0 · ${displayValue(model.nodes.find((node) => node.slot === 0)?.value)}`}</b>
          </span>
          {model.sortedFrom !== null && (
            <span className="heap-metric" data-testid="heap-sorted-from">
              <span>{t('heapSortedLabel')}</span><b>#{model.sortedFrom}</b>
            </span>
          )}
        </div>
      </div>

      <div className="heap-main">
        <div className="heap-tree-panel" data-testid="heap-tree-panel">
          {model.empty ? (
            <div className="heap-empty" data-testid="heap-empty">
              <span className="heap-empty-mark">∅</span>
              <span>{model.label}</span>
            </div>
          ) : model.nodes.length === 0 ? (
            <div className="heap-empty is-range-empty" data-testid="heap-range-empty">
              <span className="heap-empty-mark">∅</span>
              <span>{t('heapRangeEmpty')}</span>
            </div>
          ) : (
            <div className="heap-tree-scroll" data-testid="heap-tree-scroll">
              <svg
                className={`heap-svg${model.wide ? ' is-wide' : ''}`}
                viewBox={`0 0 ${model.layoutWidth} ${model.layoutHeight}`}
                preserveAspectRatio="xMidYMid meet"
                data-layout-width={Math.round(model.layoutWidth)}
                data-layout-height={Math.round(model.layoutHeight)}
                style={wideStyle}
                aria-label={t('heapTreeLabel')}
              >
                <g className="heap-edges">
                  {model.edges.map((edge) => {
                    const parent = nodesBySlot.get(edge.parentSlot);
                    const child = nodesBySlot.get(edge.childSlot);
                    if (!parent || !child) return null;
                    const dx = child.x - parent.x;
                    const dy = child.y - parent.y;
                    const length = Math.max(1, Math.hypot(dx, dy));
                    const radius = model.nodeRadius;
                    const ux = dx / length;
                    const uy = dy / length;
                    return (
                      <line
                        key={`${edge.parentSlot}-${edge.childSlot}`}
                        className={edgeClass(edge, model)}
                        data-testid="heap-edge"
                        data-from-slot={edge.parentSlot}
                        data-to-slot={edge.childSlot}
                        data-side={edge.side}
                        x1={parent.x + ux * (radius + 2)}
                        y1={parent.y + uy * (radius + 2)}
                        x2={child.x - ux * (radius + 3)}
                        y2={child.y - uy * (radius + 3)}
                      />
                    );
                  })}
                </g>
                {model.nodes.map((node) => (
                  <g
                    key={node.id}
                    className={nodeClass(node)}
                    data-testid="heap-node"
                    data-node-id={node.id}
                    data-value={displayValue(node.value)}
                    data-slot={node.slot}
                    data-depth={node.depth}
                    data-root={String(node.root)}
                    data-active={String(node.active)}
                    data-on-path={String(node.onPath)}
                    data-compared={String(node.compareParent || node.compareChild)}
                    data-swapping={String(node.swapping)}
                    data-added={String(node.added)}
                    transform={`translate(${node.x} ${node.y})`}
                  >
                    <circle className="heap-node-circle" r={model.nodeRadius} />
                    <text className="heap-node-id" y={-model.nodeRadius + 9} fontSize={idSize}>{node.id}</text>
                    <text className="heap-node-value" y={5} fontSize={valueSize}>{displayValue(node.value)}</text>
                    <text className="heap-node-slot" y={model.nodeRadius - 7} fontSize={slotSize}>#{node.slot}</text>
                    {node.root && (
                      <text className="heap-node-role" y={-model.nodeRadius - 4} fontSize={slotSize}>
                        {t('heapRootTag')}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>

        <div className="heap-array-panel" data-testid="heap-array-panel">
          <div className="heap-array-head">
            <span>{t('heapArrayLabel')}</span>
            <span className="heap-array-formula">2i+1 · 2i+2 · ⌊(i-1)/2⌋</span>
          </div>
          <div className="heap-array-list" data-testid="heap-array-list">
            {model.slots.length === 0 ? (
              <span className="heap-array-empty">∅</span>
            ) : (
              model.slots.map((slot) => (
                <div key={slot.id} className="heap-array-row-wrap">
                  {sortedDividerSlot === slot.slot && (
                    <div className="heap-array-divider" data-testid="heap-sorted-divider">
                      {t('heapSortedDivider')}
                    </div>
                  )}
                  <div
                    className={slotClass(slot)}
                    data-testid="heap-slot"
                    data-slot={slot.slot}
                    data-node-id={slot.id}
                    data-value={displayValue(slot.value)}
                    data-in-heap={String(slot.inHeap)}
                    data-active={String(slot.active)}
                    data-root={String(slot.root)}
                    data-sorted={String(slot.sorted)}
                    data-compared={String(slot.compareParent || slot.compareChild)}
                    data-swapping={String(slot.swapping)}
                  >
                    <span className="heap-slot-index">{slot.slot}</span>
                    <span className="heap-slot-id">{slot.id}</span>
                    <b className="heap-slot-value">{displayValue(slot.value)}</b>
                    {slot.sorted && <span className="heap-slot-tag">{t('heapSortedTag')}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="heap-statusbar" data-testid="heap-statusbar">
        <span className="heap-hint">{hint}</span>
        {model.removed && (
          <span className="heap-chip is-removed" data-testid="heap-removed" data-removed-id={model.removed.id}>
            {t('heapRemovedLabel')}: {model.removed.id} · {displayValue(model.removed.value)} @ #0
          </span>
        )}
        {model.replacement && (
          <span className="heap-chip" data-testid="heap-replacement">
            {t('heapReplacementLabel')}: #{model.replacement.fromSlot} → #0
          </span>
        )}
        {model.sortedSuffix.length > 0 && (
          <span className="heap-chip is-sorted" data-testid="heap-sorted-suffix">
            {t('heapSortedLabel')}: {model.sortedSuffix.join(' → ')}
          </span>
        )}
        {model.removed === null && model.sortedSuffix.length === 0 && (
          <span className="heap-chip is-muted" data-testid="heap-operation-note">{opText}</span>
        )}
      </div>
    </div>
  );
}
