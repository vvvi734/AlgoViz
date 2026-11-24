/*
 * 中文导读：用三数取中选基准划分数组，使左侧不大于基准、右侧不小于基准，再处理两侧。
 * 阅读顺序：先看 MedianOfThree 如何把中位数换到末尾；再看 partition 的指针移动与交换；最后看为什么先递归较小侧、较大侧改用循环。
 * 关键不变量：partition 过程中，左区已 <= pivot，右区已 >= pivot，中间是未处理区。
 * 易错点：固定末尾基准导致有序输入退化；相等元素处理不当死循环；递归区间包含基准；两侧都递归导致栈深 O(n)。
 * 复杂度：平均 O(n log n)，最坏 O(n²)；三数取中避开常见有序退化，较小侧递归使栈深稳定在 O(log n)。
 * 输入/输出：输入 main 内置的整数数组；排序函数原地升序重排，无返回值；main 打印排序结果。
*/

/*
 * Quicksort in C11.
 *
 * Median-of-three chooses the pivot, then Lomuto partition moves values not
 * greater than the pivot to the left and places the pivot in its final slot.
 * The smaller side is recursive and the larger side is iterative, so stack
 * depth stays O(log n) even when a partition is unbalanced.
 * Average O(n log n), worst O(n^2); the partition is not stable.
 */

#include <stdio.h>

// Purpose: Order values[low], values[middle], values[high], then move the median to high for Lomuto.
// 作用：先让 low/middle/high 三个位置有序，再把中位数换到 high，供 Lomuto 划分使用。
static int MedianOfThree(int *values, int low, int high)
{
    int middle = low + (high - low) / 2;
    // The midpoint is computed by offset to avoid low+high overflow; for a two-element range it equals low.
    if (values[middle] < values[low])
    {
        int temporary = values[middle];
        values[middle] = values[low];
        values[low] = temporary;
    }
    if (values[high] < values[low])
    // After this swap low holds the smallest of the three, so the median cannot be low.
    {
        int temporary = values[high];
        values[high] = values[low];
        values[low] = temporary;
    }
    if (values[high] < values[middle])
    // The remaining comparison orders middle and high; the median is now at middle.
    {
        int temporary = values[high];
        values[high] = values[middle];
        values[middle] = temporary;
    }
    int temporary = values[middle];
    values[middle] = values[high];
    values[high] = temporary;
    // Lomuto reads values[high] as the pivot, so the median is moved there after the three-way ordering.
    return values[high];
    // The median now sits at high, which is the value Lomuto will use as the pivot.
}

// Lomuto partition: `boundary` marks the end of the <= pivot region and starts at low - 1; the pivot is swapped to `boundary + 1`.
// Purpose: Partition around the median moved to the end: values not greater than the pivot go left, larger values go right.
// 作用：以三数取中后放在末尾的基准划分：小于等于基准的放左侧，大于的放右侧，返回基准最终下标。
static int Partition(int *values, int low, int high)
{
    int pivot = MedianOfThree(values, low, high);
    // Median-of-three makes sorted and reverse-sorted inputs choose a middle value instead of the extreme, avoiding the common O(n^2) case.
    int boundary = low - 1;
    // boundary is the last index of the <= pivot region and starts before low, so the region is empty before the first comparison.

    for (int index = low; index < high; ++index)
    // The scan stops before high because values[high] is the pivot itself; including it would compare the pivot with itself and disturb the final swap.
    {
        if (values[index] <= pivot)
        // <= sends equal keys left; this keeps duplicate-heavy input from producing an empty left side, but it also makes the partition unstable.
        {
            ++boundary;
            // boundary grows only when a qualifying element is found; the element at the new boundary is swapped into the processed region.
            int temporary = values[boundary];
            values[boundary] = values[index];
            values[index] = temporary;
        }
    }
    int temporary = values[boundary + 1];
    // The final swap puts the pivot immediately after the <= region; boundary+1 is its final position, so later recursion must exclude it.
    values[boundary + 1] = values[high];
    values[high] = temporary;
    return boundary + 1;
}

// Purpose: Sort [low..high] by partitioning, recursing on the smaller side and looping on the larger side.
// 作用：划分后先递归较小侧、再循环处理较大侧，避免不平衡划分把递归栈推到 O(n)。
static void QuickSortRange(int *values, int low, int high)
{
    while (low < high)
    // The loop replaces the larger recursive branch; only the smaller branch consumes stack, so every nested call is at most half the parent.
    {
        int pivot = Partition(values, low, high);
        if (pivot - low < high - pivot)
        // The left side is smaller: recurse there and continue the loop with the right side.
        {
            QuickSortRange(values, low, pivot - 1);
            low = pivot + 1;
        }
        else
        // The right side is no larger: recurse there and continue with the left side.
        {
            QuickSortRange(values, pivot + 1, high);
            high = pivot - 1;
        }
    }
}

// Purpose: Quicksort entry: start the recursive partition on [0..count).
// 作用：快速排序入口：对 [0..count) 调用递归划分。
void QuickSort(int *values, int count)
{
    if (count <= 1)
    {
        return;
    }
    QuickSortRange(values, 0, count - 1);
}

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
