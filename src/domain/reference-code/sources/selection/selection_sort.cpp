/*
 * 中文导读：每一轮从未排序区选出最小元素，放到未排序区的最前面。
 * 阅读顺序：先看外层 i 的已排序前缀；再看内层如何记录 min_index；最后看一轮只交换一次。
 * 关键不变量：外层第 i 轮前，a[0..i) 是全局最小的 i 个元素且已排序。
 * 易错点：每轮都交换导致不稳定/多写；min_index 未初始化；边界写成 n；相等元素顺序被交换破坏稳定性。
 * 复杂度：O(n²) 时间，O(1) 空间，不稳定。
 * 输入/输出：输入 main 内置的整数数组；排序函数原地升序重排，无返回值；main 打印排序结果。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz reference implementation: selection sort (C++17).
// Each pass selects the smallest remaining element and places it at the front.
//
// Reading guide:
// 1. The prefix [0, start) is already the sorted portion.
// 2. Scan the unsorted suffix for its minimum.
// 3. Swap that minimum into position start and grow the sorted prefix by one.
//
// Complexity: O(n^2) in all cases; extra space O(1).
// Convention: Ascending order; 0-based indices; the exchange can move equal keys, so
//   the sort is not stable.

#include <cstddef>
#include <iostream>
#include <utility>
#include <vector>

// Invariant: [0, start) is sorted; each scan finds the minimum of the unsorted suffix.
// `minimum` holds the index of the smallest value seen in the unsorted suffix; swap only after the scan finishes.
// Purpose: Each pass places the minimum of the unsorted suffix at the end of the prefix, using one swap to reduce writes.
// 作用：每轮从未排序区选最小值放到前缀末尾；只交换一次，减少写操作。
void selection_sort(std::vector<int> &values)
{
    for (std::size_t start = 0; start + 1 < values.size(); ++start)
    {
        std::size_t minimum = start;
        for (std::size_t index = start + 1; index < values.size(); ++index)
        {
            if (values[index] < values[minimum])
            {
                minimum = index;
            }
        }
        if (minimum != start)
        {
            std::swap(values[start], values[minimum]);
        }
    }
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    std::vector<int> values{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    selection_sort(values);

    std::cout << "sorted:";
    for (int value : values)
    {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> empty;
    std::vector<int> single{42};
    selection_sort(empty);
    selection_sort(single);
    std::cout << "empty:ok single:" << single.front() << '\n';
    return 0;
}
