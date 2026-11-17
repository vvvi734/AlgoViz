import type { ReactNode } from 'react';
import { buildVisualModel } from '../../domain/visualization/model';
import type { GraphVisualModel } from '../../domain/visualization/graphModel';
import type { GraphOperation } from '../../domain/trace/schema';
import type { StructureOperation } from '../../domain/trace/schema';
import type { TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';
import { QueueVisual, StackVisual } from './StructureVisuals';import { LinkedListVisual } from './LinkedListVisual';
import { BinaryTreeVisual } from './BinaryTreeVisual';
import { GraphVisual } from './GraphVisual';

const GRAPH_OPERATION_KEYS: Record<GraphOperation, string> = {
  init: 'graphOpInit',
  enqueue: 'graphOpEnqueue',
  dequeue: 'graphOpDequeue',
  push: 'graphOpPush',
  pop: 'graphOpPop',
  'inspect-edge': 'graphOpInspect',
  discover: 'graphOpDiscover',
  visit: 'graphOpVisit',
  skip: 'graphOpSkip',
  done: 'graphOpDone',
};

const GRAPH_HINT_KEYS: Record<GraphOperation, string> = {
  init: 'graphHintInit',
  enqueue: 'graphHintEnqueue',
  dequeue: 'graphHintDequeue',
  push: 'graphHintPush',
  pop: 'graphHintPop',
  'inspect-edge': 'graphHintInspect',
  discover: 'graphHintDiscover',
  visit: 'graphHintVisit',
  skip: 'graphHintSkip',
  done: 'graphHintDone',
};

function graphHint(model: GraphVisualModel, t: (key: string) => string): string {
  if (model.empty && model.operation === 'done') return t('graphHintEmpty');
  return t(GRAPH_HINT_KEYS[model.operation]);
}

/** The SAME frontierItems array that paints the graph also paints the compact
 * queue/stack. There is no second event or delayed copy. */
function graphFrontierModel(model: GraphVisualModel, t: (key: string) => string) {
  const kind = model.frontierKind;
  const items = model.frontierItems.map((item, index) => ({
    id: item.id,
    value: item.label,
    index,
    role: kind === 'queue'
      ? (index === 0 ? 'front' as const : index === model.frontierItems.length - 1 ? 'rear' as const : 'member' as const)
      : (index === model.frontierItems.length - 1 ? 'top' as const : 'member' as const),
    active: false,
    state: 'normal' as const,
    nodeId: item.nodeId,
  }));
  const removed = model.frontierRemoved
    ? {
        id: model.frontierRemoved.id,
        value: model.frontierRemoved.label,
        index: -1,
        role: kind === 'queue' ? 'front' as const : 'top' as const,
        active: false,
        state: 'leaving' as const,
        nodeId: model.frontierRemoved.nodeId,
      }
    : undefined;
  const operation: StructureOperation =
    model.algorithm === 'bfs'
      ? (model.operation === 'enqueue' || model.operation === 'dequeue' || model.operation === 'done'
          ? model.operation
          : 'init')
      : (model.operation === 'push' || model.operation === 'pop' || model.operation === 'done'
          ? model.operation
          : 'init');
  return {
    operation,
    items,
    ...(removed ? { removed } : {}),
    empty: items.length === 0,
    label: kind === 'queue' ? t('graphQueueEmpty') : t('graphStackEmpty'),
  };
}

export function VisualStage({ event }: { event: TraceEvent | undefined }) {
  const { t } = useI18n();
  const model = event
    ? buildVisualModel(
        event.state,
        {
          invalid: t('invalidTrace'),
          emptyStructure: t('emptyStack'),
          emptyStack: t('stackEmpty'),
          emptyQueue: t('queueEmpty'),
          emptyLinked: t('linkedEmpty'),
          emptyTree: t('treeEmpty'),
          emptyGraph: t('graphEmpty'),
        },
        event.structure,
      )
    : { kind: 'empty' as const, text: t('ready') };

  let content: ReactNode;
  switch (model.kind) {
    case 'stack':
      content = <StackVisual model={model} />;
      break;
    case 'queue':
      content = <QueueVisual model={model} />;
      break;
    case 'linked-list':
      content = <LinkedListVisual model={model} />;
      break;
    case 'binary-tree':
      content = <BinaryTreeVisual model={model} />;
      break;
    case 'graph-traversal': {
      const frontier = graphFrontierModel(model, t);
      content = (
        <div className="graph-traversal-stage" data-testid="graph-traversal-stage">
          <GraphVisual
            model={model}
            operationText={t(GRAPH_OPERATION_KEYS[model.operation])}
            hint={graphHint(model, t)}
          />
          <section
            className={`graph-frontier-panel graph-frontier-${model.frontierKind}`}
            data-testid="graph-frontier-panel"
            data-frontier-kind={model.frontierKind}
            data-algorithm={model.algorithm}
          >
            <header className="graph-frontier-head">
              <b>{model.frontierKind === 'queue' ? t('graphQueue') : t('graphStack')}</b>
              <small>
                {model.frontierKind === 'queue'
                  ? t('graphFrontierQueueNote')
                  : t('graphFrontierStackNote')}
              </small>
            </header>
            {model.frontierKind === 'queue' ? (
              <QueueVisual
                compact
                model={frontier}
                operationLabel={t(GRAPH_OPERATION_KEYS[model.operation])}
                hint={null}
              />
            ) : (
              <StackVisual
                compact
                model={frontier}
                operationLabel={t(GRAPH_OPERATION_KEYS[model.operation])}
                hint={null}
              />
            )}
          </section>
        </div>
      );
      break;
    }
    case 'bars':
      content = (
        <div className="bars">
          {model.bars.map((bar) => (
            <div className="bar-item" key={bar.index}>
              <div
                className={`bar ${bar.focused ? 'focus' : bar.done ? 'done' : ''}`}
                style={{ height: `${bar.height}px` }}
              >
                <span>{String(bar.value)}</span>
              </div>
              <span className="bar-label">{bar.label}</span>
            </div>
          ))}
        </div>
      );
      break;
    case 'nodes':
      content = (
        <div className="nodeflex">
          {model.nodes.map((node) => (
            <span key={node.index} style={{ display: 'contents' }}>
              <div className="node-wrap">
                <div className={`node ${node.focused ? 'focus' : ''}`}>{String(node.value)}</div>
                <div className="node-sub">{node.sub}</div>
              </div>
              {node.arrowAfter && <span className="arrow">→</span>}
            </span>
          ))}
        </div>
      );
      break;
    case 'graph': {
      const positions = new Map(model.nodes.map((node) => [node.index, node]));
      content = (
        <svg className="graph" viewBox="0 0 540 280" role="img" aria-label="graph visualization">
          {model.edges.map(([from, to], index) => {
            const a = positions.get(from);
            const b = positions.get(to);
            if (!a || !b) return null;
            return <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
          {model.nodes.map((node) => (
            <g key={node.index}>
              <circle className={node.status === 'none' ? '' : node.status} cx={node.x} cy={node.y} r="23" />
              <text x={node.x} y={node.y}>{String(node.value)}</text>
            </g>
          ))}
        </svg>
      );
      break;
    }
    case 'raw':
      content = <div className="empty">{model.text}</div>;
      break;
    case 'empty':
      content = <div className="empty">◈ {model.text}</div>;
      break;
    default:
      content = <div className="empty">{t('invalidTrace')}</div>;
  }

  const structured =
    model.kind === 'stack' ||
    model.kind === 'queue' ||
    model.kind === 'linked-list' ||
    model.kind === 'binary-tree' ||
    model.kind === 'graph-traversal';
  return (
    <div
      className={`stage${structured ? ' has-structure' : ''}`}
      aria-label="Algorithm visualization"
      data-testid="visual-stage"
    >
      {content}
    </div>
  );
}
