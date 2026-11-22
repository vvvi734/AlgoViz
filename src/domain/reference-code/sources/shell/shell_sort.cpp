/*
 * 中文导读：按逐渐缩小的间隔做插入排序，让元素先大步接近目标位置，最后 gap=1 收尾。
 * 阅读顺序：先看 gap 序列；再看每个 gap 下对 g, g+gap, ... 做插入排序；最后看 gap 如何缩小到 1。
 * 关键不变量：gap 为 g 时，所有相隔 g 的元素组成的子序列已经有序；最后 g=1 时整个数组有序。
 * 易错点：gap 缩小方式导致死循环；内层下标越界；把希尔排序当成稳定排序；gap 序列与循环边界不匹配。
 * 复杂度：取决于 gap 序列；常见约 O(n^1.3)~O(n²)，原地 O(1)，不稳定。
 * 输入/输出：输入 main 内置的整数数组；排序函数原地升序重排，无返回值；main 打印排序结果。
*/

// AlgoViz reference implementation: Shell sort (C++17).
// Gap insertion sort, halving the gap until the final gap-1 pass.
//
// Reading guide:
// 1. Choose a decreasing gap sequence; each pass insertion-sorts the subsequences
//    with that gap.
// 2. Elements far apart move early, reducing the work left for smaller gaps.
// 3. The final gap of 1 is ordinary insertion sort over the whole array.
//
// Complexity: Time depends on the gap sequence; O(n^2) worst case, often
//   subquadratic; extra space O(1).
// Convention: Ascending order; gaps are positive; the implementation uses n/2, n/4,
//   ... , 1.

#include <cstddef>
#include <iostream>
#include <vector>

// Each gap pass insertion-sorts independent subsequences; gap 1 finishes the array.
// Each gap pass insertion-sorts independent subsequences; gap 1 is the final ordinary insertion sort.
// Purpose: Insertion-sort gap-separated groups while shrinking the gap; the gap-1 pass leaves the whole array sorted.
// 作用：按缩小 gap 做分组插入排序；最后 gap=1 时整个数组有序。
void shell_sort(std::vector<int> &values)
{
    for (std::size_t gap = values.size() / 2; gap > 0; gap /= 2)
    {
        for (std::size_t index = gap; index < values.size(); ++index)
        {
            int current = values[index];
            std::size_t position = index;
            while (position >= gap && values[position - gap] > current)
            {
                values[position] = values[position - gap];
                position -= gap;
            }
            values[position] = current;
        }
    }
}

int main()
{
    std::vector<int> values{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    shell_sort(values);

    std::cout << "sorted:";
    for (int value : values)
    {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> empty;
    std::vector<int> single{42};
    shell_sort(empty);
    shell_sort(single);
    std::cout << "empty:ok single:" << single.front() << '\n';
    return 0;
}
