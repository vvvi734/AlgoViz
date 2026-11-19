/*
 * AlgoViz reference implementation: inorder traversal.
 * Original code written for this repository under the MIT License.
 * Visits left subtree, root, then right subtree; the result is sorted
 * for a binary search tree.
 */

#include <stdio.h>

typedef struct Node {
    int value;
    struct Node *left;
    struct Node *right;
} Node;

void inorder(const Node *node) {
    if (node == NULL) {
        return;
    }
    inorder(node->left);
    printf("%d ", node->value);
    inorder(node->right);
}

int main(void) {
    Node one = {1, NULL, NULL};
    Node three = {3, NULL, NULL};
    Node five = {5, NULL, NULL};
    Node seven = {7, NULL, NULL};
    Node two = {2, &one, &three};
    Node six = {6, &five, &seven};
    Node four = {4, &two, &six};

    printf("inorder: ");
    inorder(&four);
    printf("\nempty: ");
    inorder(NULL);
    printf("done\n");
    return 0;
}
