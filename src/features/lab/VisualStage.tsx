import type { ReactNode } from 'react';
import { buildVisualModel } from '../../domain/visualization/model';
import type { QueueVisualModel, StackVisualModel } from '../../domain/visualization/model';
import type { GraphVisualModel } from '../../domain/visualization/graphModel';
import type { BellmanVisualModel, FloydVisualModel } from '../../domain/visualization/shortestPathModel';
import type {
  BellmanOperation,
  ConnectedComponentOperation,
  CriticalPathOperation,
  DijkstraOperation,
  FloydOperation,
  KruskalOperation,
  PrimOperation,
  TopologicalOperation,
} from '../../domain/trace/schema';
import type { GraphOperation } from '../../domain/trace/schema';
import type { StructureOperation } from '../../domain/trace/schema';
import type { TraceEvent } from '../../domain/trace/schema';
import { useI18n } from '../../i18n/I18nProvider';
import { QueueVisual, StackVisual } from './StructureVisuals';import { LinkedListVisual } from './LinkedListVisual';
import { ExpressionVisual } from './ExpressionVisual';
import { AdvancedLinkedListVisual } from './AdvancedLinkedListVisual';
import { SequentialListVisual } from './SequentialListVisual';
import { StaticLinkedListVisual } from './StaticLinkedListVisual';
import { PolynomialVisual } from './PolynomialVisual';
import type { SequentialListVisualModel } from '../../domain/visualization/sequentialListModel';
import { BinaryTreeVisual } from './BinaryTreeVisual';
import { GraphVisual } from './GraphVisual';
import { BellmanFordVisual, FloydVisual } from './G1Visuals';
import { KruskalVisual, PrimVisual } from './MSTVisuals';
import { CriticalPathVisual, TopologicalSortVisual } from './DAGVisuals';
import { ConnectedComponentsVisual, KosarajuVisual } from './ComponentVisuals';
import { BstVisual } from './BstVisual';
import { AvlVisual } from './AvlVisual';
import { BTreeVisual } from './BTreeVisual';
import { HeapVisual } from './HeapVisual';
import { HuffmanVisual } from './HuffmanVisual';
import { SortingVisual } from './SortingVisual';
import type { SortingVisualModel } from '../../domain/visualization/sortingModel';
import { SearchVisual } from './SearchVisual';
import type { SearchVisualModel } from '../../domain/visualization/searchModel';
import { KmpVisual } from './KmpVisual';
import { BfVisual } from './BfVisual';
import { SparseTransposeVisual } from './SparseTransposeVisual';
import type { SparseTransposeVisualModel } from '../../domain/visualization/sparseTransposeModel';
import { HashVisual } from './HashVisual';
import type { HashVisualModel } from '../../domain/visualization/hashModel';
import type { KruskalVisualModel, PrimVisualModel } from '../../domain/visualization/mstModel';
import type { CriticalVisualModel, TopologicalVisualModel } from '../../domain/visualization/dagModel';
import type { ConnectedComponentsVisualModel, SccVisualModel } from '../../domain/visualization/componentsModel';
import type { BstVisualModel } from '../../domain/visualization/bstModel';
import type { AvlVisualModel } from '../../domain/visualization/avlModel';
import type { BTreeVisualModel } from '../../domain/visualization/btreeModel';
import { RecursionVisual } from './RecursionVisual';
import { buildRecursionModel } from '../../domain/visualization/recursionModel';

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

const DIJKSTRA_OPERATION_KEYS: Record<DijkstraOperation, string> = {
  init: 'graphOpInit',
  push: 'graphOpHeapPush',
  pop: 'graphOpHeapPop',
  stale: 'graphOpHeapStale',
  settle: 'graphOpSettle',
  'inspect-edge': 'graphOpInspect',
  relax: 'graphOpRelax',
  skip: 'graphOpSkip',
  done: 'graphOpDone',
};

const DIJKSTRA_HINT_KEYS: Record<DijkstraOperation, string> = {
  init: 'dijkstraHintInit',
  push: 'dijkstraHintPush',
  pop: 'dijkstraHintPop',
  stale: 'dijkstraHintStale',
  settle: 'dijkstraHintSettle',
  'inspect-edge': 'dijkstraHintInspect',
  relax: 'dijkstraHintRelax',
  skip: 'dijkstraHintSkip',
  done: 'dijkstraHintDone',
};

const FLOYD_OPERATION_KEYS: Record<FloydOperation, string> = {
  init: 'floydOpInit',
  'k-advance': 'floydOpK',
  update: 'floydOpUpdate',
  skip: 'floydOpSkip',
  'negative-cycle': 'floydOpCycle',
  done: 'floydOpDone',
};

