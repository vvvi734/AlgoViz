import type { CSSProperties } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { HuffmanOperation } from '../../domain/trace/schema';
import type { HuffmanQueueEntry, HuffmanVisualModel } from '../../domain/visualization/huffmanModel';

const OP_KEY: Record<HuffmanOperation, string> = {
  init: 'huffmanOpInit',
  'merge-select': 'huffmanOpMergeSelect',
  'merge-create': 'huffmanOpMergeCreate',
  'merge-requeue': 'huffmanOpMergeRequeue',
  'build-done': 'huffmanOpBuildDone',
  'encode-start': 'huffmanOpEncodeStart',
  'encode-left': 'huffmanOpEncodeLeft',
  'encode-right': 'huffmanOpEncodeRight',
  'encode-leaf': 'huffmanOpEncodeLeaf',
  done: 'huffmanOpDone',
};

const PHASE_KEY = {
  build: 'huffmanPhaseBuild',
  encode: 'huffmanPhaseEncode',
  done: 'huffmanPhaseDone',
} as const;

const HINT_KEY = {
  build: 'huffmanHintBuild',
  encode: 'huffmanHintEncode',
  done: 'huffmanHintDone',
} as const;

function nodeClass(node: HuffmanVisualModel['nodes'][number]): string {
  return [
    'huffman-node',
    node.root ? 'is-root' : '',
    node.leaf ? 'is-leaf' : 'is-internal',
    node.picked ? 'is-picked' : '',
    node.created ? 'is-created' : '',
    node.active ? 'is-active' : '',
    node.onPath ? 'is-on-path' : '',
    node.encoded ? 'is-encoded' : '',
  ].filter(Boolean).join(' ');
}

function edgeClass(edge: HuffmanVisualModel['edges'][number]): string {
  return [
    'huffman-edge',
    edge.onPath ? 'is-on-path' : '',
    edge.active ? 'is-active' : '',
    edge.picked ? 'is-picked' : '',
  ].filter(Boolean).join(' ');
}

function queueClass(entry: HuffmanQueueEntry): string {
  return [
    'huffman-queue-entry',
    entry.inQueue ? '' : 'is-out',
    entry.picked ? 'is-picked' : '',
    entry.created ? 'is-created' : '',
  ].filter(Boolean).join(' ');
}

function queueSymbol(entry: HuffmanQueueEntry): string {
  return entry.symbol ?? 'Σ';
}

