/*
 * 中文导读：每一轮从未排序区选出最小元素，放到未排序区的最前面。
 * 阅读顺序：先看外层 i 的已排序前缀；再看内层如何记录 min_index；最后看一轮只交换一次。
 * 关键不变量：外层第 i 轮前，a[0..i) 是全局最小的 i 个元素且已排序。
 * 易错点：每轮都交换导致不稳定/多写；min_index 未初始化；边界写成 n；相等元素顺序被交换破坏稳定性。
 * 复杂度：O(n²) 时间，O(1) 空间，不稳定。
 * 输入/输出：输入 main 内置的整数数组；排序函数原地升序重排，无返回值；main 打印排序结果。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
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
// 作用：每轮从未排序区选最小值，与未排序区首位交换；外层前缀逐步变为全局有序。
void SelectionSort(int *values, int count)
{
    for (int start = 0; start + 1 < count; ++start)
    {
        int minimum = start;
        for (int index = start + 1; index < count; ++index)
        {
            if (values[index] < values[minimum])
            {
                minimum = index;
            }
        }
        if (minimum != start)
        {
            int temporary = values[start];
            values[start] = values[minimum];
            values[minimum] = temporary;
        }
    }
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
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
