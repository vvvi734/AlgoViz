/*
 * 中文导读：维护一个已排序前缀，把当前元素向左移动到正确位置。
 * 阅读顺序：先看外层 i 从 1 开始；再看 key 被保存后，内层为什么从 i-1 向左搬移；最后把 key 放到空出的位置。
 * 关键不变量：外层第 i 轮开始前，a[0..i) 已经有序；内层只把更大的元素右移一格。
 * 易错点：不保存 key 就被覆盖；内层边界越界；稳定性被 <=/< 写反破坏；把搬移写成交换导致更多写。
 * 复杂度：最坏/平均 O(n²)，最好 O(n)，原地 O(1)，稳定。
 * 输入/输出：输入 main 内置的整数数组；排序函数原地升序重排，无返回值；main 打印排序结果。
*/

/*
 * Insertion sort in C11.
 *
 * Maintain a sorted prefix. Lift the next key, shift strictly larger values one
 * slot right, then write the key into the gap. Equal keys do not move, so the
 * sort is stable. Time O(n^2) worst, O(n) best; extra space O(1).
 */

#include <stdio.h>

// Shift only while the previous value is strictly greater; equal keys stop the shift and keep the sort stable.
// Purpose: Maintain a sorted prefix: save key, shift larger values right by one slot, then place key in the gap.
// 作用：维护已排序前缀：保存 key，把更大的元素右移一格，再把 key 放到空位。
// The function sorts in place and returns nothing; callers must keep the array alive for the whole call because every value is read and rewritten directly.
void InsertionSort(int *values, int count)
{
    // The sorted prefix is [0, index); index starts at 1 because a one-element prefix is already sorted, and the loop invariant is restored at the end of each iteration.
    for (int index = 1; index < count; ++index)
    {
        // key must be saved before shifting: the first move overwrites values[index], which is the only copy of the element being inserted.
        int key = values[index];
        // position names the rightmost element of the sorted prefix, not the hole; the hole is always position+1 during the shift loop.
        int position = index - 1;
        // The strict > is the stability decision: equal keys stop the shift, so the new key lands after them and their relative order survives.
        while (position >= 0 && values[position] > key)
        {
            // This is a one-slot move, not a swap; only larger values travel right while the hole moves left, so the number of writes is minimal.
            values[position + 1] = values[position];
            --position;
        }
        // After the loop, position+1 is the first slot whose left neighbour is <= key; that is exactly where the saved key belongs.
        values[position + 1] = key;
    }
}

int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    // On already sorted input the inner loop never runs, so each outer step costs one comparison and the total is O(n); the quadratic bound is only the worst case.
    InsertionSort(values, count);
    printf("sorted:");
    for (int index = 0; index < count; ++index)
    {
        printf(" %d", values[index]);
    }
    printf("\n");
    return 0;
}
