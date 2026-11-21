/*
 * 中文导读：按逐渐缩小的间隔做插入排序，让元素先大步接近目标位置，最后 gap=1 收尾。
 * 阅读顺序：先看 gap 序列；再看每个 gap 下对 g, g+gap, ... 做插入排序；最后看 gap 如何缩小到 1。
 * 关键不变量：gap 为 g 时，所有相隔 g 的元素组成的子序列已经有序；最后 g=1 时整个数组有序。
 * 易错点：gap 缩小方式导致死循环；内层下标越界；把希尔排序当成稳定排序；gap 序列与循环边界不匹配。
 * 复杂度：取决于 gap 序列；常见约 O(n^1.3)~O(n²)，原地 O(1)，不稳定。
 */

/*
 * Shell sort in C11.
 *
 * Insertion-sort each subsequence whose elements are gap positions apart, then
 * shrink the gap and finish with gap 1. The cost depends on the gap sequence;
 * halving gaps gives O(n^2) worst case. The usual implementation is not stable.
 * Extra space O(1).
 */

#include <stdio.h>

// Each gap pass insertion-sorts independent subsequences; gap 1 is the final ordinary insertion sort.
// 作用：按缩小 gap 做插入排序；每个 gap 下对相隔 gap 的子序列排序，最后 gap=1 收尾。
void ShellSort(int *values, int count)
{
    for (int gap = count / 2; gap > 0; gap /= 2)
    {
        for (int start = gap; start < count; ++start)
        {
            int key = values[start];
            int position = start;
            while (position >= gap && values[position - gap] > key)
            {
                values[position] = values[position - gap];
                position -= gap;
            }
            values[position] = key;
        }
    }
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    ShellSort(values, count);
    printf("sorted:");
    for (int index = 0; index < count; ++index)
    {
        printf(" %d", values[index]);
    }
    printf("\n");
    return 0;
}
