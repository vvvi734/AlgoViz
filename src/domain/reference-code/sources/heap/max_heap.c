/*
 * 中文导读：用完全二叉树数组实现优先队列：堆顶最大，插入和删除后通过上浮/下沉恢复堆序。
 * 阅读顺序：先记 0 基下标关系 parent=(i-1)/2、children=2i+1/2i+2；再看 sift_up 与 sift_down 的交换方向；最后看建堆为什么从最后一个非叶结点倒着下沉。
 * 关键不变量：每个父结点都不小于它的孩子；数组的前 size 个位置构成完全树。
 * 易错点：1 基/0 基公式混用；下沉只比较一个孩子；删除堆顶后忘记把末尾元素放到根；建堆从根往下。
 * 复杂度：取最大 O(1)，插入/删除 O(log n)，建堆 O(n)，空间 O(n)。
 * 输入/输出：输入 push/pop 操作序列；push 无返回值，pop 返回当前最大值；main 打印堆数组与弹出值。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * AlgoViz reference implementation: max heap.
 * Array-backed binary heap with sift-up on insert and sift-down on pop.
 *
 * Reading guide:
 * 1. Store the complete binary tree in an array without holes.
 * 2. For index i, the parent is (i - 1) / 2 and the children are 2i + 1, 2i + 2.
 * 3. Push appends and sifts up; pop moves the last value to the root and sifts down.
 *
 * Complexity: O(log n) push/pop, O(1) top; extra space O(n).
 * Convention: Max-heap property: every parent is >= its children; 0-based array
 *   indices.
 */

#include <stdbool.h>
#include <stdio.h>

#define HEAP_CAPACITY 16

typedef struct
{
    int items[HEAP_CAPACITY];
    int size;
} MaxHeap;

// 作用：初始化堆：size 置 0，数组容量固定。
void heap_init(MaxHeap *heap)
{
    heap->size = 0;
}

// 作用：交换两个整数，供堆的上浮/下沉复用。
void swap_int(int *a, int *b)
{
    int temp = *a;
    *a = *b;
    *b = temp;
}

// Sift up while the parent is smaller; stop when the heap property holds or root is reached.
// 作用：从 index 向上与父结点比较并交换，直到堆序恢复或到达根。
void sift_up(MaxHeap *heap, int index)
{
    while (index > 0)
    {
        int parent = (index - 1) / 2;
        if (heap->items[parent] >= heap->items[index])
        {
            break;
        }
        swap_int(&heap->items[parent], &heap->items[index]);
        index = parent;
    }
}

// For index i the children are 2*i+1 and 2*i+2; sift-down swaps with the larger child until the parent is >= both.
// 作用：从 index 向下与较大的孩子交换，直到堆序恢复或到达叶子。
void sift_down(MaxHeap *heap, int index)
{
    while (true)
    {
        int left = index * 2 + 1;
        int right = left + 1;
        int largest = index;
        if (left < heap->size && heap->items[left] > heap->items[largest])
        {
            largest = left;
        }
        if (right < heap->size && heap->items[right] > heap->items[largest])
        {
            largest = right;
        }
        if (largest == index)
        {
            break;
        }
        swap_int(&heap->items[index], &heap->items[largest]);
        index = largest;
    }
}

// 作用：把 value 放到数组末尾，再沿父链上浮到正确位置；堆满返回 false。
bool heap_push(MaxHeap *heap, int value)
{
    if (heap->size == HEAP_CAPACITY)
    {
        return false;
    }
    heap->items[heap->size] = value;
    ++heap->size;
    sift_up(heap, heap->size - 1);
    return true;
}

// 作用：取出堆顶最大值，把末尾元素移到根，再下沉恢复堆序；空堆返回 false。
bool heap_pop(MaxHeap *heap, int *out_value)
{
    if (heap->size == 0)
    {
        return false;
    }
    *out_value = heap->items[0];
    --heap->size;
    if (heap->size > 0)
    {
        heap->items[0] = heap->items[heap->size];
        sift_down(heap, 0);
    }
    return true;
}

// 作用：按数组顺序输出堆元素；只读，可直接核对父子下标关系。
void heap_print(const MaxHeap *heap)
{
    for (int i = 0; i < heap->size; ++i)
    {
        printf("%d%s", heap->items[i], i + 1 == heap->size ? "" : " ");
    }
    printf("\n");
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    MaxHeap heap;
    heap_init(&heap);
    int values[] = {5, 3, 8, 1, 9, 2};
    for (size_t i = 0; i < sizeof(values) / sizeof(values[0]); ++i)
    {
        heap_push(&heap, values[i]);
    }
    printf("heap array: ");
    heap_print(&heap);

    int value = 0;
    printf("extract: ");
    while (heap_pop(&heap, &value))
    {
        printf("%d ", value);
    }
    printf("\nempty pop: %s\n", heap_pop(&heap, &value) ? "no" : "yes");
    return 0;
}
