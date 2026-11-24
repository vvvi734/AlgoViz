/*
 * 中文导读：森林中的节点按 (权重, 真实优先, 编号) 排序，每次取前 k 个根合并。
 * 父节点权重是 k 个孩子权重之和，累计代价加上父权重；孩子挂到父节点后不再参加选择。
 * 真实段数为 n 时补 d = ((k-1) - ((n-1) mod (k-1))) mod (k-1) 个虚拟零权重叶。
 * 关键不变量：满 k 叉树每个内部节点恰有 k 个孩子，总代价等于所有内部权重之和。
 * 易错点：不补虚拟叶导致最后不足 k 个根；把根权重当总代价；虚拟叶当真实段。
 * 复杂度：小规模下直接排序森林；优先队列可将选 k 个最小根降到 O(n log n)。
 * 输入/输出：main 使用 [3,5,8,11]、k=2，打印合并过程和最终代价。
 */

/*
 * Optimal merge tree in C++17.
 *
 * Leaves are weighted by initial-run lengths. The greedy step combines the k
 * lightest roots; virtual zero-weight leaves complete the full k-ary shape.
 * The reported cost is the sum of every internal weight.
 */

#include <algorithm>
#include <cstdio>
#include <vector>

enum NodeKind
{
    REAL_LEAF,
    VIRTUAL_LEAF,
    INTERNAL
};

struct Node
{
    int weight = 0;
    NodeKind kind = REAL_LEAF;
    int localIndex = 0;
    std::vector<int> children;
    int parent = -1;
};

static bool root_comes_before(const std::vector<Node> &nodes, int left, int right)
{
    if (nodes[left].weight != nodes[right].weight)
    {
        return nodes[left].weight < nodes[right].weight;
    }
    if (nodes[left].kind != nodes[right].kind)
    {
        return nodes[left].kind != VIRTUAL_LEAF;
    }
    return left < right;
}

// Purpose: Build the full k-ary greedy tree and return the total merge cost.
// 作用：构造最佳归并树并返回总归并代价。
static int build_optimal_merge_tree(const std::vector<int> &weights, int k, std::vector<Node> &nodes)
{
    if (weights.empty() || k < 2)
    // The padding formula divides by k-1, and a one-way merge is not an internal-node merge at all.
    {
        return -1;
    }
    const int realCount = static_cast<int>(weights.size());
    int realWeight = 0;
    // Real weight is accumulated separately from virtual padding; the root must match this total at the end.
    for (int weight : weights)
    {
        realWeight += weight;
    }
    // The forest must end with one root, so pad with d zero-weight leaves; they change shape, never the total weight.
    const int missing = ((k - 1) - ((realCount - 1) % (k - 1))) % (k - 1);
    // The deficit formula is the C version translated to counts; it pads only the shape, never the total record weight.

    for (int index = 0; index < realCount; ++index)
    {
        Node node;
        node.weight = weights[index];
        node.kind = REAL_LEAF;
        node.localIndex = index;
        nodes.push_back(node);
    }
    for (int index = 0; index < missing; ++index)
    {
        Node node;
        node.kind = VIRTUAL_LEAF;
        // A virtual node has kind VIRTUAL_LEAF and default weight 0; it fills a shape slot but is never a real zero-length run.
        node.localIndex = index;
        nodes.push_back(node);
    }

    std::vector<int> roots;
    for (int index = 0; index < static_cast<int>(nodes.size()); ++index)
    {
        roots.push_back(index);
    }

    // Every internal weight is paid once, so total cost is the sum of all internal weights, not the root.
    int totalCost = 0;
    int internalCount = 0;
    while (roots.size() > 1)
    {
        if (static_cast<int>(roots.size()) < k)
        {
            return -1;
        }
        std::stable_sort(roots.begin(), roots.end(), [&nodes](int left, int right) {
        // stable_sort keeps the comparator's tie order deterministic; the comparator itself already uses weight, kind and id.
            return root_comes_before(nodes, left, right);
        });

        Node parent;
        parent.kind = INTERNAL;
        parent.localIndex = internalCount;
        for (int child = 0; child < k; ++child)
        {
            const int selected = roots[child];
            parent.children.push_back(selected);
            parent.weight += nodes[selected].weight;
            // The parent is accumulated from exactly k selected roots; a missing child would silently change the merge cost.
            nodes[selected].parent = static_cast<int>(nodes.size());
        }
        std::printf("combine T%d =", internalCount);
        for (int child : parent.children)
        {
            std::printf(" %d", nodes[child].weight);
        }
        std::printf(" -> %d\n", parent.weight);
        nodes.push_back(parent);
        totalCost += parent.weight;
        // Cost is accumulated per internal node, not reconstructed from the root afterward; the root only equals a subset of this sum.
        internalCount += 1;

        roots.erase(roots.begin(), roots.begin() + k);
        // Exactly the first k roots were consumed by this combine; erasing fewer would leave stale roots in the forest.
        roots.push_back(static_cast<int>(nodes.size()) - 1);
        // The parent index is the vector position after push_back; computing it before the push would point to the wrong node.
    }

    std::printf("leaves: real=%d virtual=%d total=%d\n",
                realCount, missing, static_cast<int>(nodes.size()) - internalCount);
    if (nodes[roots[0]].weight != realWeight)
    // Virtual leaves are shape-only; a root weight different from the real input sum means structural weight leaked into data.
    {
        std::printf("optimal merge tree invariant failed: root weight %d != real weight %d\n",
                    nodes[roots[0]].weight, realWeight);
        return -1;
    }
    std::printf("root weight=%d totalCost=%d combines=%d\n",
                nodes[roots[0]].weight, totalCost, internalCount);
    return totalCost;
}

int main()
{
    std::vector<Node> nodes;
    const int cost = build_optimal_merge_tree({3, 5, 8, 11}, 2, nodes);
    if (cost < 0)
    {
        std::printf("optimal merge tree invariant failed\n");
        return 1;
    }
    return 0;
}
