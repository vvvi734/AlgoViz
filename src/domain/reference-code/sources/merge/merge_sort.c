/*
 * 中文导读：递归把数组分成两半，再把两个有序子数组合并成一个有序数组。
 * 阅读顺序：先看递归终止条件；再看 merge 中两个指针如何取较小值；最后看临时数组什么时候拷回。
 * 关键不变量：进入 merge 时左右两半各自有序；每取一个元素后，输出前缀仍有序。
 * 易错点：临时数组下标算错；剩余元素忘记拷贝；递归边界导致死循环；合并时破坏稳定性。
 * 复杂度：O(n log n) 时间，O(n) 额外空间，稳定。
 * 输入/输出：输入 main 内置的整数数组；排序函数借助缓冲区原地归并，无返回值；main 打印排序结果。
*/

/*
 * Merge sort in C11.
 *
 * Split the range into two halves, sort each half recursively, then merge the
 * two sorted halves into a temporary buffer. Taking the left item on equality
 * keeps the sort stable. O(n log n) on every input; O(n) extra space.
 */

#include <stdio.h>
#include <stdlib.h>

// The buffer is shared across recursive calls; ties take the left run, which keeps the merge stable.
// Purpose: Merge the sorted ranges values[low..middle) and [middle..high] and write the result back, reusing buffer as temporary space.
// 作用：合并 values[low..middle) 与 [middle..high] 两段有序区间，结果写回原数组；buffer 复用临时空间。
static void MergeRange(int *values, int low, int middle, int high, int *buffer)
{
    int left = low;
    int right = middle + 1;
    int write = low;

    while (left <= middle && right <= high)
    // The main loop runs only while both runs have records; once one side ends, the remaining tail needs no comparisons.
    {
        if (values[left] <= values[right])
        // The <= tie-break takes the left run first; taking the right on equality would reverse equal records and destroy stability.
        {
            buffer[write++] = values[left++];
        }
        else
        {
            buffer[write++] = values[right++];
        }
    }
    while (left <= middle)
    // The left tail is already sorted and every value in it is <= the exhausted right side's remaining values, so it can be copied directly.
    {
        buffer[write++] = values[left++];
    }
    while (right <= high)
    {
        buffer[write++] = values[right++];
    }
    for (int index = low; index <= high; ++index)
    // The merged result is copied back only after the whole range is in buffer; writing back early could overwrite an unread source element.
    {
        values[index] = buffer[index];
    }
}

// Purpose: Recursively split [low..high], sort both halves, then merge them with MergeRange.
// 作用：递归拆分 [low..high]，对两半排序后调用 MergeRange 合并。
static void MergeSortRange(int *values, int low, int high, int *buffer)
{
    if (low >= high)
    // A zero- or one-element range is already sorted; without this base case the recursion would never reach a merge.
    {
        return;
    }
    int middle = low + (high - low) / 2;
    // The midpoint formula avoids low+high overflow and keeps the split strictly smaller than the parent range.
    MergeSortRange(values, low, middle, buffer);
    MergeSortRange(values, middle + 1, high, buffer);
    MergeRange(values, low, middle, high, buffer);
}

// Purpose: Merge-sort entry: allocate one temporary buffer and recursively sort the whole array.
// 作用：归并排序入口：分配一次临时 buffer，递归排序整个数组。
void MergeSort(int *values, int count)
{
    if (count <= 1)
    {
        return;
    }
    int *buffer = (int *)malloc((size_t)count * sizeof(int));
    // One buffer is allocated for the whole sort, not per merge; recursive calls share it because their ranges are disjoint.
    if (buffer == NULL)
    // Allocation failure returns without sorting; the caller cannot distinguish this from success because the API has no status result.
    {
        return;
    }
    MergeSortRange(values, 0, count - 1, buffer);
    free(buffer);
}

int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    MergeSort(values, count);
    printf("sorted:");
    for (int index = 0; index < count; ++index)
    {
        printf(" %d", values[index]);
    }
    printf("\n");
    return 0;
}
