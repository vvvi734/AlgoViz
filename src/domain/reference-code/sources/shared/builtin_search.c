/*
 * 中文导读：用 C/C++ 标准库的排序或查找作为对照，帮助区分“库函数用法”和“算法原理”。
 * 阅读顺序：先看输入如何准备；再看库函数调用的比较器/返回值；最后和手写实现对照时间、稳定性和边界。
 * 关键不变量：库函数只保证其文档承诺的复杂度和稳定性；不要把手写实现的假设套到库上。
 * 易错点：比较器不满足严格弱序；忽略返回 -1/0/1 与布尔值的差异；对不稳定排序期待稳定结果；空区间边界。
 * 复杂度：取决于具体库函数；本文件只用于对照，不作为复杂度证明。
 * 输入/输出：输入 main 内置的数组或操作序列；标准库便捷实现返回排序/查找结果；main 打印输出。
*/

/*
 * AlgoViz shared convenience implementation: binary search with bsearch().
 * The array must be sorted before calling bsearch(); the result is a pointer
 * to a matching element, or NULL when no match exists.
 *
 * Reading guide:
 * 1. This is the C standard-library binary-search shortcut, not a hand-written
 *    search.
 * 2. bsearch requires a sorted array and a comparator over element pointers.
 * 3. It returns a pointer to one matching element, or NULL when absent.
 *
 * Complexity: O(log n); extra space O(1).
 * Convention: 0-based array; duplicates may return any matching element.
 */

#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>

// Purpose: Integer ascending comparator used by the standard-library sort/search.
// 作用：标准库排序/查找使用的整数升序比较器。
int compare_int(const void *left, const void *right)
{
    int a = *(const int *)left;
    int b = *(const int *)right;
    return (a > b) - (a < b);
}

// Purpose: Standard-library comparison: binary-search a sorted range and return an index or -1.
// 作用：标准库对照实现：在有序区间中二分查找目标，返回下标或 -1。
int binary_search_builtin(const int *values, int length, int target)
{
    if (length <= 0)
    {
        return -1;
    }
    // `bsearch` requires a sorted array and returns a pointer to one matching element; duplicates may return any match.
    const int *found =
        (const int *)bsearch(&target, values, (size_t)length, sizeof(values[0]), compare_int);
    return found == NULL ? -1 : (int)(found - values);
}

int main(void)
{
    int values[] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9};
    int length = (int)(sizeof(values) / sizeof(values[0]));

    printf("target 6 -> %d\n", binary_search_builtin(values, length, 6));
    printf("target 10 -> %d\n", binary_search_builtin(values, length, 10));
    printf("empty -> %d\n", binary_search_builtin(NULL, 0, 6));
    return 0;
}
