/*
 * 中文导读：用完全二叉树数组实现优先队列：堆顶最大，插入和删除后通过上浮/下沉恢复堆序。
 * 阅读顺序：先记 0 基下标关系 parent=(i-1)/2、children=2i+1/2i+2；再看 sift_up 与 sift_down 的交换方向；最后看建堆为什么从最后一个非叶结点倒着下沉。
 * 关键不变量：每个父结点都不小于它的孩子；数组的前 size 个位置构成完全树。
 * 易错点：1 基/0 基公式混用；下沉只比较一个孩子；删除堆顶后忘记把末尾元素放到根；建堆从根往下。
 * 复杂度：取最大 O(1)，插入/删除 O(log n)，建堆 O(n)，空间 O(n)。
 * 输入/输出：输入 push/pop 操作序列；push 无返回值，pop 返回当前最大值；main 打印堆数组与弹出值。
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

void heap_init(MaxHeap *heap)
{
    heap->size = 0;
}

void swap_int(int *a, int *b)
{
    int temp = *a;
    *a = *b;
    *b = temp;
}

// Sift up while the parent is smaller; stop when the heap property holds or root is reached.
// Purpose: Sift up from index, swapping with the parent until heap order is restored or the root is reached.
// 作用：从 index 向上与父结点比较并交换，直到堆序恢复或到达根。
void sift_up(MaxHeap *heap, int index)
{
    while (index > 0)
    {
        int parent = (index - 1) / 2;
        // The 0-based parent formula works for every child index; using i/2 would be the 1-based rule and place the parent one level too high.
        if (heap->items[parent] >= heap->items[index])
        // Once the parent is at least the child, every ancestor was already >= that parent, so the whole path is valid without further checks.
        {
            break;
        }
        swap_int(&heap->items[parent], &heap->items[index]);
        index = parent;
    }
}

// For index i the children are 2*i+1 and 2*i+2; sift-down swaps with the larger child until the parent is >= both.
// Purpose: Sift down from index, swapping with the larger child until heap order is restored or a leaf is reached.
// 作用：从 index 向下与较大的孩子交换，直到堆序恢复或到达叶子。
void sift_down(MaxHeap *heap, int index)
{
    while (true)
    {
        int left = index * 2 + 1;
        // The left-child formula is the inverse of the parent formula; right is left+1 and may not exist.
        int right = left + 1;
        int largest = index;
        if (left < heap->size && heap->items[left] > heap->items[largest])
        {
            largest = left;
        }
        if (right < heap->size && heap->items[right] > heap->items[largest])
        // The right-child check is guarded separately because a node can have a left child without a right child.
        {
            largest = right;
        }
        if (largest == index)
        // No child is greater than the current parent, so the max-heap property holds at this position and sifting can stop.
        {
            break;
        }
        swap_int(&heap->items[index], &heap->items[largest]);
        index = largest;
    }
}

// Purpose: Place value at the end of the array and sift up the parent chain to its correct position; return false when full.
// 作用：把 value 放到数组末尾，再沿父链上浮到正确位置；堆满返回 false。
bool heap_push(MaxHeap *heap, int value)
{
    if (heap->size == HEAP_CAPACITY)
    // The array is fixed-size, so a full heap reports failure instead of growing; C++ and Python versions use dynamic storage.
    {
        return false;
    }
    heap->items[heap->size] = value;
    // The new value is written at the old size, then size grows; sifting uses the new last index, not the old slot.
    ++heap->size;
    sift_up(heap, heap->size - 1);
    return true;
}

// Purpose: Remove the heap maximum, move the last element to the root and sift down; return false when empty.
// 作用：取出堆顶最大值，把末尾元素移到根，再下沉恢复堆序；空堆返回 false。
bool heap_pop(MaxHeap *heap, int *out_value)
{
    if (heap->size == 0)
    {
        return false;
    }
    *out_value = heap->items[0];
    --heap->size;
    // Decrementing first removes the old root from the logical heap; the subsequent move overwrites slot 0 with the former last value.
    if (heap->size > 0)
    {
        heap->items[0] = heap->items[heap->size];
        // The last element is the only one that can be moved without breaking the complete-tree shape; sift_down then repairs order.
        sift_down(heap, 0);
    }
    return true;
}

// Purpose: Print heap elements in array order; read-only, so parent-child indices can be checked directly.
// 作用：按数组顺序输出堆元素；只读，可直接核对父子下标关系。
void heap_print(const MaxHeap *heap)
{
    for (int i = 0; i < heap->size; ++i)
    {
        printf("%d%s", heap->items[i], i + 1 == heap->size ? "" : " ");
    }
    printf("\n");
}

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
