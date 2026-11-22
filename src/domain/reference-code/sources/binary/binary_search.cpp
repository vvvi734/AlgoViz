/*
 * 中文导读：在有序数组中不断缩小闭区间/半开区间，排除一半候选。
 * 阅读顺序：先确认区间定义（本文件用的是哪种 low/high 约定）；再算 mid；最后看更新 low/high 后区间是否真的变小。
 * 关键不变量：目标如果存在，一定在当前候选区间内；区间外的元素已经被证明不可能。
 * 易错点：low/high 约定混用；mid 计算溢出；死循环（区间没有缩小）；把重复元素的第一个/最后一个位置混淆。
 * 复杂度：O(log n) 时间，O(1) 额外空间。
 * 输入/输出：输入有序整数数组与目标值；查找函数返回下标，未命中返回 -1；main 打印结果。
*/

// AlgoViz reference implementation: binary search (C++17).
// The algorithm is implemented explicitly; std::binary_search is not used.
//
// Reading guide:
// 1. The input must be non-decreasing; the function checks this before searching.
// 2. Keep an inclusive search window [low, high].
// 3. Compare the middle element and discard the half that cannot contain the target.
// 4. Return the found index, or -1 when the window becomes empty.
//
// Complexity: O(log n); extra space O(1).
// Convention: 0-based indices; low and high are inclusive; duplicate targets may
//   return any matching index.

#include <cstddef>
#include <iostream>
#include <vector>

// Purpose: Check that the array is non-decreasing as the precondition for binary search.
// 作用：检查数组是否按非降序排列，作为二分查找的前置条件检查。
bool is_non_decreasing(const std::vector<int> &values)
{
    for (std::size_t i = 1; i < values.size(); ++i)
    {
        if (values[i - 1] > values[i])
        {
            return false;
        }
    }
    return true;
}

// The window is inclusive: low == high still leaves one candidate, and mid is computed without overflow.
// Purpose: Binary-search a sorted vector and return the target index, or -1 when absent.
// 作用：在有序 vector 中做二分查找；返回目标下标，找不到返回 -1。
int binary_search_index(const std::vector<int> &values, int target)
{
    if (values.empty())
    {
        return -1;
    }
    int left = 0;
    int right = static_cast<int>(values.size()) - 1;
    while (left <= right)
    {
        int mid = left + (right - left) / 2;
        if (values[static_cast<std::size_t>(mid)] == target)
        {
            return mid;
        }
        if (values[static_cast<std::size_t>(mid)] < target)
        {
            left = mid + 1;
        }
        else
        {
            right = mid - 1;
        }
    }
    return -1;
}

int main()
{
    const std::vector<int> sorted{1, 3, 5, 7, 9, 11, 13};
    if (!is_non_decreasing(sorted))
    {
        std::cerr << "input must be sorted in non-decreasing order\n";
        return 1;
    }

    std::cout << "target=9 index=" << binary_search_index(sorted, 9) << '\n';
    std::cout << "missing=8 index=" << binary_search_index(sorted, 8) << '\n';
    return 0;
}
