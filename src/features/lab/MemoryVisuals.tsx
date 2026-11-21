import type { Lang } from '../../i18n/types';
import { useI18n } from '../../i18n/I18nProvider';
import type { FreeListVisualModel } from '../../domain/visualization/freeListModel';
import type { BuddyVisualModel } from '../../domain/visualization/buddyModel';
import type { GcVisualModel } from '../../domain/visualization/gcModel';

const WIDTH = 1000;

export interface StripSegment {
  start: number;
  size: number;
  className: string;
  label: string;
  subLabel?: string;
  headSize?: number;
  tailSize?: number;
}

function tickStep(capacity: number): number {
  if (capacity <= 16) return 2;
  if (capacity <= 32) return 4;
  return 8;
}

function MemoryStrip({
  capacity,
  segments,
  testId,
  ariaLabel,
}: {
  capacity: number;
  segments: StripSegment[];
  testId: string;
  ariaLabel: string;
}) {
  const barX = 24;
  const barY = 26;
  const barW = 952;
  const barH = 82;
  const step = tickStep(capacity);
  const ticks = Array.from({ length: Math.floor(capacity / step) + 1 }, (_, index) => index * step);
  return (
    <svg className="mem-strip" viewBox={`0 0 ${WIDTH} 150`} role="img" aria-label={ariaLabel} data-testid={testId}>
      <rect className="mem-strip-track" x={barX} y={barY} width={barW} height={barH} rx="4" />
      {segments.map((segment) => {
        const width = (segment.size / capacity) * barW;
        const x = barX + (segment.start / capacity) * barW;
        const showBoundary = segment.headSize !== undefined && width >= 44;
        return (
          <g key={`${segment.start}-${segment.size}-${segment.label}`} data-start={segment.start} data-size={segment.size}>
            <rect
              className={`mem-segment ${segment.className}`}
              x={x}
              y={barY}
              width={Math.max(1.5, width)}
              height={barH}
              data-head={segment.headSize}
              data-tail={segment.tailSize}
            >
              <title>
                [{segment.start}, {segment.start + segment.size}) · {segment.size}B
              </title>
            </rect>
            {width >= 26 ? (
              <text className="mem-segment-label" x={x + width / 2} y={barY + 39} textAnchor="middle">
                {segment.label}
              </text>
            ) : null}
            {segment.subLabel && width >= 48 ? (
              <text className="mem-segment-sub" x={x + width / 2} y={barY + 58} textAnchor="middle">
                {segment.subLabel}
              </text>
            ) : null}
            {showBoundary ? (
              <>
                <text className="mem-boundary" x={x + 4} y={barY + 12}>
                  H{segment.headSize}
                </text>
                <text className="mem-boundary" x={x + width - 4} y={barY + barH - 5} textAnchor="end">
                  F{segment.tailSize}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
      {ticks.map((tick) => {
        const x = barX + (tick / capacity) * barW;
        return (
          <g key={tick}>
            <line className="mem-tick" x1={x} x2={x} y1={barY + barH} y2={barY + barH + 6} />
            <text className="mem-address" x={x} y={barY + barH + 21} textAnchor="middle">
              {tick}
            </text>
          </g>
        );
      })}
      <text className="mem-axis-label" x={barX} y={12}>
        0
      </text>
      <text className="mem-axis-label" x={barX + barW} y={12} textAnchor="end">
        {capacity}B
      </text>
    </svg>
  );
}

function decisionText(model: FreeListVisualModel, lang: Lang): string {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  if (model.decision === 'no-fit') return L('没有足够大的连续块', 'No adequate contiguous block');
  if (model.decision === 'too-small') return L('当前块太小，继续扫描', 'Current block is too small');
  if (model.decision === 'fit') return L('满足申请，记录候选', 'Block fits; record candidate');
  if (model.decision === 'split') return L('分裂剩余空间', 'Split the remainder');
  if (model.decision === 'exact') return L('大小正好，直接分配', 'Exact fit; allocate directly');
  if (model.decision === 'isolated') return L('左右都占用，无需合并', 'Both neighbours allocated');
  if (model.decision === 'left-free') return L('左邻空闲，向左合并', 'Left neighbour free');
  if (model.decision === 'right-free') return L('右邻空闲，向右合并', 'Right neighbour free');
  if (model.decision === 'both-free') return L('左右都空闲，依次合并', 'Both neighbours free');
  if (model.decision === 'merged') return L('相邻空闲块已合并', 'Adjacent free blocks merged');
  if (model.decision === 'scan') return L('按地址顺序扫描空闲表', 'Scan the free list in address order');
  if (model.decision === 'done') return L('操作序列完成', 'Operation sequence complete');
  return '—';
}

export function FreeListVisual({ model }: { model: FreeListVisualModel }) {
  const { lang } = useI18n();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const segments: StripSegment[] = model.blocks.map((block) => ({
    start: block.start,
    size: block.size,
    className: [
      block.status === 'free' ? 'is-free' : 'is-allocated',
      block.current ? 'is-current' : '',
      block.candidate ? 'is-candidate' : '',
      block.selected ? 'is-selected' : '',
      block.merging ? 'is-merging' : '',
    ].join(' '),
    label: block.label ?? `${block.size}`,
    subLabel: block.status === 'free' ? L('空闲', 'free') : L('已分配', 'used'),
    headSize: block.headSize,
    tailSize: block.tailSize,
  }));
  return (
    <div
      className="mem-stage"
      data-testid="free-stage"
      data-policy={model.policy}
      data-operation={model.operation}
    >
      <div className="mem-head">
        <span className="mem-badge">
          {model.policy === 'first-fit' ? L('首次适应', 'First Fit') : L('最佳适应', 'Best Fit')}
        </span>
        <span className="mem-metric">
          {L('容量', 'Capacity')} <b>{model.capacity}B</b>
        </span>
        <span className="mem-metric">
          {L('请求', 'Request')}{' '}
          <b>{model.request ? `${model.request.id} · ${model.request.size}B` : '—'}</b>
        </span>
        <span className="mem-decision" data-decision={model.decision ?? ''}>
          {decisionText(model, lang)}
        </span>
      </div>
      <MemoryStrip
        capacity={model.capacity}
        segments={segments}
        testId="free-memory-svg"
        ariaLabel={L('内存块与空闲表', 'Memory blocks and free list')}
      />
      <div className="mem-legend">
        <span><i className="mem-swatch is-free" />{L('空闲块', 'Free')}</span>
        <span><i className="mem-swatch is-allocated" />{L('已分配块', 'Allocated')}</span>
        <span><i className="mem-swatch is-selected" />{L('当前选中', 'Selected')}</span>
        <span><i className="mem-swatch is-current" />{L('检查中', 'Checking')}</span>
      </div>
      <div className="mem-lower">
        <div className="mem-table" data-testid="free-table">
          <div className="mem-table-title">{L('可利用空间表', 'Free-space table')}</div>
          <div className="mem-table-grid">
            <span className="mem-th">{L('起始', 'Start')}</span>
            <span className="mem-th">{L('块大小', 'Size')}</span>
            <span className="mem-th">{L('状态', 'State')}</span>
            {model.freeRows.map((row) => (
              <span className="mem-tr" key={`${row.start}-${row.size}`}>
                <span>{row.start}</span>
                <span>{row.size}B</span>
                <span>{L('空闲', 'free')}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="mem-stats" data-testid="free-stats">
          <span>{L('空闲区', 'Regions')} <b>{model.freeRegionCount}</b></span>
          <span>{L('总空闲', 'Free bytes')} <b>{model.totalFree}</b></span>
          <span>{L('最大连续块', 'Largest')} <b>{model.largestFree}</b></span>
          <span>{L('已分配块', 'Allocated')} <b>{model.allocatedCount}</b></span>
        </div>
      </div>
    </div>
  );
}

export function BuddyVisual({ model }: { model: BuddyVisualModel }) {
  const { lang } = useI18n();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const segments: StripSegment[] = model.segments.map((block) => ({
    start: block.start,
    size: block.size,
    className: [
      block.status === 'free' ? 'is-free' : 'is-allocated',
      block.current ? 'is-current' : '',
      block.selected ? 'is-selected' : '',
      block.buddy ? 'is-buddy' : '',
      block.merged ? 'is-merging' : '',
    ].join(' '),
    label: block.label ?? `${block.size}`,
    subLabel: `L${block.level} · ${block.size}B`,
  }));
  return (
    <div
      className="buddy-stage"
      data-testid="buddy-stage"
      data-operation={model.operation}
      data-max-level={model.maxLevel}
    >
      <div className="mem-head">
        <span className="mem-badge">{L('伙伴系统', 'Buddy system')}</span>
        <span className="mem-metric">{L('容量', 'Capacity')} <b>{model.capacity}B</b></span>
        <span className="mem-metric">
          {L('请求', 'Request')} <b>{model.requestedId ? `${model.requestedId} · ${model.requestedSize}B` : '—'}</b>
        </span>
        <span className="mem-metric">
          {L('目标等级', 'Target level')} <b>{model.targetLevel ?? '—'}</b>
        </span>
        <span className="mem-metric">
          {L('内部碎片', 'Internal frag.')} <b>{model.internalFragment}B</b>
        </span>
      </div>
      <MemoryStrip
        capacity={model.capacity}
        segments={segments}
        testId="buddy-memory-svg"
        ariaLabel={L('伙伴系统内存分区', 'Buddy memory partition')}
      />
      <div className="buddy-state" data-testid="buddy-state">
        <span>{L('当前等级', 'Current level')} <b>{model.currentLevel ?? '—'}</b></span>
        <span>{L('当前地址', 'Current address')} <b>{model.currentStart ?? '—'}</b></span>
        <span>{L('选中块', 'Selected')} <b>{model.selectedStart ?? '—'}</b></span>
        <span>{L('伙伴地址', 'Buddy')} <b>{model.buddyStart ?? '—'}</b></span>
        <span>{L('合并起点', 'Merge start')} <b>{model.mergeStart ?? '—'}</b></span>
        <span>{L('实际块大小', 'Block size')} <b>{model.blockSize ?? '—'}</b></span>
      </div>
      <svg
        className="buddy-tree"
        viewBox={`0 0 ${WIDTH} 400`}
        role="img"
        aria-label={L('伙伴分裂树', 'Buddy split tree')}
        data-testid="buddy-tree-svg"
      >
        {model.nodes
          .filter((node) => node.leftId)
          .map((node) => {
            const child = model.nodes.find((candidate) => candidate.id === node.leftId);
            return child ? (
              <line
                className={`buddy-edge ${node.onPath ? 'is-current' : ''}`}
                key={`${node.id}-${node.leftId}`}
                x1={node.x}
                y1={node.y + 18}
                x2={child.x}
                y2={child.y - 18}
              />
            ) : null;
          })}
        {model.nodes
          .filter((node) => node.rightId)
          .map((node) => {
            const child = model.nodes.find((candidate) => candidate.id === node.rightId);
            return child ? (
              <line
                className={`buddy-edge ${node.onPath ? 'is-current' : ''}`}
                key={`${node.id}-${node.rightId}`}
                x1={node.x}
                y1={node.y + 18}
                x2={child.x}
                y2={child.y - 18}
              />
            ) : null;
          })}
        {model.nodes.map((node) => (
          <g
            key={node.id}
            className={[
              'buddy-node',
              node.status === 'internal' ? 'is-internal' : node.status === 'free' ? 'is-free' : 'is-allocated',
              node.onPath ? 'is-current' : '',
              node.selected ? 'is-selected' : '',
              node.buddy ? 'is-buddy' : '',
            ].join(' ')}
            data-node-id={node.id}
            data-status={node.status}
            data-level={node.level}
          >
            <rect x={node.x - 36} y={node.y - 19} width="72" height="38" rx="7" />
            <text className="buddy-node-main" x={node.x} y={node.y - 3} textAnchor="middle">
              {node.label ? `${node.label} · ${node.size}` : `${node.start}·${node.size}`}
            </text>
            <text className="buddy-node-sub" x={node.x} y={node.y + 12} textAnchor="middle">
              L{node.level}
            </text>
          </g>
        ))}
      </svg>
      <div className="mem-legend">
        <span><i className="mem-swatch is-free" />{L('空闲块', 'Free')}</span>
        <span><i className="mem-swatch is-allocated" />{L('已分配块', 'Allocated')}</span>
        <span><i className="mem-swatch is-buddy" />{L('伙伴候选', 'Buddy candidate')}</span>
        <span><i className="mem-swatch is-selected" />{L('选中/合并', 'Selected / merged')}</span>
      </div>
    </div>
  );
}

export function GarbageCollectionVisual({ model }: { model: GcVisualModel }) {
  const { lang } = useI18n();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const segments: StripSegment[] = model.segments.map((segment) =>
    segment.kind === 'free'
      ? {
          start: segment.start,
          size: segment.size,
          className: 'is-free',
          label: `${segment.size}`,
          subLabel: L('空闲', 'free'),
        }
      : {
          start: segment.start,
          size: segment.size,
          className: ['is-allocated', segment.current ? 'is-current' : '', segment.marked ? 'is-selected' : ''].join(' '),
          label: segment.label ?? '',
          subLabel: `@${segment.start}`,
        },
  );
  const markerId = 'gc-arrow-head';
  const position = (id: string) => model.nodes.find((node) => node.id === id);
  return (
    <div className="gc-stage" data-testid="gc-stage" data-mode={model.mode} data-operation={model.operation}>
      <div className="mem-head">
        <span className="mem-badge">{model.mode === 'mark-sweep' ? 'Mark-Sweep' : L('标记—紧缩', 'Mark-Compact')}</span>
        <span className="mem-metric">{L('容量', 'Capacity')} <b>{model.capacity}B</b></span>
        <span className="mem-metric">{L('存活', 'Live')} <b>{model.liveBytes}B</b></span>
        <span className="mem-metric">{L('空闲', 'Free')} <b>{model.freeBytes}B</b></span>
        <span className="mem-decision">
          {L('根', 'Roots')}: <b>{model.roots.join(', ') || '∅'}</b>
        </span>
      </div>
      <svg
        className="gc-graph-svg"
        viewBox={`0 0 ${WIDTH} 320`}
        role="img"
        aria-label={L('对象引用图', 'Object reference graph')}
        data-testid="gc-graph-svg"
      >
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path className="gc-arrow" d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        {model.refs.map((ref) => {
          const from = position(ref.fromId);
          const to = position(ref.toId);
          if (!from || !to) return null;
          const same = ref.fromId === ref.toId;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const length = Math.hypot(dx, dy) || 1;
          const targetX = to.x - (dx / length) * 28;
          const targetY = to.y - (dy / length) * 28;
          return (
            <g
              key={ref.id}
              className={['gc-ref', ref.live ? 'is-live' : 'is-dead', ref.updated ? 'is-updated' : ''].join(' ')}
              data-ref-id={ref.id}
              data-from={ref.fromId}
              data-to={ref.toId}
            >
              {same ? (
                <path
                  className="gc-ref-line"
                  d={`M ${from.x - 18} ${from.y - 22} C ${from.x - 58} ${from.y - 62}, ${from.x + 58} ${from.y - 62}, ${from.x + 18} ${from.y - 22}`}
                  markerEnd={`url(#${markerId})`}
                />
              ) : (
                <line
                  className="gc-ref-line"
                  x1={from.x + (dx / length) * 26}
                  y1={from.y + (dy / length) * 26}
                  x2={targetX}
                  y2={targetY}
                  markerEnd={`url(#${markerId})`}
                />
              )}
            </g>
          );
        })}
        {model.nodes.map((node) => (
          <g
            key={node.id}
            className={[
              'gc-node',
              node.root ? 'is-root' : '',
              node.marked ? 'is-marked' : '',
              node.status === 'free' ? 'is-free' : '',
              node.current ? 'is-current' : '',
              node.target ? 'is-target' : '',
            ].join(' ')}
            data-node-id={node.id}
            data-status={node.status}
            data-marked={node.marked}
            data-root={node.root}
            transform={`translate(${node.x} ${node.y})`}
          >
            <circle className="gc-node-dot" r="25" />
            <text className="gc-node-id" x="0" y="4" textAnchor="middle">
              {node.id}
            </text>
            <text className="gc-node-meta" x="0" y="42" textAnchor="middle">
              {node.size}B @{node.start}
            </text>
            {node.root ? (
              <text className="gc-root-badge" x="0" y="-35" textAnchor="middle">
                {L('根', 'ROOT')}
              </text>
            ) : null}
            {node.previousStart !== null && node.previousStart !== node.start ? (
              <text className="gc-node-moved" x="0" y="56" textAnchor="middle">
                {node.previousStart}→{node.start}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <div className="gc-set-row" data-testid="gc-marked-set">
        <span>{L('根集合', 'Roots')}: <b>{model.roots.join(', ') || '∅'}</b></span>
        <span>{L('已标记', 'Marked')}: <b>{model.markedIds.join(', ') || '∅'}</b></span>
        <span>{L('待访问栈', 'Stack')}: <b>{model.stackIds.join(', ') || '∅'}</b></span>
      </div>
      <MemoryStrip
        capacity={model.capacity}
        segments={segments}
        testId="gc-memory-svg"
        ariaLabel={L('对象内存与空闲区', 'Object memory and free spans')}
      />
      <div className="mem-legend">
        <span><i className="mem-swatch is-free" />{L('空闲区', 'Free span')}</span>
        <span><i className="mem-swatch is-allocated" />{L('存活对象', 'Live object')}</span>
        <span><i className="mem-swatch is-selected" />{L('已标记', 'Marked')}</span>
        <span><i className="mem-swatch is-current" />{L('当前对象', 'Current')}</span>
      </div>
      <div className="gc-stats" data-testid="gc-stats">
        <span>{L('空闲区数', 'Free regions')} <b>{model.freeSpans.length}</b></span>
        <span>{L('最大连续空闲', 'Largest free')} <b>{Math.max(0, ...model.freeSpans.map((span) => span.size))}</b></span>
        <span>{L('更新引用', 'Updated refs')} <b>{model.updatedRefIds.length}</b></span>
        <span>
          {L('最近移动', 'Last move')}{' '}
          <b>{model.lastMove ? `${model.lastMove.objectId}: ${model.lastMove.from}→${model.lastMove.to}` : '—'}</b>
        </span>
      </div>
    </div>
  );
}
