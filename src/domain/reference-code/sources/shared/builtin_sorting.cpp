/*
 * 中文导读：用 C/C++ 标准库的排序或查找作为对照，帮助区分“库函数用法”和“算法原理”。
 * 阅读顺序：先看输入如何准备；再看库函数调用的比较器/返回值；最后和手写实现对照时间、稳定性和边界。
 * 关键不变量：库函数只保证其文档承诺的复杂度和稳定性；不要把手写实现的假设套到库上。
 * 易错点：比较器不满足严格弱序；忽略返回 -1/0/1 与布尔值的差异；对不稳定排序期待稳定结果；空区间边界。
 * 复杂度：取决于具体库函数；本文件只用于对照，不作为复杂度证明。
 * 输入/输出：输入 main 内置的数组或操作序列；标准库便捷实现返回排序/查找结果；main 打印输出。
*/

// AlgoViz shared convenience reference: C++ standard-library sorting.
//
// std::sort and std::stable_sort perform the same task (order an int vector
// ascending), but they are not bubble/selection/insertion implementations.
// std::sort is not guaranteed stable; std::stable_sort preserves equal-key order.
//
// Reference: C++ standard library <algorithm> documentation.
//
// Reading guide:
// 1. This is the C++ standard-library sorting shortcut, not a hand-written sort.
// 2. std::sort sorts in place; std::stable_sort preserves equal-key order.
// 3. Comparators must define a strict weak ordering.
//
// Complexity: O(n log n) comparisons; std::sort uses O(log n) stack,
//   stable_sort may allocate O(n).
// Convention: 0-based iterators over half-open ranges; std::sort is not stable.

#include <algorithm>
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> values{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    // `std::sort` is not stable; use `std::stable_sort` when equal-key order matters.
    std::sort(values.begin(), values.end());

    std::cout << "sorted:";
    for (int value : values)
    {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> stable{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    std::stable_sort(stable.begin(), stable.end());
    std::cout << "stable:";
    for (int value : stable)
    {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> empty;
    std::sort(empty.begin(), empty.end());
    std::cout << "empty:ok\n";
    return 0;
}
