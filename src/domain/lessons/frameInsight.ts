/**
 * UX-02: turn one real trace frame into the four things a learner needs at a
 * glance:
 *
 *   1. what is happening now;
 *   2. why this operation is performed;
 *   3. what really changed in the recorded state;
 *   4. one short memory hook, only when the course/frame has a real one.
 *
 * The function is deliberately pure and has no React import. It only reads
 * `TraceEvent.structure`, `lessonStepId`, `message` and `state`; it never parses
 * arbitrary message text to guess structured facts. Algorithms without a typed
 * structure get an honest "no structured state change recorded" fallback.
 */
import type {
  AvlNode,
  AvlSnapshot,
  BstNode,
  BstSnapshot,
  KosarajuSnapshot,
  MaxHeapSnapshot,
  HuffmanSnapshot,
  TopologicalSortSnapshot,
  TraceEvent,
  WeightedGraphSnapshot,
} from '../trace/schema';
import { resolveStep } from './sync';
import type { Lesson, LessonLang, LessonStep } from './types';

export type FrameChangeTone = 'neutral' | 'update' | 'success' | 'warning';

export interface FrameChange {
  label: string;
  before?: string;
  after?: string;
  detail?: string;
  tone: FrameChangeTone;
}

export interface FrameInsight {
  /** The current operation, e.g. "Relax A → B: 6 → 4". */
  action: string;
  /** One or two sentences explaining the purpose of this operation. */
  why: string;
  /** Real before/after facts from the snapshot, or an explicit no-change note. */
  changes: FrameChange[];
  /** One short, relevant hook. `null` means the course has no suitable hook. */
  memory: string | null;
  /** True when the frame had a typed structure we could read directly. */
  semantic: boolean;
}

function tx(lang: LessonLang, zh: string, en: string): string {
  return lang === 'zh' ? zh : en;
}

function firstSentence(value: string, limit = 220): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const zhEnd = normalized.search(/[。！？!?]/);
  let end = zhEnd;
  if (end < 0 || end > limit) {
    // English periods followed by whitespace are sentence ends; a decimal point
    // or an abbreviation is not worth special-casing here because the limit
    // still keeps the result readable.
    const enEnd = normalized.search(/[.!?](?=\s|$)/);
    if (enEnd >= 0 && (end < 0 || enEnd < end)) end = enEnd;
  }
  const out = end >= 0 ? normalized.slice(0, end + 1) : normalized;
  return out.length > limit ? `${out.slice(0, limit).trimEnd()}…` : out;
}

function listLabel(values: readonly string[], empty = '—'): string {
  if (values.length === 0) return empty;
  const head = values.slice(0, 4).join(', ');
  return values.length > 4 ? `${head} …` : head;
}

function formatNumber(value: number | null | undefined, infinity = '∞'): string {
  return value === null || value === undefined ? infinity : String(value);
}

function entryLabel(entry: { nodeId: string; distance?: number } | null | undefined): string {
  if (!entry) return '—';
  return entry.distance === undefined ? entry.nodeId : `${entry.nodeId}(${entry.distance})`;
}

function pathLabel(path: readonly string[] | null | undefined): string {
  return path && path.length ? path.join(' → ') : '—';
}

function graphEdgeLabel(
  edge: { fromId: string; toId: string; weight?: number } | null | undefined,
  weight = true,
): string {
  if (!edge) return '—';
  return weight && edge.weight !== undefined
    ? `${edge.fromId} → ${edge.toId}（${edge.weight}）`
    : `${edge.fromId} → ${edge.toId}`;
}

function weightedEdge(snapshot: WeightedGraphSnapshot, id: string | null) {
  return id ? snapshot.edges.find((edge) => edge.id === id) ?? null : null;
}

function graphEdge(snapshot: KosarajuSnapshot | TopologicalSortSnapshot, id: string | null) {
  return id ? snapshot.edges.find((edge) => edge.id === id) ?? null : null;
}

function weightedDistance(snapshot: WeightedGraphSnapshot, id: string | null): number | null {
  if (!id) return null;
  return snapshot.distances.find((row) => row.nodeId === id)?.distance ?? null;
}

function visitedCount(snapshot: WeightedGraphSnapshot): number {
  return snapshot.visitedIds.length;
}

function heapLabel(snapshot: WeightedGraphSnapshot): string {
  return listLabel(snapshot.frontierItems.map((item) => (item.stale ? `${entryLabel(item)}*` : entryLabel(item))));
}

function kahnIndegree(snapshot: TopologicalSortSnapshot, id: string | null): number {
  if (!id) return 0;
  return snapshot.indegree.find((row) => row.nodeId === id)?.indegree ?? 0;
}

function kahnQueue(snapshot: TopologicalSortSnapshot): string {
  return listLabel(snapshot.queue.map((item) => item.nodeId), '空');
}

function kahnNodeList(ids: readonly string[]): string {
  return listLabel(ids.map((id) => id));
}

function kosarajuGroup(
  snapshot: KosarajuSnapshot,
  id: number | null,
): { id: number; nodeIds: string[]; complete: boolean } | null {
  if (id === null) return null;
  return snapshot.components.find((group) => group.id === id) ?? null;
}

function kosarajuGroupLabel(group: { id: number; nodeIds: string[] } | null): string {
  return group ? `C${group.id}={${group.nodeIds.join(',')}}` : '—';
}

function kosarajuPhase(snapshot: KosarajuSnapshot, lang: LessonLang): string {
  switch (snapshot.phase) {
    case 'first-pass':
      return tx(lang, '第一遍 DFS', 'first DFS pass');
    case 'reverse':
      return tx(lang, '构造转置图', 'build transpose');
    case 'second-pass':
      return tx(lang, '第二遍 DFS', 'second DFS pass');
    default:
      return tx(lang, '完成', 'done');
  }
}

function kosarajuStack(snapshot: KosarajuSnapshot): string {
  return listLabel(snapshot.frontierItems.map((item) => item.nodeId), '空');
}

function bstNodeLabel(node: BstNode | AvlNode | null | undefined): string {
  return node ? `${node.id}(${node.value})` : '—';
}

function bstNode(snapshot: BstSnapshot | AvlSnapshot, id: string | null): BstNode | AvlNode | null {
  if (!id) return null;
  return snapshot.nodes.find((node) => node.id === id) ?? null;
}

function bstRoot(snapshot: BstSnapshot | AvlSnapshot): string {
  return bstNodeLabel(bstNode(snapshot, snapshot.rootId));
}

function bstChildCount(snapshot: BstSnapshot | AvlSnapshot, id: string | null): number {
  const node = bstNode(snapshot, id);
  if (!node) return 0;
  return Number(node.leftId !== null) + Number(node.rightId !== null);
}

function bstPath(snapshot: BstSnapshot | AvlSnapshot): string {
  return listLabel(snapshot.pathIds.map((id) => bstNodeLabel(bstNode(snapshot, id))));
}

function bstResultLabel(result: string | null, lang: LessonLang): string {
  switch (result) {
    case 'found':
      return tx(lang, '已找到', 'found');
    case 'not-found':
    case 'missing':
      return tx(lang, '未找到', 'not found');
    case 'inserted':
      return tx(lang, '已插入', 'inserted');
    case 'duplicate':
      return tx(lang, '重复键，未插入', 'duplicate, not inserted');
    case 'deleted':
      return tx(lang, '已删除', 'deleted');
    default:
      return tx(lang, '操作完成', 'completed');
  }
}

