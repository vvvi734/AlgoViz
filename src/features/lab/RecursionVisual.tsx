import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type {
  RecursionNodeModel,
  RecursionNodeStatus,
  RecursionModel,
} from '../../domain/visualization/recursionModel';

const STATUS_CLASS: Record<RecursionNodeStatus, string> = {
  pending: 'is-pending',
  active: 'is-active',
  waiting: 'is-waiting',
  returning: 'is-returning',
  returned: 'is-returned',
};

const STATUS_KEY: Record<Exclude<RecursionNodeStatus, 'returned'>, string> = {
  pending: 'recursionNodePending',
  active: 'recursionNodeActive',
  waiting: 'recursionNodeWaiting',
  returning: 'recursionNodeReturning',
};

function nodeSecondary(node: RecursionNodeModel, t: (key: string) => string): string {
  if (node.status === 'returned') {
    return node.returnValue === null ? t('recursionNodeReturned') : `= ${node.returnValue}`;
  }
  if (node.status === 'returning') {
    const label = t(STATUS_KEY.returning);
    return node.returnValue === null ? label : `${label} ${node.returnValue}`;
  }
  if (node.status === 'active' && node.combine) return node.combine;
  return t(STATUS_KEY[node.status]);
}

/**
 * The main canvas for factorial / fib.
 *
 * It draws only the call graph/tree; the complete live stack with per-frame
 * locals stays in the right rail. Node size is fixed and the container scrolls,
 * so a wide Fibonacci tree never shrinks below a readable font size.
 */
