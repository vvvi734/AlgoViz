/*
 * 中文导读：用多路平衡结点减少树高和磁盘访问次数；本文件演示查找、分裂插入与删除修复。
 * 阅读顺序：先看阶数/最少关键字等常量；再看结点里 keys 与 children 的对应关系；然后跟一次分裂如何把中间键上移。
 * 关键不变量：每个非根结点关键字数在上下界之间；所有叶子在同一层；结点内关键字有序。
 * 易错点：children 比 keys 多一个的索引关系；分裂后把中间键留在原结点；删除借位/合并后忘记恢复下界。
 * 复杂度：查找/插入/删除 O(log n)（以阶数为底），空间 O(n)。
 * 输入/输出：输入待插入的唯一整数键；查找返回是否命中，插入返回可能更新的根；main 按层打印键列表。
*/

/*
 * B-tree of order 4 in C11.
 *
 * Each node holds at most 3 keys and at most 4 children; keys are sorted and a
 * subtree between two keys contains values strictly between them. Insertion
 * pre-splits any full child before descending, so a node never has to be
 * revisited. A full leaf is split around its median, which moves into the
 * parent; splitting a full root raises the tree by one level.
 */

#include <stdio.h>
#include <stdlib.h>

#define BTREE_ORDER 4
// These constants are one arithmetic family: order 4 gives at most 3 keys, at least 1 key in a non-root node, and at most 4 children; every index below assumes this relation.
#define MAX_KEYS (BTREE_ORDER - 1)
#define MIN_KEYS (BTREE_ORDER / 2 - 1)
#define MAX_CHILDREN BTREE_ORDER

// keys[i] separates children[i] and children[i+1]; a node with k keys therefore owns k+1 child slots, including the empty tail slots.
typedef struct BTreeNode
{
    int key_count;
    int keys[MAX_KEYS];
    struct BTreeNode *children[MAX_CHILDREN];
} BTreeNode;

// Purpose: Allocate a zero-initialized node; this implementation has no separate leaf field, so children[0] == NULL is the leaf test.
// 作用：分配并清零结点；本实现没有单独的 leaf 字段，因此用 children[0] == NULL 判断叶子。
// calloc zeroes every slot, so children[0] == NULL is a reliable leaf test; the implementation deliberately stores no separate leaf marker.
static BTreeNode *NewNode(void)
{
    BTreeNode *node = (BTreeNode *)calloc(1, sizeof(BTreeNode));
    return node;
}

// Purpose: Compare keys inside the node, then descend through the only possible child; return 1 on a hit.
// 作用：在结点内顺序比较键，再沿唯一可能的分支下降；找到返回 1。
static int Contains(const BTreeNode *node, int key)
{
    if (node == NULL)
    {
        return 0;
    }
    int index = 0;
    // The node scan stops at the first key >= target; equality is a hit, and a smaller target means the child at that same index.
    while (index < node->key_count && key > node->keys[index])
    {
        ++index;
    }
    if (index < node->key_count && key == node->keys[index])
    {
        return 1;
    }
    if (node->children[0] == NULL)
    {
        return 0;
    }
    return Contains(node->children[index], key);
}