function treeAction(
  snapshot: BstSnapshot | AvlSnapshot,
  lang: LessonLang,
  avl = false,
): { action: string; why: string; changes: FrameChange[] } {
  const target = String(snapshot.targetValue);
  const current = bstNodeLabel(bstNode(snapshot, snapshot.currentNodeId));
  const result = bstResultLabel(snapshot.result, lang);
  const nodeCount = snapshot.nodes.length;
  const root = bstRoot(snapshot);
  const path = bstPath(snapshot);
  const actionPrefix = avl ? 'AVL' : 'BST';
  const whyBase = avl
    ? tx(lang, 'AVL 在每次指针变化后都保持高度差不超过 1；下面的变化来自这一帧的真实快照。', 'AVL keeps every balance factor within ±1 after each pointer change; the changes below come from the real snapshot.')
    : tx(lang, 'BST 的查找、插入和删除都由真实指针推进；下面的变化来自这一帧的真实快照。', 'BST search, insert and delete advance through real pointers; the changes below come from the real snapshot.');

  switch (snapshot.operation) {
    case 'init':
      return {
        action: tx(lang, `初始化 ${actionPrefix}：根 ${root}`, `Initialise ${actionPrefix}: root ${root}`),
        why: whyBase,
        changes: [
          { label: tx(lang, '根节点', 'root'), after: root, tone: 'neutral' },
          { label: tx(lang, '节点数', 'nodes'), after: String(nodeCount), tone: 'neutral' },
          { label: tx(lang, '目标值', 'target'), after: target, tone: 'neutral' },
        ],
      };
    case 'inspect': {
      const node = bstNode(snapshot, snapshot.currentNodeId);
      const relation = node
        ? node.value === snapshot.targetValue
          ? tx(lang, '等于目标', 'equal')
          : node.value < snapshot.targetValue
            ? tx(lang, '小于目标', 'smaller')
            : tx(lang, '大于目标', 'larger')
        : '—';
      return {
        action: tx(lang, `比较 ${current} 与目标 ${target}`, `Compare ${current} with target ${target}`),
        why: tx(lang, '从根开始沿唯一的一条搜索路径前进；比较结果决定下一步方向。', 'Start at the root and follow the single search path; the comparison decides the next direction.'),
        changes: [
          { label: tx(lang, '当前节点', 'current'), after: current, tone: 'neutral' },
          { label: tx(lang, '目标值', 'target'), after: target, tone: 'neutral' },
          { label: tx(lang, '比较结果', 'comparison'), after: relation, tone: 'neutral' },
        ],
      };
    }
    case 'go-left':
    case 'go-right': {
      const direction = snapshot.operation === 'go-left' ? tx(lang, '左', 'left') : tx(lang, '右', 'right');
      const next = bstNodeLabel(bstNode(snapshot, snapshot.nextNodeId));
      return {
        action: tx(lang, `目标${direction === '左' ? '更小' : '更大'}：向${direction}到 ${next}`, `Target is ${direction === 'left' ? 'smaller' : 'larger'}: go ${direction} to ${next}`),
        why: tx(lang, '左子树的所有值更小，右子树的所有值更大；因此这一帧只可能沿一个方向走。', 'Everything in the left subtree is smaller and everything in the right subtree is larger, so this frame can only follow one direction.'),
        changes: [
          { label: tx(lang, '方向', 'direction'), after: direction, tone: 'neutral' },
          { label: tx(lang, '下一节点', 'next'), after: next, tone: 'neutral' },
          { label: tx(lang, '已走路径', 'path'), after: path, tone: 'neutral' },
        ],
      };
    }
    case 'found':
      return {
        action: tx(lang, `命中 ${current}：目标 ${target}`, `Found ${current}: target ${target}`),
        why: tx(lang, '当前节点的值等于目标；查找结束，不需要继续下行。', 'The current node equals the target, so the search stops here.'),
        changes: [
          { label: tx(lang, '结果', 'result'), after: bstResultLabel(snapshot.result ?? 'found', lang), tone: 'success' },
          { label: tx(lang, '命中节点', 'node'), after: current, tone: 'success' },
          { label: tx(lang, '已比较路径', 'path'), after: path, tone: 'neutral' },
        ],
      };
    case 'not-found':
      return {
        action: tx(lang, `查找失败：${target} 不在树中`, `Search failed: ${target} is not in the tree`),
        why: tx(lang, '已经走到空指针；BST 中不存在与目标相等的节点。', 'The walk reached a null pointer; no node in the BST equals the target.'),
        changes: [
          { label: tx(lang, '结果', 'result'), after: bstResultLabel(snapshot.result ?? 'not-found', lang), tone: 'warning' },
          { label: tx(lang, '最后节点', 'last node'), after: current, tone: 'neutral' },
          { label: tx(lang, '已走路径', 'path'), after: path, tone: 'neutral' },
        ],
      };
    case 'attach': {
      const inserted = bstNodeLabel(bstNode(snapshot, snapshot.insertedId));
      const parent = bstNodeLabel(bstNode(snapshot, snapshot.parentId));
      const side = snapshot.side === 'left' ? tx(lang, '左侧', 'left') : snapshot.side === 'right' ? tx(lang, '右侧', 'right') : '—';
      return {
        action: tx(lang, `插入 ${inserted}：挂到 ${parent} 的${side}`, `Insert ${inserted}: attach to the ${side} of ${parent}`),
        why: tx(lang, '找到空位后只改写父节点的 left/right 指针，再让新节点接管这个位置。', 'After finding an empty slot, only the parent left/right pointer is rewritten; the new node takes that position.'),
        changes: [
          { label: tx(lang, '新节点', 'new node'), after: inserted, tone: 'success' },
          { label: tx(lang, '父节点 / 方向', 'parent / side'), after: `${parent} / ${side}`, tone: 'update' },
          { label: tx(lang, '节点数', 'nodes'), after: String(nodeCount), tone: 'update' },
        ],
      };
    }
    case 'locate': {
      const removing = bstNodeLabel(bstNode(snapshot, snapshot.targetNodeId));
      const children = bstChildCount(snapshot, snapshot.targetNodeId);
      const kind = children === 0 ? tx(lang, '叶子', 'leaf') : children === 1 ? tx(lang, '单孩子', 'one child') : tx(lang, '双孩子', 'two children');
      return {
        action: tx(lang, `定位删除 ${removing}：${kind}`, `Locate deletion ${removing}: ${kind}`),
        why: tx(lang, '先数目标节点的孩子，才能选择正确的删除分支。', 'Count the target children first so the correct delete branch is chosen.'),
        changes: [
          { label: tx(lang, '删除目标', 'target'), after: removing, tone: 'warning' },
          { label: tx(lang, '子节点数', 'children'), after: String(children), tone: 'neutral' },
          { label: tx(lang, '删除情形', 'case'), after: kind, tone: 'neutral' },
        ],
      };
    }
    case 'delete-leaf': {
      const removed = snapshot.removedNode ? `${snapshot.removedNode.id}(${snapshot.removedNode.value})` : bstNodeLabel(bstNode(snapshot, snapshot.targetNodeId));
      return {
        action: tx(lang, `删除叶子 ${removed}`, `Delete leaf ${removed}`),
        why: tx(lang, '叶子没有孩子，只需断开父节点的对应指针。', 'A leaf has no children, so only the parent pointer has to be cleared.'),
        changes: [
          { label: tx(lang, '删除节点', 'removed'), after: removed, tone: 'warning' },
          { label: tx(lang, '父指针', 'parent'), after: tx(lang, '已断开', 'cleared'), tone: 'update' },
          { label: tx(lang, '节点数', 'nodes'), after: String(nodeCount), tone: 'update' },
        ],
      };
    }
    case 'delete-one': {
      const removed = snapshot.removedNode ? `${snapshot.removedNode.id}(${snapshot.removedNode.value})` : bstNodeLabel(bstNode(snapshot, snapshot.targetNodeId));
      const replacement = bstNodeLabel(bstNode(snapshot, snapshot.replacementId));
      return {
        action: tx(lang, `删除 ${removed}：${replacement} 接替`, `Delete ${removed}: ${replacement} takes over`),
        why: tx(lang, '目标只有一个孩子，让这个孩子直接接上目标的父节点。', 'The target has one child; that child is linked directly to the target parent.'),
        changes: [
          { label: tx(lang, '删除节点', 'removed'), after: removed, tone: 'warning' },
          { label: tx(lang, '替代节点', 'replacement'), after: replacement, tone: 'update' },
          { label: tx(lang, '节点数', 'nodes'), after: String(nodeCount), tone: 'update' },
        ],
      };
    }
    case 'successor-search':
      return {
        action: tx(lang, `在右子树寻找后继：${current}`, `Find successor in the right subtree: ${current}`),
        why: tx(lang, '双孩子删除需要一个后继来接管位置；后继是右子树中最左的节点。', 'A two-child delete needs a successor; the successor is the leftmost node in the right subtree.'),
        changes: [
          { label: tx(lang, '当前节点', 'current'), after: current, tone: 'neutral' },
          { label: tx(lang, '后继候选', 'candidate'), after: bstNodeLabel(bstNode(snapshot, snapshot.successorId)), tone: 'neutral' },
          { label: tx(lang, '已走路径', 'path'), after: path, tone: 'neutral' },
        ],
      };
    case 'successor-found':
      return {
        action: tx(lang, `后继找到 ${bstNodeLabel(bstNode(snapshot, snapshot.successorId))}`, `Successor found: ${bstNodeLabel(bstNode(snapshot, snapshot.successorId))}`),
        why: tx(lang, '没有更左的孩子，当前节点就是右子树的最小值。', 'There is no left child left to follow, so this node is the minimum of the right subtree.'),
        changes: [
          { label: tx(lang, '后继', 'successor'), after: bstNodeLabel(bstNode(snapshot, snapshot.successorId)), tone: 'success' },
          { label: tx(lang, '目标', 'target'), after: target, tone: 'neutral' },
          { label: tx(lang, '下一步', 'next'), after: tx(lang, '摘下后继', 'detach successor'), tone: 'neutral' },
        ],
      };
    case 'successor-detach': {
      const successor = bstNodeLabel(bstNode(snapshot, snapshot.successorId));
      return {
        action: tx(lang, `摘下后继 ${successor}`, `Detach successor ${successor}`),
        why: tx(lang, '后继可能还有右孩子；先把它的右孩子接到它的父节点，再移动后继。', 'The successor may have a right child; link that child to the successor parent before moving it.'),
        changes: [
          { label: tx(lang, '后继', 'successor'), after: successor, tone: 'warning' },
          { label: tx(lang, '替代孩子', 'replacement child'), after: bstNodeLabel(bstNode(snapshot, snapshot.replacementId)), tone: 'update' },
          { label: tx(lang, '目标', 'target'), after: target, tone: 'neutral' },
        ],
      };
    }
    case 'transplant': {
      const successor = bstNodeLabel(bstNode(snapshot, snapshot.successorId));
      return {
        action: tx(lang, `后继 ${successor} 接替 ${target}`, `Successor ${successor} replaces ${target}`),
        why: tx(lang, '把后继节点的左右指针改到目标的位置；树仍保持中序有序。', 'The successor left/right pointers are rewired into the target position; the in-order sequence stays sorted.'),
        changes: [
          { label: tx(lang, '接替节点', 'replacement'), after: successor, tone: 'success' },
          { label: tx(lang, '被替换目标', 'target'), after: target, tone: 'warning' },
          { label: tx(lang, '根节点', 'root'), after: root, tone: 'neutral' },
        ],
      };
    }
    case 'duplicate':
      return {
        action: tx(lang, `重复键 ${target}：拒绝插入`, `Duplicate key ${target}: insert rejected`),
        why: tx(lang, 'BST 约定严格左小右大；重复键会让中序不再严格递增，因此不插入。', 'A strict BST keeps the in-order sequence increasing; a duplicate would violate that, so it is rejected.'),
        changes: [
          { label: tx(lang, '结果', 'result'), after: bstResultLabel(snapshot.result ?? 'duplicate', lang), tone: 'warning' },
          { label: tx(lang, '节点数', 'nodes'), after: String(nodeCount), tone: 'neutral' },
          { label: tx(lang, '根节点', 'root'), after: root, tone: 'neutral' },
        ],
      };
    case 'height':
      return {
        action: tx(lang, `更新 ${current} 的高度：h=${(bstNode(snapshot, snapshot.currentNodeId) as AvlNode | null)?.height ?? '—'}`, `Update height of ${current}: h=${(bstNode(snapshot, snapshot.currentNodeId) as AvlNode | null)?.height ?? '—'}`),
        why: tx(lang, '高度由孩子高度更新；它是平衡因子和后续旋转判断的输入。', 'Height is updated from the children; it feeds the balance factor and any later rotation decision.'),
        changes: [
          { label: tx(lang, '节点', 'node'), after: current, tone: 'neutral' },
          { label: tx(lang, '高度', 'height'), after: String((bstNode(snapshot, snapshot.currentNodeId) as AvlNode | null)?.height ?? '—'), tone: 'update' },
          { label: tx(lang, '平衡因子', 'balance'), after: String((bstNode(snapshot, snapshot.currentNodeId) as AvlNode | null)?.balance ?? '—'), tone: 'neutral' },
        ],
      };
    case 'balance':
      return {
        action: tx(lang, `检查 ${current} 的平衡：BF=${(bstNode(snapshot, snapshot.currentNodeId) as AvlNode | null)?.balance ?? '—'}`, `Check balance of ${current}: BF=${(bstNode(snapshot, snapshot.currentNodeId) as AvlNode | null)?.balance ?? '—'}`),
        why: tx(lang, '平衡因子是左子树高度减右子树高度；绝对值超过 1 才需要旋转。', 'The balance factor is left height minus right height; only an absolute value above 1 needs a rotation.'),
        changes: [
          { label: tx(lang, '节点', 'node'), after: current, tone: 'neutral' },
          { label: tx(lang, '高度', 'height'), after: String((bstNode(snapshot, snapshot.currentNodeId) as AvlNode | null)?.height ?? '—'), tone: 'neutral' },
          { label: tx(lang, '平衡因子', 'balance'), after: String((bstNode(snapshot, snapshot.currentNodeId) as AvlNode | null)?.balance ?? '—'), tone: Math.abs(Number((bstNode(snapshot, snapshot.currentNodeId) as AvlNode | null)?.balance ?? 0)) > 1 ? 'warning' : 'neutral' },
        ],
      };
    case 'imbalance':
      return {
        action: tx(lang, `失衡 ${current}：BF=${(bstNode(snapshot, snapshot.imbalanceId) as AvlNode | null)?.balance ?? '—'}，类型 ${snapshot.rotationCase ?? '—'}`, `Imbalance at ${current}: BF=${(bstNode(snapshot, snapshot.imbalanceId) as AvlNode | null)?.balance ?? '—'}, case ${snapshot.rotationCase ?? '—'}`),
        why: tx(lang, '失衡节点的孩子方向与孙子方向组成 LL/RR/LR/RL，决定用一次还是两次旋转。', 'The child and grandchild directions form LL/RR/LR/RL and decide whether one or two rotations are needed.'),
        changes: [
          { label: tx(lang, '失衡节点', 'imbalance'), after: current, tone: 'warning' },
          { label: tx(lang, '平衡因子', 'balance'), after: String((bstNode(snapshot, snapshot.imbalanceId) as AvlNode | null)?.balance ?? '—'), tone: 'warning' },
          { label: tx(lang, '旋转类型', 'case'), after: snapshot.rotationCase ?? '—', tone: 'neutral' },
        ],
      };
    case 'rotate-left':
    case 'rotate-right': {
      const left = snapshot.operation === 'rotate-left';
      const phase = snapshot.rotationPhase === 'after' ? tx(lang, '完成', 'after') : tx(lang, '准备', 'before');
      const pivot = bstNodeLabel(bstNode(snapshot, snapshot.pivotId));
      return {
        action: tx(lang, `${left ? '左旋' : '右旋'}${phase}：轴 ${pivot}`, `${left ? 'Rotate left' : 'Rotate right'} ${phase}: pivot ${pivot}`),
        why: tx(lang, left ? '左旋把右孩子提上来，降低右侧高度。' : '右旋把左孩子提上来，降低左侧高度。', left ? 'A left rotation promotes the right child and reduces right-side height.' : 'A right rotation promotes the left child and reduces left-side height.'),
        changes: [
          { label: tx(lang, '旋转', 'rotation'), after: `${snapshot.operation === 'rotate-left' ? 'L' : 'R'} / ${snapshot.rotationCase ?? '—'}`, tone: 'update' },
          { label: tx(lang, '轴 / 上升', 'pivot / promoted'), after: `${pivot} / ${bstNodeLabel(bstNode(snapshot, snapshot.promotedId))}`, tone: 'update' },
          { label: tx(lang, '步骤', 'step'), after: `${snapshot.rotationStep ?? '—'} / ${snapshot.rotationTotal ?? '—'}`, tone: 'neutral' },
          { label: tx(lang, '当前根', 'root'), after: root, tone: 'neutral' },
        ],
      };
    }
    case 'done':
      return {
        action: tx(lang, `${actionPrefix} 操作完成：${result}`, `${actionPrefix} operation complete: ${result}`),
        why: tx(lang, '这是本次运行的真实结果；树结构、节点数和根指针都来自同一帧快照。', 'This is the real result of the run; the tree, node count and root pointer all come from the same frame snapshot.'),
        changes: [
          { label: tx(lang, '结果', 'result'), after: result, tone: 'success' },
          { label: tx(lang, '节点数', 'nodes'), after: String(nodeCount), tone: 'neutral' },
          { label: tx(lang, '根节点', 'root'), after: root, tone: 'neutral' },
          ...(avl
            ? [{ label: tx(lang, '根高度', 'root height'), after: String((bstNode(snapshot, snapshot.rootId) as AvlNode | null)?.height ?? '—'), tone: 'neutral' as const }]
            : []),
        ],
      };
    default: {
      const unknownOperation = (snapshot as unknown as { operation: string }).operation;
      return {
        action: tx(lang, `执行 ${unknownOperation}`, `Run ${unknownOperation}`),
        why: whyBase,
        changes: [],
      };
    }
  }
}

