/*
 * 中文导读：B+ 树把记录全部放在叶层，内部节点只保存分隔键；叶节点用 next 串成范围扫描链。
 * 阅读顺序：先看 4 阶节点容量与“内部键 i 是右孩子最小键”的约定；再看 split_leaf/split_internal 的不同提升规则；最后看 range_scan 如何从下界叶子沿 next 前进。
 * 关键不变量：内部节点有 k 个键就有 k+1 个孩子；所有记录只在叶子；叶链按关键字严格递增；内部键等于右子树最小记录。
 * 易错点：把记录写进内部节点；叶分裂照搬 B 树把中间键整个移走；范围查询每次都从根重新开始。
 * 复杂度：点查找/插入 O(log_4 n)，范围查询 O(log_4 n + k)；空间 O(n)。
 * 输入/输出：输入唯一整数键、操作与范围上下界；main 打印叶链、点查找、插入与范围结果。
*/

/*
 * Order-4 B+ tree in C11 (search, insertion, leaf-chain range scan).
 *
 * Conventions: at most 3 keys and 4 children per node; an internal key is the
 * minimum record of its right child; every record lives in a leaf; leaves are
 * linked by next; a leaf split promotes the first key of the new right leaf; an
 * internal split promotes and removes the separator between its middle
 * children; duplicate keys are rejected before mutation. Deletion is out of
 * scope for this course and is not claimed by the implementation.
 */

#include <stdio.h>
#include <stdlib.h>

#define ORDER 4
// MAX_KEYS is 3, but the arrays reserve one extra slot: insertion writes the fourth key first, then split_leaf moves it out. The overflow slot is part of the algorithm, not slack.
#define MAX_KEYS 3

typedef struct
{
    // The extra key slot is what makes a split a move rather than a second insertion pass; without it, the fourth key would overflow before the split could run.
    int keys[MAX_KEYS + 1]; // slot MAX_KEYS is the temporary overflow before a split
    int key_count;
    int children[ORDER + 1]; // slot ORDER is the temporary overflow before an internal split
    int child_count;
    int leaf;
    int next;
} BPlusNode;

typedef struct
{
    int valid; // -1 = allocation failure, 0 = no split, 1 = split with a valid right node
    int separator;
    int right;
} Split;

static BPlusNode *nodes = NULL;
static int node_count = 0;
static int node_capacity = 0;
// 0 means unlimited; a positive value is an explicit test/safety budget that fails cleanly before growing further.
static int node_limit = 0;
static int root = -1;

// Purpose: Allocate a real node and initialize the leaf flag, key list and next link together.
// 作用：分配真实节点，并同时初始化 leaf、键表与 next 链接。
// The node table grows geometrically: an insertion count is no longer capped by a compile-time constant, and a failed realloc keeps the old table intact.
static int new_node(int leaf)
{
    if (node_limit > 0 && node_count >= node_limit)
    {
        return -1;
    }
    if (node_count == node_capacity)
    {
        int grown_capacity = node_capacity == 0 ? 16 : node_capacity * 2;
        BPlusNode *grown = (BPlusNode *)realloc(nodes, (size_t)grown_capacity * sizeof(BPlusNode));
        if (grown == NULL)
        {
            return -1;
        }
        nodes = grown;
        node_capacity = grown_capacity;
    }
    int id = node_count++;
    nodes[id].key_count = 0;
    nodes[id].child_count = 0;
    nodes[id].leaf = leaf;
    nodes[id].next = -1;
    return id;
}

// Purpose: Return the most recently allocated node only when it is still the last unused node; this is the LIFO undo used when a lower split fails.
// 作用：仅当最近分配的节点仍是最后一个未使用节点时归还节点表；这是低层分裂失败时的后进先出回滚。
static void release_node(int id)
{
    if (id >= 0 && id == node_count - 1 && nodes[id].key_count == 0 && nodes[id].child_count == 0)
    {
        nodes[id].leaf = 0;
        nodes[id].next = -1;
        node_count -= 1;
    }
}

// Purpose: Locate the first edge whose separator is greater than the key; equality goes right because key i is the right minimum.
// 作用：找到第一个大于 key 的分隔键位置；相等时走右孩子，因为键 i 是右子树最小值。
static int child_slot(int node, int key)
{
    int slot = 0;
    // Equality goes right because separator i equals the minimum of the right child; sending equality left would make a duplicate range unreachable.
    while (slot < nodes[node].key_count && key >= nodes[node].keys[slot])
    {
        ++slot;
    }
    return slot;
}

// Purpose: Descend to the leaf that could own the key, following only real separator ranges.
// 作用：沿真实分隔键范围下降到可能包含 key 的叶子。
static int find_leaf(int target)
{
    int node = root;
    // Only an internal node has separators to follow; the loop stops at the first leaf, which is the only layer that can own a record.
    while (node >= 0 && !nodes[node].leaf)
    {
        node = nodes[node].children[child_slot(node, target)];
    }
    return node;
}

