/*
 * 中文导读：递归把数组分成两半，再把两个有序子数组合并成一个有序数组。
 * 阅读顺序：先看递归终止条件；再看 merge 中两个指针如何取较小值；最后看临时数组什么时候拷回。
 * 关键不变量：进入 merge 时左右两半各自有序；每取一个元素后，输出前缀仍有序。
 * 易错点：临时数组下标算错；剩余元素忘记拷贝；递归边界导致死循环；合并时破坏稳定性。
 * 复杂度：O(n log n) 时间，O(n) 额外空间，稳定。
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
// 作用：合并 values[low..middle) 与 [middle..high] 两段有序区间，结果写回原数组；buffer 复用临时空间。
static void MergeRange(int *values, int low, int middle, int high, int *buffer)
{
    int left = low;
    int right = middle + 1;
    int write = low;

    while (left <= middle && right <= high)
    {
        if (values[left] <= values[right])
        {
            buffer[write++] = values[left++];
        }
        else
        {
            buffer[write++] = values[right++];
        }
    }
    while (left <= middle)
    {
        buffer[write++] = values[left++];
    }
    while (right <= high)
    {
        buffer[write++] = values[right++];
    }
    for (int index = low; index <= high; ++index)
    {
        values[index] = buffer[index];
    }
}

// 作用：递归拆分 [low..high]，对两半排序后调用 MergeRange 合并。
static void MergeSortRange(int *values, int low, int high, int *buffer)
{
    if (low >= high)
    {
        return;
    }
    int middle = low + (high - low) / 2;
    MergeSortRange(values, low, middle, buffer);
    MergeSortRange(values, middle + 1, high, buffer);
    MergeRange(values, low, middle, high, buffer);
}

// 作用：归并排序入口：分配一次临时 buffer，递归排序整个数组。
void MergeSort(int *values, int count)
{
    if (count <= 1)
    {
        return;
    }
    int *buffer = (int *)malloc((size_t)count * sizeof(int));
    if (buffer == NULL)
    {
        return;
    }
    MergeSortRange(values, 0, count - 1, buffer);
    free(buffer);
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
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