function heapElement(snapshot: MaxHeapSnapshot, id: string | null) {
  if (!id) return null;
  return snapshot.elements.find((element) => element.id === id) ?? null;
}

function heapElementLabel(snapshot: MaxHeapSnapshot, id: string | null): string {
  const element = heapElement(snapshot, id);
  return element ? `${element.id}(${element.value})@#${element.slot}` : '—';
}

function heapRootLabel(snapshot: MaxHeapSnapshot): string {
  return snapshot.heapSize > 0 ? heapElementLabel(snapshot, snapshot.elements[0]?.id ?? null) : '∅';
}

function heapSortedLabel(snapshot: MaxHeapSnapshot): string {
  if (snapshot.sortedFrom === null) return '—';
  return snapshot.elements
    .slice(snapshot.sortedFrom)
    .map((element) => String(element.value))
    .join(' → ') || '∅';
}

function heapPathLabel(snapshot: MaxHeapSnapshot): string {
  return snapshot.pathIds.length
    ? snapshot.pathIds.map((id) => heapElementLabel(snapshot, id)).join(' → ')
    : '—';
}

function heapActionParts(snapshot: MaxHeapSnapshot, lang: LessonLang): { action: string; why: string } {
  const root = heapRootLabel(snapshot);
  const active = heapElementLabel(snapshot, snapshot.activeId);
  switch (snapshot.operation) {
    case 'init':
      return {
        action: tx(lang, `初始化最大堆：${snapshot.totalSize} 个元素，根 ${root}`, `Initialise max heap: ${snapshot.totalSize} elements, root ${root}`),
        why: tx(lang, '数组按层序对应完全二叉树；槽位 i 的左孩子 2i+1、右孩子 2i+2、父节点 ⌊(i-1)/2⌋。', 'The array is a complete tree in level order: slot i has left child 2i+1, right child 2i+2, parent ⌊(i-1)/2⌋.'),
      };
    case 'build-start':
      return {
        action: tx(lang, `建堆开始：从最后一个非叶节点 #${Math.max(0, Math.floor(snapshot.totalSize / 2) - 1)} 向前`, `Build starts at the last non-leaf #${Math.max(0, Math.floor(snapshot.totalSize / 2) - 1)}`),
        why: tx(lang, '叶子本身已是合法堆；从 n//2 - 1 向前逐个下沉子树根，自底向上建堆是 O(n)。', 'Leaves are already valid heaps; sift down each subtree root from n//2 - 1 backwards, making bottom-up build O(n).'),
      };
    case 'heapify-node':
      return {
        action: tx(lang, `下沉子树根 ${active}`, `Sift down subtree root ${active}`),
        why: tx(lang, '先选较大的孩子，再与当前父节点比较；父不小于子就停止，否则沿这条路径继续下沉。', 'Choose the larger child, compare it with the parent, stop when parent ≥ child, otherwise continue down that path.'),
      };
    case 'compare-children':
      return {
        action: tx(lang, `比较孩子 ${heapElementLabel(snapshot, snapshot.compareChildren?.leftId ?? null)} 与 ${heapElementLabel(snapshot, snapshot.compareChildren?.rightId ?? null)}`, `Compare children ${heapElementLabel(snapshot, snapshot.compareChildren?.leftId ?? null)} and ${heapElementLabel(snapshot, snapshot.compareChildren?.rightId ?? null)}`),
        why: tx(lang, '左槽位是 2i+1、右槽位是 2i+2；选择较大孩子，避免把更大值埋到下面。', 'The left slot is 2i+1 and right is 2i+2; choosing the larger child avoids burying a larger value.'),
      };
    case 'compare-parent-child':
      return {
        action: tx(lang, `比较父 ${heapElementLabel(snapshot, snapshot.compareParent?.parentId ?? null)} 与子 ${heapElementLabel(snapshot, snapshot.compareParent?.childId ?? null)}`, `Compare parent ${heapElementLabel(snapshot, snapshot.compareParent?.parentId ?? null)} with child ${heapElementLabel(snapshot, snapshot.compareParent?.childId ?? null)}`),
        why: tx(lang, '最大堆要求父节点 ≥ 子节点；相等时也不交换，因为交换不会改善堆性质。', 'A max heap requires parent ≥ child; equality does not swap because it would not improve the invariant.'),
      };
    case 'swap': {
      const first = heapElementLabel(snapshot, snapshot.swap?.firstId ?? null);
      const second = heapElementLabel(snapshot, snapshot.swap?.secondId ?? null);
      return {
        action: tx(lang, `交换 ${first} ↔ ${second}`, `Swap ${first} ↔ ${second}`),
        why: tx(lang, '交换只移动槽位里的元素，完全二叉树与所有父子下标公式保持不变。', 'A swap moves elements between slots; the complete tree and all parent/child formulas stay unchanged.'),
      };
    }
    case 'build-done':
      return {
        action: tx(lang, '最大堆建立完成', 'Max heap built'),
        why: tx(lang, '每个父节点都不小于孩子，根就是全局最大值，可以开始逐轮堆排序。', 'Every parent is at least its children, so the root is the global maximum and heap sort can start.'),
      };
    case 'push-append':
      return {
        action: tx(lang, `追加 ${heapElementLabel(snapshot, snapshot.addedId)} 到数组末尾`, `Append ${heapElementLabel(snapshot, snapshot.addedId)} at the array tail`),
        why: tx(lang, '新元素先真实进入最后一个槽位，再沿父链上浮；最多走树高 O(log n) 层。', 'The new element really enters the last slot, then sifts up the parent chain for at most O(log n) levels.'),
      };
    case 'extract-select':
      return {
        action: tx(lang, `选中堆顶最大值 ${root}`, `Select max root ${root}`),
        why: tx(lang, '最大堆的根就是全局最大值；先记录返回值，再准备把末尾元素补到根。', 'The root of a max heap is the global maximum; record it before moving the tail element to the root.'),
      };
    case 'replace-root':
      return {
        action: tx(lang, `末尾元素补到根：${heapElementLabel(snapshot, snapshot.replacement?.id ?? null)}`, `Tail element replaces root: ${heapElementLabel(snapshot, snapshot.replacement?.id ?? null)}`),
        why: tx(lang, '旧根已移除，堆大小减一；末尾元素写入 #0 后，若不满足父 ≥ 子就从根下沉。', 'The old root is gone and the heap shrank by one; after the tail enters #0, sift down if parent ≥ child fails.'),
      };
    case 'sort-select':
      return {
        action: tx(lang, `堆排序：选中当前最大值 ${root}`, `Heap sort: select current maximum ${root}`),
        why: tx(lang, '当前堆顶是剩余堆区最大值，把它交换到当前堆尾即可固定一个最终位置。', 'The root is the maximum of the remaining heap; swapping it to the current end fixes one final position.'),
      };
    case 'swap-to-end': {
      const second = heapElementLabel(snapshot, snapshot.swap?.secondId ?? null);
      return {
        action: tx(lang, `最大值换到堆尾：${second}`, `Maximum moved to the heap end: ${second}`),
        why: tx(lang, '交换后堆区缩小，sortedFrom 及其右侧不再参与调整；再从新根下沉恢复堆性质。', 'After the swap the heap shrinks; slots from sortedFrom onward are never adjusted again, and the new root is sifted down.'),
      };
    }
    case 'done': {
      const result = snapshot.result === 'sorted'
        ? tx(lang, '堆排序完成，数组升序', 'heap sort complete, array ascending')
        : snapshot.result === 'extracted'
          ? tx(lang, `删除堆顶完成，最大值 ${snapshot.removed?.value ?? '—'}`, `extract complete, maximum ${snapshot.removed?.value ?? '—'}`)
          : snapshot.result === 'empty'
            ? tx(lang, '空堆，没有可删除的堆顶', 'empty heap, no maximum to extract')
            : snapshot.result === 'pushed'
              ? tx(lang, '插入完成，堆性质成立', 'push complete, heap invariant holds')
              : tx(lang, '建堆完成，堆性质成立', 'build complete, heap invariant holds');
      return {
        action: tx(lang, `最终状态：${result}`, `Final state: ${result}`),
        why: tx(lang, '终帧读取同一份真实数组：建堆/插入/删除检查父 ≥ 子，堆排序检查整数组升序。', 'The terminal frame reads the same real array: build/push/extract check parent ≥ child, heap sort checks the entire array is ascending.'),
      };
    }
    default:
      return { action: active, why: currentHeapWhy(lang) };
  }
}

