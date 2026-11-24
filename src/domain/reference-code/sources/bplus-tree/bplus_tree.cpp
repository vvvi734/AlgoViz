/*
 * 中文导读：B+ 树把记录全部放在叶层，内部节点只保存分隔键；叶节点用 next 串成范围扫描链。
 * 阅读顺序：先看 4 阶容量与“内部键 i 是右孩子最小键”；再看叶/内部节点不同的分裂提升规则；最后看 rangeScan 沿 next 前进。
 * 关键不变量：内部节点 k 个键有 k+1 个孩子；记录只在叶子；叶链递增；内部键等于右子树最小记录。
 * 易错点：记录写进内部节点；叶分裂提升中间键；范围查询每次回到根；删除被误称为已支持。
 * 复杂度：点查找/插入 O(log_4 n)，范围查询 O(log_4 n + k)；空间 O(n)。
 * 输入/输出：唯一整数键、操作与范围；main 打印叶链、查找、插入与范围结果。
*/

/*
 * Order-4 B+ tree in C++17 (search, insertion, leaf-chain range scan).
 *
 * Internal keys are separators equal to the minimum of their right child.
 * Records live only in leaves; leaves form an ordered next chain. A leaf split
 * promotes the right leaf's first key. An internal split promotes and removes
 * the middle separator. Duplicate keys are rejected before mutation. Deletion
 * is deliberately out of scope for this course.
 */

#include <algorithm>
#include <iostream>
#include <memory>
#include <optional>
#include <vector>

constexpr int ORDER = 4;
// Order 4 means three resident keys; vectors grow to four during insertion, then splitLeaf or splitInternal removes the overflow entry.
constexpr int MAX_KEYS = ORDER - 1;

struct BPlusNode
{
    std::vector<int> keys;
    std::vector<std::unique_ptr<BPlusNode>> children;
    bool leaf = true;
    // next is a non-owning raw pointer: unique_ptr owns the tree edges, while next only exposes the leaf chain for range scans.
    BPlusNode *next = nullptr;
};

struct Promotion
{
    int separator;
    std::unique_ptr<BPlusNode> right;
};

// Purpose: Allocate a real leaf or index node; links stay empty until a split creates them.
// 作用：分配真实叶节点或索引节点；链在分裂时才建立。
std::unique_ptr<BPlusNode> makeNode(bool leaf)
{
    auto node = std::make_unique<BPlusNode>();
    node->leaf = leaf;
    return node;
}

// Purpose: First separator greater than the key chooses the child; equality goes right.
// 作用：选择第一个大于 key 的分隔键对应的孩子；相等时走右子树。
int childSlot(const BPlusNode &node, int key)
{
    int slot = 0;
    // The >= test sends equality to the right child, because a separator is the minimum record of that child rather than a value strictly smaller.
    while (slot < static_cast<int>(node.keys.size()) && key >= node.keys[slot])
    {
        ++slot;
    }
    return slot;
}

// Purpose: Reach a leaf through real separator ranges.
// 作用：沿真实分隔键范围到达叶层。
// Separators only route; even when target equals a separator, the loop continues until a leaf, because internal entries are not records.
BPlusNode *findLeaf(BPlusNode *node, int target)
{
    while (node && !node->leaf)
    {
        node = node->children[childSlot(*node, target)].get();
    }
    return node;
}

// Purpose: Point lookup checks records in the leaf only; internal keys are not records.
// 作用：点查找只在叶子检查记录；内部键不是记录。
bool contains(BPlusNode *root, int target)
{
    BPlusNode *leaf = findLeaf(root, target);
    // binary_search is valid because leaf keys stay sorted; it never inspects an internal separator as a possible record.
    return leaf && std::binary_search(leaf->keys.begin(), leaf->keys.end(), target);
}

// Purpose: Split a leaf 2/2 and promote the first key of the right leaf.
// 作用：叶节点按 2/2 分裂，并提升右叶首键。
// The leaf split assumes the overflow key is already present: node has four keys, right takes keys 2 and 3, and left keeps keys 0 and 1.
Promotion splitLeaf(BPlusNode &node)
{
    auto right = makeNode(true);
    // The separator is right->keys.front() and remains stored there; unlike a B-tree split, the promoted value is duplicated at the record layer by design.
    right->keys.assign(node.keys.begin() + 2, node.keys.end());
    node.keys.erase(node.keys.begin() + 2, node.keys.end());
    right->next = node.next;
    node.next = right.get();
    int separator = right->keys.front();
    return {separator, std::move(right)};
}

// Purpose: Split an internal node, promote and remove the middle separator, and move the right child range.
// 作用：分裂内部节点，提升并移除中间分隔键，同时移动右半孩子范围。
// The middle key is removed from both halves: it becomes the parent separator, right gets keys after 2, and left keeps two keys and three children.
Promotion splitInternal(BPlusNode &node)
{
    auto right = makeNode(false);
    int separator = node.keys[2];
    // Right starts at index 3, not 2, because index 2 is the separator; copying index 2 would leave the same key in parent and child.
    right->keys.assign(node.keys.begin() + 3, node.keys.end());
    node.keys.erase(node.keys.begin() + 2, node.keys.end());
    right->children.reserve(node.children.size() - 3);
    for (int index = 3; index < static_cast<int>(node.children.size()); ++index)
    {
        right->children.push_back(std::move(node.children[index]));
    }
    node.children.resize(3);
    return {separator, std::move(right)};
}

