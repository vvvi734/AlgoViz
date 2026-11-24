/*
 * 中文导读：选基准划分数组，使左侧不大于基准、右侧不小于基准，再递归处理两侧。
 * 阅读顺序：先看 partition 的指针移动与交换；再看基准最终落在哪里；最后看递归区间为什么排除基准位置。
 * 关键不变量：partition 过程中，左区已 <= pivot，右区已 >= pivot，中间是未处理区。
 * 易错点：基准选择导致退化 O(n²)；相等元素处理不当死循环；递归区间包含基准；栈深度过大。
 * 复杂度：平均 O(n log n)，最坏 O(n²)，原地 O(1) 额外空间（递归栈 O(log n) 平均）。
 * 输入/输出：输入 main 内置的整数数组；排序函数原地升序重排，无返回值；main 打印排序结果。
*/

// AlgoViz reference implementation: quicksort (C++17).
// Lomuto partition: <= pivot goes left, > pivot goes right.
//
// Reading guide:
// 1. Partition the range around the last element as pivot.
// 2. Move values smaller than the pivot left and values greater than it right.
// 3. Place the pivot in its final slot and recurse on the two sides.
//
// Complexity: O(n log n) average, O(n^2) worst; extra space O(log n) average
//   recursion, O(n) worst.
// Convention: Ranges are inclusive [low, high]; 0-based indices; the partition
//   scheme is not stable.

#include <iostream>
#include <utility>
#include <vector>

namespace
{

// Lomuto partition: <= pivot goes left, > pivot goes right, pivot returns at boundary + 1.
// Lomuto partition: `boundary` marks the end of the <= pivot region and starts at low - 1; the pivot is swapped to `boundary + 1`.
// Purpose: Partition around the last element and return its final index; the left side is not greater and the right side is not smaller than the pivot.
// 作用：以区间末尾为基准划分，返回基准最终下标；左右两侧分别不大于/不小于基准。
int partition(std::vector<int> &values, int low, int high)
{
    int pivot = values[static_cast<std::size_t>(high)];
    // The pivot is copied by value before any swap, so later element moves cannot change the comparison target.
    int boundary = low - 1;
    // boundary is a signed index because low can be 0; low-1 must remain a sentinel rather than wrap to a huge size_t.
    for (int index = low; index < high; ++index)
    // The loop visits every non-pivot element exactly once; the final pivot swap happens after the scan, not inside it.
    {
        if (values[static_cast<std::size_t>(index)] <= pivot)
        // The <= decision is the partition contract; changing it to < would leave equal keys on the right and alter duplicate behavior.
        {
            ++boundary;
            // boundary advances before the swap, so it always marks the last accepted element after the exchange.
            std::swap(values[static_cast<std::size_t>(boundary)],
                      values[static_cast<std::size_t>(index)]);
        }
    }
    std::swap(values[static_cast<std::size_t>(boundary + 1)],
    // The pivot moves to boundary+1 only after all smaller-or-equal keys are on its left; that slot is final, not provisional.
              values[static_cast<std::size_t>(high)]);
    return boundary + 1;
}

// Purpose: Recursively sort the range: after partitioning, recurse on both sides without the pivot.
// 作用：递归排序区间：划分后排除基准位置，分别处理左右两段。
void quick_sort_range(std::vector<int> &values, int low, int high)
{
    if (low >= high)
    // The base case covers both empty and single-element ranges; no partition is attempted when there is nothing to split.
    {
        return;
    }
    int middle = partition(values, low, high);
    quick_sort_range(values, low, middle - 1);
    quick_sort_range(values, middle + 1, high);
    // Recursing on middle+1 and middle-1 keeps the pivot out of both subproblems, which guarantees progress.
}

} // namespace

// Purpose: Quicksort entry: start the recursive partition on the whole vector.
// 作用：快速排序入口：对整个 vector 调用递归划分。
void quick_sort(std::vector<int> &values)
{
    quick_sort_range(values, 0, static_cast<int>(values.size()) - 1);
}

int main()
{
    std::vector<int> values{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    quick_sort(values);

    std::cout << "sorted:";
    for (int value : values)
    {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> empty;
    std::vector<int> single{42};
    quick_sort(empty);
    quick_sort(single);
    std::cout << "empty:ok single:" << single.front() << '\n';
    return 0;
}