function currentHeapWhy(lang: LessonLang): string {
  return tx(lang, '完全二叉树的槽位与数组下标一一对应，帧中的元素编号只表示身份。', 'Complete-tree slots map one-to-one to array indices; ids identify elements only.');
}

function heapInsight(
  snapshot: MaxHeapSnapshot,
  lang: LessonLang,
  hasStep: boolean,
  lesson: Lesson | undefined,
  event: TraceEvent,
  previousEvent: TraceEvent | undefined,
): FrameInsight {
  const previous = previousEvent?.structure?.kind === 'max-heap' ? previousEvent.structure : undefined;
  const { action, why } = heapActionParts(snapshot, lang);
  const changes: FrameChange[] = [];
  const root = heapRootLabel(snapshot);
  const previousRoot = previous ? heapRootLabel(previous) : null;
  const previousHeapSize = previous ? previous.heapSize : null;
  if (previousRoot !== null && previousRoot !== root) {
    changes.push({ label: tx(lang, '根', 'root'), before: previousRoot, after: root, tone: 'update' });
  } else {
    changes.push({ label: tx(lang, '根', 'root'), after: root, tone: 'neutral' });
  }
  changes.push({
    label: tx(lang, '堆大小', 'heap size'),
    before: previousHeapSize === null ? undefined : `${previousHeapSize}/${previous?.totalSize ?? '—'}`,
    after: `${snapshot.heapSize}/${snapshot.totalSize}`,
    tone: snapshot.heapSize !== previousHeapSize ? 'update' : 'neutral',
  });
  if (snapshot.sortedFrom !== null) {
    changes.push({
      label: tx(lang, '已排序后缀', 'sorted suffix'),
      after: heapSortedLabel(snapshot),
      detail: `#${snapshot.sortedFrom} … #${Math.max(snapshot.sortedFrom, snapshot.totalSize - 1)}`,
      tone: 'success',
    });
  } else if (snapshot.pathIds.length > 0) {
    changes.push({ label: tx(lang, '根→当前路径', 'root → active'), after: heapPathLabel(snapshot), tone: 'neutral' });
  }
  if (snapshot.removed) {
    changes.push({
      label: tx(lang, '删除的最大值', 'removed maximum'),
      before: `${snapshot.removed.id}(${snapshot.removed.value})`,
      after: tx(lang, '已离开数组', 'gone from the array'),
      tone: 'warning',
    });
  }
  if (snapshot.replacement) {
    changes.push({
      label: tx(lang, '补根元素', 'tail to root'),
      before: `#${snapshot.replacement.fromSlot}`,
      after: `#${snapshot.replacement.toSlot}`,
      tone: 'update',
    });
  }
  return {
    semantic: true,
    action,
    why: hasStep ? firstSentence(lesson?.steps.find((step) => step.stepId === event.lessonStepId)?.explanation[lang] ?? why) : why,
    changes: changes.slice(0, 4),
    memory: hasStep ? firstSentence(lesson?.steps.find((step) => step.stepId === event.lessonStepId)?.tip?.[lang] ?? '', 140) || null : null,
  };
}

