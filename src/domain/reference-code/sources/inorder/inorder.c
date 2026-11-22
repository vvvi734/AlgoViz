/*
 * 中文导读：递归实现二叉树的中序遍历，访问顺序固定为“左子树、根、右子树”。
 * 阅读顺序：先看空指针递归出口；再看左递归返回后访问根；最后看右递归与 BST 升序性质。
 * 关键不变量：递归栈保存的是尚未访问完的祖先；中序输出始终按左—根—右。
 * 易错点：先访问根再走左子树会变成前序；忘记空指针出口；把右递归写在访问之前。
 * 复杂度：O(n) 时间，O(h) 递归栈空间，h 为树高。
 * 输入/输出：输入 main 内置的二叉树；按中序打印键；空树不输出任何键。
*/

/*
 * Inorder traversal in C11.
 *
 * Visit the left subtree, then the current node, then the right subtree. For a
 * binary search tree the output is ascending. Time O(n); recursion space O(h),
 * where h is the tree height.
 */

#include <stdio.h>

typedef struct TreeNode
{
    int value;
    struct TreeNode *left;
    struct TreeNode *right;
} TreeNode;

// Recurse left, visit the root, then recurse right; for a BST this emits keys in ascending order.
void InOrder(const TreeNode *node)
{
    // NULL is the empty subtree, so return without touching value or child links; this base case stops every descent.
    if (node == NULL)
    {
        return;
    }
    // The left call must return before the root is printed; the call stack holds ancestors whose right subtrees are still pending.
    InOrder(node->left);
    // Visiting between the two recursive calls is the definition of inorder; moving this line changes the traversal order.
    printf("%d ", node->value);
    // The right subtree runs after the root, so a BST emits keys in ascending order.
    InOrder(node->right);
}

int main(void)
{
    TreeNode one = {1, NULL, NULL};
    TreeNode three = {3, NULL, NULL};
    TreeNode five = {5, NULL, NULL};
    TreeNode seven = {7, NULL, NULL};
    TreeNode two = {2, &one, &three};
    TreeNode six = {6, &five, &seven};
    TreeNode four = {4, &two, &six};

    printf("inorder: ");
    InOrder(&four);
    printf("\nempty: ");
    InOrder(NULL);
    printf("done\n");
    return 0;
}
