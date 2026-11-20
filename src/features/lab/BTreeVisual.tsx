import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { BtreeOperation } from '../../domain/trace/schema';
import type {
  BTreeEdgeModel,
  BTreeVisualModel,
} from '../../domain/visualization/btreeModel';
import '../../styles/btree.css';

const OP_KEY: Record<BtreeOperation, string> = {
  init: 'btreeOpInit',
  inspect: 'btreeOpInspect',
  descend: 'btreeOpDescend',
  found: 'btreeOpFound',
  'not-found': 'btreeOpNotFound',
  duplicate: 'btreeOpDuplicate',
  split: 'btreeOpSplit',
  insert: 'btreeOpInsert',
  done: 'btreeOpDone',
};

function displayNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

function edgeClass(edge: BTreeEdgeModel): string {
  return [
    'btree-edge',
    edge.onPath ? 'is-on-path' : '',
    edge.selected ? 'is-selected' : '',
    edge.inSubtree ? 'is-in-subtree' : '',
  ].filter(Boolean).join(' ');
}

export function BTreeVisual({ model }: { model: BTreeVisualModel }) {
  const { t } = useI18n();
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;
    element.scrollLeft = Math.max(0, (element.scrollWidth - element.clientWidth) / 2);
  }, [model.rootId, model.nodes.length, model.empty]);

  if (model.empty) {
    return (
      <div className="btree-visual" data-testid="btree-visual" data-empty="true">
        <div className="btree-op-row">
          <span className="btree-op">{t(OP_KEY[model.operation])}</span>
          <span className="btree-order">{t('btreeOrderLabel')}</span>
        </div>
        <div className="btree-empty">{t('btreeEmpty')}</div>
      </div>
    );
  }

  const split = model.split;
  const parent = split?.phase === 'after' && split.parentId
    ? model.nodes.find((node) => node.id === split.parentId)
    : undefined;
  const promotedKey = parent && split?.promotedIndex !== null && split?.promotedIndex !== undefined
    ? parent.keys[split.promotedIndex]
    : undefined;
  const opLabel = model.operation === 'split' && split
    ? t(split.phase === 'before' ? 'btreeOpSplitBefore' : 'btreeOpSplitAfter')
    : t(OP_KEY[model.operation]);

  return (
    <div
      className="btree-visual"
      data-testid="btree-visual"
      data-operation={model.operation}
      data-result={model.result ?? ''}
      data-root-id={model.rootId ?? ''}
      aria-label={t('btreeVisualLabel')}
    >
      <div className="btree-op-row">
        <span className="btree-op">{opLabel}</span>
        <span className="btree-order">{t('btreeOrderLabel')}</span>
      </div>

      <div className="btree-canvas-scroll" ref={scrollerRef}>
        <svg
          className="btree-svg"
          width={model.width}
          height={model.height}
          viewBox={`0 0 ${model.width} ${model.height}`}
          role="img"
          aria-label={t('btreeVisualLabel')}
        >
          {model.edges.map((edge) => (
            <g key={edge.id} data-testid="btree-edge" data-from-id={edge.fromId} data-to-id={edge.toId} data-slot={edge.slot}>
              <line
                className={edgeClass(edge)}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
              />
              <circle
                className={`btree-slot${edge.selected ? ' is-selected' : ''}`}
                cx={edge.x1}
                cy={edge.y1}
                r={4}
              />
            </g>
          ))}

          {model.nodes.map((node) => {
            const inSubtree = model.selectedSubtreeIds.includes(node.id);
            const classes = [
              'btree-node',
              node.active ? 'is-current' : '',
              node.onPath ? 'is-on-path' : '',
              node.selected ? 'is-selected' : '',
              inSubtree && !node.selected ? 'is-subtree' : '',
              node.splitBefore ? 'is-split-before' : '',
              node.splitLeft ? 'is-split-left' : '',
              node.splitRight ? 'is-split-right' : '',
              node.newRoot ? 'is-new-root' : '',
              node.leaf ? 'is-leaf' : '',
            ].filter(Boolean).join(' ');
            return (
              <g
                key={node.id}
                className={classes}
                data-testid="btree-node"
                data-node-id={node.id}
                data-depth={node.depth}
                data-leaf={String(node.leaf)}
                data-active={String(node.active)}
                data-selected={String(node.selected)}
                data-split-before={String(node.splitBefore)}
                data-split-left={String(node.splitLeft)}
                data-split-right={String(node.splitRight)}
                data-new-root={String(node.newRoot)}
              >
                <rect
                  className="btree-node-box"
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx={8}
                />
                {node.keys.map((key) => (
                  <g key={`${node.id}-${key.index}`} data-testid="btree-key" data-key-index={key.index} data-key-value={key.value}>
                    {key.compared ? (
                      <rect
                        className="btree-key-compare"
                        x={key.x}
                        y={node.y + 3}
                        width={key.width}
                        height={node.height - 6}
                      />
                    ) : null}
                    {key.inserted ? (
                      <rect
                        className="btree-key-inserted"
                        x={key.x}
                        y={node.y + 3}
                        width={key.width}
                        height={node.height - 6}
                      />
                    ) : null}
                    {key.promoted ? (
                      <rect
                        className="btree-key-promoted"
                        x={key.x}
                        y={node.y + 3}
                        width={key.width}
                        height={node.height - 6}
                      />
                    ) : null}
                    {key.index > 0 ? (
                      <line
                        className="btree-key-separator"
                        x1={key.x}
                        y1={node.y + 5}
                        x2={key.x}
                        y2={node.y + node.height - 5}
                      />
                    ) : null}
                    <text
                      className="btree-key-text"
                      x={key.x + key.width / 2}
                      y={node.y + node.height / 2 + 6}
                      textAnchor="middle"
                    >
                      {displayNumber(key.value)}
                    </text>
                  </g>
                ))}
                {node.splitBefore ? (
                  <g className="btree-node-tag is-before" data-testid="btree-split-badge">
                    <rect x={node.x + node.width / 2 - 62} y={node.y - 30} width={124} height={22} rx={7} />
                    <text x={node.x + node.width / 2} y={node.y - 15} textAnchor="middle">
                      {t('btreeFullNodeTag')} · {t('btreeBefore')}
                    </text>
                  </g>
                ) : null}
                {node.splitLeft ? (
                  <g className="btree-node-tag is-original" data-testid="btree-split-badge">
                    <rect x={node.x + node.width / 2 - 40} y={node.y - 30} width={80} height={22} rx={7} />
                    <text x={node.x + node.width / 2} y={node.y - 15} textAnchor="middle">
                      {t(split?.rootChanged ? 'btreeOriginalRoot' : 'btreeOriginalNode')}
                    </text>
                  </g>
                ) : null}
                {node.splitRight ? (
                  <g className="btree-node-tag is-new" data-testid="btree-split-badge">
                    <rect x={node.x + node.width / 2 - 40} y={node.y - 30} width={80} height={22} rx={7} />
                    <text x={node.x + node.width / 2} y={node.y - 15} textAnchor="middle">
                      {t('btreeNewNode')}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}

          {split?.phase === 'after' && parent && promotedKey !== undefined ? (
            <g className="btree-promoted" data-testid="btree-promoted">
              <rect
                x={promotedKey.x + promotedKey.width / 2 - 44}
                y={parent.y - 64}
                width={88}
                height={26}
                rx={8}
              />
              <text
                x={promotedKey.x + promotedKey.width / 2}
                y={parent.y - 46}
                textAnchor="middle"
              >
                ↑ {displayNumber(promotedKey.value)} · {t(split.rootChanged ? 'btreeNewRootTag' : 'btreePromotedTag')}
              </text>
              <line
                x1={promotedKey.x + promotedKey.width / 2}
                y1={parent.y - 38}
                x2={promotedKey.x + promotedKey.width / 2}
                y2={parent.y - 2}
              />
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  );
}
