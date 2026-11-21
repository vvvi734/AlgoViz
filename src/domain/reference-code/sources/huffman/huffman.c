/*
 * 中文导读：反复合并权值最小的两棵树，得到带权路径长度最小的前缀码。
 * 阅读顺序：先看优先队列/最小堆如何选两个最小结点；再看合并后的新结点权值；最后递归打印 0/1 路径得到编码。
 * 关键不变量：每次合并后森林结点数减一；任何字符编码都不是另一个编码的前缀。
 * 易错点：合并顺序不稳定导致同权树形不同；叶子权值当频率用错；只支持单字符；释放树时递归断链。
 * 复杂度：O(n log n) 时间（堆），O(n) 空间；编码长度取决于频率分布。
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
    HNode *items[32];
    int size;
} MinHeap;

// 作用：最小堆比较器：频率小的优先；频率相同用插入序号打破平局，保证树形稳定。
int node_less(const HNode *a, const HNode *b)
{
    if (a->frequency != b->frequency)
    {
        return a->frequency < b->frequency;
    }
    return a->order < b->order;
}

// 作用：初始化堆：size 置 0，数组容量固定。
void heap_init(MinHeap *heap)
{
    heap->size = 0;
}

// Min-heap ordering is (frequency, insertion order), keeping ties deterministic.
// 作用：把新结点插入最小堆并上浮；比较使用 node_less。
void heap_push(MinHeap *heap, HNode *node)
{
    int index = heap->size++;
    heap->items[index] = node;
    while (index > 0)
    {
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
}

// 作用：弹出频率最小的结点，把末尾结点移到根后下沉恢复堆序。
HNode *heap_pop(MinHeap *heap)
{
    HNode *top = heap->items[0];
    --heap->size;
    if (heap->size == 0)
    {
        return top;
    }
    heap->items[0] = heap->items[heap->size];
    int index = 0;
    while (1)
    {
        int left = index * 2 + 1;
        int right = left + 1;
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

// 作用：创建哈夫曼结点：保存频率、字符和插入顺序；内部结点字符用占位符。
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

// 作用：沿树的 0/1 路径递归输出每个叶子的哈夫曼编码；不修改树。
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
        path[depth] = '0';
        print_codes(node->left, path, depth + 1);
    }
    if (node->right != NULL)
    {
        path[depth] = '1';
        print_codes(node->right, path, depth + 1);
    }
}

// 作用：后序释放哈夫曼树：先释放左右孩子，再释放当前结点。
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

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    char symbols[] = {'a', 'b', 'c', 'd', 'e', 'f'};
    int frequencies[] = {5, 9, 12, 13, 16, 45};
    int count = (int)(sizeof(frequencies) / sizeof(frequencies[0]));

    MinHeap heap;
    heap_init(&heap);
    for (int i = 0; i < count; ++i)
    {
        heap_push(&heap, make_node(frequencies[i], symbols[i], i));
    }

    int order = count;
    // Merge the two least frequent nodes repeatedly; the final tree gives shorter codes to more frequent symbols.
    while (heap.size > 1)
    {
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
