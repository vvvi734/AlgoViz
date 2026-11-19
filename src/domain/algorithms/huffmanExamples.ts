/**
 * T4: real Python Huffman tree + prefix-code teaching program.
 *
 * `heapq` is the only priority queue. Every merge pops two real entries, creates
 * a real parent with left/right references, pushes that parent back and emits a
 * snapshot of the forest, the actual heap array and the codes produced so far.
 * No tree is drawn from a precomputed answer.
 *
 * Equal weights are ordered by `order`, a monotonically increasing creation
 * index. Python's heapq therefore has a fully deterministic tie-break even
 * though Huffman codes themselves are not unique.
 */

export const HUFFMAN_PRESETS = [
  {
    id: 'official',
    label: 'huffmanPresetOfficial',
    symbols: [
      ['A', 5],
      ['B', 9],
      ['C', 12],
      ['D', 13],
      ['E', 16],
      ['F', 45],
    ],
  },
  {
    id: 'equal',
    label: 'huffmanPresetEqual',
    symbols: [
      ['A', 4],
      ['B', 4],
      ['C', 4],
      ['D', 4],
    ],
  },
  {
    id: 'single',
    label: 'huffmanPresetSingle',
    symbols: [['Z', 7]],
  },
  {
    id: 'empty',
    label: 'huffmanPresetEmpty',
    symbols: [],
  },
] as const;

export type HuffmanPreset = (typeof HUFFMAN_PRESETS)[number];
export type HuffmanPresetId = HuffmanPreset['id'];

export const HUFFMAN_DEFAULT_INPUT: unknown = {
  preset: 'official',
  symbols: [
    ['A', 5],
    ['B', 9],
    ['C', 12],
    ['D', 13],
    ['E', 16],
    ['F', 45],
  ],
};

export function huffmanPresetInput(id: HuffmanPresetId): unknown {
  const preset = HUFFMAN_PRESETS.find((entry) => entry.id === id) ?? HUFFMAN_PRESETS[0];
  return {
    preset: preset.id,
    symbols: preset.symbols.map(([symbol, weight]) => [symbol, weight]),
  };
}

export function huffmanPresetFromInput(value: unknown): HuffmanPresetId | null {
  if (!value || typeof value !== 'object') return null;
  const preset = (value as { preset?: unknown }).preset;
  if (typeof preset !== 'string') return null;
  return HUFFMAN_PRESETS.some((entry) => entry.id === preset)
    ? (preset as HuffmanPresetId)
    : null;
}

