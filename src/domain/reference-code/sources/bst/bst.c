/*
 * 中文导读：利用左小右大的中序顺序，把查找、插入、删除限制在一条根到叶的路径上。
 * 阅读顺序：先看 insert() 如何比较并下探；再看 search() 的循环/递归；最后看 delete() 的三种情况，尤其两个孩子的替换。
 * 关键不变量：任意结点左子树所有键小于它，右子树所有键大于它；中序遍历得到升序。
 * 易错点：删除双子结点时只改值却忘记删除后继；重复键处理不一致；用引用/指针更新父结点时接错边。
 * 复杂度：平均 O(log n)，最坏 O(n)（退化成链）；额外空间 O(n)。
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
