/*
 * 中文导读：利用左小右大的中序顺序，把查找、插入、删除限制在一条根到叶的路径上。
 * 阅读顺序：先看 insert() 如何比较并下探；再看 search() 的循环/递归；最后看 delete() 的三种情况，尤其两个孩子的替换。
 * 关键不变量：任意结点左子树所有键小于它，右子树所有键大于它；中序遍历得到升序。
 * 易错点：删除双子结点时只改值却忘记删除后继；重复键处理不一致；用引用/指针更新父结点时接错边。
 * 复杂度：平均 O(log n)，最坏 O(n)（退化成链）；额外空间 O(n)。
 * 输入/输出：输入整数键与待删除键；插入/删除原地修改树，中序输出升序键，查找返回是否存在。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * Binary search tree in C11.
 *
 * Keys in the left subtree are smaller than the root and keys in the right
 * subtree are larger. Search follows one root-to-leaf path; duplicate keys are
 * rejected. Inorder traversal yields ascending keys. Average O(log n), O(n) in
 * the worst unbalanced case; extra space O(h) recursion.
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct BSTNode
{
    int value;
    struct BSTNode *left;
    struct BSTNode *right;
} BSTNode;

// BST invariant: left keys < root < right keys; duplicates are rejected, so search follows one path.
// Purpose: Insert value by the left-smaller/right-larger rule; inserted distinguishes a new key from a duplicate, and the new subtree root is returned.
// 作用：按左小右大插入 value；inserted 区分新插入与重复键，返回新的子树根。
BSTNode *BSTInsert(BSTNode *root, int value, bool *inserted)
{
    if (root == NULL)
    {
        BSTNode *node = (BSTNode *)malloc(sizeof(BSTNode));
        if (node == NULL)
        {
            *inserted = false;
            return NULL;
        }
        node->value = value;
        node->left = NULL;
        node->right = NULL;
        *inserted = true;
        return node;
    }
    if (value < root->value)
    {
        root->left = BSTInsert(root->left, value, inserted);
    }
    else if (value > root->value)
    {
        root->right = BSTInsert(root->right, value, inserted);
    }
    else
    {
        *inserted = false;
    }
    return root;
}

// Purpose: Search for target along one root-to-leaf path and return the node pointer, or NULL when absent.
// 作用：沿一条根到叶路径查找 target；找到返回结点指针，否则返回 NULL。
BSTNode *BSTSearch(BSTNode *root, int target)
{
    while (root != NULL)
    {
        if (target == root->value)
        {
            return root;
        }
        root = target < root->value ? root->left : root->right;
    }
    return NULL;
}

// Purpose: Inorder traversal that prints keys; ascending output verifies the BST ordering property.
// 作用：中序遍历并输出键值；升序输出可验证 BST 的排序性质。
void InOrder(const BSTNode *root)
{
    if (root == NULL)
    {
        return;
    }
    InOrder(root->left);
    printf("%d ", root->value);
    InOrder(root->right);
}

// Purpose: Free a BST postorder: release both children before the current node.
// 作用：后序释放二叉搜索树：先释放左右子树，再释放当前结点。
void FreeTree(BSTNode *root)
{
    if (root == NULL)
    {
        return;
    }
    FreeTree(root->left);
    FreeTree(root->right);
    free(root);
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    BSTNode *root = NULL;
    int keys[] = {50, 30, 70, 20, 40, 60, 80};
    bool inserted = false;

    for (int index = 0; index < (int)(sizeof(keys) / sizeof(keys[0])); ++index)
    {
        root = BSTInsert(root, keys[index], &inserted);
    }

    printf("inorder:");
    InOrder(root);
    printf("\n");
    printf("search 60: %s\n", BSTSearch(root, 60) != NULL ? "found" : "missing");
    printf("search 65: %s\n", BSTSearch(root, 65) != NULL ? "found" : "missing");
    root = BSTInsert(root, 30, &inserted);
    printf("duplicate 30 inserted: %s\n", inserted ? "yes" : "no");

    FreeTree(root);
    return 0;
}
