/*
 * 中文导读：用 C/C++ 标准库的排序或查找作为对照，帮助区分“库函数用法”和“算法原理”。
 * 阅读顺序：先看输入如何准备；再看库函数调用的比较器/返回值；最后和手写实现对照时间、稳定性和边界。
 * 关键不变量：库函数只保证其文档承诺的复杂度和稳定性；不要把手写实现的假设套到库上。
 * 易错点：比较器不满足严格弱序；忽略返回 -1/0/1 与布尔值的差异；对不稳定排序期待稳定结果；空区间边界。
 * 复杂度：取决于具体库函数；本文件只用于对照，不作为复杂度证明。
 * 输入/输出：输入 main 内置的数组或操作序列；标准库便捷实现返回排序/查找结果；main 打印输出。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz shared convenience implementation: binary search with lower_bound.
// lower_bound finds the first position that is not less than the target.
// The input range must already be sorted.
//
// Reading guide:
// 1. This is the C++ standard-library binary-search shortcut, not a hand-written
//    search.
// 2. std::lower_bound finds the first element not less than the target.
// 3. The range must be partitioned with respect to the comparator.
//
// Complexity: O(log n) comparisons; extra space O(1).
// Convention: Half-open iterator range; the returned iterator may equal end().

#include <algorithm>
#include <iostream>
#include <vector>

// 作用：标准库对照实现：在有序区间中二分查找目标，返回下标或 -1。
int binary_search_builtin(const std::vector<int> &values, int target)
{
    // `lower_bound` returns the first position not less than the target; end() means no candidate.
    auto position = std::lower_bound(values.begin(), values.end(), target);
    if (position == values.end() || *position != target)
    {
        return -1;
    }
    return static_cast<int>(position - values.begin());
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    std::vector<int> values{0, 1, 2, 3, 4, 5, 6, 7, 8, 9};
    std::cout << "target 6 -> " << binary_search_builtin(values, 6) << '\n';
    std::cout << "target 10 -> " << binary_search_builtin(values, 10) << '\n';
    std::cout << "empty -> " << binary_search_builtin({}, 6) << '\n';
    return 0;
}
