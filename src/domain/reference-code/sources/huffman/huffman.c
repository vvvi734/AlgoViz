/*
 * Textbook material note
 * The textbook provided by the user does not contain this algorithm.
 * This file keeps AlgoViz's original C implementation and comments; it does
 * not present itself as textbook text.
 */

/*
 * AlgoViz reference implementation: Huffman coding.
 * Original code written for this repository under the MIT License.
 * Builds a min-heap of nodes, repeatedly merges the two lightest nodes,
 * then emits prefix-free codes by walking the tree.
 *
 * Reading guide:
 * 1. Count the frequency of every symbol.
 * 2. Put all leaf nodes in a min-heap ordered by frequency.
 * 3. Repeatedly merge the two least frequent nodes until one root remains.
 * 4. Left edges mean 0 and right edges mean 1, producing prefix-free codes.
 *
 * Complexity: O(n log n) with a heap; extra space O(n) for tree and codes.
 * Convention: Symbols are unique; ties are broken by insertion order where the heap
 *   supports it.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct HNode {
    int frequency;
    char symbol;
    int order;
    struct HNode *left;
    struct HNode *right;
} HNode;

typedef struct {
    HNode *items[32];
    int size;
} MinHeap;

int node_less(const HNode *a, const HNode *b) {
    if (a->frequency != b->frequency) {
        return a->frequency < b->frequency;
    }
    return a->order < b->order;
}

void heap_init(MinHeap *heap) {
    heap->size = 0;
}

// Min-heap ordering is (frequency, insertion order), keeping ties deterministic.
void heap_push(MinHeap *heap, HNode *node) {
    int index = heap->size++;
    heap->items[index] = node;
    while (index > 0) {
        int parent = (index - 1) / 2;
        if (!node_less(heap->items[index], heap->items[parent])) {
            break;
        }
        HNode *temp = heap->items[parent];
        heap->items[parent] = heap->items[index];
        heap->items[index] = temp;
        index = parent;
    }
}

HNode *heap_pop(MinHeap *heap) {
    HNode *top = heap->items[0];
    --heap->size;
    if (heap->size == 0) {
        return top;
    }
    heap->items[0] = heap->items[heap->size];
    int index = 0;
    while (1) {
        int left = index * 2 + 1;
        int right = left + 1;
        int smallest = index;
        if (left < heap->size && node_less(heap->items[left], heap->items[smallest])) {
            smallest = left;
        }
        if (right < heap->size && node_less(heap->items[right], heap->items[smallest])) {
            smallest = right;
        }
        if (smallest == index) {
            break;
        }
        HNode *temp = heap->items[index];
        heap->items[index] = heap->items[smallest];
        heap->items[smallest] = temp;
        index = smallest;
    }
    return top;
}

HNode *make_node(int frequency, char symbol, int order) {
    HNode *node = (HNode *)malloc(sizeof(HNode));
    if (node == NULL) {
        return NULL;
    }
    node->frequency = frequency;
    node->symbol = symbol;
    node->order = order;
    node->left = NULL;
    node->right = NULL;
    return node;
}

void print_codes(const HNode *node, char path[], int depth) {
    if (node->left == NULL && node->right == NULL) {
        path[depth] = '\0';
        printf("%c: %s\n", node->symbol, depth == 0 ? "(empty)" : path);
        return;
    }
    if (node->left != NULL) {
        path[depth] = '0';
        print_codes(node->left, path, depth + 1);
    }
    if (node->right != NULL) {
        path[depth] = '1';
        print_codes(node->right, path, depth + 1);
    }
}

void free_tree(HNode *node) {
    if (node == NULL) {
        return;
    }
    free_tree(node->left);
    free_tree(node->right);
    free(node);
}

int main(void) {
    char symbols[] = {'a', 'b', 'c', 'd', 'e', 'f'};
    int frequencies[] = {5, 9, 12, 13, 16, 45};
    int count = (int)(sizeof(frequencies) / sizeof(frequencies[0]));

    MinHeap heap;
    heap_init(&heap);
    for (int i = 0; i < count; ++i) {
        heap_push(&heap, make_node(frequencies[i], symbols[i], i));
    }

    int order = count;
    while (heap.size > 1) {
        HNode *first = heap_pop(&heap);
        HNode *second = heap_pop(&heap);
        HNode *parent = make_node(first->frequency + second->frequency, '\0', order++);
        parent->left = first;
        parent->right = second;
        heap_push(&heap, parent);
    }

    HNode *root = heap_pop(&heap);
    char path[32];
    printf("root frequency: %d\n", root->frequency);
    printf("codes:\n");
    print_codes(root, path, 0);
    free_tree(root);
    return 0;
}
