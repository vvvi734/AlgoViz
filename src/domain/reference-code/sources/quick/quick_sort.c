/*
 * 中文导读：选基准划分数组，使左侧不大于基准、右侧不小于基准，再递归处理两侧。
 * 阅读顺序：先看 partition 的指针移动与交换；再看基准最终落在哪里；最后看递归区间为什么排除基准位置。
 * 关键不变量：partition 过程中，左区已 <= pivot，右区已 >= pivot，中间是未处理区。
 * 易错点：基准选择导致退化 O(n²)；相等元素处理不当死循环；递归区间包含基准；栈深度过大。
 * 复杂度：平均 O(n log n)，最坏 O(n²)，原地 O(1) 额外空间（递归栈 O(log n) 平均）。
 * 输入/输出：输入 main 内置的整数数组；排序函数原地升序重排，无返回值；main 打印排序结果。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * Quicksort in C11.
 *
 * Lomuto partition: use the last element as pivot, move values not greater than
 * the pivot to the left, then place the pivot in its final slot and recurse on
 * both sides. Average O(n log n), worst O(n^2); recursion space O(log n) average.
 * The partition is not stable.
 */

#include <stdio.h>

// Lomuto partition: `boundary` marks the end of the <= pivot region and starts at low - 1; the pivot is swapped to `boundary + 1`.
// 作用：以区间末尾为基准划分：小于等于基准的放左侧，大于的放右侧，返回基准最终下标。
static int Partition(int *values, int low, int high)
{
    int pivot = values[high];
    int boundary = low - 1;

    for (int index = low; index < high; ++index)
    {
        if (values[index] <= pivot)
        {
            ++boundary;
            int temporary = values[boundary];
            values[boundary] = values[index];
            values[index] = temporary;
        }
    }
    int temporary = values[boundary + 1];
    values[boundary + 1] = values[high];
    values[high] = temporary;
    return boundary + 1;
}

// 作用：递归排序 [low..high]：先划分，再排除基准位置递归左右两段。
static void QuickSortRange(int *values, int low, int high)
{
    if (low >= high)
    {
        return;
    }
    int pivot = Partition(values, low, high);
    QuickSortRange(values, low, pivot - 1);
    QuickSortRange(values, pivot + 1, high);
}

// 作用：快速排序入口：对 [0..count) 调用递归划分。
void QuickSort(int *values, int count)
{
    if (count <= 1)
    {
        return;
    }
    QuickSortRange(values, 0, count - 1);
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    QuickSort(values, count);
    printf("sorted:");
    for (int index = 0; index < count; ++index)
    {
        printf(" %d", values[index]);
    }
    printf("\n");
    return 0;
}
