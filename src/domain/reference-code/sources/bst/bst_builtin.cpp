/*
 * 中文导读：利用左小右大的中序顺序，把查找、插入、删除限制在一条根到叶的路径上。
 * 阅读顺序：先看 insert() 如何比较并下探；再看 search() 的循环/递归；最后看 delete() 的三种情况，尤其两个孩子的替换。
 * 关键不变量：任意结点左子树所有键小于它，右子树所有键大于它；中序遍历得到升序。
 * 易错点：删除双子结点时只改值却忘记删除后继；重复键处理不一致；用引用/指针更新父结点时接错边。
 * 复杂度：平均 O(log n)，最坏 O(n)（退化成链）；额外空间 O(n)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入整数键与待删除键；插入/删除原地修改树，中序输出升序键，查找返回是否存在。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz convenience implementation: ordered set with std::set (C++17).
// std::set is a balanced binary search tree; iteration is ascending.
//
// Reading guide:
// 1. This convenience file uses std::set instead of writing BST node rotations or
//    links.
// 2. insert/erase/count each take logarithmic time on a balanced red-black tree.
// 3. Iterating the set yields the keys in ascending order; duplicates are discarded.
//
// Complexity: O(log n) per insert/erase/search; extra space O(n).
// Convention: Unique integer keys; ordering is ascending; no manual tree structure
//   is exposed.

#include <iostream>
#include <set>

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    // `std::set` keeps unique keys ordered; `count` is membership, not an index lookup.
    std::set<int> tree;
    for (int key : {5, 2, 7, 1, 4, 6, 8, 3})
    {
        tree.insert(key);
    }

    std::cout << "inorder:";
    for (int value : tree)
    {
        std::cout << ' ' << value;
    }
    std::cout << '\n';
    std::cout << "contains 4: " << (tree.count(4) ? "yes" : "no") << '\n';
    std::cout << "contains 9: " << (tree.count(9) ? "yes" : "no") << '\n';

    tree.erase(5);
    std::cout << "after remove 5:";
    for (int value : tree)
    {
        std::cout << ' ' << value;
    }
    std::cout << '\n';
    return 0;
}