// Purpose: Insert a record into a leaf, or a promoted separator into an internal node.
// 作用：把记录插入叶子；内部节点接收上升的分隔键。
std::optional<Promotion> insertRec(BPlusNode &node, int key)
{
    if (node.leaf)
    {
        // Duplicates were rejected before this call, so lower_bound and upper_bound coincide; lower_bound is enough and keeps the leaf sorted.
        auto position = std::lower_bound(node.keys.begin(), node.keys.end(), key);
        node.keys.insert(position, key);
        if (static_cast<int>(node.keys.size()) <= MAX_KEYS)
        {
            return std::nullopt;
        }
        return splitLeaf(node);
    }
    int slot = childSlot(node, key);
    auto promoted = insertRec(*node.children[slot], key);
    if (!promoted)
    {
        return std::nullopt;
    }
    node.keys.insert(node.keys.begin() + slot, promoted->separator);
    node.children.insert(node.children.begin() + slot + 1, std::move(promoted->right));
    if (static_cast<int>(node.keys.size()) <= MAX_KEYS)
    {
        return std::nullopt;
    }
    return splitInternal(node);
}

// Purpose: Reject duplicates before mutation; a root split creates one new index level.
// 作用：修改前拒绝重复；根分裂只创建一层新索引。
std::unique_ptr<BPlusNode> insert(std::unique_ptr<BPlusNode> root, int key)
{
    if (!root)
    {
        root = makeNode(true);
        root->keys.push_back(key);
        return root;
    }
    if (contains(root.get(), key))
    {
        return root;
    }
    auto promoted = insertRec(*root, key);
    // A promotion at the root creates exactly one new level; no other path in this implementation changes tree height.
    if (promoted)
    {
        auto fresh = makeNode(false);
        fresh->keys.push_back(promoted->separator);
        fresh->children.push_back(std::move(root));
        fresh->children.push_back(std::move(promoted->right));
        root = std::move(fresh);
    }
    return root;
}

// Purpose: Start at the lower-bound leaf, follow next, and stop once keys exceed the upper bound.
// 作用：从下界叶子开始，沿 next 前进，超过上界即停止。
// The first leaf may contain keys below low; the explicit range test filters them instead of assuming the leaf starts at the lower bound.
std::vector<int> rangeScan(BPlusNode *root, int low, int high)
{
    std::vector<int> result;
    BPlusNode *leaf = findLeaf(root, low);
    while (leaf)
    {
        for (int key : leaf->keys)
        {
            if (key >= low && key <= high)
            {
                result.push_back(key);
            }
        }
        if (!leaf->keys.empty() && leaf->keys.back() > high)
        {
            break;
        }
        leaf = leaf->next;
    }
    return result;
}

// Purpose: Print the real leaf chain to show all records are at one layer.
// 作用：打印真实叶链，说明所有记录在同一层。
void printLeaves(BPlusNode *root)
{
    BPlusNode *leaf = root;
    while (leaf && !leaf->leaf)
    {
        leaf = leaf->children.front().get();
    }
    std::cout << "leaves:";
    while (leaf)
    {
        std::cout << " [";
        for (int index = 0; index < static_cast<int>(leaf->keys.size()); ++index)
        {
            std::cout << (index ? " " : "") << leaf->keys[index];
        }
        std::cout << "]";
        leaf = leaf->next;
    }
    std::cout << "\n";
}

// Purpose: Exercise leaf/root splits, point lookup, duplicate rejection and a leaf-chain range scan.
// 作用：覆盖叶/根分裂、点查找、重复拒绝与叶链范围扫描。
int main()
{
    std::unique_ptr<BPlusNode> root;
    for (int key : {8, 9, 10, 15, 20})
    {
        root = insert(std::move(root), key);
    }
    printLeaves(root.get());
    std::cout << "find 15: " << (contains(root.get(), 15) ? "found" : "missing") << "\n";
    std::cout << "find 12: " << (contains(root.get(), 12) ? "found" : "missing") << "\n";
    bool duplicate = contains(root.get(), 12);
    root = insert(std::move(root), 12);
    std::cout << "insert 12: " << (duplicate ? "duplicate" : "inserted") << "\n";
    duplicate = contains(root.get(), 12);
    root = insert(std::move(root), 12);
    std::cout << "insert 12 again: " << (duplicate ? "duplicate" : "inserted") << "\n";
    auto found = rangeScan(root.get(), 10, 18);
    std::cout << "range [10, 18]:";
    for (int key : found)
    {
        std::cout << " " << key;
    }
    std::cout << "\nfind 12 after insertion: " << (contains(root.get(), 12) ? "found" : "missing") << "\n";
    return 0;
}