// Purpose: Split a full child into an already allocated right node: promote the middle key to parent, keep the left half in the old node and the right half in `right`; children always has one more entry than keys.
// 作用：把满子结点分裂到已分配好的右结点：中间键上移到 parent，左右两半分别留在原结点和 `right`；children 比 keys 多一个。
// Precondition: `right` is allocated and zeroed by the caller. This helper allocates nothing, so it cannot fail after the tree has been modified.
// Failure path: split allocates nothing; callers allocate `right` before any structural write, so OOM returns 0 with the old tree unchanged.
// 失败路径：split 不分配；调用方在改结构前分配 right，OOM 返回 0，旧树保持不变。
int split(BTreeNode *parent, int index, BTreeNode *full, BTreeNode *right)
{
    if (right == NULL)
    {
        return 0;
    }
    // The median index is 1 for order 4; it is moved to the parent and removed from the child, so the two halves never both retain it.
    int middle = MAX_KEYS / 2;
    int median = full->keys[middle];

    // Keys after the median become the right node; their child slots must move with them, not stay under the left node.
    right->key_count = MAX_KEYS - middle - 1;
    // Right receives only the keys after the median; the bound is right->key_count, not MAX_KEYS, because copying the whole tail would duplicate keys.
    for (int offset = 0; offset < right->key_count; ++offset)
    {
        right->keys[offset] = full->keys[middle + 1 + offset];
    }
    if (full->children[0] != NULL)
    {
        // A node with k keys owns k+1 children, so the right child slots include the slot just past the last key; the <= bound moves that tail child too.
        for (int offset = 0; offset <= right->key_count; ++offset)
        {
            right->children[offset] = full->children[middle + 1 + offset];
        }
    }
    full->key_count = middle;

    // Shift key and child slots right before inserting the promoted median and the new right child.
    for (int position = parent->key_count; position > index; --position)
    {
        parent->keys[position] = parent->keys[position - 1];
        parent->children[position + 1] = parent->children[position];
    }
    parent->keys[index] = median;
    parent->children[index + 1] = right;
    ++parent->key_count;
    return 1;
}

// Purpose: Insert into a subtree known not to be full; allocate the right sibling before splitting a full child, then descend so no backtracking is needed.
// 作用：在确定未满的子树中插入；分裂满孩子前先分配右兄弟，再下降，避免回溯。
static int InsertNonFull(BTreeNode *node, int key)
{
    int index = node->key_count - 1;
    if (node->children[0] == NULL)
    {
        // Leaf insertion walks left while larger keys are present; the new key is written only after the gap is opened, and key_count grows last.
        while (index >= 0 && key < node->keys[index])
        {
            node->keys[index + 1] = node->keys[index];
            --index;
        }
        node->keys[index + 1] = key;
        ++node->key_count;
        return 1;
    }

    index = 0;
    while (index < node->key_count && key > node->keys[index])
    {
        ++index;
    }
    // A full child is split before the descent; after promotion, comparing key with the new separator decides whether the lower half or the right sibling is the next child.
    if (node->children[index]->key_count == MAX_KEYS)
    {
        BTreeNode *right = NewNode();
        if (right == NULL)
        {
            return 0;
        }
        split(node, index, node->children[index], right);
        // The promoted median now sits at index; if the new key is larger, it belongs to the new right child.
        if (key > node->keys[index])
        {
            ++index;
        }
    }
    return InsertNonFull(node->children[index], key);
}

// A full child is split before descending; its median moves into the parent, so insertion never needs to back up.
// Purpose: B-tree insertion entry: reject duplicates; when the root is full, allocate the new root and right sibling before splitting so an allocation failure leaves the old tree intact.
// 作用：B 树插入入口：重复键拒绝；根满时先分配新根和右兄弟再分裂，使分配失败时旧树保持不变。
int InsertBTree(BTreeNode **root, int key)
{
    if (*root == NULL)
    {
        *root = NewNode();
        if (*root == NULL)
        {
            return 0;
        }
        (*root)->keys[0] = key;
        (*root)->key_count = 1;
        return 1;
    }
    if (Contains(*root, key))
    {
        return 1;
    }
    // Root splitting is the only height increase; both new nodes are allocated before any pointer changes, so an allocation failure leaves the old tree intact.
    if ((*root)->key_count == MAX_KEYS)
    {
        BTreeNode *new_root = NewNode();
        if (new_root == NULL)
        {
            return 0;
        }
        BTreeNode *right = NewNode();
        if (right == NULL)
        {
            free(new_root);
            return 0;
        }
        new_root->children[0] = *root;
        split(new_root, 0, *root, right);
        *root = new_root;
    }
    return InsertNonFull(*root, key);
}

// Purpose: Return the first key position not less than key; this is also the only possible child slot.
// 作用：返回第一个不小于 key 的位置；它同时也是唯一可能下降的孩子下标。
static int NodeIndex(const BTreeNode *node, int key)
{
    int index = 0;
    while (index < node->key_count && node->keys[index] < key)
    {
        ++index;
    }
    return index;
}

