/*
 * 中文导读：本文件用 std::set 作标准库对照；它通常是平衡二叉搜索树，但结点、旋转与链接都不在接口中暴露。
 * 阅读顺序：先看 insert 建立集合；再用 count 判断成员；最后看 erase 删除后仍按升序迭代。
 * 关键不变量：键唯一且有序；迭代按升序；不要假设能看到树高或具体平衡策略。
 * 易错点：把 count 当元素值；期待重复键；依赖红黑树内部结构；把 O(log n) 误说成最坏 O(1)。
 * 复杂度：插入/删除/查找 O(log n)，空间 O(n)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入整数键；main 插入、查询、删除并输出升序键与成员结果。
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
