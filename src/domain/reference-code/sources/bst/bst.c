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

typedef struct BSTNode {
    int value;
    struct BSTNode *left;
    struct BSTNode *right;
} BSTNode;

BSTNode *BSTInsert(BSTNode *root, int value, bool *inserted)
{
    if (root == NULL) {
        BSTNode *node = (BSTNode *)malloc(sizeof(BSTNode));
        if (node == NULL) {
            *inserted = false;
            return NULL;
        }
        node->value = value;
        node->left = NULL;
        node->right = NULL;
        *inserted = true;
        return node;
    }
    if (value < root->value) {
        root->left = BSTInsert(root->left, value, inserted);
    } else if (value > root->value) {
        root->right = BSTInsert(root->right, value, inserted);
    } else {
        *inserted = false;
    }
    return root;
}

BSTNode *BSTSearch(BSTNode *root, int target)
{
    while (root != NULL) {
        if (target == root->value) {
            return root;
        }
        root = target < root->value ? root->left : root->right;
    }
    return NULL;
}

void InOrder(const BSTNode *root)
{
    if (root == NULL) {
        return;
    }
    InOrder(root->left);
    printf("%d ", root->value);
    InOrder(root->right);
}

void FreeTree(BSTNode *root)
{
    if (root == NULL) {
        return;
    }
    FreeTree(root->left);
    FreeTree(root->right);
    free(root);
}

int main(void)
{
    BSTNode *root = NULL;
    int keys[] = {50, 30, 70, 20, 40, 60, 80};
    bool inserted = false;

    for (int index = 0; index < (int)(sizeof(keys) / sizeof(keys[0])); ++index) {
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
