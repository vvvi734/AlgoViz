/*
 * 中文导读：维护一个已排序前缀，把当前元素向左移动到正确位置。
 * 阅读顺序：先看外层 i 从 1 开始；再看 key 被保存后，内层为什么从 i-1 向左搬移；最后把 key 放到空出的位置。
 * 关键不变量：外层第 i 轮开始前，a[0..i) 已经有序；内层只把更大的元素右移一格。
 * 易错点：不保存 key 就被覆盖；内层边界越界；稳定性被 <=/< 写反破坏；把搬移写成交换导致更多写。
 * 复杂度：最坏/平均 O(n²)，最好 O(n)，原地 O(1)，稳定。
 * 输入/输出：输入 main 内置的整数数组；排序函数原地升序重排，无返回值；main 打印排序结果。
*/

// AlgoViz reference implementation: insertion sort (C++17).
// The sorted prefix grows one element at a time; larger elements shift right.
//
// Reading guide:
// 1. Treat [0, i) as the sorted prefix and values[i] as the key to insert.
// 2. Shift every prefix value greater than the key one slot right.
// 3. Write the key into the first free slot; this preserves the relative order of
//    equal keys.
//
// Complexity: O(n^2) worst, O(n) best for nearly sorted input; extra space
//   O(1).
// Convention: Ascending order; 0-based indices; the shift stops at the first value
//   <= key, so the sort is stable.

#include <cstddef>
#include <iostream>
#include <vector>

// Invariant: [0, i) is sorted; shift larger values right before writing the key.
// Shift only while the previous value is strictly greater; equal keys stop the shift and keep the sort stable.
// Purpose: Maintain a sorted prefix: save key, shift larger values right by one slot, then place key in the gap.
// 作用：维护已排序前缀：保存 key，把更大的元素右移一格，再把 key 放到空位。
// The vector is passed by reference and mutated in place; no auxiliary array is allocated, so extra space stays O(1).
void insertion_sort(std::vector<int> &values)
{
    // size_t has no negative value, so the prefix index starts at 1 and every earlier position is a valid already-sorted element.
    for (std::size_t index = 1; index < values.size(); ++index)
    {
        // current is the value being inserted; saving it is necessary because values[index] is overwritten by the first right shift.
        int current = values[index];
        // position is the hole index, so the loop compares values[position-1] and writes the shifted value into values[position].
        std::size_t position = index;
        // The position > 0 guard makes position-1 readable; the strict > stops on equality and preserves the relative order of equal keys.
        while (position > 0 && values[position - 1] > current)
        {
            // The hole moves one slot left while the larger value moves right; no temporary swap is needed because the hole already holds a duplicate.
            values[position] = values[position - 1];
            --position;
        }
        // The loop stops at the first position whose predecessor is <= current, so writing current into the hole restores the sorted prefix.
        values[position] = current;
    }
}

int main()
{
    std::vector<int> values{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    insertion_sort(values);

    std::cout << "sorted:";
    for (int value : values)
    {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> empty;
    std::vector<int> single{42};
    insertion_sort(empty);
    insertion_sort(single);
    std::cout << "empty:ok single:" << single.front() << '\n';
    return 0;
}
