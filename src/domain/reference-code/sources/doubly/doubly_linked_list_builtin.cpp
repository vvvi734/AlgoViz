/*
 * 中文导读：每个结点同时保存 prev 和 next，使已知结点两侧的插入/删除都为 O(1)。
 * 阅读顺序：先看 Node 的两个指针和 head/tail；再看插入时四条链接的赋值顺序；最后看删除时两侧如何互相接回。
 * 关键不变量：对任意相邻结点 a、b，必须同时有 a.next == b 与 b.prev == a。
 * 易错点：只改 next 不改 prev；删除尾结点不更新 tail；头尾边界空指针；释放后仍访问旧结点。
 * 复杂度：已知位置插删 O(1)，查找 O(n)，空间 O(n)（每结点多一个指针）。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入 main 内置的演示操作序列；结构函数原地改 prev/next，返回成功/元素；main 双向打印。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
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

// 作用：只读遍历并输出当前结构；不会修改数据，适合在每一步后核对状态。
template <typename T> void print(const std::list<T> &values)
{
    for (auto it = values.begin(); it != values.end(); ++it)
    {
        std::cout << *it << (std::next(it) == values.end() ? "" : " ");
    }
    std::cout << '\n';
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
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