function huffmanInsight(
  snapshot: HuffmanSnapshot,
  lang: LessonLang,
  hasStep: boolean,
  lesson: Lesson | undefined,
  event: TraceEvent,
  previousEvent: TraceEvent | undefined,
): FrameInsight {
  const byId = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const label = (id: string | null) => {
    if (!id) return '—';
    const node = byId.get(id);
    if (!node) return id;
    return node.symbol === null ? `Σ${node.weight}(${node.id})` : `${node.symbol}=${node.weight}(${node.id})`;
  };
  const previous = previousEvent?.structure?.kind === 'huffman' ? previousEvent.structure : undefined;
  const rootId = snapshot.nodes.find((node) => !snapshot.nodes.some((other) => other.leftId === node.id || other.rightId === node.id))?.id ?? null;
  const metrics = snapshot.metrics;

  const action = (() => {
    switch (snapshot.operation) {
      case 'init':
        return tx(lang, `初始化：${snapshot.nodes.length} 个字符各自成为叶子并进入最小堆`, `Init: ${snapshot.nodes.length} symbols become leaves in the min-heap`);
      case 'merge-select':
        return tx(lang, `取出两个最小根：${label(snapshot.pickedIds?.[0] ?? null)} 与 ${label(snapshot.pickedIds?.[1] ?? null)}`, `Pop the two minima: ${label(snapshot.pickedIds?.[0] ?? null)} and ${label(snapshot.pickedIds?.[1] ?? null)}`);
      case 'merge-create': {
        const created = snapshot.createdId ? byId.get(snapshot.createdId) : undefined;
        const left = created?.leftId ? byId.get(created.leftId) : undefined;
        const right = created?.rightId ? byId.get(created.rightId) : undefined;
        return tx(
          lang,
          `合并出新父节点 ${label(snapshot.createdId)}，权值 ${left?.weight ?? '?'}+${right?.weight ?? '?'}=${created?.weight ?? '?'}`,
          `Create parent ${label(snapshot.createdId)} with weight ${left?.weight ?? '?'}+${right?.weight ?? '?'}=${created?.weight ?? '?'}`,
        );
      }
      case 'merge-requeue':
        return tx(lang, `新父节点 ${label(snapshot.createdId)} 重新入堆；当前堆顶 ${label(snapshot.queueIds[0] ?? null)}`, `Requeue ${label(snapshot.createdId)}; heap top is ${label(snapshot.queueIds[0] ?? null)}`);
      case 'build-done':
        return tx(lang, `建树完成：森林只剩根 ${label(rootId)}，WPL=${metrics?.wpl ?? '—'}`, `Build complete: single root ${label(rootId)}, WPL=${metrics?.wpl ?? '—'}`);
      case 'encode-start':
        return tx(lang, `从根 ${label(snapshot.activeNodeId)} 开始编码，左 0 右 1`, `Encode from root ${label(snapshot.activeNodeId)}; left 0, right 1`);
      case 'encode-left':
        return tx(lang, `走左分支追加 0，前缀 ${snapshot.prefix || '(空)'} → ${label(snapshot.activeNodeId)}`, `Take left and append 0: prefix ${snapshot.prefix || '(empty)'} → ${label(snapshot.activeNodeId)}`);
      case 'encode-right':
        return tx(lang, `走右分支追加 1，前缀 ${snapshot.prefix || '(空)'} → ${label(snapshot.activeNodeId)}`, `Take right and append 1: prefix ${snapshot.prefix || '(empty)'} → ${label(snapshot.activeNodeId)}`);
      case 'encode-leaf': {
        const node = snapshot.activeNodeId ? byId.get(snapshot.activeNodeId) : undefined;
        const code = snapshot.codes.find((row) => row.nodeId === snapshot.activeNodeId)?.code;
        return tx(lang, `到达叶子 ${node?.symbol ?? '?'}，编码 ${code ?? '?'}，码长 ${code?.length ?? 0}`, `Leaf ${node?.symbol ?? '?'} reached: code ${code ?? '?'}, length ${code?.length ?? 0}`);
      }
      case 'done':
        return snapshot.result === 'empty'
          ? tx(lang, '空输入：不建树、不编码，WPL 与位数均为 0', 'Empty input: no tree, no codes, WPL and bits are 0')
          : tx(lang, `编码完成：${metrics?.leafCount ?? 0} 个前缀码，WPL=${metrics?.wpl ?? '—'}，共 ${metrics?.totalBits ?? '—'} 位`, `Encoding complete: ${metrics?.leafCount ?? 0} prefix codes, WPL=${metrics?.wpl ?? '—'}, ${metrics?.totalBits ?? '—'} bits`);
    }
  })();

  const fallbackWhy = tx(
    lang,
    '哈夫曼建树与编码读同一份真实 Python 快照：树、最小堆和编码表同时来自当前帧。',
    'Huffman build and coding read one real Python snapshot: tree, min-heap and code table all come from the current frame.',
  );
  const changes: FrameChange[] = [];
  const previousQueue = previous?.queueIds.length ?? null;
  changes.push({
    label: tx(lang, '最小堆大小', 'heap size'),
    before: previousQueue === null ? undefined : String(previousQueue),
    after: String(snapshot.queueIds.length),
    detail: snapshot.queueIds.length ? snapshot.queueIds.join(' ') : tx(lang, '空', 'empty'),
    tone: snapshot.queueIds.length !== previousQueue ? 'update' : 'neutral',
  });
  if (snapshot.pickedIds) {
    changes.push({
      label: tx(lang, '取出的两个最小根', 'popped minima'),
      after: snapshot.pickedIds.map((id) => label(id)).join(' + '),
      tone: 'warning',
    });
  }
  if (snapshot.createdId) {
    const created = byId.get(snapshot.createdId);
    changes.push({
      label: tx(lang, '新父节点', 'new parent'),
      before: snapshot.operation === 'merge-create' ? tx(lang, '尚未入堆', 'not yet in heap') : undefined,
      after: created ? `${created.id}: ${created.weight}` : snapshot.createdId,
      tone: 'success',
    });
  }
  if (snapshot.operation === 'build-done' && rootId) {
    changes.push({ label: tx(lang, '唯一根', 'single root'), after: label(rootId), tone: 'success' });
  }
  if (snapshot.activeNodeId) {
    changes.push({
      label: tx(lang, 'active / 当前前缀', 'active / prefix'),
      after: `${label(snapshot.activeNodeId)} · ${snapshot.prefix || '(空)'}`,
      tone: 'update',
    });
  }
  if (snapshot.operation === 'encode-leaf') {
    const row = snapshot.codes.find((item) => item.nodeId === snapshot.activeNodeId);
    if (row) {
      changes.push({
        label: tx(lang, '新增编码行', 'new code row'),
        after: `${row.symbol} → ${row.code} (${row.length})`,
        tone: 'success',
      });
    }
  }
  if (metrics) {
    changes.push({
      label: tx(lang, 'WPL / 实际总位数', 'WPL / total bits'),
      after: `${metrics.wpl} / ${metrics.totalBits}`,
      detail: tx(lang, `定长 ${metrics.fixedBitsPerChar} 位/字符 → ${metrics.fixedBits} 位`, `fixed ${metrics.fixedBitsPerChar} bits/symbol → ${metrics.fixedBits} bits`),
      tone: 'neutral',
    });
  }

  return {
    semantic: true,
    action,
    why: hasStep ? firstSentence(lesson?.steps.find((step) => step.stepId === event.lessonStepId)?.explanation[lang] ?? fallbackWhy) : fallbackWhy,
    changes: changes.slice(0, 4),
    memory: hasStep ? firstSentence(lesson?.steps.find((step) => step.stepId === event.lessonStepId)?.tip?.[lang] ?? '', 140) || null : null,
  };
}

function dijkstraInsight(
  snapshot: WeightedGraphSnapshot,
  lang: LessonLang,
  hasStep: boolean,
  lesson: Lesson | undefined,
  event: TraceEvent,
  previousEvent: TraceEvent | undefined,
): FrameInsight {
  const start = snapshot.startNodeId ?? '—';
  const target = snapshot.targetNodeId ?? '—';
  const current = snapshot.currentNodeId;
  const neighbor = snapshot.neighborNodeId;
  const edge = weightedEdge(snapshot, snapshot.currentEdgeId);
  const currentDistance = weightedDistance(snapshot, current);
  const neighborDistance = weightedDistance(snapshot, neighbor);
  const memoryFor = (zh: string, en: string) => (hasStep ? tx(lang, zh, en) : null);

  switch (snapshot.operation) {
    case 'init':
      return {
        semantic: true,
        action: tx(lang, `初始化带权图与距离表：${start} 出发，目标 ${target}`, `Initialise weighted graph and distances: start ${start}, target ${target}`),
        why: tx(lang, '距离表用 ∞ 表示未知；最小堆为空，起点尚未确定。', 'Distances start at ∞ for unknown; the min-heap is empty and no node is settled yet.'),
        changes: [
          { label: tx(lang, '距离表', 'distances'), after: tx(lang, '全部 ∞', 'all ∞'), tone: 'neutral' },
          { label: tx(lang, '起点 / 目标', 'start / target'), after: `${start} / ${target}`, tone: 'neutral' },
          { label: tx(lang, '最小堆', 'min-heap'), after: tx(lang, '空', 'empty'), tone: 'neutral' },
        ],
        memory: memoryFor('∞ 不是 0：未知就是未知。', '∞ is not 0: unknown stays unknown.'),
      };
    case 'push':
      return {
        semantic: true,
        action: tx(lang, `起点 ${current ?? start} 入堆：候选距离 0`, `Push start ${current ?? start}: candidate distance 0`),
        why: tx(lang, '起点距离写成 0 后入堆；堆里的是候选，不是已经确定的最短距离。', 'The start distance becomes 0 and enters the heap; a heap entry is a candidate, not a settled distance.'),
        changes: [
          { label: tx(lang, '入堆', 'push'), after: entryLabel(snapshot.frontierAdded), tone: 'update' },
          { label: tx(lang, '距离', 'distance'), before: '∞', after: formatNumber(currentDistance), tone: 'update' },
          { label: tx(lang, '堆大小', 'heap size'), after: String(snapshot.frontierItems.length), tone: 'neutral' },
        ],
        memory: memoryFor('堆里是候选，不是最终答案。', 'The heap stores candidates, not final answers.'),
      };
    case 'pop':
      return {
        semantic: true,
        action: tx(lang, `弹出堆顶 ${entryLabel(snapshot.frontierRemoved)}`, `Pop heap top ${entryLabel(snapshot.frontierRemoved)}`),
        why: tx(lang, '取出当前距离最小的候选；接下来还要核对它是否过期，不能直接宣布最短。', 'Remove the smallest candidate; the staleness check still has to decide whether it can be settled.'),
        changes: [
          { label: tx(lang, '弹出', 'popped'), after: entryLabel(snapshot.frontierRemoved), tone: 'neutral' },
          { label: tx(lang, '堆剩余', 'heap left'), after: heapLabel(snapshot), tone: 'neutral' },
          { label: tx(lang, '检查门槛', 'gate'), detail: tx(lang, '弹出 ≠ 确定；下一帧比较距离与已确定集合。', 'Popping is not settling; the next frame compares the distance and settled set.'), tone: 'neutral' },
        ],
        memory: memoryFor('先弹出，再检查；弹出 ≠ 确定。', 'Pop first, then check: popping is not settling.'),
      };
    case 'stale':
      return {
        semantic: true,
        action: tx(lang, `丢弃过期堆条目 ${entryLabel(snapshot.frontierRemoved)}`, `Discard stale heap entry ${entryLabel(snapshot.frontierRemoved)}`),
        why: tx(lang, '同一节点可能有多条候选；这条已经比距离表旧或节点已确定，不能再处理。', 'A node can have several candidates; this entry is older than the table or already settled, so it must not be processed.'),
        changes: [
          { label: tx(lang, '丢弃条目', 'discarded'), after: entryLabel(snapshot.frontierRemoved), tone: 'warning' },
          { label: tx(lang, '距离表中的节点', 'table distance'), after: `${current ?? '—'} = ${formatNumber(currentDistance)}`, tone: 'neutral' },
          { label: tx(lang, '结论', 'verdict'), detail: tx(lang, '旧条目不重复处理节点。', 'The old entry is discarded without reprocessing the node.'), tone: 'neutral' },
        ],
        memory: memoryFor('旧候选直接丢，别重复处理节点。', 'Drop stale candidates; never reprocess the node.'),
      };
    case 'settle':
      return {
        semantic: true,
        action: tx(lang, `确定 ${current ?? '—'} 的最短距离 ${formatNumber(currentDistance)}`, `Settle shortest distance of ${current ?? '—'}: ${formatNumber(currentDistance)}`),
        why: tx(lang, '堆中最小候选不小于它，且边权非负，因此不会再被任何绕路改小。', 'Every remaining candidate is at least as large and all weights are non-negative, so no detour can reduce it.'),
        changes: [
          { label: tx(lang, '已确定', 'settled'), after: current ?? '—', tone: 'success' },
          { label: tx(lang, '最短距离', 'distance'), after: formatNumber(currentDistance), tone: 'success' },
          { label: tx(lang, '已确认', 'confirmed'), after: `${visitedCount(snapshot)} / ${snapshot.nodes.length}`, tone: 'neutral' },
        ],
        memory: memoryFor('非负边权 + 最小候选 = 可以盖章。', 'Non-negative weights + smallest candidate = safe to stamp.'),
      };
    case 'inspect-edge': {
      const weight = edge?.weight ?? null;
      const candidate = currentDistance !== null && weight !== null ? currentDistance + weight : null;
      return {
        semantic: true,
        action: tx(lang, `检查边 ${graphEdgeLabel(edge)}`, `Inspect edge ${graphEdgeLabel(edge)}`),
        why: tx(lang, '候选距离 = 当前已确定距离 + 这条边的权重；这一帧还没有决定是否更新。', 'Candidate = current settled distance + this edge weight; this frame has not decided whether to update yet.'),
        changes: [
          { label: tx(lang, '当前边', 'edge'), after: graphEdgeLabel(edge), tone: 'neutral' },
          { label: tx(lang, '候选距离', 'candidate'), after: candidate === null ? '—' : `${formatNumber(currentDistance)} + ${weight} = ${candidate}`, tone: 'neutral' },
          { label: tx(lang, '邻居当前距离', 'neighbour'), after: `${neighbor ?? '—'} = ${formatNumber(neighborDistance)}`, tone: 'neutral' },
        ],
        memory: memoryFor('候选 = 当前距离 + 边权。', 'Candidate = current distance + edge weight.'),
      };
    }
    case 'relax': {
      const change = snapshot.relax;
      return {
        semantic: true,
        action: tx(lang, `松弛 ${edge?.fromId ?? '—'} → ${edge?.toId ?? '—'}：${formatNumber(change?.oldDistance)} → ${formatNumber(change?.newDistance)}`, `Relax ${edge?.fromId ?? '—'} → ${edge?.toId ?? '—'}: ${formatNumber(change?.oldDistance)} → ${formatNumber(change?.newDistance)}`),
        why: tx(lang, '候选严格小于邻居当前距离，才同时替换距离和前驱，并把新候选入堆。', 'Only a strictly smaller candidate replaces both the distance and previous pointer, then pushes the new candidate.'),
        changes: [
          { label: tx(lang, '距离', 'distance'), before: formatNumber(change?.oldDistance), after: formatNumber(change?.newDistance), tone: 'update' },
          { label: tx(lang, '前驱', 'previous'), before: change?.oldPreviousId ?? '—', after: change?.newPreviousId ?? '—', tone: 'update' },
          { label: tx(lang, '新堆条目', 'new heap entry'), after: `${change?.nodeId ?? '—'}(${formatNumber(change?.newDistance)})`, tone: 'update' },
        ],
        memory: memoryFor('严格变小才改距离和前驱。', 'Only a strict decrease changes distance and previous.'),
      };
    }
    case 'skip': {
      const weight = edge?.weight ?? null;
      const candidate = currentDistance !== null && weight !== null ? currentDistance + weight : null;
      return {
        semantic: true,
        action: tx(lang, `不松弛 ${graphEdgeLabel(edge)}：候选 ${formatNumber(candidate)} ≥ ${formatNumber(neighborDistance)}`, `Skip ${graphEdgeLabel(edge)}: candidate ${formatNumber(candidate)} ≥ ${formatNumber(neighborDistance)}`),
        why: tx(lang, '候选没有严格更小，保留原距离和原前驱；skip 不是失败，而是没有改进。', 'The candidate is not strictly smaller, so the old distance and previous stay; skip is not a failure, just no improvement.'),
        changes: [
          { label: tx(lang, '候选', 'candidate'), after: candidate === null ? '—' : `${formatNumber(currentDistance)} + ${weight} = ${candidate}`, tone: 'neutral' },
          { label: tx(lang, '当前距离', 'current distance'), after: `${neighbor ?? '—'} = ${formatNumber(neighborDistance)}`, tone: 'neutral' },
          { label: tx(lang, '结论', 'verdict'), detail: tx(lang, '不严格变小，保留原值。', 'Not a strict decrease; keep the old value.'), tone: 'neutral' },
        ],
        memory: memoryFor('不严格变小就保留，skip 不是错误。', 'Keep the old value when not strictly smaller; skip is not an error.'),
      };
    }
    case 'done':
      return {
        semantic: true,
        action: tx(lang, `堆空：${snapshot.pathNodeIds?.length ? `最短路径 ${pathLabel(snapshot.pathNodeIds)}` : '没有可达路径'}`, `Heap empty: ${snapshot.pathNodeIds?.length ? `shortest path ${pathLabel(snapshot.pathNodeIds)}` : 'no reachable path'}`),
        why: tx(lang, '堆清空后算法结束；路径由真实 previous 指针反向恢复，不是预先写好的字符串。', 'The algorithm ends when the heap is empty; the path is restored from real previous pointers, not a prewritten string.'),
        changes: [
          { label: tx(lang, '路径', 'path'), after: pathLabel(snapshot.pathNodeIds), tone: snapshot.pathNodeIds?.length ? 'success' : 'warning' },
          { label: tx(lang, '总权重', 'total weight'), after: formatNumber(snapshot.pathDistance), tone: snapshot.pathDistance !== null ? 'success' : 'warning' },
          { label: tx(lang, '已确定', 'settled'), after: `${visitedCount(snapshot)} / ${snapshot.nodes.length}`, tone: 'neutral' },
        ],
        memory: memoryFor('路径从 previous 反向恢复，不是背答案。', 'The path is restored from previous pointers, not memorised.'),
      };
    default:
      return fallbackInsight(lesson, event, previousEvent, lang);
  }
}

