/*
 * 中文导读：反复比较相邻元素并交换，让每一轮把当前最大元素推到未排序区末尾。
 * 阅读顺序：先看双层循环的边界；再看 swapped 提前结束；最后确认每轮结束后哪一段已经有序。
 * 关键不变量：第 i 轮结束后，末尾 i 个元素是全局最大的 i 个，且已排好序。
 * 易错点：内层边界写成 n 导致越界；每一轮都从 0 到 n-1 做无效比较；忘记提前退出只影响常数，不影响正确性。
 * 复杂度：最坏/平均 O(n²)，最好 O(n)（已有序且提前退出），原地 O(1)。
 */

/*
 * Bubble sort in C11.
 *
 * Repeatedly compare adjacent pairs and swap inverted pairs. After pass k the
 * largest k values are fixed at the right end. A pass without a swap proves the
 * remaining prefix is sorted, so the algorithm stops early.
 * Stable; O(n^2) worst and average, O(n) best, extra space O(1).
 */

#include <stdio.h>

// After pass k the largest k values sit at the right end; an unchanged pass ends the sort early.
// 作用：对 values[0..count) 做冒泡排序：每轮把未排序区最大值推到末尾，swapped 为假时提前结束。
void BubbleSort(int *values, int count)
{
    for (int end = count - 1; end > 0; --end)
    {
        int swapped = 0;
        for (int index = 0; index < end; ++index)
        {
            if (values[index] > values[index + 1])
            {
                int temporary = values[index];
                values[index] = values[index + 1];
                values[index + 1] = temporary;
                swapped = 1;
            }
        }
        if (!swapped)
        {
            break;
        }
    }
}

// 作用：只读输出数组元素，用于检查排序每一步的结果。
static void PrintValues(const int *values, int count)
{
    for (int index = 0; index < count; ++index)
    {
        printf("%d%s", values[index], index + 1 == count ? "\n" : " ");
    }
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    BubbleSort(values, count);
    printf("sorted: ");
    PrintValues(values, count);
    return 0;
}
