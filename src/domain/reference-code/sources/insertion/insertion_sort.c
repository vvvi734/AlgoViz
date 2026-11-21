/*
 * 中文导读：维护一个已排序前缀，把当前元素向左移动到正确位置。
 * 阅读顺序：先看外层 i 从 1 开始；再看 key 被保存后，内层为什么从 i-1 向左搬移；最后把 key 放到空出的位置。
 * 关键不变量：外层第 i 轮开始前，a[0..i) 已经有序；内层只把更大的元素右移一格。
 * 易错点：不保存 key 就被覆盖；内层边界越界；稳定性被 <=/< 写反破坏；把搬移写成交换导致更多写。
 * 复杂度：最坏/平均 O(n²)，最好 O(n)，原地 O(1)，稳定。
 * 输入/输出：输入 main 内置的整数数组；排序函数原地升序重排，无返回值；main 打印排序结果。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
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
// 作用：维护已排序前缀：保存 key，把更大的元素右移一格，再把 key 放到空位。
void InsertionSort(int *values, int count)
{
    for (int index = 1; index < count; ++index)
    {
        int key = values[index];
        int position = index - 1;
        while (position >= 0 && values[position] > key)
        {
            values[position + 1] = values[position];
            --position;
        }
        values[position + 1] = key;
    }
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    InsertionSort(values, count);
    printf("sorted:");
    for (int index = 0; index < count; ++index)
    {
        printf(" %d", values[index]);
    }
    printf("\n");
    return 0;
}
