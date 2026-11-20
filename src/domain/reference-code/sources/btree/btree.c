/*
 * B-tree of order 4 in C11.
 *
 * Each node holds at most 3 keys and at most 4 children; keys are sorted and a
 * subtree between two keys contains values strictly between them. Insertion
 * pre-splits any full child before descending, so a node never has to be
 * revisited. A full leaf is split around its median, which moves into the
 * parent; splitting a full root raises the tree by one level.
 */

#include <stdio.h>
#include <stdlib.h>

#define BTREE_ORDER 4
#define MAX_KEYS (BTREE_ORDER - 1)
#define MAX_CHILDREN BTREE_ORDER

typedef struct BTreeNode {
    int key_count;
    int keys[MAX_KEYS];
    struct BTreeNode *children[MAX_CHILDREN];
} BTreeNode;

static BTreeNode *NewNode(void)
{
    BTreeNode *node = (BTreeNode *)calloc(1, sizeof(BTreeNode));
    return node;
}

static int Contains(const BTreeNode *node, int key)
{
    if (node == NULL) {
        return 0;
    }
    int index = 0;
    while (index < node->key_count && key > node->keys[index]) {
        ++index;
    }
    if (index < node->key_count && key == node->keys[index]) {
        return 1;
    }
    if (node->children[0] == NULL) {
        return 0;
    }
    return Contains(node->children[index], key);
}

void split(BTreeNode *parent, int index, BTreeNode *full)
{
    int middle = MAX_KEYS / 2;
    int median = full->keys[middle];
    BTreeNode *right = NewNode();
    if (right == NULL) {
        return;
    }

    right->key_count = MAX_KEYS - middle - 1;
    for (int offset = 0; offset < right->key_count; ++offset) {
        right->keys[offset] = full->keys[middle + 1 + offset];
    }
    if (full->children[0] != NULL) {
        for (int offset = 0; offset <= right->key_count; ++offset) {
            right->children[offset] = full->children[middle + 1 + offset];
        }
    }
    full->key_count = middle;

    for (int position = parent->key_count; position > index; --position) {
        parent->keys[position] = parent->keys[position - 1];
        parent->children[position + 1] = parent->children[position];
    }
    parent->keys[index] = median;
    parent->children[index + 1] = right;
    ++parent->key_count;
}

static void InsertNonFull(BTreeNode *node, int key)
{
    int index = node->key_count - 1;
    if (node->children[0] == NULL) {
        while (index >= 0 && key < node->keys[index]) {
            node->keys[index + 1] = node->keys[index];
            --index;
        }
        node->keys[index + 1] = key;
        ++node->key_count;
        return;
    }

    index = 0;
    while (index < node->key_count && key > node->keys[index]) {
        ++index;
    }
    if (node->children[index]->key_count == MAX_KEYS) {
        split(node, index, node->children[index]);
        if (key > node->keys[index]) {
            ++index;
        }
    }
    InsertNonFull(node->children[index], key);
}

void InsertBTree(BTreeNode **root, int key)
{
    if (*root == NULL) {
        *root = NewNode();
        if (*root == NULL) {
            return;
        }
        (*root)->keys[0] = key;
        (*root)->key_count = 1;
        return;
    }
    if (Contains(*root, key)) {
        return;
    }
    if ((*root)->key_count == MAX_KEYS) {
        BTreeNode *new_root = NewNode();
        if (new_root == NULL) {
            return;
        }
        new_root->children[0] = *root;
        split(new_root, 0, *root);
        *root = new_root;
    }
    InsertNonFull(*root, key);
}

static void PrintTree(const BTreeNode *node, int depth)
{
    if (node == NULL) {
        return;
    }
    for (int level = 0; level < depth; ++level) {
        printf("  ");
    }
    printf("[");
    for (int index = 0; index < node->key_count; ++index) {
        printf("%s%d", index == 0 ? "" : " ", node->keys[index]);
    }
    printf("]\n");
    if (node->children[0] != NULL) {
        for (int index = 0; index <= node->key_count; ++index) {
            PrintTree(node->children[index], depth + 1);
        }
    }
}

void FreeBTree(BTreeNode *node)
{
    if (node == NULL) {
        return;
    }
    if (node->children[0] != NULL) {
        for (int index = 0; index <= node->key_count; ++index) {
            FreeBTree(node->children[index]);
        }
    }
    free(node);
}

int main(void)
{
    BTreeNode *root = NULL;
    int keys[] = {10, 20, 5, 6, 12, 30, 7, 17};

    for (int index = 0; index < (int)(sizeof(keys) / sizeof(keys[0])); ++index) {
        InsertBTree(&root, keys[index]);
    }

    PrintTree(root, 0);
    printf("contains 17: %s\n", Contains(root, 17) ? "yes" : "no");
    printf("contains 18: %s\n", Contains(root, 18) ? "yes" : "no");
    FreeBTree(root);
    return 0;
}