function kahnInsight(snapshot: TopologicalSortSnapshot, lang: LessonLang, hasStep: boolean, lesson: Lesson | undefined, event: TraceEvent, previousEvent: TraceEvent | undefined): FrameInsight {
  const current = snapshot.currentNodeId;
  const neighbor = snapshot.neighborNodeId;
  const edge = graphEdge(snapshot, snapshot.currentEdgeId);
  const added = snapshot.queueAdded;
  const removed = snapshot.queueRemoved;
  const indegreeChange = snapshot.indegreeChange;
  const memoryFor = (zh: string, en: string) => (hasStep ? tx(lang, zh, en) : null);
  const unresolved = snapshot.cycleNodeIds.length ? snapshot.cycleNodeIds : snapshot.nodes.map((node) => node.id).filter((id) => !snapshot.topologicalOrder.includes(id));

  switch (snapshot.operation) {
    case 'init': {
      const sources = snapshot.indegree.filter((row) => row.indegree === 0).map((row) => row.nodeId);
      return {
        semantic: true,
        action: tx(lang, `初始化入度表：零入度源点 ${listLabel(sources, '无')}`, `Initialise indegrees: zero-indegree sources ${listLabel(sources, 'none')}`),
        why: tx(lang, '入度是还没完成的前驱数量；只有入度为 0 的顶点才能作为拓扑序列的起点。', 'Indegree counts unfinished predecessors; only a zero-indegree vertex may open a topological order.'),
        changes: [
          { label: tx(lang, '图规模', 'graph'), after: `${snapshot.nodes.length} 顶点 / ${snapshot.edges.length} 依赖边`, tone: 'neutral' },
          { label: tx(lang, '零入度', 'sources'), after: listLabel(sources, '无'), tone: 'neutral' },
          { label: tx(lang, '候选队列', 'queue'), after: kahnQueue(snapshot), tone: 'neutral' },
        ],
        memory: memoryFor('入度 = 还有多少前驱没完成。', 'Indegree = how many predecessors remain unfinished.'),
      };
    }
    case 'enqueue':
    case 'enqueue-node':
      return {
        semantic: true,
        action: tx(lang, `零入度 ${added?.nodeId ?? current ?? '—'} 入队`, `Zero-indegree ${added?.nodeId ?? current ?? '—'} enters the queue`),
        why: tx(lang, '所有前驱都被移除，入度变成 0，顶点才获得入队资格。', 'Every predecessor has been removed and the indegree reached 0, so the vertex may enter the queue.'),
        changes: [
          { label: tx(lang, '入队', 'enqueue'), after: added?.nodeId ?? '—', tone: 'success' },
          { label: tx(lang, '入度', 'indegree'), after: `${added?.nodeId ?? '—'} = ${kahnIndegree(snapshot, added?.nodeId ?? null)}`, tone: 'update' },
          { label: tx(lang, '队列', 'queue'), after: kahnQueue(snapshot), tone: 'neutral' },
        ],
        memory: memoryFor('入度真正为 0 才入队，候选不等于已排序。', 'Only a real zero indegree enters the queue; queued is not ordered yet.'),
      };
    case 'dequeue':
      return {
        semantic: true,
        action: tx(lang, `出队 ${removed?.nodeId ?? current ?? '—'}，写入拓扑序列`, `Dequeue ${removed?.nodeId ?? current ?? '—'} into the topological order`),
        why: tx(lang, '队首顶点的所有前驱都已处理完，因此它可以安全加入当前序列位置。', 'Every predecessor of the queue head is done, so it can safely take the current position.'),
        changes: [
          { label: tx(lang, '出队', 'dequeue'), after: removed?.nodeId ?? '—', tone: 'success' },
          { label: tx(lang, '拓扑序列', 'order'), after: kahnNodeList(snapshot.topologicalOrder), tone: 'update' },
          { label: tx(lang, '队列', 'queue'), after: kahnQueue(snapshot), tone: 'neutral' },
        ],
        memory: memoryFor('只有出队才进入序列。', 'Only a real dequeue appends to the order.'),
      };
    case 'inspect-edge':
      return {
        semantic: true,
        action: tx(lang, `检查依赖 ${graphEdgeLabel(edge, false)}`, `Inspect dependency ${graphEdgeLabel(edge, false)}`),
        why: tx(lang, '这条边仍是一条未移除的依赖；检查它，但还不能提前把入度减一。', 'The edge is still an unremoved dependency; inspect it without decrementing early.'),
        changes: [
          { label: tx(lang, '当前边', 'edge'), after: graphEdgeLabel(edge, false), tone: 'neutral' },
          { label: tx(lang, '目标入度', 'target indegree'), after: `${neighbor ?? '—'} = ${kahnIndegree(snapshot, snapshot.neighborNodeId)}`, tone: 'neutral' },
          { label: tx(lang, '状态', 'state'), detail: tx(lang, '尚未减一，边还未移除。', 'Not decremented yet; the edge is still present.'), tone: 'neutral' },
        ],
        memory: memoryFor('检查边和移除依赖是两个真实帧。', 'Inspecting and removing a dependency are two real frames.'),
      };
    case 'decrement':
      return {
        semantic: true,
        action: tx(lang, `移除依赖 ${graphEdgeLabel(edge, false)}：入度 ${indegreeChange?.before ?? '—'} → ${indegreeChange?.after ?? '—'}`, `Remove dependency ${graphEdgeLabel(edge, false)}: indegree ${indegreeChange?.before ?? '—'} → ${indegreeChange?.after ?? '—'}`),
        why: tx(lang, '当前顶点的出边贡献了一条依赖；移除它，目标顶点的入度就减少 1。', 'The current vertex contributes one dependency; removing it decrements the target indegree by one.'),
        changes: [
          { label: tx(lang, '入度', 'indegree'), before: String(indegreeChange?.before ?? '—'), after: String(indegreeChange?.after ?? '—'), tone: 'update' },
          { label: tx(lang, '已移除边', 'removed edges'), after: `${snapshot.removedEdgeIds.length} / ${snapshot.edges.length}`, tone: 'neutral' },
          { label: tx(lang, '队列', 'queue'), after: kahnQueue(snapshot), tone: 'neutral' },
        ],
        memory: memoryFor('减到 0 才是所有前驱完成。', 'Only reaching 0 means every predecessor is done.'),
      };
    case 'cycle':
      return {
        semantic: true,
        action: tx(lang, `检测到有向环：${listLabel(unresolved, '—')}`, `Directed cycle detected: ${listLabel(unresolved, '—')}`),
        why: tx(lang, '队列空了但仍有顶点未进入序列，它们的入度都大于 0，互相等待。', 'The queue is empty while vertices remain outside the order; their indegrees are positive and they wait on one another.'),
        changes: [
          { label: tx(lang, '未解析顶点', 'unresolved'), after: listLabel(unresolved, '—'), tone: 'warning' },
          { label: tx(lang, '队列', 'queue'), after: kahnQueue(snapshot), tone: 'warning' },
          { label: tx(lang, '结论', 'verdict'), detail: tx(lang, '不存在完整拓扑序。', 'No complete topological order exists.'), tone: 'warning' },
        ],
        memory: memoryFor('队列空仍有剩余顶点 = 有向环。', 'Empty queue with vertices left = directed cycle.'),
      };
    case 'done':
      return {
        semantic: true,
        action: tx(lang, snapshot.hasCycle ? '拓扑排序结束：存在有向环，无完整拓扑序' : `拓扑排序完成：${kahnNodeList(snapshot.topologicalOrder)}`, snapshot.hasCycle ? 'Topological sort ended: directed cycle, no complete order' : `Topological sort complete: ${kahnNodeList(snapshot.topologicalOrder)}`),
        why: tx(lang, '每个顶点出队一次、每条边移除一次；记录里的顺序就是本次运行的真实拓扑序。', 'Each vertex dequeues once and each edge is removed once; the recorded order is this run’s real topological order.'),
        changes: [
          { label: tx(lang, '拓扑序列', 'order'), after: kahnNodeList(snapshot.topologicalOrder), tone: snapshot.hasCycle ? 'warning' : 'success' },
          { label: tx(lang, '顶点覆盖', 'coverage'), after: `${snapshot.topologicalOrder.length} / ${snapshot.nodes.length}`, tone: 'neutral' },
          { label: tx(lang, '移除依赖边', 'removed edges'), after: `${snapshot.removedEdgeIds.length} / ${snapshot.edges.length}`, tone: 'neutral' },
        ],
        memory: memoryFor('Kahn = 入度表 + 零入度队列；减到零再入队。', 'Kahn = indegree table + zero-indegree queue; enqueue at zero.'),
      };
    default:
      return fallbackInsight(lesson, event, previousEvent, lang, memoryFor);
  }
}

