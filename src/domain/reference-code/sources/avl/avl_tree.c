/*
 * AlgoViz reference implementation: AVL tree.
 * Original code written for this repository under the MIT License.
 * Height-balanced BST with LL, RR, LR and RL rotations on insert.
 */

#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    int height;
    struct Node *left;
    struct Node *right;
} Node;

int height(const Node *node) {
    return node == NULL ? 0 : node->height;
}

int max_int(int a, int b) {
    return a > b ? a : b;
}

void update_height(Node *node) {
    node->height = 1 + max_int(height(node->left), height(node->right));
}

int balance_factor(const Node *node) {
    return node == NULL ? 0 : height(node->left) - height(node->right);
}

Node *rotate_right(Node *y) {
    Node *x = y->left;
    Node *middle = x->right;
    x->right = y;
    y->left = middle;
    update_height(y);
    update_height(x);
    return x;
}

Node *rotate_left(Node *x) {
    Node *y = x->right;
    Node *middle = y->left;
    y->left = x;
    x->right = middle;
    update_height(x);
    update_height(y);
    return y;
}

Node *balance(Node *node) {
    update_height(node);
    int factor = balance_factor(node);
    if (factor > 1) {
        if (balance_factor(node->left) < 0) {
            node->left = rotate_left(node->left);
        }
        return rotate_right(node);
    }
    if (factor < -1) {
        if (balance_factor(node->right) > 0) {
            node->right = rotate_right(node->right);
        }
        return rotate_left(node);
    }
    return node;
}

Node *avl_insert(Node *node, int value) {
    if (node == NULL) {
        Node *created = (Node *)malloc(sizeof(Node));
        if (created == NULL) {
            return NULL;
        }
        created->value = value;
        created->height = 1;
        created->left = NULL;
        created->right = NULL;
        return created;
    }
    if (value < node->value) {
        node->left = avl_insert(node->left, value);
    } else if (value > node->value) {
        node->right = avl_insert(node->right, value);
    } else {
        return node;
    }
    return balance(node);
}

void inorder(const Node *node) {
    if (node == NULL) {
        return;
    }
    inorder(node->left);
    printf("%d ", node->value);
    inorder(node->right);
}

void avl_free(Node *node) {
    if (node == NULL) {
        return;
    }
    avl_free(node->left);
    avl_free(node->right);
    free(node);
}

int main(void) {
    Node *root = NULL;
    int keys[] = {30, 20, 10, 25, 27, 5};
    for (size_t i = 0; i < sizeof(keys) / sizeof(keys[0]); ++i) {
        root = avl_insert(root, keys[i]);
    }

    printf("inorder: ");
    inorder(root);
    printf("\nroot: %d height: %d\n", root->value, root->height);
    printf("left height: %d right height: %d\n", height(root->left), height(root->right));
    avl_free(root);
    return 0;
}
