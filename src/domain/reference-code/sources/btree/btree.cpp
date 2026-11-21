/*
 * 中文导读：用多路平衡结点减少树高和磁盘访问次数；本文件演示查找、分裂插入与删除修复。
 * 阅读顺序：先看阶数/最少关键字等常量；再看结点里 keys 与 children 的对应关系；然后跟一次分裂如何把中间键上移。
 * 关键不变量：每个非根结点关键字数在上下界之间；所有叶子在同一层；结点内关键字有序。
 * 易错点：children 比 keys 多一个的索引关系；分裂后把中间键留在原结点；删除借位/合并后忘记恢复下界。
 * 复杂度：查找/插入/删除 O(log n)（以阶数为底），空间 O(n)。
 * 输入/输出：输入待插入的唯一整数键；查找返回是否命中，插入返回可能更新的根；main 按层打印键列表。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * AlgoViz reference implementation: order-4 B-tree (search and insertion).
 *
 * Reading guide:
 * 1. Each node keeps a sorted std::vector<int> and at most four child pointers.
 * 2. A node with k keys has exactly k + 1 children; child i owns the interval
 *    between key i - 1 and key i.
 * 3. Search compares inside one node, then follows one child.
 * 4. Insertion rejects duplicates, splits a full root first, then splits every
 *    full child before descending. Splitting moves the median up and keeps the
 *    left node at the old object.
 *
 * Complexity: height h = O(log_4 n); search and insert visit O(h) nodes.
 * Space: O(n). Deletion is out of scope.
 * Convention: unique integer keys. std::map is NOT used here: the point is a
 * real B-tree, not a standard-library shortcut.
 */

#include <algorithm>
#include <iostream>
#include <memory>
#include <queue>
#include <vector>

constexpr int ORDER = 4;
constexpr int MAX_KEYS = ORDER - 1;

struct BTreeNode
{
    std::vector<int> keys;
    std::vector<std::shared_ptr<BTreeNode>> children;
    bool leaf = true;
};

using NodePtr = std::shared_ptr<BTreeNode>;

// Purpose: Create a new node with its value and pointer initialized; the caller owns the release.
// 作用：创建一个新结点并初始化值和指针；调用者负责释放。
NodePtr make_node(bool leaf)
{
    auto node = std::make_shared<BTreeNode>();
    node->leaf = leaf;
    return node;
}

/* Read-only search; comparisons counts key comparisons when non-null. */
// Purpose: Read-only lookup: compare keys inside the node, descend through the only possible child, and optionally count comparisons.
// 作用：只读查找：在结点内比较键，再沿唯一可能的分支下降；可选统计比较次数。
bool btree_search(const NodePtr &node, int target, int *comparisons = nullptr)
{
    const BTreeNode *current = node.get();
    while (current != nullptr)
    {
        std::size_t index = 0;
        while (index < current->keys.size())
        {
            if (comparisons != nullptr)
            {
                ++*comparisons;
            }
            if (target == current->keys[index])
            {
                return true;
            }
            if (target < current->keys[index])
            {
                break;
            }
            ++index;
        }
        if (current->leaf)
        {
            return false;
        }
        current = current->children[index].get();
    }
    return false;
}

/* Split parent->children[index] (full) and promote its median into parent. */
// Purpose: Split a full child by promoting its median key to the parent, moving the right half into a new node, and fixing child indices.
// 作用：分裂满孩子：把中位键提升到父结点，右半部分放进新结点，并修正 children 下标。
NodePtr split_child(const NodePtr &parent, std::size_t index)
{
    NodePtr left = parent->children[index];
    int promoted = left->keys[1];

    NodePtr right = make_node(left->leaf);
    right->keys.push_back(left->keys[2]);
    if (!left->leaf)
    {
        right->children.push_back(left->children[2]);
        right->children.push_back(left->children[3]);
        left->children.resize(2);
    }
    left->keys.resize(1);

    parent->keys.insert(parent->keys.begin() + static_cast<std::ptrdiff_t>(index), promoted);
    parent->children.insert(parent->children.begin() + static_cast<std::ptrdiff_t>(index + 1),
                            right);
    return right;
}

/* Insert a unique key; returns the possibly new root. Duplicate is rejected. */
// A full child is split before descending; its median moves into the parent, so insertion never needs to back up.
// Purpose: B-tree insertion entry: reject duplicates; when the root is full, create and split a new root, then descend along a non-full path.
// 作用：B 树插入入口：重复键拒绝；根满时先建新根并分裂，再沿未满路径下降插入。
NodePtr btree_insert(NodePtr root, int value)
{
    if (root == nullptr)
    {
        root = make_node(true);
        root->keys.push_back(value);
        return root;
    }

    if (btree_search(root, value))
    {
        return root;
    }

    if (root->keys.size() == MAX_KEYS)
    {
        NodePtr new_root = make_node(false);
        new_root->children.push_back(root);
        split_child(new_root, 0);
        root = new_root;
    }

    NodePtr node = root;
    while (!node->leaf)
    {
        std::size_t index = 0;
        while (index < node->keys.size() && value > node->keys[index])
        {
            ++index;
        }
        NodePtr child = node->children[index];
        if (child->keys.size() == MAX_KEYS)
        {
            int promoted = child->keys[1];
            NodePtr right = split_child(node, index);
            if (value > promoted)
            {
                child = right;
            }
        }
        node = child;
    }

    auto position = std::upper_bound(node->keys.begin(), node->keys.end(), value);
    node->keys.insert(position, value);
    return root;
}

// Purpose: Print B-tree nodes and keys level by level to inspect parent-child links after splits; read-only.
// 作用：按层输出 B 树结点及键值，用于检查分裂后的父子关系；只读。
void print_tree(const NodePtr &root)
{
    if (root == nullptr)
    {
        return;
    }
    std::queue<NodePtr> pending;
    pending.push(root);
    while (!pending.empty())
    {
        const std::size_t level_size = pending.size();
        for (std::size_t i = 0; i < level_size; ++i)
        {
            NodePtr node = pending.front();
            pending.pop();
            std::cout << "[";
            for (std::size_t k = 0; k < node->keys.size(); ++k)
            {
                if (k != 0)
                {
                    std::cout << ",";
                }
                std::cout << node->keys[k];
            }
            std::cout << "]";
            if (!node->leaf)
            {
                for (const NodePtr &child : node->children)
                {
                    pending.push(child);
                }
            }
        }
        std::cout << "\n";
    }
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    NodePtr root;
    const std::vector<int> values = {10, 20, 30, 40, 50, 60, 70, 45};
    for (int value : values)
    {
        root = btree_insert(root, value);
    }

    std::cout << "B-tree after insertion:\n";
    print_tree(root);

    int comparisons = 0;
    const bool found_30 = btree_search(root, 30, &comparisons);
    std::cout << "search 30: " << (found_30 ? "found" : "missing") << " (" << comparisons
              << " comparisons)\n";

    comparisons = 0;
    const bool found_35 = btree_search(root, 35, &comparisons);
    std::cout << "search 35: " << (found_35 ? "found" : "missing") << " (" << comparisons
              << " comparisons)\n";

    root = btree_insert(root, 45);
    std::cout << "duplicate 45 rejected; search says "
              << (btree_search(root, 45) ? "present" : "impossible") << "\n";
    return 0;
}
