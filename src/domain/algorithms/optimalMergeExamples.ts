/**
 * TEXTBOOK-11: optimal k-way merge tree.
 *
 * The leaves are initial-run lengths. Adding the minimum number of zero-weight
 * dummy leaves makes a full k-ary tree possible. Each combine takes the k
 * lightest current roots, creates their parent, and adds the parent weight to
 * the total merge cost. This is k-ary Huffman construction for merge lengths,
 * not a claim that every leaf is a real initial run.
 */
import type { AlgorithmEntry } from './types';

export const OPTIMAL_MERGE_ENTRY: AlgorithmEntry = {
  group: 'sort',
  icon: '⑂',
  name: ['最佳归并树（k 路）', 'Optimal k-way merge tree'],
  desc: [
    '把每个初始归并段的长度作为叶权重，每次从当前森林中选 k 个最轻的根合并，父节点权重为它们之和，并把父权重计入总归并代价。若真实叶数不能构成满 k 叉树，先补零权重虚拟叶；虚拟叶必须明显标记，不能当成真实归并段。',
    'Treat each initial-run length as a leaf weight. Repeatedly combine the k lightest roots, give the parent the sum of their weights, and charge that weight to the total merge cost. When the real leaf count cannot form a full k-ary tree, add zero-weight dummy leaves; mark them explicitly rather than presenting them as real runs.',
  ],
  time: 'O(m log m) forest updates with a heap for m leaves (m includes dummy leaves)',
  space: 'O(m) nodes and forest entries',
  input: undefined,
  code: "trace({type:'array',values:['Optimal merge tree: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const OPTIMAL_MERGE_DEFAULT_INPUT: unknown = {
  preset: 'two-way',
  segmentWeights: [3, 5, 8, 11],
  k: 2,
};

export const OPTIMAL_MERGE_PYTHON = `# Optimal k-way merge tree: leaves are initial-run lengths, internal weights are
# child sums, and zero-weight dummy leaves complete a full k-ary tree. The total
# cost is the sum of all internal weights, i.e. the weighted external path length.
import inspect


def _read_input(raw):
    if not isinstance(raw, dict):
        raise ValueError("optimal merge tree input must be an object")
    weights = raw.get("segmentWeights")
    k = raw.get("k")
    preset = raw.get("preset")
    if not isinstance(weights, list):
        raise ValueError("segmentWeights must be a list")
    clean = []
    for weight in weights:
        if isinstance(weight, bool) or not isinstance(weight, int):
            raise ValueError("segment weights must be integers")
        if not 1 <= weight <= 999:
            raise ValueError("segment weights must be 1 to 999")
        clean.append(weight)
    if not 1 <= len(clean) <= 12:
        raise ValueError("optimal merge tree needs 1 to 12 segment weights")
    if isinstance(k, bool) or not isinstance(k, int) or not 2 <= k <= 4:
        raise ValueError("k must be an integer from 2 to 4")
    if preset is not None and not isinstance(preset, str):
        preset = None
    return clean, k, preset


WEIGHTS, K, PRESET = _read_input(input)
REAL_COUNT = len(WEIGHTS)
DUMMY_COUNT = ((K - 1) - ((REAL_COUNT - 1) % (K - 1))) % (K - 1)
NODES = []
FOREST = []
for index, weight in enumerate(WEIGHTS):
    node_id = "S" + str(index)
    NODES.append({
        "id": node_id,
        "weight": weight,
        "virtual": False,
        "leaf": True,
        "sourceIndex": index,
        "children": [],
    })
    FOREST.append(node_id)
for index in range(DUMMY_COUNT):
    node_id = "V" + str(index)
    NODES.append({
        "id": node_id,
        "weight": 0,
        "virtual": True,
        "leaf": True,
        "sourceIndex": None,
        "children": [],
    })
    FOREST.append(node_id)
BY_ID = {node["id"]: node for node in NODES}
TOTAL_COST = 0
COMBINES = 0
SELECTED = []
NEW_NODE = None
COST_ADDED = 0
TRACING = True


def fmt(value):
    return str(value)


def emit(operation, message, lesson, result=None):
    if not TRACING:
        return
    trace(
        {"type": "array", "values": [node["weight"] for node in NODES], "done": operation == "done"},
        message,
        line=inspect.currentframe().f_back.f_lineno,
        variables={
            "k": K,
            "realLeaves": REAL_COUNT,
            "virtualLeaves": DUMMY_COUNT,
            "forest": len(FOREST),
            "combines": COMBINES,
            "costAdded": COST_ADDED,
            "totalCost": TOTAL_COST,
            "result": result if result is not None else "pending",
        },
        lesson_step=lesson,
        structure={
            "kind": "merge-tree",
            "preset": PRESET,
            "operation": operation,
            "k": K,
            "segmentWeights": list(WEIGHTS),
            "nodes": [{
                **node,
                "children": list(node["children"]),
            } for node in NODES],
            "forestIds": list(FOREST),
            "selectedIds": list(SELECTED),
            "newNodeId": NEW_NODE,
            "costAdded": COST_ADDED,
            "totalCost": TOTAL_COST,
            "combines": COMBINES,
            "result": result,
        },
    )


SELECTED = []
NEW_NODE = None
COST_ADDED = 0
emit(
    "init",
    "以真实归并段长度为叶；不足满 k 叉时补零权重虚拟叶 / seed real run lengths and add zero-weight dummies for a full k-ary shape",
    "init",
)

while len(FOREST) > 1:
    ordered = sorted(
        FOREST,
        key=lambda node_id: (
            BY_ID[node_id]["weight"],
            1 if BY_ID[node_id]["virtual"] else 0,
            node_id,
        ),
    )
    SELECTED = ordered[:K]
    if len(SELECTED) != K:
        raise ValueError("forest cannot supply k roots")
    parent_id = "T" + str(COMBINES)
    parent = {
        "id": parent_id,
        "weight": sum(BY_ID[node_id]["weight"] for node_id in SELECTED),
        "virtual": False,
        "leaf": False,
        "sourceIndex": None,
        "children": list(SELECTED),
    }
    NODES.append(parent)
    BY_ID[parent_id] = parent
    FOREST = [node_id for node_id in FOREST if node_id not in SELECTED]
    FOREST.append(parent_id)
    COMBINES += 1
    COST_ADDED = parent["weight"]
    TOTAL_COST += COST_ADDED
    NEW_NODE = parent_id
    emit(
        "combine",
        "选取当前最轻的 k 个根，合并成一个新节点并累加代价 / take the k lightest roots, create their parent and charge its weight",
        "combine",
    )

SELECTED = []
NEW_NODE = None
COST_ADDED = 0
emit(
    "done",
    "森林只剩一个根，最佳归并树构造完成 / one root remains and the optimal merge tree is complete",
    "done",
    result="built",
)`;

export function optimalMergePythonExample(): string {
  return OPTIMAL_MERGE_PYTHON;
}
