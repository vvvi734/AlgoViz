/*
 * 中文导读：从一端逐个比较，直到找到目标或扫描完整个区间。
 * 阅读顺序：先看循环边界；再看找到时返回下标、失败时返回什么；最后看哨兵写法为什么能少一次边界判断。
 * 关键不变量：当前下标之前的元素都已经比较过且不是目标。
 * 易错点：返回 0 当作未找到与真实下标 0 混淆；越界；哨兵值覆盖原数据；重复元素返回哪一个不明确。
 * 复杂度：O(n) 时间，O(1) 空间。
 * 输入/输出：输入整数数组与目标值；返回首个匹配下标或 -1；main 打印命中/未命中。
*/

// AlgoViz reference implementation: linear search (C++17).
// Scans from left to right and returns the first matching index, or -1.
//
// Reading guide:
// 1. Scan values[0..n) from left to right.
// 2. Return the first index whose value equals the target.
// 3. Return -1 after the scan if no value matched.
//
// Complexity: O(n); extra space O(1).
// Convention: 0-based indices; returns the first match, or -1 when absent.

#include <iostream>
#include <vector>

// Return the first matching index; -1 means the whole array was scanned.
// Return the first matching index; -1 is correct only after the entire array has been scanned.
// Purpose: Compare from one end of the array; return the matching index or -1.
// 作用：从数组一端逐个比较；找到返回下标，失败返回 -1。
int linear_search(const std::vector<int> &values, int target)
{
    for (std::size_t index = 0; index < values.size(); ++index)
    {
        if (values[index] == target)
        {
            return static_cast<int>(index);
        }
    }
    return -1;
}

int main()
{
    std::vector<int> values{4, 7, 2, 9, 1, 5};
    std::cout << "target 9 -> " << linear_search(values, 9) << '\n';
    std::cout << "target 1 -> " << linear_search(values, 1) << '\n';
    std::cout << "target 6 -> " << linear_search(values, 6) << '\n';
    std::cout << "empty -> " << linear_search({}, 6) << '\n';
    return 0;
}
