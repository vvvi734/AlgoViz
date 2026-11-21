import { useI18n } from '../../i18n/I18nProvider';
import type {
  GeneralizedListVisualModel,
  GlTreeLayout,
  GlVisualNode,
} from '../../domain/visualization/glModel';
import '../../styles/gl01.css';

function operationKey(model: GeneralizedListVisualModel): string {
  if (model.mode === 'copy') {
    const keys: Record<string, string> = {
      init: 'glCopyOpInit',
      enter: 'glCopyOpEnter',
      'alloc-list': 'glCopyOpAlloc',
      'copy-atom': 'glCopyOpAtom',
      'copy-empty': 'glCopyOpEmpty',
      inspect: 'glCopyOpInspect',
      return: 'glCopyOpReturn',
      done: 'glCopyOpDone',
    };
    return keys[model.operation] ?? 'glCopyOpInit';
  }
  const keys: Record<string, string> = {
    init: 'glDepthOpInit',
    enter: 'glDepthOpEnter',
    'atom-return': 'glDepthOpAtom',
    'empty-return': 'glDepthOpEmpty',
    return: 'glDepthOpReturn',
    done: 'glDepthOpDone',
  };
  return keys[model.operation] ?? 'glDepthOpInit';
}

function statusText(model: GeneralizedListVisualModel, t: (key: string) => string): string {
  const level = String(model.depthLevel);
  if (model.operation === 'init') {
    return model.mode === 'depth'
      ? t('glStatusDepthInit').replace('{expression}', model.expression)
      : t('glStatusCopyInit').replace('{expression}', model.expression);
  }
  if (model.operation === 'done') {
    if (model.mode === 'depth') {
      return t('glStatusDepthDone').replace('{depth}', String(model.resultDepth ?? '—'));
    }
    return t('glStatusCopyDone')
      .replace('{count}', String(model.copiedCount))
      .replace('{expression}', model.resultExpression ?? model.expression);
  }
  if (model.operation === 'enter') {
    return t(model.mode === 'depth' ? 'glStatusEnterDepth' : 'glStatusEnterCopy')
      .replace('{level}', level);
  }
  if (model.operation === 'atom-return') {
    return t('glStatusAtomReturn').replace('{level}', level);
  }
  if (model.operation === 'empty-return') {
    return t('glStatusEmptyReturn').replace('{level}', level);
  }
  if (model.operation === 'return' && model.mode === 'depth') {
    return t('glStatusReturn')
      .replace('{max}', String(model.maxChildDepth ?? 0))
      .replace('{depth}', String(model.currentDepth ?? 0))
      .replace('{level}', level);
  }
  if (model.operation === 'alloc-list') {
    return t('glStatusAlloc').replace('{copy}', model.copyId ?? '—');
  }
  if (model.operation === 'copy-atom') {
    return t('glStatusCopyAtom')
      .replace('{source}', model.activeId ?? '—')
      .replace('{copy}', model.copyId ?? '—');
  }
  if (model.operation === 'copy-empty') {
    return t('glStatusCopyEmpty').replace('{copy}', model.copyId ?? '—');
  }
  if (model.operation === 'inspect') {
    return t('glStatusInspect')
      .replace('{source}', model.activeId ?? '—')
      .replace('{copy}', model.copyId ?? '—');
  }
  if (model.operation === 'return') {
    return t('glStatusCopyReturn')
      .replace('{copy}', model.copyId ?? '—')
      .replace('{level}', level);
  }
  return t('glStatusIdle');
}

function toneClass(node: GlVisualNode): string {
  return `gl-node is-${node.tone} is-${node.kind}${node.empty ? ' is-empty' : ''}`;
}

function nodeLabel(node: GlVisualNode, t: (key: string) => string): string {
  if (node.kind === 'atom') return node.atom ?? '';
  return node.empty ? '()' : t('glListTag');
}

