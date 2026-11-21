/*
 * 中文导读：在有序数组中不断缩小闭区间/半开区间，排除一半候选。
 * 阅读顺序：先确认区间定义（本文件用的是哪种 low/high 约定）；再算 mid；最后看更新 low/high 后区间是否真的变小。
 * 关键不变量：目标如果存在，一定在当前候选区间内；区间外的元素已经被证明不可能。
 * 易错点：low/high 约定混用；mid 计算溢出；死循环（区间没有缩小）；把重复元素的第一个/最后一个位置混淆。
 * 复杂度：O(log n) 时间，O(1) 额外空间。
 * 输入/输出：输入有序整数数组与目标值；查找函数返回下标，未命中返回 -1；main 打印结果。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * Binary search in C11.
 *
 * Precondition: values is sorted in non-decreasing order. Keep an inclusive
 * window [low, high], compare the middle value, and discard the half that
 * cannot contain the target. Returns an index, or -1 when absent.
 * Time O(log n), extra space O(1).
 */

#include <stdio.h>

// The window is inclusive: low == high still leaves one candidate, and mid is computed without overflow.
// Purpose: Binary-search a sorted array and return the index, or -1 when absent; the interval convention is documented on the function's first comment.
// 作用：在有序数组中做二分查找；返回下标，找不到返回 -1。区间约定见函数第一行注释。
int Binary_Search(const int *values, int count, int target)
{
    int low = 0;
    int high = count - 1;

    while (low <= high)
    {
        int middle = low + (high - low) / 2;
        if (values[middle] == target)
        {
            return middle;
        }
        if (values[middle] < target)
        {
            low = middle + 1;
        }
        else
        {
            high = middle - 1;
        }
    }
    return -1;
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    int values[] = {1, 3, 5, 7, 9, 11, 13};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    printf("find 9: index=%d\n", Binary_Search(values, count, 9));
    printf("find 8: index=%d\n", Binary_Search(values, count, 8));
    return 0;
}
