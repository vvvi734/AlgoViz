/*
 * 中文导读：B+ 树把记录全部放在叶层，内部节点只保存分隔键；叶节点用 next 串成范围扫描链。
 * 阅读顺序：先看 4 阶节点容量与“内部键 i 是右孩子最小键”的约定；再看 split_leaf/split_internal 的不同提升规则；最后看 range_scan 如何从下界叶子沿 next 前进。
 * 关键不变量：内部节点有 k 个键就有 k+1 个孩子；所有记录只在叶子；叶链按关键字严格递增；内部键等于右子树最小记录。
 * 易错点：把记录写进内部节点；叶分裂照搬 B 树把中间键整个移走；范围查询每次都从根重新开始。
 * 复杂度：点查找/插入 O(log_4 n)，范围查询 O(log_4 n + k)；空间 O(n)。
 * 输入/输出：输入唯一整数键、操作与范围上下界；main 打印叶链、点查找、插入与范围结果。
 * 函数地图：先读 main，再查看 split_leaf、split_internal、insert_rec、find_leaf、range_scan。
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

#define ORDER 4
#define MAX_KEYS 3
#define MAX_NODES 72

typedef struct
{
    int keys[MAX_KEYS + 1]; // slot MAX_KEYS is the temporary overflow before a split
    int key_count;
    int children[ORDER + 1]; // slot ORDER is the temporary overflow before an internal split
    int child_count;
    int leaf;
    int next;
} BPlusNode;

typedef struct
{
    int valid;
    int separator;
    int right;
} Split;

static BPlusNode nodes[MAX_NODES];
static int node_count = 0;
static int root = -1;

// Purpose: Allocate a real node and initialize the leaf flag, key list and next link together.
// 作用：分配真实节点，并同时初始化 leaf、键表与 next 链接。
static int new_node(int leaf)
{
    if (node_count >= MAX_NODES)
    {
        return -1;
    }
    int id = node_count++;
    nodes[id].key_count = 0;
    nodes[id].child_count = 0;
    nodes[id].leaf = leaf;
    nodes[id].next = -1;
    return id;
}

// Purpose: Locate the first edge whose separator is greater than the key; equality goes right because key i is the right minimum.
// 作用：找到第一个大于 key 的分隔键位置；相等时走右孩子，因为键 i 是右子树最小值。
static int child_slot(int node, int key)
{
    int slot = 0;
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
static Split split_leaf(int node)
{
    Split result = {1, 0, -1};
    int right = new_node(1);
    if (right < 0)
    {
        return result;
    }
    nodes[right].key_count = nodes[node].key_count - 2;
    for (int index = 2; index < nodes[node].key_count; ++index)
    {
        nodes[right].keys[index - 2] = nodes[node].keys[index];
    }
    nodes[right].next = nodes[node].next;
    nodes[node].next = right;
    nodes[node].key_count = 2;
    result.separator = nodes[right].keys[0];
    result.right = right;
    return result;
}

// Purpose: Split an internal node, promote and remove the middle separator, and move the right child range.
// 作用：分裂内部节点，提升并移除中间分隔键，同时移动右半孩子范围。
static Split split_internal(int node)
{
    Split result = {1, 0, -1};
    int right = new_node(0);
    if (right < 0)
    {
        return result;
    }
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
    result.right = right;
    return result;
}

// Purpose: Insert into a subtree; only a split propagates upward, and records enter leaves only.
// 作用：向子树插入；只有分裂会向上传播，记录只写入叶子。
static Split insert_rec(int node, int key)
{
    Split none = {0, 0, -1};
    if (nodes[node].leaf)
    {
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
        return split_leaf(node);
    }
    int slot = child_slot(node, key);
    Split child = insert_rec(nodes[node].children[slot], key);
    if (!child.valid)
    {
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
        return none;
    }
    return split_internal(node);
}

// Purpose: Reject duplicates before mutation; a root split is the only way the tree grows taller.
// 作用：修改前拒绝重复；根分裂是树唯一长高的方式。
static int insert_key(int key)
{
    if (root < 0)
    {
        root = new_node(1);
        nodes[root].keys[0] = key;
        nodes[root].key_count = 1;
        return 1;
    }
    if (contains(key))
    {
        return 0;
    }
    Split promoted = insert_rec(root, key);
    if (promoted.valid)
    {
        int fresh = new_node(0);
        if (fresh < 0)
        {
            return 0;
        }
        nodes[fresh].keys[0] = promoted.separator;
        nodes[fresh].key_count = 1;
        nodes[fresh].children[0] = root;
        nodes[fresh].children[1] = promoted.right;
        nodes[fresh].child_count = 2;
        root = fresh;
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
    printf("insert 12: %s\n", insert_key(12) ? "inserted" : "duplicate");
    printf("insert 12 again: %s\n", insert_key(12) ? "inserted" : "duplicate");
    range_scan(10, 18);
    printf("find 12 after insertion: %s\n", contains(12) ? "found" : "missing");
    return 0;
}
