/*
 * 中文导读：每个桶挂一条链表，冲突的元素共享同一个桶但保留为独立结点。
 * 阅读顺序：先看 hash 函数和桶数组；再看 insert 为什么先查重；最后看 remove 如何跨过待删结点重接链表。
 * 关键不变量：同一个键最多出现一次；每个结点只属于其哈希值对应的桶。
 * 易错点：删除头结点不更新桶指针；哈希为负未取模；扩容后没有重新散列；比较键时只比哈希值。
 * 复杂度：平均 O(1)，最坏 O(n)（全部冲突）；空间 O(n+buckets)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入非负整数 key 的插入/查找/删除序列；操作返回布尔或值；main 打印桶链状态。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz convenience implementation: hash table with std::unordered_map.
// unordered_map handles hashing, buckets and collision chains internally.
//
// Reading guide:
// 1. This convenience file uses std::unordered_map instead of hand-written buckets.
// 2. insert/count/find are expected O(1), with O(n) worst case under extreme
//    collisions.
// 3. The library owns hashing, bucket growth and chain layout.
//
// Complexity: Expected time: O(1) per operation, O(n) worst; extra space O(n).
// Convention: Unique integer keys; iteration order is unspecified.

#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    // `unordered_map` owns hashing and chains; iteration order is unspecified, so it is not sorted output.
    std::unordered_map<int, std::string> table;
    table[15] = "alpha";
    table[22] = "beta";
    table[8] = "gamma";
    table[29] = "delta";

    for (const auto &[key, value] : table)
    {
        std::cout << key << " -> " << value << '\n';
    }
    std::cout << "contains 29: " << (table.count(29) ? "yes" : "no") << '\n';
    std::cout << "contains 7: " << (table.count(7) ? "yes" : "no") << '\n';
    return 0;
}
