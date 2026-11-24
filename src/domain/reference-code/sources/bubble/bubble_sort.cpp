/*
 * 中文导读：反复比较相邻元素并交换，让每一轮把当前最大元素推到未排序区末尾。
 * 阅读顺序：先看双层循环的边界；再看 swapped 提前结束；最后确认每轮结束后哪一段已经有序。
 * 关键不变量：第 i 轮结束后，末尾 i 个元素是全局最大的 i 个，且已排好序。
 * 易错点：内层边界写成 n 导致越界；每一轮都从 0 到 n-1 做无效比较；忘记提前退出只影响常数，不影响正确性。
 * 复杂度：最坏/平均 O(n²)，最好 O(n)（已有序且提前退出），原地 O(1)。
 * 输入/输出：输入 main 内置的整数数组；排序函数原地升序重排，无返回值；main 打印排序结果。
*/

// AlgoViz reference implementation: bubble sort (C++17).
// This is the manual exchange-sort version; std::sort is intentionally not used.
//
// Reading guide:
// 1. Each pass compares adjacent pairs from the left and swaps inverted pairs.
// 2. After pass k, the largest k values are fixed at the right end.
// 3. A pass with no swap proves the remaining prefix is already sorted, so stop
//    early.
//
// Complexity: O(n^2) average/worst, O(n) best with early exit; extra space
//   O(1).
// Convention: Ascending order; 0-based array access; equal values are never swapped,
//   so the sort is stable.

#include <cstddef>
#include <iostream>
#include <utility>
#include <vector>

// Invariant: after each pass, the largest remaining values are fixed at the right end.
// After pass k the largest k values sit at the right end; an unchanged pass ends the sort early.
// Purpose: Bubble-sort the vector, shrinking the unsorted suffix each pass and stopping when a pass makes no swap.
// 作用：对 vector 做冒泡排序；每轮缩小未排序区，某轮没有交换就提前结束。
void bubble_sort(std::vector<int> &values)
{
    if (values.size() < 2)
    // Fewer than two elements already satisfy the postcondition; the guard also prevents size_t end-- from wrapping below zero.
    {
        return;
    }

    for (std::size_t end = values.size(); end > 1; --end)
    // end is one past the last index of the active prefix; comparing index-1 with index covers every adjacent pair and leaves the fixed tail alone.
    {
        bool swapped = false;
        // The flag is per pass; reusing a previous pass's true value would suppress the early-exit proof.
        for (std::size_t index = 1; index < end; ++index)
        // Starting at 1 lets index-1 denote the left neighbour without a separate lower-bound variable; index < end excludes the fixed suffix.
        {
            if (values[index - 1] > values[index])
            {
                std::swap(values[index - 1], values[index]);
                // Swapping adjacent inverted keys moves the maximum right; strict > is the stability decision because equal keys are left in place.
                swapped = true;
            }
        }
        // A pass without swaps means the remaining prefix is already sorted.
        if (!swapped)
        // No swap means no inversion remains in the active prefix; the next pass would repeat the same comparisons with the same result.
        {
            break;
        }
    }
}

int main()
{
    std::vector<int> values{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    bubble_sort(values);

    std::cout << "sorted:";
    for (int value : values)
    {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> empty;
    std::vector<int> single{42};
    bubble_sort(empty);
    bubble_sort(single);
    std::cout << "empty:ok single:" << single.front() << '\n';
    return 0;
}