function TreeSvg({
  layout,
  label,
  testId,
}: {
  layout: GlTreeLayout;
  label: string;
  testId: string;
}) {
  const { t } = useI18n();
  return (
    <div className="gl-svg-wrap" data-testid={testId}>
      <svg
        className="gl-svg"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label={label}
      >
        {layout.edges.map((edge) => {
          const from = layout.nodes.find((node) => node.id === edge.from);
          const to = layout.nodes.find((node) => node.id === edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              className="gl-edge"
              x1={from.x}
              y1={from.y + from.height / 2}
              x2={to.x}
              y2={to.y - to.height / 2}
            />
          );
        })}
        {layout.nodes.map((node) => (
          <g
            key={node.id}
            className={toneClass(node)}
            data-testid={`gl-node-${node.id}`}
            data-kind={node.kind}
            data-tone={node.tone}
            data-depth={node.depth ?? ''}
            data-source={node.sourceId ?? ''}
          >
            <title>{node.sourceId ? `${node.id} ← ${node.sourceId}` : node.id}</title>
            <rect
              className="gl-node-box"
              x={node.x - node.width / 2}
              y={node.y - node.height / 2}
              width={node.width}
              height={node.height}
              rx={node.kind === 'atom' ? node.height / 2 : 8}
            />
            <text
              className="gl-node-label"
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
            >
              {nodeLabel(node, t)}
            </text>
            {node.depth !== null ? (
              <text
                className="gl-depth-badge"
                x={node.x + node.width / 2 - 2}
                y={node.y + node.height / 2 + 15}
                textAnchor="end"
                data-testid={`gl-depth-${node.id}`}
              >
                d={node.depth}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * 广义表主画布：深度模式显示原树与深度账本；复制模式并排显示原树和新树。
 * 所有节点身份、当前焦点和返回深度都直接来自真实 Trace 快照。
 */
export function GeneralizedListVisual({ model }: { model: GeneralizedListVisualModel }) {
  const { t } = useI18n();
  const status = statusText(model, t);
  const activeNode = model.original.nodes.find((node) => node.id === model.activeId) ?? null;
  const activeLabel = activeNode
    ? activeNode.kind === 'atom'
      ? activeNode.atom ?? ''
      : activeNode.empty
        ? '()'
        : t('glListTag')
    : '—';

  return (
    <div
      className={`gl-visual gl-${model.mode}`}
      data-testid="gl-visual"
      data-mode={model.mode}
      data-operation={model.operation}
      data-active={model.activeId ?? ''}
      data-copy={model.copyId ?? ''}
      data-result-depth={model.resultDepth ?? ''}
      data-copied={model.copiedCount}
      role="group"
      aria-label={t(model.mode === 'depth' ? 'glDepthVisualLabel' : 'glCopyVisualLabel')}
    >
      <div className="gl-topline">
        <span className="gl-op-chip" data-testid="gl-operation">{t(operationKey(model))}</span>
        <span className="gl-level-chip" data-testid="gl-level">
          {t('glLevelChip').replace('{level}', String(model.depthLevel))}
        </span>
        <span className="gl-active-chip" data-testid="gl-active">
          {t('glActiveChip').replace('{node}', model.activeId ?? '—').replace('{label}', activeLabel)}
        </span>
        {model.mode === 'depth' ? (
          <span className="gl-metric-chip" data-testid="gl-result-depth">
            {t('glResultDepthChip').replace('{depth}', String(model.resultDepth ?? '—'))}
          </span>
        ) : (
          <span className="gl-metric-chip" data-testid="gl-copied-count">
            {t('glCopiedChip')
              .replace('{count}', String(model.copiedCount))
              .replace('{total}', String(model.totalNodes))}
          </span>
        )}
      </div>

      <p className={`gl-status ${model.operation === 'done' ? 'is-done' : ''}`} data-testid="gl-status">
        {status}
      </p>

      <div className={`gl-body ${model.mode === 'copy' ? 'has-two-trees' : ''}`}>
        <section className="gl-tree-panel" data-testid="gl-original-panel">
          <header className="gl-panel-head">
            <h3>{t(model.mode === 'depth' ? 'glOriginalTreeDepth' : 'glOriginalTreeCopy')}</h3>
            <span className="note muted">{model.expression}</span>
          </header>
          <TreeSvg layout={model.original} label={t('glOriginalTreeLabel')} testId="gl-original-tree" />
        </section>

        {model.mode === 'copy' ? (
          <section className="gl-tree-panel is-copy" data-testid="gl-copy-panel">
            <header className="gl-panel-head">
              <h3>{t('glCopyTree')}</h3>
              <span className="note muted">
                {model.copy ? t('glCopyTreeHint') : t('glCopyWaiting')}
              </span>
            </header>
            {model.copy ? (
              <TreeSvg layout={model.copy} label={t('glCopyTreeLabel')} testId="gl-copy-tree" />
            ) : (
              <div className="gl-empty-copy" data-testid="gl-copy-empty">{t('glCopyWaiting')}</div>
            )}
          </section>
        ) : (
          <section className="gl-ledger" data-testid="gl-depth-ledger">
            <header className="gl-panel-head">
              <h3>{t('glDepthLedger')}</h3>
              <span className="note muted">{t('glDepthLedgerHint')}</span>
            </header>
            <div className="gl-ledger-rows">
              {model.depthRows.length === 0 ? (
                <p className="note muted">{t('glDepthLedgerEmpty')}</p>
              ) : (
                model.depthRows.map((row) => (
                  <div
                    className={`gl-ledger-row${row.active ? ' is-active' : ''}`}
                    key={row.id}
                    data-testid={`gl-depth-row-${row.id}`}
                  >
                    <span className="gl-ledger-id">{row.id}</span>
                    <span className="gl-ledger-label">
                      {row.kind === 'atom' ? row.atom : t('glListTag')}
                    </span>
                    <span className="gl-ledger-value">d = {row.depth}</span>
                  </div>
                ))
              )}
            </div>
            {model.maxChildDepth !== null ? (
              <p className="gl-ledger-formula" data-testid="gl-depth-formula">
                {t('glDepthFormula')
                  .replace('{max}', String(model.maxChildDepth))
                  .replace('{depth}', String(model.currentDepth ?? 0))}
              </p>
            ) : null}
          </section>
        )}
      </div>

      {model.operation === 'done' ? (
        <div className="gl-done-banner" data-testid="gl-done-banner">
          {model.mode === 'depth'
            ? t('glDoneDepth').replace('{depth}', String(model.resultDepth ?? '—'))
            : t('glDoneCopy')
                .replace('{count}', String(model.copiedCount))
                .replace('{expression}', model.resultExpression ?? '')}
        </div>
      ) : null}
    </div>
  );
}
