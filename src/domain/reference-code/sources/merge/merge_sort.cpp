/*
 * 中文导读：递归把数组分成两半，再把两个有序子数组合并成一个有序数组。
 * 阅读顺序：先看递归终止条件；再看 merge 中两个指针如何取较小值；最后看临时数组什么时候拷回。
 * 关键不变量：进入 merge 时左右两半各自有序；每取一个元素后，输出前缀仍有序。
 * 易错点：临时数组下标算错；剩余元素忘记拷贝；递归边界导致死循环；合并时破坏稳定性。
 * 复杂度：O(n log n) 时间，O(n) 额外空间，稳定。
 * 输入/输出：输入 main 内置的整数数组；排序函数借助缓冲区原地归并，无返回值；main 打印排序结果。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz reference implementation: merge sort (C++17).
// std::sort / std::stable_sort are deliberately not used.
//
// Reading guide:
// 1. Split the closed range [left, right] at its midpoint into [left, middle] and [middle + 1, right].
// 2. Recursively sort both halves, then merge them into a temporary buffer.
// 3. Merge by repeatedly taking the smaller front element; copy the merged run back.
//
// Complexity: O(n log n); extra space O(n) for the merge buffer.
// Convention: Ranges are closed [left, right]; 0-based indices; taking the left
//   element on ties keeps the sort stable.

#include <iostream>
#include <vector>

// The buffer is shared across recursive calls; ties take the left run, which keeps the merge stable.
// Purpose: Merge the two sorted halves by copying the smaller head into buffer, then copy back.
// 作用：合并左右两段有序区间；每次取较小者写入 buffer，再拷回原数组。
void merge_range(std::vector<int> &values, std::vector<int> &buffer, int left, int middle,
                 int right)
{
    int i = left;
    int j = middle + 1;
    int k = left;

    while (i <= middle && j <= right)
    {
        // Take the left run on ties to preserve stability.
        if (values[static_cast<std::size_t>(i)] <= values[static_cast<std::size_t>(j)])
        {
            buffer[static_cast<std::size_t>(k++)] = values[static_cast<std::size_t>(i++)];
        }
        else
        {
            buffer[static_cast<std::size_t>(k++)] = values[static_cast<std::size_t>(j++)];
        }
    }
    while (i <= middle)
    {
        buffer[static_cast<std::size_t>(k++)] = values[static_cast<std::size_t>(i++)];
    }
    while (j <= right)
    {
        buffer[static_cast<std::size_t>(k++)] = values[static_cast<std::size_t>(j++)];
    }
    for (k = left; k <= right; ++k)
    {
        values[static_cast<std::size_t>(k)] = buffer[static_cast<std::size_t>(k)];
    }
}

// Purpose: Recursively split the range and merge the sorted halves; stop when fewer than two elements remain.
// 作用：递归拆分区间，排序两半后合并；终止条件是区间不足两个元素。
void merge_sort_range(std::vector<int> &values, std::vector<int> &buffer, int left, int right)
{
    if (left >= right)
    {
        return;
    }
    int middle = left + (right - left) / 2;
    merge_sort_range(values, buffer, left, middle);
    merge_sort_range(values, buffer, middle + 1, right);
    merge_range(values, buffer, left, middle, right);
}

// Recursive divide-and-conquer; the merge step takes the smaller front element to stay stable.
// Purpose: Merge-sort entry: allocate one buffer as long as the array, once.
// 作用：归并排序入口：分配与数组等长的 buffer，只分配一次。
void merge_sort(std::vector<int> &values)
{
    if (values.size() < 2)
    {
        return;
    }
    std::vector<int> buffer(values.size());
    merge_sort_range(values, buffer, 0, static_cast<int>(values.size()) - 1);
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    std::vector<int> values{9, 4, 7, 2, 6, 1, 3, 8, 5};
    merge_sort(values);

    std::cout << "sorted:";
    for (int value : values)
    {
        std::cout << ' ' << value;
    }
    std::cout << '\n';
    return 0;
}