export function HuffmanVisual({ model }: { model: HuffmanVisualModel }) {
  const { t } = useI18n();
  const opText = t(OP_KEY[model.operation]);
  const nodeById = new Map(model.nodes.map((node) => [node.id, node]));
  const treeStyle = {
    width: `${Math.max(model.layoutWidth, 1)}px`,
    height: `${Math.max(model.layoutHeight, 1)}px`,
  } as CSSProperties;
  const hasMetrics = model.wpl !== null;
  const prefixLabel = model.prefix === '' ? '∅' : model.prefix;
  const rawQueue = model.queueIds.length ? model.queueIds.join(' · ') : '[]';
  const pathLabel = model.pathIds.length
    ? model.pathIds.map((id) => {
        const node = nodeById.get(id);
        return node ? (node.symbol ?? `n${id.replace(/^n/, '')}`) : id;
      }).join(' → ')
    : t('huffmanPathEmpty');
  const fixedSummary =
    model.fixedBits !== null && model.fixedBitsPerChar !== null
      ? t('huffmanFixedSummary')
          .replace('{bits}', String(model.fixedBitsPerChar))
          .replace('{total}', String(model.fixedBits))
      : null;

  return (
    <div
      className="huffman-visual"
      data-testid="huffman-visual"
      aria-label={t('huffmanVisualLabel')}
      data-operation={model.operation}
      data-preset={model.preset}
      data-phase={model.phase}
      data-focus={model.focus}
      data-roots={model.roots.length}
      data-node-count={model.nodes.length}
      data-leaf-count={model.leafCount}
      data-total-weight={model.totalWeight}
      data-wpl={model.wpl ?? ''}
      data-total-bits={model.totalBits ?? ''}
      data-fixed-bits={model.fixedBits ?? ''}
      data-layout-width={Math.round(model.layoutWidth)}
      data-layout-height={Math.round(model.layoutHeight)}
      data-single-symbol={model.singleSymbol ? 'true' : 'false'}
    >
      <header className="huffman-topbar">
        <div className="huffman-op-group">
          <span className={`huffman-phase is-${model.phase}`}>{t(PHASE_KEY[model.phase])}</span>
          <span className="huffman-command">{opText}</span>
        </div>
        <div className="huffman-metrics">
          <span className="huffman-metric">
            {t('huffmanMetricLeaf')} <b>{model.leafCount}</b>
          </span>
          <span className="huffman-metric">
            Σw <b>{model.totalWeight}</b>
          </span>
          <span className="huffman-metric" data-testid="huffman-wpl">
            {t('huffmanMetricWpl')} <b>{hasMetrics ? model.wpl : '—'}</b>
          </span>
          <span className="huffman-metric" data-testid="huffman-total-bits">
            {t('huffmanMetricBits')} <b>{model.totalBits ?? '—'}</b>
          </span>
        </div>
      </header>

      <div className="huffman-main">
        <section
          className={`huffman-tree-panel is-focus-${model.focus === 'tree' ? 'on' : 'off'}`}
          data-testid="huffman-tree-panel"
          aria-label={t('huffmanTreeLabel')}
        >
          <div className="huffman-panel-head">
            <span className="huffman-panel-title">{t('huffmanTreeLabel')}</span>
            <span className="huffman-panel-note">
              {model.roots.length > 1
                ? t('huffmanTreeRoots').replace('{count}', String(model.roots.length))
                : model.roots.length === 1
                  ? t('huffmanTreeRootOne')
                  : '∅'}
              {' · '}
              {t('huffmanTreeHint')}
            </span>
          </div>
          <div className="huffman-tree-scroll" data-testid="huffman-tree-scroll">
            {model.empty ? (
              <div className="huffman-tree-empty" data-testid="huffman-empty">
                {t('huffmanEmpty')}
              </div>
            ) : (
              <svg
                className="huffman-svg"
                style={treeStyle}
                width={Math.max(model.layoutWidth, 1)}
                height={Math.max(model.layoutHeight, 1)}
                viewBox={`0 0 ${Math.max(model.layoutWidth, 1)} ${Math.max(model.layoutHeight, 1)}`}
                role="img"
                aria-label={t('huffmanTreeLabel')}
              >
                {model.edges.map((edge) => {
                  const midX = edge.x1 + (edge.x2 - edge.x1) * 0.46;
                  const midY = edge.y1 + (edge.y2 - edge.y1) * 0.46;
                  return (
                    <g
                      key={`${edge.fromId}-${edge.toId}`}
                      className={edgeClass(edge)}
                      data-testid="huffman-edge"
                      data-from-id={edge.fromId}
                      data-to-id={edge.toId}
                      data-side={edge.side}
                      data-bit={edge.bit}
                      data-on-path={edge.onPath ? 'true' : 'false'}
                      data-picked={edge.picked ? 'true' : 'false'}
                    >
                      <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} />
                      <rect x={midX - 8} y={midY - 8} width={16} height={16} rx={5} />
                      <text x={midX} y={midY + 1} textAnchor="middle" dominantBaseline="middle">
                        {edge.bit}
                      </text>
                    </g>
                  );
                })}
                {model.nodes.map((node) => {
                  const x = node.x - 44;
                  const y = node.y - 29;
                  const label = node.symbol
                    ? `${node.symbol} · ${node.weight}`
                    : `internal · ${node.weight}`;
                  return (
                    <g
                      key={node.id}
                      className={nodeClass(node)}
                      data-testid="huffman-node"
                      data-node-id={node.id}
                      data-symbol={node.symbol ?? ''}
                      data-weight={node.weight}
                      data-depth={node.depth}
                      data-root={node.root ? 'true' : 'false'}
                      data-leaf={node.leaf ? 'true' : 'false'}
                      data-picked={node.picked ? 'true' : 'false'}
                      data-created={node.created ? 'true' : 'false'}
                      data-active={node.active ? 'true' : 'false'}
                      data-on-path={node.onPath ? 'true' : 'false'}
                      data-encoded={node.encoded ? 'true' : 'false'}
                      role="img"
                      aria-label={label}
                    >
                      <rect className="huffman-node-box" x={x} y={y} width={88} height={58} rx={11} />
                      <text className="huffman-node-id" x={x + 8} y={y + 12} textAnchor="start">
                        {node.id}
                      </text>
                      {node.root ? (
                        <text className="huffman-node-tag" x={x + 80} y={y + 12} textAnchor="end">
                          {t('huffmanRootTag')}
                        </text>
                      ) : null}
                      <text className="huffman-node-symbol" x={node.x} y={node.y - 7} textAnchor="middle">
                        {node.symbol ?? 'Σ'}
                      </text>
                      <text className="huffman-node-weight" x={node.x} y={node.y + 11} textAnchor="middle">
                        w={node.weight}
                      </text>
                      <text className="huffman-node-code" x={node.x} y={node.y + 24} textAnchor="middle">
                        {node.code ? node.code : node.leaf ? t('huffmanLeafTag') : t('huffmanInternalTag')}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </section>

        <aside
          className={`huffman-queue-panel is-focus-${model.focus === 'queue' ? 'on' : 'off'}`}
          data-testid="huffman-queue-panel"
          aria-label={t('huffmanQueueLabel')}
        >
          <div className="huffman-panel-head">
            <span className="huffman-panel-title">{t('huffmanQueueLabel')}</span>
            <span className="huffman-panel-note">heapq · {model.queueIds.length}</span>
          </div>
          <div className="huffman-queue-body">
            <div className="huffman-queue-note" title={rawQueue}>
              {t('huffmanQueueRaw').replace('{ids}', rawQueue)}
            </div>
            {model.queueEntries.length === 1 &&
            (model.phase !== 'build' || model.operation === 'build-done') ? (
              <div className="huffman-queue-banner" data-testid="huffman-queue-root-only">
                {t('huffmanQueueRootOnly')}
              </div>
            ) : null}
            {model.pickedEntries.map((entry) => (
              <div
                key={`picked-${entry.nodeId}`}
                className={queueClass(entry)}
                data-testid="huffman-queue-picked"
                data-node-id={entry.nodeId}
                data-weight={entry.weight}
                data-in-queue="false"
                data-picked="true"
                data-created="false"
              >
                <span className="huffman-queue-rank is-out">{t('huffmanQueueOut')}</span>
                <span className="huffman-queue-symbol">{queueSymbol(entry)}</span>
                <span className="huffman-queue-weight">{entry.weight}</span>
                <span className="huffman-queue-id">{entry.nodeId}</span>
              </div>
            ))}
            {model.createdEntry ? (
              <div
                className={queueClass(model.createdEntry)}
                data-testid="huffman-queue-created"
                data-node-id={model.createdEntry.nodeId}
                data-weight={model.createdEntry.weight}
                data-in-queue="false"
                data-picked="false"
                data-created="true"
              >
                <span className="huffman-queue-rank is-new">{t('huffmanQueueNew')}</span>
                <span className="huffman-queue-symbol">Σ</span>
                <span className="huffman-queue-weight">{model.createdEntry.weight}</span>
                <span className="huffman-queue-id">{model.createdEntry.nodeId}</span>
              </div>
            ) : null}
            {model.queueEntries.map((entry) => (
              <div
                key={`queue-${entry.nodeId}`}
                className={queueClass(entry)}
                data-testid="huffman-queue-entry"
                data-node-id={entry.nodeId}
                data-weight={entry.weight}
                data-rank={entry.rank}
                data-heap-index={entry.heapIndex ?? ''}
                data-in-queue="true"
                data-picked="false"
                data-created={entry.created ? 'true' : 'false'}
              >
                <span className="huffman-queue-rank">#{entry.rank}</span>
                <span className="huffman-queue-symbol">{queueSymbol(entry)}</span>
                <span className="huffman-queue-weight">{entry.weight}</span>
                <span className="huffman-queue-id">{entry.nodeId}</span>
                {entry.created ? <span className="huffman-queue-tag">{t('huffmanQueueNew')}</span> : null}
              </div>
            ))}
            {model.pickedEntries.length === 0 &&
            !model.createdEntry &&
            model.queueEntries.length === 0 ? (
              <div className="huffman-queue-empty" data-testid="huffman-queue-empty">
                {t('huffmanQueueEmpty')}
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <section
        className={`huffman-code-panel is-focus-${model.focus === 'codes' ? 'on' : 'off'}`}
        data-testid="huffman-code-panel"
        aria-label={t('huffmanCodeLabel')}
      >
        <div className="huffman-code-head">
          <div className="huffman-code-title">
            <span className="huffman-panel-title">{t('huffmanCodeLabel')}</span>
            {fixedSummary ? (
              <span className="huffman-fixed-note" data-testid="huffman-fixed-bits">
                {fixedSummary}
                {model.savingsPercent !== null ? ` · ${t('huffmanSavings').replace('{percent}', String(model.savingsPercent))}` : ''}
              </span>
            ) : null}
          </div>
          <div className="huffman-code-metrics">
            <span className="huffman-metric">
              {t('huffmanMetricWpl')} <b>{hasMetrics ? model.wpl : '—'}</b>
            </span>
            <span className="huffman-metric">
              {t('huffmanMetricBits')} <b>{model.totalBits ?? '—'}</b>
            </span>
          </div>
        </div>
        <div className="huffman-code-scroll">
          {model.codes.length > 0 ? (
            <table className="huffman-code-table">
              <thead>
                <tr>
                  <th>{t('huffmanCodeChar')}</th>
                  <th>{t('huffmanCodeFrequency')}</th>
                  <th>{t('huffmanCodeBits')}</th>
                  <th>{t('huffmanCodeLength')}</th>
                  <th>{t('huffmanCodeContribution')}</th>
                </tr>
              </thead>
              <tbody>
                {model.codes.map((row) => (
                  <tr
                    key={row.nodeId}
                    className={row.active ? 'is-active' : ''}
                    data-testid="huffman-code-row"
                    data-symbol={row.symbol}
                    data-code={row.code}
                    data-length={row.length}
                    data-weight={row.weight}
                    data-contribution={row.contribution}
                    data-active={row.active ? 'true' : 'false'}
                  >
                    <td className="huffman-code-symbol">{row.symbol}</td>
                    <td>{row.weight}</td>
                    <td className="huffman-code-bits">{row.code}</td>
                    <td>{row.length}</td>
                    <td>{row.contribution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="huffman-code-empty" data-testid="huffman-code-empty">
              {model.empty
                ? t('huffmanEmpty')
                : model.phase === 'build'
                  ? t('huffmanCodeBuildEmpty')
                  : t('huffmanCodePending')}
            </div>
          )}
        </div>
        {model.singleSymbol && hasMetrics ? (
          <div className="huffman-note is-warning" data-testid="huffman-single-note">
            {t('huffmanSingleNote')}
          </div>
        ) : null}
        {model.phase === 'done' && !model.empty ? (
          <div className="huffman-note">
            {t('huffmanPrefixNote')} {t('huffmanNonUniqueNote')}
          </div>
        ) : null}
      </section>

      <footer className="huffman-pathbar" data-testid="huffman-active-path" data-prefix={model.prefix}>
        <span className="huffman-path-label">{t('huffmanCurrentPath')}</span>
        <span className="huffman-path-value">{pathLabel}</span>
        <span className="huffman-prefix-label">{t('huffmanCurrentPrefix')}</span>
        <code className="huffman-prefix-value">{prefixLabel}</code>
        <span className="huffman-hint">{t(HINT_KEY[model.phase])}</span>
      </footer>
    </div>
  );
}