// Purpose: Return the maximum key of a subtree, used to replace an internal key by its in-order predecessor.
// 作用：返回子树最大键，用中序前驱替换内部节点中的待删键。
static int MaxKey(const BTreeNode *node)
{
    while (node->children[0] != NULL)
    {
        node = node->children[node->key_count];
    }
    return node->keys[node->key_count - 1];
}

// Purpose: Ensure the child at index has more than MIN_KEYS before descending: borrow from left, borrow from right, then merge.
// 作用：下降前保证 index 处孩子多于 MIN_KEYS：先左借、再右借，最后合并。
// ensure_child runs before descending; borrowing or merging here guarantees the child has at least MIN_KEYS+1 keys when the recursive delete reaches it.
static void EnsureChild(BTreeNode *node, int index)
{
    BTreeNode *child = node->children[index];
    if (child->key_count > MIN_KEYS)
    {
        return;
    }
    if (index > 0)
    {
        BTreeNode *left = node->children[index - 1];
        if (left->key_count > MIN_KEYS)
        {
            for (int position = child->key_count; position > 0; --position)
            {
                child->keys[position] = child->keys[position - 1];
            }
            // Left borrowing rotates three things: the parent separator moves down, the left maximum moves up, and the left child's last child slot moves under the inserted key.
            child->keys[0] = node->keys[index - 1];
            ++child->key_count;
            if (child->children[0] != NULL)
            {
                for (int position = child->key_count; position > 0; --position)
                {
                    child->children[position] = child->children[position - 1];
                }
                child->children[0] = left->children[left->key_count];
            }
            node->keys[index - 1] = left->keys[left->key_count - 1];
            --left->key_count;
            return;
        }
    }
    if (index < node->key_count)
    {
        BTreeNode *right = node->children[index + 1];
        if (right->key_count > MIN_KEYS)
        {
            child->keys[child->key_count] = node->keys[index];
            ++child->key_count;
            node->keys[index] = right->keys[0];
            for (int position = 0; position < right->key_count - 1; ++position)
            {
                right->keys[position] = right->keys[position + 1];
            }
            --right->key_count;
            if (right->children[0] != NULL)
            {
                child->children[child->key_count] = right->children[0];
                for (int position = 0; position < right->key_count; ++position)
                {
                    right->children[position] = right->children[position + 1];
                }
            }
            return;
        }
    }
    if (index > 0)
    {
        BTreeNode *left = node->children[index - 1];
        // A left merge pulls the separator into the left sibling, appends the underfull child's keys and children, then removes the separator and child slot from the parent.
        left->keys[left->key_count] = node->keys[index - 1];
        ++left->key_count;
        for (int offset = 0; offset < child->key_count; ++offset)
        {
            left->keys[left->key_count + offset] = child->keys[offset];
        }
        if (child->children[0] != NULL)
        {
            for (int offset = 0; offset <= child->key_count; ++offset)
            {
                left->children[left->key_count + offset] = child->children[offset];
            }
        }
        left->key_count += child->key_count;
        free(child);
        for (int position = index - 1; position < node->key_count - 1; ++position)
        {
            node->keys[position] = node->keys[position + 1];
            node->children[position + 1] = node->children[position + 2];
        }
        --node->key_count;
        return;
    }
    BTreeNode *right = node->children[index + 1];
    child->keys[child->key_count] = node->keys[index];
    ++child->key_count;
    for (int offset = 0; offset < right->key_count; ++offset)
    {
        child->keys[child->key_count + offset] = right->keys[offset];
    }
    if (right->children[0] != NULL)
    {
        for (int offset = 0; offset <= right->key_count; ++offset)
        {
            child->children[child->key_count + offset] = right->children[offset];
        }
    }
    child->key_count += right->key_count;
    free(right);
    for (int position = index; position < node->key_count - 1; ++position)
    {
        node->keys[position] = node->keys[position + 1];
        node->children[position + 1] = node->children[position + 2];
    }
    --node->key_count;
}

