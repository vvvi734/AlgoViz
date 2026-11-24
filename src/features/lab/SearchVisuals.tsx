import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { BlockSearchVisualModel } from '../../domain/visualization/blockSearchModel';
import type { BplusVisualModel } from '../../domain/visualization/bplusModel';
import type { KeyTreeVisualModel } from '../../domain/visualization/keyTreeModel';
import '../../styles/search09.css';

const BLOCK_OP_KEY: Record<BlockSearchVisualModel['operation'], string> = {
  init: 'blockSearchOpInit',
  'index-compare': 'blockSearchOpIndexCompare',
  'index-select': 'blockSearchOpIndexSelect',
  'block-compare': 'blockSearchOpBlockCompare',
  found: 'blockSearchOpFound',
  'not-found': 'blockSearchOpNotFound',
  done: 'blockSearchOpDone',
};

export function BlockSearchVisual({ model }: { model: BlockSearchVisualModel }) {
  const { t } = useI18n();
  return (
    <div
      className="block-search-visual"
      data-testid="block-search-visual"
      data-operation={model.operation}
      data-result={model.result ?? ''}
    >
      <div className="search-visual-head">
        <span className="search-op">{t(BLOCK_OP_KEY[model.operation])}</span>
        <span className="search-target">
          {t('blockSearchTarget')} <strong>{model.target}</strong>
        </span>
        <span className="search-count">{t('blockSearchIndexCount')} {model.indexComparisons}</span>
        <span className="search-count">{t('blockSearchBlockCount')} {model.blockComparisons}</span>
        {model.result ? <span className="search-result">{t(model.result === 'found' ? 'blockSearchFound' : 'blockSearchNotFound')}</span> : null}
      </div>

      {model.empty ? (
        <div className="search-empty">{t('blockSearchEmpty')}</div>
      ) : (
        <div className="block-search-body">
          <section className="block-index-panel" aria-label={t('blockSearchIndexTitle')}>
            <h4>{t('blockSearchIndexTitle')}</h4>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>max</th>
                  <th>{t('blockSearchRangeLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {model.indexRows.map((row) => (
                  <tr
                    key={row.index}
                    data-testid="block-index-row"
                    data-index={row.index}
                    data-selected={String(row.selected)}
                    className={[
                      row.selected ? 'is-selected' : '',
                      row.passed ? 'is-passed' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <td>{row.index + 1}</td>
                    <td>{row.max}</td>
                    <td>{row.start}–{row.start + row.length - 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="block-data-panel" aria-label={t('blockSearchBlockTitle')}>
            <h4>{t('blockSearchBlockTitle')}</h4>
            {model.rows.map((row) => (
              <div
                key={row.index}
                className={`block-row${row.selected ? ' is-selected' : ''}`}
                data-testid="block-row"
                data-block-index={row.index}
                data-selected={String(row.selected)}
              >
                <div className="block-row-label">
                  <span>#{row.index + 1}</span>
                  <span>max {row.max}</span>
                  <span>{row.start}–{row.start + row.length - 1}</span>
                </div>
                <div className="block-cells">
                  {row.cells.map((cell) => (
                    <span
                      key={`${row.index}-${cell.position}`}
                      className={[
                        'block-cell',
                        cell.scanned ? 'is-scanned' : '',
                        cell.compared ? 'is-compared' : '',
                        cell.matched ? 'is-matched' : '',
                      ].filter(Boolean).join(' ')}
                      data-testid="block-cell"
                      data-block-index={row.index}
                      data-position={cell.position}
                      data-value={cell.value}
                      data-compared={String(cell.compared)}
                      data-matched={String(cell.matched)}
                    >
                      <small>{row.start + cell.position}</small>
                      {cell.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

const BPLUS_OP_KEY: Record<BplusVisualModel['operation'], string> = {
  init: 'bplusOpInit',
  'inspect-internal': 'bplusOpInspectInternal',
  descend: 'bplusOpDescend',
  'inspect-leaf': 'bplusOpInspectLeaf',
  found: 'bplusOpFound',
  'not-found': 'bplusOpNotFound',
  duplicate: 'bplusOpDuplicate',
  'insert-leaf': 'bplusOpInsertLeaf',
  'split-leaf': 'bplusOpSplitLeaf',
  'split-internal': 'bplusOpSplitInternal',
  'new-root': 'bplusOpNewRoot',
  'range-start': 'bplusOpRangeStart',
  'range-scan': 'bplusOpRangeScan',
  'range-end': 'bplusOpRangeEnd',
  done: 'bplusOpDone',
};

function numberText(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

export function BplusTreeVisual({ model }: { model: BplusVisualModel }) {
  const { t } = useI18n();
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;
    element.scrollLeft = Math.max(0, (element.scrollWidth - element.clientWidth) / 2);
  }, [model.rootId, model.nodes.length, model.empty]);

  return (
    <div
      className="bplus-visual"
      data-testid="bplus-tree-visual"
      data-operation={model.operation}
      data-result={model.result ?? ''}
      data-root-id={model.rootId ?? ''}
    >
      <div className="search-visual-head">
        <span className="search-op">{t(BPLUS_OP_KEY[model.operation])}</span>
        <span className="search-target">{t('bplusTargetLabel')} <strong>{numberText(model.targetValue)}</strong></span>
        {model.command === 'range' ? (
          <span className="search-count">[{numberText(model.targetValue)}, {numberText(model.rangeEnd)}]</span>
        ) : null}
        {model.rangeKeys.length > 0 ? (
          <span className="search-result">{t('bplusRangeKeys')} {model.rangeKeys.join(', ')}</span>
        ) : null}
      </div>

      {model.empty ? (
        <div className="search-empty">{t('bplusEmpty')}</div>
      ) : (
        <div className="bplus-canvas-scroll" ref={scrollerRef}>
          <svg
            className="bplus-svg"
            width={model.width}
            height={model.height}
            viewBox={`0 0 ${model.width} ${model.height}`}
            role="img"
            aria-label={t('bplusVisualLabel')}
          >
            <defs>
              <marker id="bplus-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" />
              </marker>
            </defs>
            {model.edges.map((edge) => (
              <line
                key={edge.id}
                className={`bplus-edge${edge.onPath ? ' is-on-path' : ''}${edge.selected ? ' is-selected' : ''}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                data-testid="bplus-edge"
                data-slot={edge.slot}
              />
            ))}
            {model.nodes.map((node) => (
              <g
                key={node.id}
                className={[
                  'bplus-node',
                  node.leaf ? 'is-leaf' : 'is-index',
                  node.active ? 'is-current' : '',
                  node.onPath ? 'is-on-path' : '',
                  node.splitLeft ? 'is-split-left' : '',
                  node.splitRight ? 'is-split-right' : '',
                  node.newRoot ? 'is-new-root' : '',
                  node.rangeScanned ? 'is-range-scanned' : '',
                ].filter(Boolean).join(' ')}
                data-testid="bplus-node"
                data-node-id={node.id}
                data-leaf={String(node.leaf)}
                data-active={String(node.active)}
              >
                <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={8} />
                {node.keys.map((key) => (
                  <g
                    key={`${node.id}-${key.index}`}
                    data-testid="bplus-key"
                    data-key-index={key.index}
                    data-key-value={key.value}
                  >
                    {key.compared ? (
                      <rect className="bplus-key-compare" x={key.x} y={node.y + 3} width={key.width} height={node.height - 6} />
                    ) : null}
                    {key.inserted ? (
                      <rect className="bplus-key-inserted" x={key.x} y={node.y + 3} width={key.width} height={node.height - 6} />
                    ) : null}
                    {key.promoted ? (
                      <rect className="bplus-key-promoted" x={key.x} y={node.y + 3} width={key.width} height={node.height - 6} />
                    ) : null}
                    {key.index > 0 ? (
                      <line className="bplus-key-separator" x1={key.x} y1={node.y + 5} x2={key.x} y2={node.y + node.height - 5} />
                    ) : null}
                    <text
                      x={key.x + key.width / 2}
                      y={node.y + node.height / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {numberText(key.value)}
                    </text>
                  </g>
                ))}
                <text className="bplus-node-role" x={node.x + node.width / 2} y={node.y - 8} textAnchor="middle">
                  {node.leaf ? t('bplusLeafTag') : t('bplusIndexTag')}
                </text>
              </g>
            ))}
            {model.leafLinks.map((link) => (
              <line
                key={link.id}
                className={`bplus-leaf-link${link.scanned ? ' is-scanned' : ''}`}
                x1={link.x1}
                y1={link.y1}
                x2={link.x2}
                y2={link.y2}
                markerEnd="url(#bplus-arrow)"
                data-testid="bplus-leaf-link"
                data-from-id={link.fromId}
                data-to-id={link.toId}
              />
            ))}
            {model.split && model.split.promotedKey !== null ? (() => {
              const parent = model.nodes.find((node) => node.id === model.split?.parentId);
              if (!parent) return null;
              const promoted = parent.keys.find((key) => key.value === model.split?.promotedKey);
              if (!promoted) return null;
              return (
                <g className="bplus-promoted" data-testid="bplus-promoted">
                  <rect x={promoted.x + promoted.width / 2 - 54} y={parent.y - 58} width={108} height={24} rx={7} />
                  <text x={promoted.x + promoted.width / 2} y={parent.y - 41} textAnchor="middle">
                    ↑ {numberText(model.split.promotedKey)} · {t(model.split.rootChanged ? 'bplusNewRootTag' : 'bplusPromotedTag')}
                  </text>
                </g>
              );
            })() : null}
          </svg>
        </div>
      )}
      <div className="bplus-foot">
        <span>{t('bplusLeafChain')}: {model.rangeLeafIds.length > 0 ? model.rangeLeafIds.join(' → ') : t('bplusLeafChainHint')}</span>
      </div>
    </div>
  );
}

const KEY_TREE_OP_KEY: Record<KeyTreeVisualModel['operation'], string> = {
  init: 'keyTreeOpInit',
  compare: 'keyTreeOpCompare',
  create: 'keyTreeOpCreate',
  terminal: 'keyTreeOpTerminal',
  found: 'keyTreeOpFound',
  'not-found': 'keyTreeOpNotFound',
  duplicate: 'keyTreeOpDuplicate',
  done: 'keyTreeOpDone',
};

export function KeyTreeVisual({ model }: { model: KeyTreeVisualModel }) {
  const { t } = useI18n();
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;
    element.scrollLeft = Math.max(0, (element.scrollWidth - element.clientWidth) / 2);
  }, [model.nodes.length]);

  return (
    <div
      className="key-tree-visual"
      data-testid="key-tree-visual"
      data-operation={model.operation}
      data-result={model.result ?? ''}
    >
      <div className="search-visual-head">
        <span className="search-op">{t(KEY_TREE_OP_KEY[model.operation])}</span>
        <span className="search-mode">{t(model.mode === 'insert' ? 'keyTreeModeInsert' : 'keyTreeModeFind')}</span>
        <span className="search-target">{t('keyTreeTarget')} <strong>{model.target || '—'}</strong></span>
        <span className="search-count">{t('keyTreeMatched')} {model.matchedLength}</span>
        {model.compareChar ? <span className="search-result">'{model.compareChar}'</span> : null}
      </div>

      <div className="key-tree-body">
        <div className="key-tree-canvas" ref={scrollerRef}>
          <svg
            width={model.width}
            height={model.height}
            viewBox={`0 0 ${model.width} ${model.height}`}
            role="img"
            aria-label={t('keyTreeVisualLabel')}
          >
            {model.edges.map((edge) => (
              <g key={edge.id}>
                <line
                  className={`key-tree-edge${edge.onPath ? ' is-on-path' : ''}`}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  data-testid="key-tree-edge"
                  data-from-id={edge.fromId}
                  data-to-id={edge.toId}
                />
                <text
                  className="key-tree-edge-label"
                  x={(edge.x1 + edge.x2) / 2}
                  y={(edge.y1 + edge.y2) / 2 - 5}
                  textAnchor="middle"
                >
                  {edge.char}
                </text>
              </g>
            ))}
            {model.nodes.map((node) => (
              <g
                key={node.id}
                className={[
                  'key-tree-node',
                  node.onPath ? 'is-on-path' : '',
                  node.active ? 'is-current' : '',
                  node.terminal ? 'is-terminal' : '',
                  node.created ? 'is-created' : '',
                  node.root ? 'is-root' : '',
                ].filter(Boolean).join(' ')}
                data-testid="key-tree-node"
                data-node-id={node.id}
                data-terminal={String(node.terminal)}
                data-char={node.char}
              >
                {node.terminal ? <circle className="key-tree-terminal-ring" cx={node.x} cy={node.y} r={27} /> : null}
                <circle className="key-tree-node-circle" cx={node.x} cy={node.y} r={22} />
                <text className="key-tree-node-char" x={node.x} y={node.y + 6} textAnchor="middle">
                  {node.char}
                </text>
                {node.created ? (
                  <text className="key-tree-created" x={node.x} y={node.y - 30} textAnchor="middle">
                    + {t('keyTreeCreated')}
                  </text>
                ) : null}
              </g>
            ))}
          </svg>
        </div>
        <aside className="key-tree-dictionary">
          <h4>{t('keyTreeDictionary')}</h4>
          <div className="key-tree-chips">
            {model.dictionary.map((word) => (
              <span key={word} className={word === model.target && model.result === 'found' ? 'is-hit' : ''}>
                {word}
              </span>
            ))}
          </div>
          <p>{t('keyTreeTerminalHint')}</p>
        </aside>
      </div>
    </div>
  );
}
