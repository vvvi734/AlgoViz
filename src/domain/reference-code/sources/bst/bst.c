/*
 * AlgoViz reference implementation: binary search tree.
 * Original code written for this repository under the MIT License.
 * Insert, search, remove and inorder traversal for unique integer keys.
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *left;
    struct Node *right;
} Node;

Node *bst_insert(Node *root, int value) {
    if (root == NULL) {
        Node *node = (Node *)malloc(sizeof(Node));
        if (node == NULL) {
            return NULL;
        }
        node->value = value;
        node->left = NULL;
        node->right = NULL;
        return node;
    }
    if (value < root->value) {
        root->left = bst_insert(root->left, value);
    } else if (value > root->value) {
        root->right = bst_insert(root->right, value);
    }
    return root;
}

bool bst_contains(const Node *root, int value) {
    while (root != NULL) {
        if (value == root->value) {
            return true;
        }
        root = value < root->value ? root->left : root->right;
    }
    return false;
}

Node *bst_min(Node *root) {
    while (root != NULL && root->left != NULL) {
        root = root->left;
    }
    return root;
}

Node *bst_remove(Node *root, int value) {
    if (root == NULL) {
        return NULL;
    }
    if (value < root->value) {
        root->left = bst_remove(root->left, value);
        return root;
    }
    if (value > root->value) {
        root->right = bst_remove(root->right, value);
        return root;
    }
    if (root->left == NULL) {
        Node *right = root->right;
        free(root);
        return right;
    }
    if (root->right == NULL) {
        Node *left = root->left;
        free(root);
        return left;
    }
    Node *successor = bst_min(root->right);
    root->value = successor->value;
    root->right = bst_remove(root->right, successor->value);
    return root;
}

void bst_inorder(const Node *root) {
    if (root == NULL) {
        return;
    }
    bst_inorder(root->left);
    printf("%d ", root->value);
    bst_inorder(root->right);
}

void bst_free(Node *root) {
    if (root == NULL) {
        return;
    }
    bst_free(root->left);
    bst_free(root->right);
    free(root);
}

int main(void) {
    Node *root = NULL;
    int keys[] = {5, 2, 7, 1, 4, 6, 8, 3};
    for (size_t i = 0; i < sizeof(keys) / sizeof(keys[0]); ++i) {
        root = bst_insert(root, keys[i]);
    }

    printf("inorder: ");
    bst_inorder(root);
    printf("\ncontains 4: %s\n", bst_contains(root, 4) ? "yes" : "no");
    printf("contains 9: %s\n", bst_contains(root, 9) ? "yes" : "no");

    root = bst_remove(root, 5);
    printf("after remove 5: ");
    bst_inorder(root);
    printf("\nroot: %d\n", root->value);
    bst_free(root);
    return 0;
}
