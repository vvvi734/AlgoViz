/*
 * 中文导读：本文件用 std::list 作标准库对照；它是双向链表，已知迭代器位置的拼接或删除为 O(1)。
 * 阅读顺序：先看 push_back 建立序列；再看正向/反向迭代；最后看 splice/erase 如何使用迭代器定位。
 * 关键不变量：迭代器在无关拼接后仍有效；end() 是尾后位置；没有随机访问。
 * 易错点：用下标访问；删除后继续使用失效迭代器；把 std::list 与手写 prev/next 混为一谈。
 * 复杂度：已知位置拼接/删除 O(1)，查找 O(n)，空间 O(n)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入 main 内置的演示序列；main 打印正向与反向遍历结果。
*/

// AlgoViz convenience implementation: doubly linked list with std::list.
// std::list is a doubly linked list with O(1) insert/erase at a known position.
//
// Reading guide:
// 1. This convenience file uses std::list, a doubly linked list from the standard
//    library.
// 2. Splicing a known node is O(1); search and traversal are O(n).
// 3. There is no random access; iterators are the stable way to name positions.
//
// Complexity: O(1) splice at a known iterator, O(n) search; extra space O(n).
// Convention: Iterators remain valid across unrelated splices; end() is one past the
//   last node.

#include <iostream>
#include <iterator>
#include <list>

// Purpose: Traverse and print the current structure without modifying data, so each step can be checked.
// 作用：只读遍历并输出当前结构；不会修改数据，适合在每一步后核对状态。
template <typename T> void print(const std::list<T> &values)
{
    for (auto it = values.begin(); it != values.end(); ++it)
    {
        std::cout << *it << (std::next(it) == values.end() ? "" : " ");
    }
    std::cout << '\n';
}

int main()
{
    std::list<int> values;
    // `std::list` owns both directions; iterators survive splicing, but there is no random access.
    values.push_back(1);
    values.push_back(2);
    values.push_back(3);

    std::cout << "forward: ";
    print(values);
    std::cout << "backward: ";
    for (auto it = values.rbegin(); it != values.rend(); ++it)
    {
        std::cout << *it << (std::next(it) == values.rend() ? "" : " ");
    }
    std::cout << '\n';

    auto it = std::next(values.begin());
    values.erase(it);
    std::cout << "after remove 2: ";
    print(values);
    return 0;
}