const BELLMAN_OPERATION_KEYS: Record<BellmanOperation, string> = {
  init: 'bellmanOpInit',
  'round-start': 'bellmanOpRound',
  'inspect-edge': 'bellmanOpInspect',
  relax: 'bellmanOpRelax',
  skip: 'bellmanOpSkip',
  'round-end': 'bellmanOpRoundEnd',
  'early-exit': 'bellmanOpEarlyExit',
  'negative-cycle': 'bellmanOpCycle',
  done: 'bellmanOpDone',
};

const BELLMAN_HINT_KEYS: Record<BellmanOperation, string> = {
  init: 'bellmanHintInit',
  'round-start': 'bellmanHintRound',
  'inspect-edge': 'bellmanHintInspect',
  relax: 'bellmanHintRelax',
  skip: 'bellmanHintSkip',
  'round-end': 'bellmanHintRoundEnd',
  'early-exit': 'bellmanHintEarlyExit',
  'negative-cycle': 'bellmanHintCycle',
  done: 'bellmanHintDone',
};

const PRIM_OPERATION_KEYS: Record<PrimOperation, string> = {
  init: 'primOpInit',
  start: 'primOpStart',
  push: 'primOpPush',
  pop: 'primOpPop',
  'select-edge': 'primOpSelect',
  skip: 'primOpSkip',
  'component-start': 'primOpComponent',
  done: 'primOpDone',
};

const KRUSKAL_OPERATION_KEYS: Record<KruskalOperation, string> = {
  init: 'kruskalOpInit',
  sort: 'kruskalOpSort',
  'inspect-edge': 'kruskalOpInspect',
  'reject-edge': 'kruskalOpReject',
  union: 'kruskalOpUnion',
  done: 'kruskalOpDone',
};

const TOPOLOGICAL_OPERATION_KEYS: Record<TopologicalOperation, string> = {
  init: 'topoOpInit',
  enqueue: 'topoOpEnqueue',
  dequeue: 'topoOpDequeue',
  'inspect-edge': 'topoOpInspect',
  decrement: 'topoOpDecrement',
  'enqueue-node': 'topoOpEnqueueNode',
  cycle: 'topoOpCycle',
  done: 'topoOpDone',
};

const TOPOLOGICAL_HINT_KEYS: Record<TopologicalOperation, string> = {
  init: 'topoHintInit',
  enqueue: 'topoHintEnqueue',
  dequeue: 'topoHintDequeue',
  'inspect-edge': 'topoHintInspect',
  decrement: 'topoHintDecrement',
  'enqueue-node': 'topoHintEnqueueNode',
  cycle: 'topoHintCycle',
  done: 'topoHintDone',
};

const CRITICAL_OPERATION_KEYS: Record<CriticalPathOperation, string> = {
  init: 'criticalOpInit',
  'topo-order': 'criticalOpTopo',
  ve: 'criticalOpVe',
  vl: 'criticalOpVl',
  activity: 'criticalOpActivity',
  cycle: 'criticalOpCycle',
  done: 'criticalOpDone',
};

const CONNECTED_OPERATION_KEYS: Record<ConnectedComponentOperation, string> = {
  init: 'g4OpInit',
  'start-component': 'g4OpStart',
  pop: 'g4OpPop',
  visit: 'g4OpVisit',
  'inspect-edge': 'g4OpInspect',
  discover: 'g4OpDiscover',
  push: 'g4OpPush',
  skip: 'g4OpSkip',
  'complete-component': 'g4OpComplete',
  done: 'g4OpDone',
};

const CONNECTED_HINT_KEYS: Record<ConnectedComponentOperation, string> = {
  init: 'g4HintInit',
  'start-component': 'g4HintStart',
  pop: 'g4HintPop',
  visit: 'g4HintVisit',
  'inspect-edge': 'g4HintInspect',
  discover: 'g4HintDiscover',
  push: 'g4HintPush',
  skip: 'g4HintSkip',
  'complete-component': 'g4HintComplete',
  done: 'g4HintDone',
};

function graphOperationText(model: GraphVisualModel, t: (key: string) => string): string {
  if (model.algorithm === 'dijkstra') return t(DIJKSTRA_OPERATION_KEYS[model.operation as DijkstraOperation]);
  return t(GRAPH_OPERATION_KEYS[model.operation as GraphOperation]);
}

function graphHint(model: GraphVisualModel, t: (key: string) => string): string {
  if (model.empty && model.operation === 'done') return t('graphHintEmpty');
  if (model.algorithm === 'dijkstra') return t(DIJKSTRA_HINT_KEYS[model.operation as DijkstraOperation]);
  return t(GRAPH_HINT_KEYS[model.operation as GraphOperation]);
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
  const base = {
    operation,
    items,
    ...(removed ? { removed } : {}),
    empty: items.length === 0,
    label: kind === 'queue' ? t('graphQueueEmpty') : t('graphStackEmpty'),
  };
  return kind === 'queue'
    ? { kind: 'queue' as const, ...base }
    : { kind: 'stack' as const, ...base };
}