function kosarajuInsight(snapshot: KosarajuSnapshot, lang: LessonLang, hasStep: boolean, lesson: Lesson | undefined, event: TraceEvent, previousEvent: TraceEvent | undefined): FrameInsight {
  const current = snapshot.currentNodeId;
  const neighbor = snapshot.neighborNodeId;
  const edge = graphEdge(snapshot, snapshot.currentEdgeId);
  const start = snapshot.startNodeId;
  const group = kosarajuGroup(snapshot, snapshot.currentComponentId);
  const memoryFor = (zh: string, en: string) => (hasStep ? tx(lang, zh, en) : null);
  const phase = kosarajuPhase(snapshot, lang);
  const secondIndex = snapshot.secondPassIndex === null ? '—' : `${snapshot.secondPassIndex + 1} / ${snapshot.secondPassOrder.length || '—'}`;

  switch (snapshot.operation) {
    case 'init':
      return {
        semantic: true,
        action: tx(lang, '初始化 Kosaraju：原图、反向图与完成顺序', 'Initialise Kosaraju: original graph, transpose and finish order'),
        why: tx(lang, 'Kosaraju 需要两遍 DFS：第一遍记录完成顺序，第二遍按逆序在转置图上划分 SCC。', 'Kosaraju needs two DFS passes: one records finish order, the other partitions the transpose in reverse order.'),
        changes: [
          { label: tx(lang, '阶段', 'phase'), after: tx(lang, '第一遍 DFS', 'first DFS pass'), tone: 'neutral' },
          { label: tx(lang, '图规模', 'graph'), after: `${snapshot.nodes.length} 顶点 / ${snapshot.edges.length} 有向边`, tone: 'neutral' },
          { label: tx(lang, '反向图', 'transpose'), after: tx(lang, '未构建', 'not built'), tone: 'neutral' },
        ],
        memory: memoryFor('两遍 DFS：先记完成顺序，再在转置图逆序扫描。', 'Two DFS passes: finish order first, then reverse scan on the transpose.'),
      };
    case 'start-first':
      return {
        semantic: true,
        action: tx(lang, `第一遍 DFS：从 ${start ?? '—'} 开始`, `First DFS pass: start at ${start ?? '—'}`),
        why: tx(lang, '从未发现的根开始 DFS，沿原图出边把所有可达节点压入栈。', 'Start DFS at an undiscovered root and push every reachable node along original outgoing edges.'),
        changes: [
          { label: tx(lang, '阶段', 'phase'), after: phase, tone: 'neutral' },
          { label: tx(lang, '根节点', 'root'), after: start ?? '—', tone: 'update' },
          { label: tx(lang, 'DFS 栈', 'DFS stack'), after: kosarajuStack(snapshot), tone: 'neutral' },
        ],
        memory: memoryFor('第一遍不划分 SCC，只记录谁最后完成。', 'The first pass does not partition SCCs; it records who finishes last.'),
      };
    case 'inspect-edge':
      return {
        semantic: true,
        action: tx(lang, `检查${snapshot.phase === 'second-pass' ? '转置图' : '原图'}边 ${graphEdgeLabel(edge, false)}`, `Inspect ${snapshot.phase === 'second-pass' ? 'transpose' : 'original'} edge ${graphEdgeLabel(edge, false)}`),
        why: tx(lang, '检查当前出边；如果邻居还没发现，就继续 DFS；否则跳过，避免重复压栈。', 'Inspect the current outgoing edge; continue DFS if the neighbour is undiscovered, otherwise skip to avoid duplicate pushes.'),
        changes: [
          { label: tx(lang, '阶段', 'phase'), after: phase, tone: 'neutral' },
          { label: tx(lang, '当前边', 'edge'), after: graphEdgeLabel(edge, false), tone: 'neutral' },
          { label: tx(lang, '邻居', 'neighbour'), after: `${neighbor ?? '—'} ${snapshot.discoveredIds.includes(neighbor ?? '') ? tx(lang, '已发现', 'discovered') : tx(lang, '未发现', 'undiscovered')}`, tone: 'neutral' },
        ],
        memory: memoryFor('发现过就不再压栈，避免重复 DFS。', 'Once discovered, do not push again; avoid duplicate DFS.'),
      };
    case 'skip':
      return {
        semantic: true,
        action: tx(lang, `跳过 ${graphEdgeLabel(edge, false)}：${neighbor ?? '—'} 已发现`, `Skip ${graphEdgeLabel(edge, false)}: ${neighbor ?? '—'} already discovered`),
        why: tx(lang, '邻居已在 discovered 中，继续压栈会重复处理同一节点，因此跳过这条边。', 'The neighbour is already discovered; pushing again would reprocess the same node, so this edge is skipped.'),
        changes: [
          { label: tx(lang, '阶段', 'phase'), after: phase, tone: 'neutral' },
          { label: tx(lang, '跳过的边', 'skipped edge'), after: graphEdgeLabel(edge, false), tone: 'neutral' },
          { label: tx(lang, '结论', 'verdict'), detail: tx(lang, '不重复压栈。', 'No duplicate push.'), tone: 'neutral' },
        ],
        memory: memoryFor('已发现的节点不再压栈。', 'A discovered node is not pushed again.'),
      };
    case 'push':
      return {
        semantic: true,
        action: tx(lang, `发现 ${snapshot.frontierAdded?.nodeId ?? neighbor ?? '—'}，压入 DFS 栈`, `Discover ${snapshot.frontierAdded?.nodeId ?? neighbor ?? '—'} and push onto the DFS stack`),
        why: tx(lang, '邻居第一次被发现，加入 discovered 并压栈，后续帧会继续深入它。', 'The neighbour is discovered for the first time, joins discovered and is pushed so later frames can go deeper.'),
        changes: [
          { label: tx(lang, '新发现', 'discovered'), after: snapshot.frontierAdded?.nodeId ?? '—', tone: 'success' },
          { label: tx(lang, 'DFS 栈', 'DFS stack'), after: kosarajuStack(snapshot), tone: 'update' },
          { label: tx(lang, '已发现数', 'discovered count'), after: `${snapshot.discoveredIds.length} / ${snapshot.nodes.length}`, tone: 'neutral' },
        ],
        memory: memoryFor('压栈的是待深入节点，不是 SCC 结果。', 'The stack holds nodes to explore, not SCC results.'),
      };
    case 'finish':
      return {
        semantic: true,
        action: tx(lang, `${snapshot.frontierRemoved?.nodeId ?? current ?? '—'} 完成，写入完成顺序`, `${snapshot.frontierRemoved?.nodeId ?? current ?? '—'} finishes and enters the finish order`),
        why: tx(lang, '当前节点的所有出边都处理完了；它从栈中弹出并追加到完成顺序。', 'Every outgoing edge of the current node is done; it leaves the stack and is appended to the finish order.'),
        changes: [
          { label: tx(lang, '完成节点', 'finished'), after: snapshot.frontierRemoved?.nodeId ?? current ?? '—', tone: 'success' },
          { label: tx(lang, '完成顺序', 'finish order'), after: listLabel(snapshot.finishOrder), tone: 'update' },
          { label: tx(lang, 'DFS 栈', 'DFS stack'), after: kosarajuStack(snapshot), tone: 'neutral' },
        ],
        memory: memoryFor('完成顺序在第二遍要倒着用。', 'The finish order is used backwards in the second pass.'),
      };
    case 'reverse':
      return {
        semantic: true,
        action: tx(lang, '构造转置图：所有有向边反向', 'Build transpose: reverse every directed edge'),
        why: tx(lang, '第二遍要在转置图上按完成顺序的逆序扫描，才能正确切出强连通分量。', 'The second pass scans the transpose in reverse finish order to cut out SCCs correctly.'),
        changes: [
          { label: tx(lang, '阶段', 'phase'), after: phase, tone: 'update' },
          { label: tx(lang, '完成顺序', 'finish order'), after: `${snapshot.finishOrder.length} / ${snapshot.nodes.length}`, tone: 'neutral' },
          { label: tx(lang, '第二遍顺序', 'second order'), after: listLabel(snapshot.secondPassOrder), tone: 'neutral' },
        ],
        memory: memoryFor('第二遍走转置图，顺序取完成顺序的逆序。', 'Second pass uses the transpose in reverse finish order.'),
      };
    case 'start-second':
      return {
        semantic: true,
        action: tx(lang, `第二遍 DFS：根 ${start ?? '—'}，新建 ${kosarajuGroupLabel(group)}`, `Second DFS pass: root ${start ?? '—'}, open ${kosarajuGroupLabel(group)}`),
        why: tx(lang, '按逆序取出一个未分配节点，开启一个新的强连通分量。', 'Take an unassigned node in reverse order and open a new strongly connected component.'),
        changes: [
          { label: tx(lang, '根节点', 'root'), after: start ?? '—', tone: 'update' },
          { label: tx(lang, '新分量', 'new component'), after: kosarajuGroupLabel(group), tone: 'update' },
          { label: tx(lang, '逆序位置', 'reverse index'), after: secondIndex, tone: 'neutral' },
        ],
        memory: memoryFor('第二遍每个根开启一个新 SCC。', 'Each root in the second pass opens a new SCC.'),
      };
    case 'assign':
      return {
        semantic: true,
        action: tx(lang, `${current ?? '—'} 归入 ${kosarajuGroupLabel(group)}`, `Assign ${current ?? '—'} to ${kosarajuGroupLabel(group)}`),
        why: tx(lang, '当前节点从栈中弹出并归入当前分量；第二遍只沿转置图的可达边分配。', 'The current node leaves the stack and joins the current component; the second pass assigns along transpose-reachable edges only.'),
        changes: [
          { label: tx(lang, '归属', 'assigned to'), after: kosarajuGroupLabel(group), tone: 'success' },
          { label: tx(lang, '当前分量', 'component'), after: listLabel(group?.nodeIds ?? []), tone: 'update' },
          { label: tx(lang, '已发现数', 'discovered count'), after: `${snapshot.discoveredIds.length} / ${snapshot.nodes.length}`, tone: 'neutral' },
        ],
        memory: memoryFor('第二遍的分配范围来自转置图。', 'Second-pass assignment follows transpose edges.'),
      };
    case 'complete-component':
      return {
        semantic: true,
        action: tx(lang, `${kosarajuGroupLabel(group)} 完成`, `${kosarajuGroupLabel(group)} completes`),
        why: tx(lang, '当前分量的所有可达节点都分配完了；标记完成，下一帧再开新分量。', 'Every reachable node in this component has been assigned; mark it complete before opening another.'),
        changes: [
          { label: tx(lang, '完成分量', 'completed'), after: kosarajuGroupLabel(group), tone: 'success' },
          { label: tx(lang, '节点集合', 'nodes'), after: listLabel(group?.nodeIds ?? []), tone: 'neutral' },
          { label: tx(lang, '已完成分量', 'completed count'), after: `${snapshot.components.filter((item) => item.complete).length} / ${snapshot.componentCount}`, tone: 'neutral' },
        ],
        memory: memoryFor('一个分量完成，才继续下一个根。', 'Finish one component before moving to the next root.'),
      };
    case 'done':
      return {
        semantic: true,
        action: tx(lang, `SCC 划分完成：${snapshot.componentCount} 个分量`, `SCC partition complete: ${snapshot.componentCount} components`),
        why: tx(lang, '第二遍结束时，每个节点恰好属于一个强连通分量；分量数来自真实分组记录。', 'At the end of the second pass every node belongs to exactly one SCC; the count comes from the recorded groups.'),
        changes: [
          { label: tx(lang, '分量数', 'components'), after: String(snapshot.componentCount), tone: 'success' },
          { label: tx(lang, '分量列表', 'groups'), after: listLabel(snapshot.components.map((item) => kosarajuGroupLabel(item)), '—'), tone: 'neutral' },
          { label: tx(lang, '节点覆盖', 'coverage'), after: `${snapshot.components.reduce((total, item) => total + item.nodeIds.length, 0)} / ${snapshot.nodes.length}`, tone: 'neutral' },
        ],
        memory: memoryFor('转置图 + 逆完成顺序 = SCC。', 'Transpose + reverse finish order = SCCs.'),
      };
    default:
      return fallbackInsight(lesson, event, previousEvent, lang, memoryFor);
  }
}

