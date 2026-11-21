/*
 * AVL tree in C11.
 *
 * A binary search tree that keeps |height(left) - height(right)| <= 1 at every
 * node. Insertion recurses down, then refreshes heights on the way back and
 * applies one of LL, RR, LR or RL rotations when a node becomes unbalanced.
 * Height stays O(log n), so search, insert and delete are O(log n).
 */

#include <stdio.h>
#include <stdlib.h>

typedef struct AVLNode {
    int value;
    int height;
    struct AVLNode *left;
    struct AVLNode *right;
} AVLNode;

static int MaxInt(int left, int right)
{
    return left > right ? left : right;
}

static int NodeHeight(const AVLNode *node)
{
    return node == NULL ? 0 : node->height;
}

static void RefreshHeight(AVLNode *node)
{
    node->height = 1 + MaxInt(NodeHeight(node->left), NodeHeight(node->right));
}

static AVLNode *RotateRight(AVLNode *root)
{
    AVLNode *pivot = root->left;
    AVLNode *middle = pivot->right;
    pivot->right = root;
    root->left = middle;
    RefreshHeight(root);
    RefreshHeight(pivot);
    return pivot;
}

static AVLNode *RotateLeft(AVLNode *root)
{
    AVLNode *pivot = root->right;
    AVLNode *middle = pivot->left;
    pivot->left = root;
    root->right = middle;
    RefreshHeight(root);
    RefreshHeight(pivot);
    return pivot;
}

AVLNode *AVLInsert(AVLNode *root, int value)
{
    if (root == NULL) {
        AVLNode *node = (AVLNode *)malloc(sizeof(AVLNode));
        if (node == NULL) {
            return NULL;
        }
        node->value = value;
        node->height = 1;
        node->left = NULL;
        node->right = NULL;
        return node;
    }
    if (value < root->value) {
        root->left = AVLInsert(root->left, value);
    } else if (value > root->value) {
        root->right = AVLInsert(root->right, value);
    } else {
        return root;
    }

    RefreshHeight(root);
    // The balance factor is height(left) - height(right); values outside {-1, 0, 1} need rotation.
    int balance = NodeHeight(root->left) - NodeHeight(root->right);
    if (balance > 1) {
        if (value < root->left->value) {
            return RotateRight(root);
        }
        // LR case: rotate the left child left first, then rotate the unbalanced root right.
        root->left = RotateLeft(root->left);
        return RotateRight(root);
    }
    if (balance < -1) {
        if (value > root->right->value) {
            return RotateLeft(root);
        }
        root->right = RotateRight(root->right);
        return RotateLeft(root);
    }
    return root;
}

void InOrder(const AVLNode *root)
{
    if (root == NULL) {
        return;
    }
    InOrder(root->left);
    printf("%d ", root->value);
    InOrder(root->right);
}

void FreeAVL(AVLNode *root)
{
    if (root == NULL) {
        return;
    }
    FreeAVL(root->left);
    FreeAVL(root->right);
    free(root);
}

int main(void)
{
    AVLNode *root = NULL;
    int keys[] = {10, 20, 30, 40, 50, 25};

    for (int index = 0; index < (int)(sizeof(keys) / sizeof(keys[0])); ++index) {
        root = AVLInsert(root, keys[index]);
    }

    printf("inorder:");
    InOrder(root);
    printf("\nheight: %d\n", NodeHeight(root));
    FreeAVL(root);
    return 0;
}
