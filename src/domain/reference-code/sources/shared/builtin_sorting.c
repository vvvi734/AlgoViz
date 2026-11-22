/*
 * 中文导读：用 C/C++ 标准库的排序或查找作为对照，帮助区分“库函数用法”和“算法原理”。
 * 阅读顺序：先看输入如何准备；再看库函数调用的比较器/返回值；最后和手写实现对照时间、稳定性和边界。
 * 关键不变量：库函数只保证其文档承诺的复杂度和稳定性；不要把手写实现的假设套到库上。
 * 易错点：比较器不满足严格弱序；忽略返回 -1/0/1 与布尔值的差异；对不稳定排序期待稳定结果；空区间边界。
 * 复杂度：取决于具体库函数；本文件只用于对照，不作为复杂度证明。
 * 输入/输出：输入 main 内置的数组或操作序列；标准库便捷实现返回排序/查找结果；main 打印输出。
*/

/*
 * AlgoViz shared convenience reference: C standard-library qsort.
 *
 * qsort performs the same task (order an int array ascending), but it is an
 * unspecified in-place sort rather than a hand-written bubble/selection/
 * insertion sort. It is not guaranteed to be stable.
 *
 * Reference: C standard library qsort documentation.
 *
 * Reading guide:
 * 1. This is the C standard-library sorting shortcut, not a hand-written sort.
 * 2. qsort receives the array, element count, element size and a comparator.
 * 3. The comparator returns negative/zero/positive for less/equal/greater.
 *
 * Complexity: O(n log n) comparisons on average; extra space is
 *   implementation-defined.
 * Convention: 0-based array; qsort is not guaranteed stable.
 */

#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>

// Purpose: Integer ascending comparator used by the standard-library sort/search.
// 作用：标准库排序/查找使用的整数升序比较器。
static int compare_int(const void *left, const void *right)
{
    int a = *(const int *)left;
    int b = *(const int *)right;
    /* Compare instead of subtracting, so large values cannot overflow. */
    return (a > b) - (a < b);
}

// Purpose: Print array elements read-only so each sorting step can be checked.
// 作用：只读输出数组元素，用于检查排序每一步的结果。
static void print_values(const int *values, size_t length)
{
    for (size_t index = 0; index < length; ++index)
    {
        printf(" %d", values[index]);
    }
}

int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    size_t length = sizeof(values) / sizeof(values[0]);

    // `qsort` is in-place and not guaranteed stable; the comparator returns negative, zero or positive.
    qsort(values, length, sizeof(values[0]), compare_int);
    printf("sorted:");
    print_values(values, length);
    printf("\n");

    int empty[1] = {0};
    int single[] = {42};
    qsort(empty, 0, sizeof(empty[0]), compare_int);
    qsort(single, 1, sizeof(single[0]), compare_int);
    printf("empty:ok single:%d\n", single[0]);
    return 0;
}