export function RecursionVisual({ model }: { model: RecursionModel }) {
  const { t, b } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const current = model.nodes.find((node) => node.isCurrent);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !current) return;
    const center = current.x + model.nodeWidth / 2;
    const left = center - container.clientWidth / 2;
    if (left > container.scrollLeft + container.clientWidth || left < container.scrollLeft) {
      container.scrollLeft = Math.max(0, left);
    }
    const top = current.y + model.nodeHeight / 2 - container.clientHeight / 2;
    if (
      current.y < container.scrollTop
      || current.y + model.nodeHeight > container.scrollTop + container.clientHeight
    ) {
      container.scrollTop = Math.max(0, top);
    }
  }, [current, model.nodeHeight, model.nodeWidth]);

  const title = model.algorithm === 'factorial'
    ? t('recursionFactorialTitle')
    : t('recursionFibTitle');
  const note = model.kind === 'call-chain'
    ? t('recursionFactorialNote')
    : t('recursionFibNote');

  return (
    <section
      className={`recursion-visual recursion-${model.algorithm}`}
      data-testid="recursion-visual"
      data-kind={model.kind}
      data-algorithm={model.algorithm}
    >
      <header className="recursion-head">
        <div className="recursion-heading">
          <h3>{title}</h3>
          <small>{note}</small>
        </div>
        <div className="recursion-stats" data-testid="recursion-stats">
          <span>{t('recursionCalls')} <b>{model.totalCalls}</b></span>
          <span>{t('recursionDepth')} <b>{model.maxDepth + 1}</b></span>
          <span>{t('recursionReturned')} <b data-testid="recursion-returned-count">{model.returnedCount}</b></span>
          <span>{t('recursionStackDepth')} <b data-testid="recursion-stack-depth">{model.stackDepth}</b></span>
          {model.result !== null ? (
            <span className="recursion-result">{t('recursionResult')} <b data-testid="recursion-result">{model.result}</b></span>
          ) : null}
        </div>
      </header>

      <div className="recursion-legend" aria-label={b('调用状态图例', 'Call state legend')}>
        <span className="is-pending">{t('recursionLegendPending')}</span>
        <span className="is-active">{t('recursionLegendActive')}</span>
        <span className="is-waiting">{t('recursionLegendWaiting')}</span>
        <span className="is-returning">{t('recursionLegendReturning')}</span>
        <span className="is-returned">{t('recursionLegendReturned')}</span>
      </div>

      {model.repeated.length > 0 ? (
        <div className="recursion-repeat-note" data-testid="recursion-repeat-note">
          <span>{t('recursionRepeated')}</span>
          {model.repeated.map((entry) => (
            <span className="recursion-repeat-chip" key={entry.n} data-repeat-n={entry.n}>
              {model.algorithm}({entry.n}) × {entry.count}
            </span>
          ))}
          <small>{t('recursionRepeatHint')}</small>
        </div>
      ) : null}

      <div className="recursion-canvas" ref={scrollRef} data-testid="recursion-canvas">
        <svg
          className="recursion-svg"
          width="100%"
          height={model.height}
          viewBox={`0 0 ${model.width} ${model.height}`}
          preserveAspectRatio="xMinYMin meet"
          role="img"
          aria-label={title}
          data-testid="recursion-tree"
          style={{ minWidth: `${model.width}px` }}
        >
          <defs>
            <marker id={`recursion-arrow-pending-${model.algorithm}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path className="recursion-arrow is-pending" d="M 0 0 L 8 4 L 0 8 z" />
            </marker>
            <marker id={`recursion-arrow-active-${model.algorithm}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path className="recursion-arrow is-active" d="M 0 0 L 8 4 L 0 8 z" />
            </marker>
            <marker id={`recursion-arrow-returned-${model.algorithm}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path className="recursion-arrow is-returned" d="M 0 0 L 8 4 L 0 8 z" />
            </marker>
          </defs>

          {model.links.map((link) => {
            const from = model.nodes.find((node) => node.id === link.from)!;
            const to = model.nodes.find((node) => node.id === link.to)!;
            const startX = from.x + model.nodeWidth / 2;
            const startY = from.y + model.nodeHeight;
            const endX = to.x + model.nodeWidth / 2;
            const endY = to.y;
            const middleY = (startY + endY) / 2;
            return (
              <path
                key={`${link.from}-${link.to}`}
                className={`recursion-link ${STATUS_CLASS[link.status === 'active' ? 'active' : link.status === 'returned' ? 'returned' : 'pending']}`}
                d={`M ${startX} ${startY} C ${startX} ${middleY}, ${endX} ${middleY}, ${endX} ${endY}`}
                markerEnd={`url(#recursion-arrow-${link.status}-${model.algorithm})`}
                data-link-status={link.status}
              />
            );
          })}

          {model.nodes.map((node) => (
            <g
              key={node.id}
              className={`recursion-node ${STATUS_CLASS[node.status]}${node.isCurrent ? ' is-current' : ''}${node.repeatTone !== null ? ` repeat-tone-${node.repeatTone}` : ''}`}
              data-testid={`recursion-node-${node.id}`}
              data-status={node.status}
              data-n={node.n}
              data-current={node.isCurrent ? 'true' : 'false'}
            >
              <title>{`${node.label} · ${nodeSecondary(node, t)}`}</title>
              <rect
                x={node.x}
                y={node.y}
                width={model.nodeWidth}
                height={model.nodeHeight}
                rx="9"
                className="recursion-node-box"
              />
              {node.repeatTone !== null ? (
                <text className="recursion-repeat-badge" x={node.x + model.nodeWidth - 7} y={node.y + 12} textAnchor="end">
                  ×{node.repeatCount}
                </text>
              ) : null}
              <text className="recursion-node-label" x={node.x + model.nodeWidth / 2} y={node.y + 21} textAnchor="middle">
                {node.label}
              </text>
              <text className="recursion-node-value" x={node.x + model.nodeWidth / 2} y={node.y + 40} textAnchor="middle">
                {nodeSecondary(node, t)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {model.pendingCount > 0 ? (
        <p className="recursion-pending-note">{t('recursionPendingNote')}</p>
      ) : null}
    </section>
  );
}
