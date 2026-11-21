/*
 * 中文导读：用连续数组和 length 保存线性表，随机访问 O(1)，中间插入删除要搬移元素。
 * 阅读顺序：先看 data/length/capacity；再看下标合法性检查；最后看插入时从后往前搬、删除时从前往后搬。
 * 关键不变量：有效元素在 data[0..length)，length <= capacity；下标 i 的合法范围由 length 决定。
 * 易错点：把 capacity 当 length；插入从前往后搬覆盖数据；删除漏搬最后一个；length 与搬移顺序不同步。
 * 复杂度：访问 O(1)，按位置插删 O(n)，空间 O(capacity)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 */

// AlgoViz convenience implementation: sequential list with std::vector.
// vector::insert and vector::erase perform the same shifting internally.
//
// Reading guide:
// 1. This convenience file uses std::vector as a dynamic sequential list.
// 2. push_back is amortized O(1); insert/erase in the middle shift later elements.
// 3. Indexing is O(1), matching the contiguous-storage model.
//
// Complexity: O(1) indexed access, O(n) middle insert/erase, O(1) amortized
//   append; extra space O(n).
// Convention: Positions are 0-based; insert takes an iterator position and erase
//   invalidates later iterators.

#include <iostream>
#include <vector>

// 作用：只读输出顺序表当前有效元素。
template <typename T> void print(const std::vector<T> &values)
{
    for (std::size_t i = 0; i < values.size(); ++i)
    {
        std::cout << values[i] << (i + 1 == values.size() ? "" : " ");
    }
    std::cout << '\n';
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    // `std::vector::insert/erase` shift later elements and may invalidate iterators after the edit.
    std::vector<int> values{1, 3};
    values.insert(values.begin() + 1, 2);
    values.insert(values.end(), 4);
    std::cout << "after inserts: ";
    print(values);

    values.erase(values.begin() + 1);
    std::cout << "after erase: ";
    print(values);
    return 0;
}
