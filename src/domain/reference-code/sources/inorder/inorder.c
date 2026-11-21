/*
 * 中文导读：按访问根结点的时机区分前序、中序、后序；层序遍历则借助队列逐层访问。
 * 阅读顺序：先看递归函数中 visit 放在两次递归的哪一侧；再看显式栈版本为什么要一路压左孩子；最后看层序队列的 size 分层。
 * 关键不变量：递归栈保存的是尚未访问完的祖先；中序输出始终按左—根—右。
 * 易错点：前/中/后序访问语句位置放错；显式栈弹栈后忘记右子树；层序不记录每层 size 导致分层错误；空树边界。
 * 复杂度：O(n) 时间，递归 O(h) 栈 / 层序 O(width) 队列。
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
// 作用：中序遍历：先左子树，再访问根，最后右子树；只读。
void InOrder(const TreeNode *node)
{
    if (node == NULL)
    {
        return;
    }
    InOrder(node->left);
    printf("%d ", node->value);
    InOrder(node->right);
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
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
