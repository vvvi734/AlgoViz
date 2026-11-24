"""树形选择排序（锦标赛排序）的 Python 原理实现。

阅读顺序：
1. better() 用 (value, original_index) 选出较优记录，相等关键字不会混为一条。
2. build_tree() 把记录放入叶节点，再自底向上把赢家送到根。
3. remove_winner() 只沿赢家叶到根的路径重算，其他分支的结果继续复用。

关键不变量：每个内部节点保存两个孩子当前“有效赢家”中较优者的下标；
根节点就是剩余记录中的最小者。

中文导读：选择树缓存比较结果，根输出当前最小值；每轮只更新一条叶到根路径。
复杂度：建树 O(n)，每输出一个记录 O(log n)，总计 O(n log n)；树空间 O(n)。
输入/输出：main 使用官方示例数组，排序后打印 (关键字, 原始身份)。
"""

# Stable order: smaller value wins; on equality the smaller original index wins.
# 作用：返回更优的有效候选下标；两个候选都失效时返回 None。
def better(records, active, left, right):
    if left is None or not active[left]:
    # None and inactive are different reasons for absence but both mean the left child cannot win.
        return right if right is not None and active[right] else None
    if right is None or not active[right]:
        return left
    if records[left]["value"] != records[right]["value"]:
    # Only unequal values reach this branch; equality is handled by the identity tie-break below.
        return left if records[left]["value"] < records[right]["value"] else right
    return left if records[left]["original_index"] < records[right]["original_index"] else right
    # The original index is carried through the tournament unchanged, which is what lets equal values remain distinguishable and stable.


# Purpose: Fill leaves in input order, then build every internal winner bottom-up.
# 作用：按输入次序填叶节点，再自底向上为每个内部节点选出赢家。
def build_tree(records, active, tree, leaf_count):
    for slot in range(leaf_count):
        tree[leaf_count + slot] = slot if slot < len(records) else None
        # Leaves use record indices for real inputs and None for padding; a numeric 0 would be a valid record and therefore ambiguous.
    for node in range(leaf_count - 1, 0, -1):
    # The reverse range stops at 1 because index 0 is unused; root 1 is the last node computed.
        tree[node] = better(records, active, tree[node * 2], tree[node * 2 + 1])


# Purpose: Deactivate the winner and recompute only its leaf-to-root path.
# 作用：将赢家置为失效，并只重算它所在叶子到根的祖先路径。
def remove_winner(records, active, tree, leaf_count, winner):
    active[winner] = False
    # The record is deactivated before recomputation so every ancestor sees the new state on its first visit.
    node = (leaf_count + records[winner]["original_index"]) // 2
    # Floor division maps a leaf slot to its parent; the floor is exact because leaf_count is a power of two.
    while node >= 1:
        tree[node] = better(records, active, tree[node * 2], tree[node * 2 + 1])
        # Recomputing both child references is necessary even though only one side changed: Better needs both current candidates.
        node //= 2


# Purpose: Return the stable sorted record sequence produced by the winner tree.
# 作用：返回选择树产生的稳定升序记录序列。
def tournament_sort(values):
    if not 1 <= len(values) <= 12:
        raise ValueError("tree sort needs 1..12 records")
    records = [
        {"value": value, "original_index": index}
        for index, value in enumerate(values)
    ]
    active = [True] * len(records)
    leaf_count = 1
    while leaf_count < len(records):
        leaf_count *= 2
    tree = [None] * (2 * leaf_count)
    output = []

    build_tree(records, active, tree, leaf_count)
    while len(output) < len(records):
        winner = tree[1]
        if winner is None:
            raise ValueError("tree has no winner before every record is output")
        output.append(dict(records[winner]))
        remove_winner(records, active, tree, leaf_count, winner)
    return output


def main():
    ordered = tournament_sort([8, 3, 11, 1, 7, 2, 9, 4])
    labels = [f"({record['value']},{chr(ord('A') + record['original_index'])})" for record in ordered]
    print(" -> ".join(labels))


if __name__ == "__main__":
    main()
