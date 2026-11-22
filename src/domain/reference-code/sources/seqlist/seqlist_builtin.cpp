/*
 * 中文导读：本文件用 std::vector 作标准库对照；连续存储带来 O(1) 下标访问，中间插删由库搬移元素。
 * 阅读顺序：先看 push_back；再看 insert/erase；最后核对 size 与下标范围。
 * 关键不变量：元素在连续存储中；size 是有效元素数；capacity 不等于 size。
 * 易错点：把 capacity 当 size；insert/erase 后继续使用失效迭代器；下标越界。
 * 复杂度：下标访问 O(1)，中间插删 O(n)，push_back 均摊 O(1)，空间 O(n)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入演示操作序列；main 插入、删除、按下标访问并打印表内容。
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

// Purpose: Print the current live elements of the sequential list read-only.
// 作用：只读输出顺序表当前有效元素。
template <typename T> void print(const std::vector<T> &values)
{
    for (std::size_t i = 0; i < values.size(); ++i)
    {
        std::cout << values[i] << (i + 1 == values.size() ? "" : " ");
    }
    std::cout << '\n';
}

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
