/*
 * 中文导读：用三数取中选基准划分数组，使左侧不大于基准、右侧不小于基准，再处理两侧。
 * 阅读顺序：先看 median_of_three 如何把中位数换到末尾；再看 partition 的指针移动与交换；最后看为什么先递归较小侧、较大侧改用循环。
 * 关键不变量：partition 过程中，左区已 <= pivot，右区已 >= pivot，中间是未处理区。
 * 易错点：固定末尾基准导致有序输入退化；相等元素处理不当死循环；递归区间包含基准；两侧都递归导致栈深 O(n)。
 * 复杂度：平均 O(n log n)，最坏 O(n²)；三数取中避开常见有序退化，较小侧递归使栈深稳定在 O(log n)。
 * 输入/输出：输入 main 内置的整数数组；排序函数原地升序重排，无返回值；main 打印排序结果。
*/

// AlgoViz reference implementation: quicksort (C++17).
// Median-of-three chooses the pivot; Lomuto partition places it in its final slot.
// The smaller side recurses and the larger side iterates, bounding stack depth to O(log n).
//
// Reading guide:
// 1. Order low/middle/high and move the median to high.
// 2. Partition with <= on the left and > on the right.
// 3. Recurse on the smaller side; continue the loop on the larger side.
//
// Complexity: O(n log n) average, O(n^2) worst; recursion space O(log n) by construction.
// Convention: Ranges are inclusive [low, high]; 0-based indices; the partition
//   scheme is not stable.

#include <iostream>
#include <utility>
#include <vector>

namespace
{

// Purpose: Order values[low], values[middle], values[high], then move the median to high for Lomuto.
// 作用：先让 low/middle/high 三个位置有序，再把中位数换到 high，供 Lomuto 划分使用。
int median_of_three(std::vector<int> &values, int low, int high)
{
    int middle = low + (high - low) / 2;
    // The midpoint offset avoids low+high overflow; for a two-element range it equals low.
    if (values[static_cast<std::size_t>(middle)] < values[static_cast<std::size_t>(low)])
    {
        std::swap(values[static_cast<std::size_t>(middle)],
                  values[static_cast<std::size_t>(low)]);
    }
    if (values[static_cast<std::size_t>(high)] < values[static_cast<std::size_t>(low)])
    // After this swap low holds the smallest of the three, so the median cannot be low.
    {
        std::swap(values[static_cast<std::size_t>(high)],
                  values[static_cast<std::size_t>(low)]);
    }
    if (values[static_cast<std::size_t>(high)] < values[static_cast<std::size_t>(middle)])
    // The remaining comparison orders middle and high; the median is now at middle.
    {
        std::swap(values[static_cast<std::size_t>(high)],
                  values[static_cast<std::size_t>(middle)]);
    }
    std::swap(values[static_cast<std::size_t>(middle)],
              values[static_cast<std::size_t>(high)]);
    // Lomuto reads values[high] as the pivot, so the median is moved there after the three-way ordering.
    return values[static_cast<std::size_t>(high)];
    // The median now sits at high, which is the value Lomuto will use as the pivot.
}

// Lomuto partition: `boundary` marks the end of the <= pivot region and starts at low - 1; the pivot is swapped to `boundary + 1`.
// Purpose: Partition around the median moved to the end and return its final index.
// 作用：以三数取中后放在末尾的基准划分，返回基准最终下标。
int partition(std::vector<int> &values, int low, int high)
{
    int pivot = median_of_three(values, low, high);
    // Median-of-three makes sorted and reverse-sorted inputs choose a middle value instead of an extreme, avoiding their common O(n^2) path.
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

// Purpose: Partition, recurse on the smaller side, and iterate on the larger side.
// 作用：划分后先递归较小侧、再循环处理较大侧，避免不平衡划分把递归栈推到 O(n)。
void quick_sort_range(std::vector<int> &values, int low, int high)
{
    while (low < high)
    // The loop replaces the larger recursive branch; only the smaller branch consumes stack, bounding depth by O(log n).
    {
        int middle = partition(values, low, high);
        if (middle - low < high - middle)
        // The left side is smaller: recurse there and continue the loop with the right side.
        {
            quick_sort_range(values, low, middle - 1);
            low = middle + 1;
        }
        else
        // The right side is no larger: recurse there and continue with the left side.
        {
            quick_sort_range(values, middle + 1, high);
            high = middle - 1;
        }
    }
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
