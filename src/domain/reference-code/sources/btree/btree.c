/*
 * AlgoViz reference implementation: order-4 B-tree (search and insertion).
 * Original code written for this repository under the MIT License.
 *
 * Reading guide:
 * 1. One node holds at most 3 sorted keys and 4 child pointers.
 * 2. A node with k keys has exactly k + 1 children; child i owns the interval
 *    between key i - 1 and key i.
 * 3. Search compares keys inside one node, then follows exactly one child.
 * 4. Insertion rejects duplicates, splits a full root first, then splits every
 *    full child before descending into it.
 *
 * Complexity: height h = O(log_4 n); search and insertion visit O(h) nodes.
 * Space: O(n) nodes. Deletion is intentionally out of scope.
 * Convention: integer keys are unique; the demo prints the final tree level by
 * level.
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#define ORDER 4
#define MAX_KEYS (ORDER - 1)
#define MAX_CHILDREN ORDER

typedef struct BTreeNode {
    int keys[MAX_KEYS];
    int key_count;
    struct BTreeNode *children[MAX_CHILDREN];
    int child_count;
    bool leaf;
} BTreeNode;

static BTreeNode *btree_new_node(bool leaf) {
    BTreeNode *node = (BTreeNode *)calloc(1, sizeof(BTreeNode));
    if (node != NULL) {
        node->leaf = leaf;
    }
    return node;
}

/* Read-only search. Returns true on a hit; comparisons may be NULL. */
bool btree_search(const BTreeNode *node, int target, int *comparisons) {
    while (node != NULL) {
        int index = 0;
        while (index < node->key_count) {
            if (comparisons != NULL) {
                (*comparisons)++;
            }
            if (target == node->keys[index]) {
                return true;
            }
            if (target < node->keys[index]) {
                break;
            }
            index++;
        }
        if (node->leaf) {
            return false;
        }
        node = node->children[index];
    }
    return false;
}

/* Split a full child into a left node (old object) and a right node.
 * The median key rises into parent at child_index. The parent must have room.
 */
static BTreeNode *btree_split_child(BTreeNode *parent, int child_index) {
    BTreeNode *left = parent->children[child_index];
    int promoted = left->keys[1];

    BTreeNode *right = btree_new_node(left->leaf);
    if (right == NULL) {
        return NULL;
    }
    right->keys[0] = left->keys[2];
    right->key_count = 1;

    if (!left->leaf) {
        right->children[0] = left->children[2];
        right->children[1] = left->children[3];
        right->child_count = 2;
        left->child_count = 2;
    }
    left->keys[1] = 0;
    left->keys[2] = 0;
    left->key_count = 1;

    for (int i = parent->key_count; i > child_index; i--) {
        parent->keys[i] = parent->keys[i - 1];
    }
    parent->keys[child_index] = promoted;
    parent->key_count++;

    for (int i = parent->child_count; i > child_index + 1; i--) {
        parent->children[i] = parent->children[i - 1];
    }
    parent->children[child_index + 1] = right;
    parent->child_count++;
    return right;
}

/* Insert one unique key. Returns the (possibly new) root, or NULL only on
 * allocation failure. A duplicate leaves the tree unchanged. */
BTreeNode *btree_insert(BTreeNode *root, int value) {
    if (root == NULL) {
        root = btree_new_node(true);
        if (root == NULL) {
            return NULL;
        }
        root->keys[0] = value;
        root->key_count = 1;
        return root;
    }

    /* Locate before mutating, so a rejected duplicate cannot alter the tree. */
    if (btree_search(root, value, NULL)) {
        return root;
    }

    if (root->key_count == MAX_KEYS) {
        BTreeNode *new_root = btree_new_node(false);
        if (new_root == NULL) {
            return root;
        }
        new_root->children[0] = root;
        new_root->child_count = 1;
        BTreeNode *right = btree_split_child(new_root, 0);
        if (right == NULL) {
            free(new_root);
            return root;
        }
        root = new_root;
    }

    BTreeNode *node = root;
    while (!node->leaf) {
        int index = 0;
        while (index < node->key_count && value > node->keys[index]) {
            index++;
        }
        BTreeNode *child = node->children[index];
        if (child->key_count == MAX_KEYS) {
            int promoted = child->keys[1];
            BTreeNode *right = btree_split_child(node, index);
            if (right == NULL) {
                return root;
            }
            /* The median has moved up; choose the side that owns value. */
            if (value > promoted) {
                child = right;
            }
        }
        node = child;
    }

    int position = node->key_count;
    while (position > 0 && node->keys[position - 1] > value) {
        node->keys[position] = node->keys[position - 1];
        position--;
    }
    node->keys[position] = value;
    node->key_count++;
    return root;
}

static void btree_print_level(const BTreeNode *node) {
    if (node == NULL) {
        return;
    }
    printf("[");
    for (int i = 0; i < node->key_count; i++) {
        printf("%s%d", i == 0 ? "" : ",", node->keys[i]);
    }
    printf("]");
}

static void btree_print_tree(const BTreeNode *root) {
    const BTreeNode *queue[64];
    int front = 0;
    int rear = 0;
    if (root != NULL) {
        queue[rear++] = root;
    }
    while (front < rear) {
        int level_size = rear - front;
        for (int i = 0; i < level_size; i++) {
            const BTreeNode *node = queue[front++];
            btree_print_level(node);
            if (!node->leaf) {
                for (int j = 0; j < node->child_count && rear < 64; j++) {
                    queue[rear++] = node->children[j];
                }
            }
        }
        printf("\n");
    }
}

static void btree_free(BTreeNode *node) {
    if (node == NULL) {
        return;
    }
    if (!node->leaf) {
        for (int i = 0; i < node->child_count; i++) {
            btree_free(node->children[i]);
        }
    }
    free(node);
}

int main(void) {
    BTreeNode *root = NULL;
    int values[] = {10, 20, 30, 40, 50, 60, 70, 45};
    for (int i = 0; i < (int)(sizeof(values) / sizeof(values[0])); i++) {
        root = btree_insert(root, values[i]);
    }

    printf("B-tree after insertion:\n");
    btree_print_tree(root);

    int comparisons = 0;
    bool found_30 = btree_search(root, 30, &comparisons);
    printf("search 30: %s (%d comparisons)\n",
           found_30 ? "found" : "missing", comparisons);
    comparisons = 0;
    bool found_35 = btree_search(root, 35, &comparisons);
    printf("search 35: %s (%d comparisons)\n",
           found_35 ? "found" : "missing", comparisons);

    /* A duplicate is rejected: the same pointer comes back, tree unchanged. */
    root = btree_insert(root, 45);
    printf("duplicate 45 rejected; search says %s\n",
           btree_search(root, 45, NULL) ? "still one key" : "impossible");

    btree_free(root);
    return 0;
}
