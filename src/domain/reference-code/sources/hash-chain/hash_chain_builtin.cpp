/*
 * 中文导读：本文件用 std::unordered_map 作标准库对照；哈希、桶与冲突链都由库内部管理。
 * 阅读顺序：先看键值写入；再用 count/find 查询；最后看 erase 后遍历顺序仍然不可依赖。
 * 关键不变量：键唯一；平均 O(1)，极端冲突 O(n)；迭代顺序未指定。
 * 易错点：把 unordered_map 当手写桶链；依赖遍历顺序；忽略最坏 O(n)。
 * 复杂度：平均 O(1)，最坏 O(n)，空间 O(n)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入非负整数键；main 插入、查询、删除并打印结果；桶链布局不可见。
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