// Purpose: Delete from a subtree after existence is proved; repair an underfull child before descending.
// 作用：在已证明存在后从子树删除；下降前修复关键字不足的孩子。
static void DeleteRec(BTreeNode *node, int key)
{
    // Leaf deletion only shifts keys left; there is no child pointer to repair, and decrementing key_count is the entire structural change.
    if (node->children[0] == NULL)
    {
        int index = NodeIndex(node, key);
        for (int position = index; position < node->key_count - 1; ++position)
        {
            node->keys[position] = node->keys[position + 1];
        }
        --node->key_count;
        return;
    }
    int index = NodeIndex(node, key);
    if (index < node->key_count && node->keys[index] == key)
    {
        if (node->children[index]->key_count == MIN_KEYS)
        {
            EnsureChild(node, index);
            index = NodeIndex(node, key);
            // A merge pulled the separator (the target) down into the merged child.
            if (index == node->key_count || node->keys[index] != key)
            {
                DeleteRec(node->children[index], key);
                return;
            }
        }
        // An internal key is replaced by the maximum of its left child, then that real predecessor is deleted; copying the value without deleting its source would duplicate it.
        int predecessor = MaxKey(node->children[index]);
        node->keys[index] = predecessor;
        DeleteRec(node->children[index], predecessor);
        return;
    }
    EnsureChild(node, index);
    index = NodeIndex(node, key);
    DeleteRec(node->children[index], key);
}

// Purpose: Delete entry: missing keys leave the tree untouched; a zero-key internal root is replaced by its only child.
// 作用：删除入口：不存在的键保持树不变；零键内部根立即由唯一孩子替换。
void DeleteBTree(BTreeNode **root, int key)
{
    if (*root == NULL || !Contains(*root, key))
    {
        return;
    }
    DeleteRec(*root, key);
    // A zero-key internal root has exactly one child; promoting it is the only legal height decrease and keeps the new root non-empty.
    if ((*root)->children[0] != NULL && (*root)->key_count == 0)
    {
        BTreeNode *old_root = *root;
        *root = old_root->children[0];
        free(old_root);
    }
}

static void PrintTree(const BTreeNode *node, int depth)
{
    if (node == NULL)
    {
        return;
    }
    for (int level = 0; level < depth; ++level)
    {
        printf("  ");
    }
    printf("[");
    for (int index = 0; index < node->key_count; ++index)
    {
        printf("%s%d", index == 0 ? "" : " ", node->keys[index]);
    }
    printf("]\n");
    if (node->children[0] != NULL)
    {
        for (int index = 0; index <= node->key_count; ++index)
        {
            PrintTree(node->children[index], depth + 1);
        }
    }
}

// Purpose: Free B-tree nodes and child arrays postorder so releasing only the root cannot leak.
// 作用：后序释放 B 树结点与子树数组，避免只释放根造成泄漏。
void FreeBTree(BTreeNode *node)
{
    if (node == NULL)
    {
        return;
    }
    if (node->children[0] != NULL)
    {
        for (int index = 0; index <= node->key_count; ++index)
        {
            FreeBTree(node->children[index]);
        }
    }
    free(node);
}

int main(void)
{
    BTreeNode *root = NULL;
    int keys[] = {10, 20, 5, 6, 12, 30, 7, 17};

    for (int index = 0; index < (int)(sizeof(keys) / sizeof(keys[0])); ++index)
    {
        InsertBTree(&root, keys[index]);
    }

    PrintTree(root, 0);
    printf("contains 17: %s\n", Contains(root, 17) ? "yes" : "no");
    printf("contains 18: %s\n", Contains(root, 18) ? "yes" : "no");
    DeleteBTree(&root, 17);
    printf("after delete 17:\n");
    PrintTree(root, 0);
    DeleteBTree(&root, 99);
    printf("delete missing 99 keeps contains 17 = %s\n", Contains(root, 17) ? "yes" : "no");
    FreeBTree(root);
    return 0;
}
