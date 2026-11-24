/*
 * 中文导读：反复合并权值最小的两棵树，得到带权路径长度最小的前缀码。
 * 阅读顺序：先看优先队列/最小堆如何选两个最小结点；再看合并后的新结点权值；最后递归打印 0/1 路径得到编码。
 * 关键不变量：每次合并后森林结点数减一；任何字符编码都不是另一个编码的前缀。
 * 易错点：合并顺序不稳定导致同权树形不同；叶子权值当频率用错；只支持单字符；释放树时递归断链。
 * 复杂度：O(n log n) 时间（堆），O(n) 空间；编码长度取决于频率分布。
 * 输入/输出：输入字符及其权值；构造哈夫曼树后输出每个字符的 0/1 编码；main 打印编码表。
*/

/*
 * AlgoViz reference implementation: Huffman coding.
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

typedef struct HNode
{
    int frequency;
    char symbol;
    int order;
    struct HNode *left;
    struct HNode *right;
} HNode;

typedef struct
{
    HNode *items[64];
    int size;
} MinHeap;

#define HEAP_CAPACITY 64

// Frequency is primary; order breaks ties, so equal weights still produce a deterministic tree shape.
int node_less(const HNode *a, const HNode *b)
{
    if (a->frequency != b->frequency)
    {
        return a->frequency < b->frequency;
    }
    return a->order < b->order;
}

void heap_init(MinHeap *heap)
{
    heap->size = 0;
}

// Append at the end of the array, then sift up; the heap property is restored along one root path.
int heap_push(MinHeap *heap, HNode *node)
{
    // The array has a physical limit; returning 0 lets the caller free its nodes instead of writing items[64].
    if (heap == NULL || node == NULL || heap->size >= HEAP_CAPACITY)
    {
        return 0;
    }
    int index = heap->size++;
    heap->items[index] = node;
    while (index > 0)
    {
        // The 0-based parent formula; index 0 has no parent and ends the sift-up loop.
        int parent = (index - 1) / 2;
        if (!node_less(heap->items[index], heap->items[parent]))
        {
            break;
        }
        HNode *temp = heap->items[parent];
        heap->items[parent] = heap->items[index];
        heap->items[index] = temp;
        index = parent;
    }
    return 1;
}

// The root is the minimum; removing it must keep the array compact, so the last leaf fills the root.
HNode *heap_pop(MinHeap *heap)
{
    // An empty heap has no items[0] to read; callers must check NULL before dereferencing the result.
    if (heap == NULL || heap->size == 0)
    {
        return NULL;
    }
    HNode *top = heap->items[0];
    --heap->size;
    if (heap->size == 0)
    {
        return top;
    }
    // Shrink first, then copy the current last live node into the root; the saved top remains the returned minimum.
    heap->items[0] = heap->items[heap->size];
    int index = 0;
    while (1)
    {
        int left = index * 2 + 1;
        int right = left + 1;
        // Sift-down compares the current node with both children and swaps with the smaller one; stopping when neither child is smaller restores heap order.
        int smallest = index;
        if (left < heap->size && node_less(heap->items[left], heap->items[smallest]))
        {
            smallest = left;
        }
        if (right < heap->size && node_less(heap->items[right], heap->items[smallest]))
        {
            smallest = right;
        }
        if (smallest == index)
        {
            break;
        }
        HNode *temp = heap->items[index];
        heap->items[index] = heap->items[smallest];
        heap->items[smallest] = temp;
        index = smallest;
    }
    return top;
}

// Every node starts with null children; internal nodes use the placeholder symbol, so only leaves are printed as characters.
HNode *make_node(int frequency, char symbol, int order)
{
    HNode *node = (HNode *)malloc(sizeof(HNode));
    if (node == NULL)
    {
        return NULL;
    }
    node->frequency = frequency;
    node->symbol = symbol;
    node->order = order;
    node->left = NULL;
    node->right = NULL;
    return node;
}

// A node with no children is a leaf; its path is complete, so write the terminator and emit the code.
void print_codes(const HNode *node, char path[], int depth)
{
    if (node->left == NULL && node->right == NULL)
    {
        path[depth] = '\0';
        printf("%c: %s\n", node->symbol, depth == 0 ? "(empty)" : path);
        return;
    }
    if (node->left != NULL)
    {
        // Left edges append 0 and right edges append 1; depth indexes the next free character in the shared path buffer.
        path[depth] = '0';
        print_codes(node->left, path, depth + 1);
    }
    if (node->right != NULL)
    {
        path[depth] = '1';
        print_codes(node->right, path, depth + 1);
    }
}

// Postorder release is required: children must be freed before the parent whose fields still point at them.
void free_tree(HNode *node)
{
    if (node == NULL)
    {
        return;
    }
    free_tree(node->left);
    free_tree(node->right);
    free(node);
}

// Free every root still inside the heap after a failed merge: each item owns a disjoint subtree.
static void free_forest(MinHeap *heap)
{
    for (int index = 0; index < heap->size; ++index)
    {
        free_tree(heap->items[index]);
    }
    heap->size = 0;
}

int main(void)
{
    char symbols[] = {'a', 'b', 'c', 'd', 'e', 'f'};
    int frequencies[] = {5, 9, 12, 13, 16, 45};
    int count = (int)(sizeof(frequencies) / sizeof(frequencies[0]));

    MinHeap heap;
    heap_init(&heap);
    for (int i = 0; i < count; ++i)
    {
        HNode *leaf = make_node(frequencies[i], symbols[i], i);
        // Both allocation and heap-capacity failures must stop before the next iteration, otherwise NULL enters the heap.
        if (leaf == NULL || !heap_push(&heap, leaf))
        {
            free_tree(leaf);
            free_forest(&heap);
            printf("failed to build the initial forest\n");
            return 1;
        }
    }

    int order = count;
    // Merge the two least frequent nodes repeatedly; the final tree gives shorter codes to more frequent symbols.
    while (heap.size > 1)
    {
        HNode *first = heap_pop(&heap);
        HNode *second = heap_pop(&heap);
        if (first == NULL || second == NULL)
        {
            free_tree(first);
            free_tree(second);
            free_forest(&heap);
            printf("heap underflow\n");
            return 1;
        }
        HNode *parent = make_node(first->frequency + second->frequency, '\0', order++);
        // A failed allocation must not leave first and second detached from the forest.
        if (parent == NULL)
        {
            free_tree(first);
            free_tree(second);
            free_forest(&heap);
            printf("allocation failed during merge\n");
            return 1;
        }
        parent->left = first;
        parent->right = second;
        if (!heap_push(&heap, parent))
        {
            free_tree(parent);
            free_forest(&heap);
            printf("heap capacity exhausted during merge\n");
            return 1;
        }
    }

    HNode *root = heap_pop(&heap);
    if (root == NULL)
    {
        printf("no Huffman root\n");
        return 1;
    }
    // A 64-leaf tree can have depth 63, so the path buffer must hold 63 bits plus the terminator.
    char path[HEAP_CAPACITY + 1];
    printf("root frequency: %d\n", root->frequency);
    printf("codes:\n");
    print_codes(root, path, 0);
    free_tree(root);
    return 0;
}
