"""最佳归并树的 Python 原理实现。

阅读顺序：
1. add_virtual_leaves() 按 d 公式补齐零权重虚拟叶，使叶数能构成满 k 叉树。
2. build_tree() 每次取 k 个最轻根，父权重为孩子和，并放回森林。
3. totalCost 累加每个内部节点的权重，而不是只取根权重。

关键不变量：每个内部节点恰有 k 个孩子，父权重等于孩子和，总代价等于内部权重之和。
易错点：不补虚拟叶导致最后不足 k 个根；把根权重当总代价；虚拟叶当作真实零长度段；
把该构造直接称为哈夫曼编码。
复杂度：小规模直接排序森林；优先队列可将每次选 k 个最小根降到 O(n log n)。
输入/输出：main 使用 [3,5,8,11]、k=2，打印每次合并、虚拟叶数和最终总代价。
"""


def root_key(node):
    return (node["weight"], 1 if node["kind"] == "virtual" else 0, node["id"])


# Purpose: Build a full k-ary greedy merge tree and return total cost plus nodes.
# 作用：构造最佳归并树，返回总归并代价和全部节点。
def build_optimal_merge_tree(weights, k):
    if not 1 <= len(weights) <= 12:
        raise ValueError("optimal merge tree needs 1..12 segments")
    if not 2 <= k <= 4:
        raise ValueError("k must be 2..4")
    if any(weight < 1 or weight > 999 for weight in weights):
        raise ValueError("segment weights must be 1..999")

    real_count = len(weights)
    # The forest must end with one root, so pad with d zero-weight leaves; they change shape, never total weight.
    missing = ((k - 1) - ((real_count - 1) % (k - 1))) % (k - 1)
    # The padding count is zero when the real leaves already form a full tree; otherwise it is the smallest positive deficit.
    nodes = []
    for index, weight in enumerate(weights):
        nodes.append({
            "id": f"S{index}",
            "kind": "real",
            "weight": weight,
            "children": [],
            "parent": None,
        })
    for index in range(missing):
        nodes.append({
            "id": f"V{index}",
            "kind": "virtual",
            "weight": 0,
            # Virtual leaves contribute no key weight; their only role is to occupy the shape slots needed for full branching.
            "children": [],
            "parent": None,
        })

    roots = list(range(len(nodes)))
    # Every internal weight is paid once, so total cost is their sum, not the root weight alone.
    total_cost = 0
    internal_count = 0
    while len(roots) > 1:
    # Termination requires one root; the forest size shrinks by k-1 each combine, which is exactly the divisibility invariant.
        if len(roots) < k:
            raise ValueError("forest cannot supply k roots; virtual leaves are missing")
        roots.sort(key=lambda node_index: root_key(nodes[node_index]))
        # Sorting the forest by (weight, real-before-virtual, id) is the greedy selection; a different tie order can change the tree shape but not the optimal cost for valid weights.
        selected = roots[:k]
        # Exactly k roots are combined; selecting fewer would produce an internal node with an invalid arity.
        parent_index = len(nodes)
        parent = {
            "id": f"T{internal_count}",
            "kind": "internal",
            "weight": sum(nodes[index]["weight"] for index in selected),
            "children": selected,
            "parent": None,
        }
        nodes.append(parent)
        for index in selected:
            nodes[index]["parent"] = parent_index
        total_cost += parent["weight"]
        # Each internal node adds its own weight to the total; summing root weights would miss the costs paid at lower levels.
        internal_count += 1
        print(f"combine {parent['id']} = {parent['weight']}")
        roots = roots[k:] + [parent_index]
        # The new parent replaces the consumed prefix; keeping the selected roots would duplicate their records in later merges.

    return total_cost, nodes, missing


def main():
    total_cost, nodes, missing = build_optimal_merge_tree([3, 5, 8, 11], 2)
    root = next(index for index, node in enumerate(nodes) if node["parent"] is None)
    real_count = sum(1 for node in nodes if node["kind"] == "real")
    internal_count = sum(1 for node in nodes if node["kind"] == "internal")
    print(f"leaves: real={real_count} virtual={missing} total={real_count + missing}")
    print(f"root weight={nodes[root]['weight']} totalCost={total_cost} combines={internal_count}")


if __name__ == "__main__":
    main()
