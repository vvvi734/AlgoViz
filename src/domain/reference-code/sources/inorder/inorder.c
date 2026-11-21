/*
 * Inorder traversal in C11.
 *
 * Visit the left subtree, then the current node, then the right subtree. For a
 * binary search tree the output is ascending. Time O(n); recursion space O(h),
 * where h is the tree height.
 */

#include <stdio.h>

typedef struct TreeNode {
    int value;
    struct TreeNode *left;
    struct TreeNode *right;
} TreeNode;

// Recurse left, visit the root, then recurse right; for a BST this emits keys in ascending order.
void InOrder(const TreeNode *node)
{
    if (node == NULL) {
        return;
    }
    InOrder(node->left);
    printf("%d ", node->value);
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