function formatPqDistance(distance: number | null | undefined): string {
  if (distance === null || distance === undefined) return '∞';
  return Number.isInteger(distance) ? String(distance) : distance.toFixed(2);
}

/** Visualises the real heapq contents of one weighted-graph frame. */
function PriorityQueuePanel({ model, operationText }: { model: GraphVisualModel; operationText: string }) {
  const { t } = useI18n();
  const removed = model.frontierRemoved;
  return (
    <section
      className="graph-priority-queue"
      data-testid="graph-priority-queue-panel"
      data-frontier-kind="priority-queue"
      data-algorithm="dijkstra"
    >
      <header className="graph-frontier-head">
        <b>{t('graphPriorityQueue')}</b>
        <small>{t('graphPriorityQueueNote')}</small>
      </header>
      <div className="graph-pq-operation" data-testid="graph-pq-operation">
        <span className="graph-pq-op-label">{operationText}</span>
        {model.frontierAdded && (
          <span className="graph-pq-added" data-testid="graph-pq-added">
            + ({formatPqDistance(model.frontierAdded.distance)}, {model.frontierAdded.nodeId})
          </span>
        )}
        {removed && (
          <span
            className={`graph-pq-removed${removed.stale ? ' is-stale' : ''}`}
            data-testid="graph-pq-removed"
            data-stale={removed.stale ? 'true' : 'false'}
          >
            − ({formatPqDistance(removed.distance)}, {removed.nodeId})
            {removed.stale ? ` · ${t('graphPqStale')}` : ''}
          </span>
        )}
      </div>
      {model.frontierItems.length ? (
        <ol className="graph-pq-list" data-testid="graph-pq-list">
          {model.frontierItems.map((item, index) => (
            <li
              key={item.id}
              className={`graph-pq-entry${item.stale ? ' is-stale' : ''}${
                model.frontierAdded?.id === item.id ? ' is-added' : ''
              }`}
              data-testid="graph-pq-entry"
              data-entry-id={item.id}
              data-node-id={item.nodeId}
              data-distance={item.distance ?? ''}
              data-stale={item.stale ? 'true' : 'false'}
            >
              <span className="graph-pq-rank">{index + 1}</span>
              <code className="graph-pq-key">
                ({formatPqDistance(item.distance)}, {item.nodeId})
              </code>
              {item.stale && <span className="graph-pq-stale-tag">{t('graphPqStale')}</span>}
            </li>
          ))}
        </ol>
      ) : (
        <p className="graph-pq-empty" data-testid="graph-pq-empty">
          {t('graphPriorityQueueEmpty')}
        </p>
      )}
      <footer className="graph-pq-footer">
        <span>{t('graphPqOrderNote')}</span>
        <span data-testid="graph-pq-size">
          {t('graphPqSize')}: {model.frontierItems.length}
        </span>
      </footer>
    </section>
  );
}