export const HUFFMAN_PYTHON = `# Huffman tree + prefix codes: a real heapq forest, then a real tree walk.
import heapq
import math

raw_input = input
if not isinstance(raw_input, dict):
    raw_input = {}
PRESET = raw_input.get("preset", "custom")
if not isinstance(PRESET, str):
    PRESET = "custom"
raw_symbols = raw_input.get("symbols", [])
if not isinstance(raw_symbols, list):
    raw_symbols = []

# Aggregate repeated symbols; keep deterministic first-seen order.
AGG = {}
for item in raw_symbols:
    symbol = None
    weight = None
    if isinstance(item, dict):
        symbol = item.get("symbol")
        weight = item.get("weight")
    elif isinstance(item, (list, tuple)) and len(item) == 2:
        symbol, weight = item
    if not isinstance(symbol, str):
        continue
    symbol = symbol.strip()
    if not symbol or len(symbol) > 8:
        continue
    if isinstance(weight, bool) or not isinstance(weight, (int, float)):
        continue
    if not math.isfinite(weight):
        continue
    weight = int(weight)
    if weight <= 0:
        continue
    AGG[symbol] = AGG.get(symbol, 0) + weight

ITEMS = list(AGG.items())[:16]
MAX_WEIGHT = 1000000000000
for symbol, weight in ITEMS:
    if weight > MAX_WEIGHT:
        raise ValueError("symbol frequency is too large for this teaching demo")

def node_label(node):
    if node.symbol is not None:
        return node.symbol
    return "n" + node.node_id[1:]

class Node:
    def __init__(self, node_id, symbol, weight, order):
        self.node_id = node_id
        self.symbol = symbol
        self.weight = weight
        self.order = order
        self.left = None
        self.right = None
        self.parent = None

NODES = []
NEXT_ID = 1
NEXT_ORDER = 0
LEAVES = []

def new_node(symbol, weight):
    global NEXT_ID, NEXT_ORDER
    node = Node("n" + str(NEXT_ID), symbol, weight, NEXT_ORDER)
    NEXT_ID += 1
    NEXT_ORDER += 1
    NODES.append(node)
    return node

for symbol, weight in ITEMS:
    leaf = new_node(symbol, weight)
    LEAVES.append(leaf)

HEAP = []
for leaf in LEAVES:
    heapq.heappush(HEAP, (leaf.weight, leaf.order, leaf.node_id, leaf))

CODES = {}
TREE_ROOT = None

def roots():
    return [node for node in NODES if node.parent is None]

def queue_ids():
    return [entry[3].node_id for entry in HEAP]

def node_payload(node):
    return {
        "id": node.node_id,
        "symbol": node.symbol,
        "weight": node.weight,
        "order": node.order,
        "leftId": node.left.node_id if node.left is not None else None,
        "rightId": node.right.node_id if node.right is not None else None,
    }

def metrics_payload(root):
    if root is None:
        return {
            "leafCount": 0, "totalWeight": 0, "wpl": 0, "totalBits": 0,
            "fixedBitsPerChar": 0, "fixedBits": 0,
        }
    depths = {}
    def walk_depth(node, depth):
        if node.left is None and node.right is None:
            depths[node.node_id] = depth
            return
        if node.left is not None:
            walk_depth(node.left, depth + 1)
        if node.right is not None:
            walk_depth(node.right, depth + 1)
    walk_depth(root, 0)
    total_weight = 0
    wpl = 0
    for leaf in LEAVES:
        total_weight += leaf.weight
        wpl += leaf.weight * depths[leaf.node_id]
    count = len(LEAVES)
    single = count == 1
    total_bits = total_weight if single else wpl
    if count == 0:
        fixed_per = 0
    elif count == 1:
        fixed_per = 1
    else:
        fixed_per = int((count - 1).bit_length())
    return {
        "leafCount": count,
        "totalWeight": total_weight,
        "wpl": wpl,
        "totalBits": total_bits,
        "fixedBitsPerChar": fixed_per,
        "fixedBits": total_weight * fixed_per,
    }

def codes_payload():
    # The code table follows the input order of the symbols, not DFS arrival.
    result = []
    for leaf in LEAVES:
        row = CODES.get(leaf.node_id)
        if row is not None:
            result.append({
                "symbol": row["symbol"],
                "nodeId": row["nodeId"],
                "code": row["code"],
                "length": row["length"],
                "weight": row["weight"],
                "contribution": row["contribution"],
            })
    return result

def emit(operation, message, line, lesson, active=None, path=None, prefix="",
         picked=None, created=None, side=None, result=None, with_metrics=False):
    path = path or []
    payload = {
        "kind": "huffman",
        "preset": PRESET,
        "operation": operation,
        "nodes": [node_payload(node) for node in NODES],
        "queueIds": queue_ids(),
        "activeNodeId": active.node_id if active is not None else None,
        "pathIds": [node.node_id for node in path],
        "prefix": prefix,
        "pickedIds": [node.node_id for node in picked] if picked is not None else None,
        "createdId": created.node_id if created is not None else None,
        "viaSide": side,
        "codes": codes_payload(),
        "metrics": metrics_payload(TREE_ROOT) if with_metrics else None,
        "result": result,
    }
    values = []
    focus = []
    for index, node in enumerate(NODES):
        values.append(node.symbol if node.left is None and node.right is None else "Σ" + str(node.weight))
        if active is not None and node.node_id == active.node_id:
            focus.append(index)
    state = {
        "type": "array",
        "values": values,
        "focus": focus,
        "done": operation == "done",
    }
    variables = {
        "nodes": len(NODES),
        "leaves": len(LEAVES),
        "heap": queue_ids(),
        "wpl": metrics_payload(TREE_ROOT)["wpl"] if TREE_ROOT is not None else None,
    }
    if active is not None:
        variables["active"] = active.node_id
        variables["prefix"] = prefix
    trace(state, message, line=line, variables=variables,
          lesson_step=lesson, structure=payload)

def add_parent(left, right):
    parent = new_node(None, left.weight + right.weight)
    parent.left = left
    parent.right = right
    left.parent = parent
    right.parent = parent
    return parent

emit("init",
     "初始化：每个字符是一棵独立叶子，按 (权值, 创建序) 进入最小堆 / initialise leaves into a real min-heap",
     168, "init")

if len(HEAP) == 0:
    emit("done", "空输入：没有字符可编码，WPL 与位数均为 0 / empty input",
         172, "done", result="empty", with_metrics=True)
else:
    while len(HEAP) > 1:
        wa, oa, ia, a = heapq.heappop(HEAP)
        wb, ob, ib, b = heapq.heappop(HEAP)
        emit("merge-select",
             "取出两个最小权值：" + node_label(a) + "=" + str(a.weight) + " 与 " + node_label(b) + "=" + str(b.weight) + " / pop two minima",
             184, "merge-select", picked=[a, b])
        parent = add_parent(a, b)
        emit("merge-create",
             "合并为新父节点 n" + str(parent.node_id[1:]) + "，权值 " + str(a.weight) + "+" + str(b.weight) + "=" + str(parent.weight) + " / create parent",
             190, "merge-create", picked=[a, b], created=parent)
        heapq.heappush(HEAP, (parent.weight, parent.order, parent.node_id, parent))
        emit("merge-requeue",
             "新父节点 n" + str(parent.node_id[1:]) + " 重新入堆，当前堆顶 " + HEAP[0][3].node_id + " / requeue parent",
             194, "merge-requeue", created=parent)

    TREE_ROOT = HEAP[0][3]
    emit("build-done",
         "建树完成：森林只剩根 n" + str(TREE_ROOT.node_id[1:]) + "，叶子与字符一一对应 / tree complete",
         200, "build-done", with_metrics=True)

    emit("encode-start",
         "从根开始生成编码，左分支记 0、右分支记 1 / encode from the root",
         208, "encode-start", active=TREE_ROOT, path=[TREE_ROOT], prefix="", with_metrics=True)

    def encode_leaf(node, path, bits, side):
        actual = "0" if len(LEAVES) == 1 else bits
        shown_prefix = "" if len(LEAVES) == 1 else bits
        CODES[node.node_id] = {
            "symbol": node.symbol,
            "nodeId": node.node_id,
            "code": actual,
            "length": len(actual),
            "weight": node.weight,
            "contribution": node.weight * len(actual),
        }
        emit("encode-leaf",
             "到达叶子 " + node.symbol + "：路径 " + (bits if bits else "根") + " → 编码 " + actual + " / leaf code",
             222, "encode-leaf", active=node, path=path, prefix=shown_prefix,
             side=side, with_metrics=True)

    def encode_node(node, path, bits):
        if node.left is None and node.right is None:
            encode_leaf(node, path, bits, None)
            return
        left = node.left
        left_path = path + [left]
        left_bits = bits + "0"
        if left.left is None and left.right is None:
            encode_leaf(left, left_path, left_bits, "left")
        else:
            emit("encode-left",
                 "走左分支：路径 " + left_bits + "，到达内部节点 n" + str(left.node_id[1:]) + " / take left 0",
                 230, "encode-left", active=left, path=left_path, prefix=left_bits,
                 side="left", with_metrics=True)
            encode_node(left, left_path, left_bits)
        right = node.right
        right_path = path + [right]
        right_bits = bits + "1"
        if right.left is None and right.right is None:
            encode_leaf(right, right_path, right_bits, "right")
        else:
            emit("encode-right",
                 "走右分支：路径 " + right_bits + "，到达内部节点 n" + str(right.node_id[1:]) + " / take right 1",
                 237, "encode-right", active=right, path=right_path, prefix=right_bits,
                 side="right", with_metrics=True)
            encode_node(right, right_path, right_bits)

    encode_node(TREE_ROOT, [TREE_ROOT], "")
    emit("done",
         "编码完成：所有字符都是前缀码，WPL 与总位数见结果表 / all prefix codes ready",
         245, "done", result="encoded", with_metrics=True)
`;