function fallbackInsight(
  lesson: Lesson | undefined,
  event: TraceEvent | null,
  previousEvent: TraceEvent | undefined,
  lang: LessonLang,
  memoryFor?: (zh: string, en: string) => string | null,
): FrameInsight {
  const activeStep = event ? resolveStep(lesson, event.lessonStepId) : null;
  const action = activeStep?.title[lang] || event?.message || tx(lang, '当前执行帧', 'Current frame');
  const why = activeStep ? firstSentence(activeStep.explanation[lang]) : event?.message || '';
  const memory = memoryFor
    ? memoryFor('', '')
    : activeStep?.tip
      ? firstSentence(activeStep.tip[lang], 140)
      : null;
  const changes = event
    ? genericStateChanges(event, previousEvent, lang)
    : [{ label: tx(lang, '状态', 'state'), detail: tx(lang, '暂无执行帧。', 'No frame yet.'), tone: 'neutral' as const }];
  return {
    semantic: false,
    action,
    why,
    changes,
    memory: memory && memory.trim() ? memory : null,
  };
}

function stateValues(event: TraceEvent): { label: string; values: unknown[] } | null {
  const state = event.state as Record<string, unknown>;
  const type = state.type;
  if (type === 'array' && Array.isArray(state.values)) {
    return { label: 'Array', values: state.values };
  }
  if ((type === 'stack' || type === 'queue') && Array.isArray(state.values)) {
    return { label: type === 'stack' ? 'Stack' : 'Queue', values: state.values };
  }
  return null;
}

function compactValue(value: unknown, limit = 56): string {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
  } catch {
    return String(value);
  }
}

function genericStateChanges(event: TraceEvent, previousEvent: TraceEvent | undefined, lang: LessonLang): FrameChange[] {
  const current = stateValues(event);
  const previous = previousEvent ? stateValues(previousEvent) : null;
  const noChange: FrameChange = {
    label: tx(lang, '状态', 'state'),
    detail: tx(lang, '本帧没有记录结构化状态变化，正在检查、比较或准备下一步。', 'No structured state change was recorded for this frame; the step is inspecting, comparing or preparing the next move.'),
    tone: 'neutral',
  };
  if (!current) return [noChange];
  const label = current.label === 'Array'
    ? tx(lang, '数组', 'array')
    : current.label === 'Stack'
      ? tx(lang, '栈', 'stack')
      : tx(lang, '队列', 'queue');
  const after = `[${listLabel(current.values.map((value) => compactValue(value)))}]`;
  if (!previous || previous.label !== current.label) {
    return [{ label, after, detail: tx(lang, '当前帧记录的真实状态。', 'Real state recorded by this frame.'), tone: 'neutral' }];
  }
  const before = `[${listLabel(previous.values.map((value) => compactValue(value)))}]`;
  if (before === after) return [noChange];
  return [{ label, before, after, tone: 'update' }];
}

/**
 * Build the compact, frame-synchronised insight for the right rail.
 *
 * `lesson` may be undefined (algorithm without a course); `currentEvent` may be
 * undefined (before a run). In both cases the caller renders its own explicit
 * empty/unlinked state rather than using this function to invent a step.
 */
export function buildFrameInsight(
  lesson: Lesson | undefined,
  currentEvent: TraceEvent | undefined,
  previousEvent: TraceEvent | undefined,
  lang: LessonLang,
): FrameInsight | null {
  if (!currentEvent) return null;
  const activeStep: LessonStep | null = resolveStep(lesson, currentEvent.lessonStepId);
  const hasStep = activeStep !== null;
  const structure = currentEvent.structure;
  if (structure) {
    switch (structure.kind) {
      case 'weighted-graph':
        return dijkstraInsight(structure, lang, hasStep, lesson, currentEvent, previousEvent);
      case 'topological-sort':
        return kahnInsight(structure, lang, hasStep, lesson, currentEvent, previousEvent);
      case 'kosaraju':
        return kosarajuInsight(structure, lang, hasStep, lesson, currentEvent, previousEvent);
      case 'bst':
        return { semantic: true, ...treeAction(structure, lang, false), memory: activeStep?.tip ? firstSentence(activeStep.tip[lang], 140) : null };
      case 'avl':
        return { semantic: true, ...treeAction(structure, lang, true), memory: activeStep?.tip ? firstSentence(activeStep.tip[lang], 140) : null };
      case 'max-heap':
        return heapInsight(structure, lang, hasStep, lesson, currentEvent, previousEvent);
      case 'huffman':
        return huffmanInsight(structure, lang, hasStep, lesson, currentEvent, previousEvent);
      default:
        break;
    }
  }

  const action = activeStep?.title[lang] || currentEvent.message || tx(lang, '当前执行帧', 'Current frame');
  const why = activeStep ? firstSentence(activeStep.explanation[lang]) : currentEvent.message;
  const memory = activeStep?.tip ? firstSentence(activeStep.tip[lang], 140) : null;
  return {
    semantic: false,
    action,
    why,
    changes: genericStateChanges(currentEvent, previousEvent, lang),
    memory,
  };
}