export function VisualStage({
  event,
  events,
  index,
  algorithmId,
}: {
  event: TraceEvent | undefined;
  /** Full validated trace, needed by the recursion call graph. */
  events?: readonly TraceEvent[];
  /** Playhead index into `events`. */
  index?: number;
  algorithmId?: string;
}) {
  const { t } = useI18n();
  const recursionModel = algorithmId && events?.length
    ? buildRecursionModel(events, index ?? 0, algorithmId)
    : null;
  if (recursionModel) {
    return (
      <div
        className="stage has-structure recursion-stage"
        aria-label="Algorithm visualization"
        data-testid="visual-stage"
      >
        <RecursionVisual model={recursionModel} />
      </div>
    );
  }
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
          emptyBst: t('bstEmpty'),
          emptyAvl: t('avlEmpty'),
          emptyGraph: t('graphEmpty'),
          emptyHeap: t('heapEmpty'),
          emptyHuffman: t('huffmanEmpty'),
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
    case 'expression':
      content = <ExpressionVisual model={model} />;
      break;
    case 'linked-list':
      content = <LinkedListVisual model={model} />;
      break;
    case 'doubly-linked-list':
    case 'circular-linked-list':
      content = <AdvancedLinkedListVisual model={model} />;
      break;
    case 'sequential-list':
      content = <SequentialListVisual model={model as SequentialListVisualModel} />;
      break;
    case 'static-linked-list':
      content = <StaticLinkedListVisual model={model} />;
      break;
    case 'polynomial':
      content = <PolynomialVisual model={model} />;
      break;
    case 'binary-tree':
      content = <BinaryTreeVisual model={model} />;
      break;
    case 'bst':
      content = <BstVisual model={model as BstVisualModel} />;
      break;
    case 'avl':
      content = <AvlVisual model={model as AvlVisualModel} />;
      break;
    case 'btree':
      content = <BTreeVisual model={model as BTreeVisualModel} />;
      break;
    case 'max-heap':
      content = <HeapVisual model={model} />;
      break;
    case 'huffman':
      content = <HuffmanVisual model={model} />;
      break;
    case 'sorting':
      content = <SortingVisual model={model as SortingVisualModel} />;
      break;
    case 'search':
      content = <SearchVisual model={model as SearchVisualModel} />;
      break;
    case 'bf':
      content = <BfVisual model={model} />;
      break;
    case 'kmp':
      content = <KmpVisual model={model} />;
      break;
    case 'sparse-transpose':
      content = <SparseTransposeVisual model={model as SparseTransposeVisualModel} />;
      break;
    case 'hash':
      content = <HashVisual model={model as HashVisualModel} />;
      break;
    case 'floyd-matrix':
      content = (
        <FloydVisual
          model={model as FloydVisualModel}
          operationText={t(FLOYD_OPERATION_KEYS[model.operation])}
        />
      );
      break;
    case 'bellman-table':
      content = (
        <BellmanFordVisual
          model={model as BellmanVisualModel}
          operationText={t(BELLMAN_OPERATION_KEYS[model.operation])}
          hint={t(BELLMAN_HINT_KEYS[model.operation])}
        />
      );
      break;
    case 'prim-mst':
      content = (
        <PrimVisual
          model={model as PrimVisualModel}
          operationText={t(PRIM_OPERATION_KEYS[model.operation])}
        />
      );
      break;
    case 'kruskal-mst':
      content = (
        <KruskalVisual
          model={model as KruskalVisualModel}
          operationText={t(KRUSKAL_OPERATION_KEYS[model.operation])}
        />
      );
      break;
    case 'topological-sort':
      content = (
        <TopologicalSortVisual
          model={model as TopologicalVisualModel}
          operationText={t(TOPOLOGICAL_OPERATION_KEYS[model.operation])}
          hint={t(TOPOLOGICAL_HINT_KEYS[model.operation])}
        />
      );
      break;
    case 'critical-path':
      content = (
        <CriticalPathVisual
          model={model as CriticalVisualModel}
          operationText={t(CRITICAL_OPERATION_KEYS[model.operation])}
        />
      );
      break;
    case 'connected-components':
      content = (
        <ConnectedComponentsVisual
          model={model as ConnectedComponentsVisualModel}
          operationText={t(CONNECTED_OPERATION_KEYS[model.operation])}
          hint={t(CONNECTED_HINT_KEYS[model.operation])}
        />
      );
      break;
    case 'kosaraju':
      content = (
        <KosarajuVisual
          model={model as SccVisualModel}
        />
      );
      break;
    case 'graph-traversal': {
      const operationText = graphOperationText(model, t);
      if (model.algorithm === 'dijkstra') {
        content = (
          <div className="graph-traversal-stage is-weighted" data-testid="graph-traversal-stage">
            <GraphVisual model={model} operationText={operationText} hint={graphHint(model, t)} />
            <PriorityQueuePanel model={model} operationText={operationText} />
          </div>
        );
        break;
      }
      const frontier = graphFrontierModel(model, t);
      content = (
        <div className="graph-traversal-stage" data-testid="graph-traversal-stage">
          <GraphVisual model={model} operationText={operationText} hint={graphHint(model, t)} />
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
                model={frontier as QueueVisualModel}
                operationLabel={operationText}
                hint={null}
              />
            ) : (
              <StackVisual
                compact
                model={frontier as StackVisualModel}
                operationLabel={operationText}
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
                style={{ height: `${Math.min(100, (bar.height / 165) * 100).toFixed(2)}%` }}
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
    model.kind === 'doubly-linked-list' ||
    model.kind === 'circular-linked-list' ||
    model.kind === 'sequential-list' ||
    model.kind === 'static-linked-list' ||
    model.kind === 'polynomial' ||
    model.kind === 'binary-tree' ||
    model.kind === 'bst' ||
    model.kind === 'avl' ||
    model.kind === 'btree' ||
    model.kind === 'max-heap' ||
    model.kind === 'huffman' ||
    model.kind === 'sorting' ||
    model.kind === 'search' ||
    model.kind === 'sparse-transpose' ||
    model.kind === 'hash' ||
    model.kind === 'graph-traversal' ||
    model.kind === 'floyd-matrix' ||
    model.kind === 'bellman-table' ||
    model.kind === 'prim-mst' ||
    model.kind === 'kruskal-mst' ||
    model.kind === 'topological-sort' ||
    model.kind === 'critical-path' ||
    model.kind === 'connected-components' ||
    model.kind === 'kosaraju';
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
