/*
 * 中文导读：从一端逐个比较，直到找到目标或扫描完整个区间。
 * 阅读顺序：先看循环边界；再看找到时返回下标、失败时返回什么；最后看哨兵写法为什么能少一次边界判断。
 * 关键不变量：当前下标之前的元素都已经比较过且不是目标。
 * 易错点：返回 0 当作未找到与真实下标 0 混淆；越界；哨兵值覆盖原数据；重复元素返回哪一个不明确。
 * 复杂度：O(n) 时间，O(1) 空间。
 * 输入/输出：输入整数数组与目标值；返回首个匹配下标或 -1；main 打印命中/未命中。
*/

/*
 * Linear search in C11.
 *
 * Compare every element from left to right. The array does not need to be
 * sorted; the first equal element wins. Returns its index, or -1 if absent.
 * Worst-case time O(n), extra space O(1).
 */

#include <stdio.h>

// Return the first matching index; -1 is correct only after the entire array has been scanned.
// Purpose: Compare from 0 through count-1; return the matching index or -1.
// 作用：从 0 到 count-1 逐个比较；找到返回下标，失败返回 -1。
int LinearSearch(const int *values, int count, int target)
{
    for (int index = 0; index < count; ++index)
    {
        if (values[index] == target)
        {
            return index;
        }
    }
    return -1;
}

int main(void)
{
    int values[] = {7, 2, 9, 4, 4, 1};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    printf("find 4: index=%d\n", LinearSearch(values, count, 4));
    printf("find 8: index=%d\n", LinearSearch(values, count, 8));
    return 0;
}