// Purpose: Point lookup must reach a leaf; internal separators are never records.
// 作用：点查找必须到达叶层；内部节点中的分隔键不是记录。
static int contains(int target)
{
    int leaf = find_leaf(target);
    if (leaf < 0)
    {
        return 0;
    }
    // Routing to a leaf is not proof of a hit; the leaf must be scanned because several records can share one leaf block.
    for (int index = 0; index < nodes[leaf].key_count; ++index)
    {
        if (nodes[leaf].keys[index] == target)
        {
            return 1;
        }
    }
    return 0;
}

// Purpose: Split a leaf 2/2, preserve the leaf chain, and promote the first key of the new right leaf.
// 作用：把叶节点按 2/2 分裂，保持叶链，并提升新右叶的首键。
// Precondition: `right` was allocated before this call. The helper only moves existing keys and links, so a later allocation cannot leave a half-written leaf.
// Failure path: new_node failures are reported as valid=-1 before any key or link changes; callers release preallocated nodes and return -1 to insert_key.
// 失败路径：new_node 失败在改动任何键或链接前返回 valid=-1；调用方释放预分配节点并把 -1 传回 insert_key。
// The split is 2/2 after the overflow key is present: right keeps keys 2 and 3, left keeps keys 0 and 1, and the promoted separator stays in the right leaf.
static Split split_leaf(int node, int right)
{
    Split result = {0, 0, -1};
    if (right < 0)
    {
        return result;
    }
    nodes[right].key_count = nodes[node].key_count - 2;
    for (int index = 2; index < nodes[node].key_count; ++index)
    {
        nodes[right].keys[index - 2] = nodes[node].keys[index];
    }
    // The link order cannot be reversed: right first points at the old successor, then node points at right, so the chain stays connected.
    nodes[right].next = nodes[node].next;
    nodes[node].next = right;
    nodes[node].key_count = 2;
    result.valid = 1;
    result.separator = nodes[right].keys[0];
    result.right = right;
    return result;
}

// Purpose: Split an internal node, promote and remove the middle separator, and move the right child range.
// 作用：分裂内部节点，提升并移除中间分隔键，同时移动右半孩子范围。
// Precondition: `right` is already allocated; this helper cannot fail after mutating the left node or its children.
// Internal split removes key 2 from both halves: it becomes the promoted separator, right receives keys after 2 and children after 2, left keeps keys 0..1 and children 0..2.
static Split split_internal(int node, int right)
{
    Split result = {0, 0, -1};
    if (right < 0)
    {
        return result;
    }
    // The separator is read before the left node is truncated; afterward the value exists only in the parent, while both children keep disjoint ranges.
    result.separator = nodes[node].keys[2];
    nodes[right].key_count = nodes[node].key_count - 3;
    nodes[right].child_count = nodes[node].child_count - 3;
    for (int index = 3; index < nodes[node].key_count; ++index)
    {
        nodes[right].keys[index - 3] = nodes[node].keys[index];
    }
    for (int index = 3; index < nodes[node].child_count; ++index)
    {
        nodes[right].children[index - 3] = nodes[node].children[index];
    }
    nodes[node].key_count = 2;
    nodes[node].child_count = 3;
    result.valid = 1;
    result.right = right;
    return result;
}

// Purpose: Insert into a subtree; allocations for a possible parent split happen before descending, and a failed child split is reported instead of being treated as a completed split.
// 作用：向子树插入；父节点可能分裂所需的空间在下降前分配，孩子分裂失败会向上报告，而不是当作已分裂。
static Split insert_rec(int node, int key)
{
    Split none = {0, 0, -1};
    if (nodes[node].leaf)
    {
        int right = -1;
        // A full leaf is split only after the new key is written into the overflow slot; the preallocated right node makes this a pure move.
        if (nodes[node].key_count == MAX_KEYS)
        {
            right = new_node(1);
            if (right < 0)
            {
                Split failure = {-1, 0, -1};
                return failure;
            }
        }
        int position = nodes[node].key_count;
        while (position > 0 && nodes[node].keys[position - 1] > key)
        {
            nodes[node].keys[position] = nodes[node].keys[position - 1];
            --position;
        }
        nodes[node].keys[position] = key;
        ++nodes[node].key_count;
        if (nodes[node].key_count <= MAX_KEYS)
        {
            return none;
        }
        return split_leaf(node, right);
    }
    int slot = child_slot(node, key);
    int pending = -1;
    // A pending index node is needed only when both parent and child may split; if the child does not split, the pending node is released unused.
    if (nodes[node].key_count == MAX_KEYS && nodes[nodes[node].children[slot]].key_count == MAX_KEYS)
    {
        pending = new_node(0);
        if (pending < 0)
        {
            Split failure = {-1, 0, -1};
            return failure;
        }
    }
    Split child = insert_rec(nodes[node].children[slot], key);
    if (child.valid < 0)
    {
        release_node(pending);
        return child;
    }
    if (!child.valid)
    {
        release_node(pending);
        return none;
    }
    for (int position = nodes[node].key_count; position > slot; --position)
    {
        nodes[node].keys[position] = nodes[node].keys[position - 1];
        nodes[node].children[position + 1] = nodes[node].children[position];
    }
    nodes[node].keys[slot] = child.separator;
    nodes[node].children[slot + 1] = child.right;
    ++nodes[node].key_count;
    ++nodes[node].child_count;
    if (nodes[node].key_count <= MAX_KEYS)
    {
        release_node(pending);
        return none;
    }
    if (pending < 0)
    {
        // The preallocation above must cover this case; keep the failure explicit rather than returning valid with right=-1.
        Split failure = {-1, 0, -1};
        return failure;
    }
    return split_internal(node, pending);
}

