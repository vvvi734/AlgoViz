/*
 * 中文导读：每一轮从未排序区选出最小元素，放到未排序区的最前面。
 * 阅读顺序：先看外层 i 的已排序前缀；再看内层如何记录 min_index；最后看一轮只交换一次。
 * 关键不变量：外层第 i 轮前，a[0..i) 是全局最小的 i 个元素且已排序。
 * 易错点：每轮都交换导致不稳定/多写；min_index 未初始化；边界写成 n；相等元素顺序被交换破坏稳定性。
 * 复杂度：O(n²) 时间，O(1) 空间，不稳定。
 * 输入/输出：输入 main 内置的整数数组；排序函数原地升序重排，无返回值；main 打印排序结果。
*/

/*
 * Selection sort in C11.
 *
 * Each pass finds the minimum in the unsorted suffix and swaps it into the end
 * of the sorted prefix. Swaps may cross equal keys, so the usual implementation
 * is not stable. Time O(n^2), extra space O(1).
 */

#include <stdio.h>

// `minimum` holds the index of the smallest value seen in the unsorted suffix; swap only after the scan finishes.
// Purpose: Each pass selects the minimum from the unsorted suffix and swaps it into the front of that suffix, growing a globally sorted prefix.
// 作用：每轮从未排序区选最小值，与未排序区首位交换；外层前缀逐步变为全局有序。
void SelectionSort(int *values, int count)
{
    for (int start = 0; start + 1 < count; ++start)
    // start+1 < count stops before the final single-element suffix; that last element is already in place and needs no self-swap.
    {
        int minimum = start;
        // The candidate starts as the first unsorted element; if the scan finds nothing smaller, no swap is needed.
        for (int index = start + 1; index < count; ++index)
        // The scan begins after start because comparing the candidate with itself cannot change the minimum.
        {
            if (values[index] < values[minimum])
            // Strict < keeps the first occurrence on equal keys during the scan, but the final swap can still move an equal key across another.
            {
                minimum = index;
            }
        }
        if (minimum != start)
        // One swap per pass keeps writes low; skipping a self-swap is an optimization, not the reason the algorithm is correct.
        {
            int temporary = values[start];
            values[start] = values[minimum];
            values[minimum] = temporary;
        }
    }
}

int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    // The input contains several inversions so every pass can be observed changing the sorted prefix.
    int count = (int)(sizeof(values) / sizeof(values[0]));

    SelectionSort(values, count);
    printf("sorted:");
    for (int index = 0; index < count; ++index)
    {
        printf(" %d", values[index]);
    }
    printf("\n");
    return 0;
}
