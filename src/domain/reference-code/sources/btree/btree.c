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
#define MAX_KEYS (BTREE_ORDER - 1)
#define MIN_KEYS (BTREE_ORDER / 2 - 1)
#define MAX_CHILDREN BTREE_ORDER

typedef struct BTreeNode
{
    int key_count;
    int keys[MAX_KEYS];
    struct BTreeNode *children[MAX_CHILDREN];
} BTreeNode;

// Purpose: Allocate and initialize a B-tree node; set the leaf flag and key_count together.
// 作用：分配并初始化一个 B 树结点；leaf 标记和 key_count 必须同时设置。
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

// Purpose: Split a full child: promote the middle key to parent, keep the left half in the old node and the right half in a new node; children always has one more entry than keys.
// 作用：分裂满子结点：中间键上移到 parent，左右两半分别留在原结点和新结点；children 比 keys 多一个。
void split(BTreeNode *parent, int index, BTreeNode *full)
{
    int middle = MAX_KEYS / 2;
    int median = full->keys[middle];
    BTreeNode *right = NewNode();
    if (right == NULL)
    {
        return;
    }

    right->key_count = MAX_KEYS - middle - 1;
    for (int offset = 0; offset < right->key_count; ++offset)
    {
        right->keys[offset] = full->keys[middle + 1 + offset];
    }
    if (full->children[0] != NULL)
    {
        for (int offset = 0; offset <= right->key_count; ++offset)
        {
            right->children[offset] = full->children[middle + 1 + offset];
        }
    }
    full->key_count = middle;

    for (int position = parent->key_count; position > index; --position)
    {
        parent->keys[position] = parent->keys[position - 1];
        parent->children[position + 1] = parent->children[position];
    }
    parent->keys[index] = median;
    parent->children[index + 1] = right;
    ++parent->key_count;
}

// Purpose: Insert into a subtree known not to be full; split a full child before descending so no backtracking is needed.
// 作用：在确定未满的子树中插入；遇到满孩子先分裂再下降，避免回溯。
static void InsertNonFull(BTreeNode *node, int key)
{
    int index = node->key_count - 1;
    if (node->children[0] == NULL)
    {
        while (index >= 0 && key < node->keys[index])
        {
            node->keys[index + 1] = node->keys[index];
            --index;
        }
        node->keys[index + 1] = key;
        ++node->key_count;
        return;
    }

    index = 0;
    while (index < node->key_count && key > node->keys[index])
    {
        ++index;
    }
    if (node->children[index]->key_count == MAX_KEYS)
    {
        split(node, index, node->children[index]);
        if (key > node->keys[index])
        {
            ++index;
        }
    }
    InsertNonFull(node->children[index], key);
}

// A full child is split before descending; its median moves into the parent, so insertion never needs to back up.
// Purpose: B-tree insertion entry: reject duplicates; when the root is full, create a new root and split so height grows by one.
// 作用：B 树插入入口：重复键拒绝；根满时先建新根并分裂，保证树高只增一层。
void InsertBTree(BTreeNode **root, int key)
{
    if (*root == NULL)
    {
        *root = NewNode();
        if (*root == NULL)
        {
            return;
        }
        (*root)->keys[0] = key;
        (*root)->key_count = 1;
        return;
    }
    if (Contains(*root, key))
    {
        return;
    }
    if ((*root)->key_count == MAX_KEYS)
    {
        BTreeNode *new_root = NewNode();
        if (new_root == NULL)
        {
            return;
        }
        new_root->children[0] = *root;
        split(new_root, 0, *root);
        *root = new_root;
    }
    InsertNonFull(*root, key);
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

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
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