// Purpose: Reject duplicates before mutation; preallocate a new root before a taller tree is needed, so an allocation failure leaves the old root and leaf chain untouched.
// 作用：修改前拒绝重复；树需要长高前先分配新根，使静态池失败时旧根与叶链保持不变。
static int insert_key(int key)
{
    if (root < 0)
    {
        int fresh = new_node(1);
        if (fresh < 0)
        {
            return -1;
        }
        root = fresh;
        nodes[root].keys[0] = key;
        nodes[root].key_count = 1;
        return 1;
    }
    if (contains(key))
    {
        return 0;
    }
    int fresh = -1;
    int root_will_split = nodes[root].leaf ||
                          nodes[nodes[root].children[child_slot(root, key)]].key_count == MAX_KEYS;
    // The root grows only when it is full and the selected child will actually produce a promotion; a full root above a non-full child needs no new level.
    if (nodes[root].key_count == MAX_KEYS && root_will_split)
    {
        fresh = new_node(0);
        if (fresh < 0)
        {
            return -1;
        }
    }
    Split promoted = insert_rec(root, key);
    if (promoted.valid < 0)
    {
        release_node(fresh);
        return -1;
    }
    if (promoted.valid)
    {
        if (fresh < 0)
        {
            return -1;
        }
        nodes[fresh].keys[0] = promoted.separator;
        nodes[fresh].key_count = 1;
        nodes[fresh].children[0] = root;
        nodes[fresh].children[1] = promoted.right;
        nodes[fresh].child_count = 2;
        root = fresh;
    }
    else
    {
        release_node(fresh);
    }
    return 1;
}

// Purpose: Range scan starts at the lower-bound leaf, then follows next and stops above high.
// 作用：范围扫描从下界叶子开始，再沿 next 前进并在超过上界时停止。
static void range_scan(int low, int high)
{
    int leaf = find_leaf(low);
    printf("range [%d, %d]:", low, high);
    while (leaf >= 0)
    {
        for (int index = 0; index < nodes[leaf].key_count; ++index)
        {
            int key = nodes[leaf].keys[index];
            if (key >= low && key <= high)
            {
                printf(" %d", key);
            }
        }
        // Once a leaf's last key exceeds high, the next leaf starts even higher, so the chain walk may stop without scanning the rest of the tree.
        if (nodes[leaf].key_count > 0 && nodes[leaf].keys[nodes[leaf].key_count - 1] > high)
        {
            break;
        }
        leaf = nodes[leaf].next;
    }
    printf("\n");
}

// Purpose: Print the leaf chain, demonstrating that every record is reachable from the leaf layer.
// 作用：打印叶链，说明所有记录都可从叶层访问。
static void print_leaves(void)
{
    int leaf = root;
    // The leaf chain starts at the leftmost leaf, reached by always taking child 0; this path is independent of any separator value.
    while (leaf >= 0 && !nodes[leaf].leaf)
    {
        leaf = nodes[leaf].children[0];
    }
    printf("leaves:");
    while (leaf >= 0)
    {
        printf(" [");
        for (int index = 0; index < nodes[leaf].key_count; ++index)
        {
            printf("%s%d", index == 0 ? "" : " ", nodes[leaf].keys[index]);
        }
        printf("]");
        leaf = nodes[leaf].next;
    }
    printf("\n");
}

// Purpose: Build a tree with 8, 9, 10, 15 and 20 to exercise leaf and root growth.
// 作用：建树并触发叶分裂/根分裂，再验证点查找与范围查询。
int main(void)
{
    int values[] = {8, 9, 10, 15, 20};
    for (int index = 0; index < (int)(sizeof(values) / sizeof(values[0])); ++index)
    {
        insert_key(values[index]);
    }
    print_leaves();
    printf("find 15: %s\n", contains(15) ? "found" : "missing");
    printf("find 12: %s\n", contains(12) ? "found" : "missing");
    int first_insert = insert_key(12);
    printf("insert 12: %s\n", first_insert == 1 ? "inserted" : first_insert == 0 ? "duplicate" : "allocation failed");
    int second_insert = insert_key(12);
    printf("insert 12 again: %s\n", second_insert == 1 ? "inserted" : second_insert == 0 ? "duplicate" : "allocation failed");
    range_scan(10, 18);
    printf("find 12 after insertion: %s\n", contains(12) ? "found" : "missing");
    free(nodes);
    nodes = NULL;
    node_count = 0;
    node_capacity = 0;
    node_limit = 0;
    return 0;
}
