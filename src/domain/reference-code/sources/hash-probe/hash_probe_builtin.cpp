/*
 * 中文导读：本文件用 std::unordered_map 作标准库对照，不是开放地址实现；重点比较接口、去重与边界，不展示线性探测或墓碑。
 * 阅读顺序：先看键值写入；再用 count 做成员判断；最后与手写 hash-probe 比较可观察行为与复杂度。
 * 关键不变量：键唯一；标准库自行选择冲突策略，内部桶布局与遍历顺序都不是接口承诺。
 * 易错点：把 unordered_map 当成线性探测；依赖桶遍历顺序；把 count 的 0/1 当成元素值。
 * 复杂度：平均 O(1)，最坏 O(n)；空间 O(n)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入非负整数 key 的插入/查找序列；操作返回布尔；main 打印槽的空/占用状态。
*/

// AlgoViz convenience implementation: hash table with std::unordered_map.
// unordered_map chooses its own collision strategy; no probing loop is visible.
//
// Reading guide:
// 1. This convenience file uses std::unordered_map, not an open-addressing table.
// 2. The standard library chooses its own collision strategy; probing is not
//    exposed.
// 3. Use this file to compare the interface, not to inspect linear-probe mechanics.
//
// Complexity: Expected time: O(1) per operation, O(n) worst; extra space O(n).
// Convention: Unique integer keys; the internal bucket layout is unspecified.

#include <iostream>
#include <string>
#include <unordered_map>

int main()
{
    // `unordered_map` may use any collision strategy; this file cannot show linear probing or tombstones.
    std::unordered_map<int, std::string> table;
    table[22] = "a";
    table[11] = "b";
    table[33] = "c";
    table[44] = "d";
    table[55] = "e";

    for (const auto &[key, value] : table)
    {
        std::cout << key << " -> " << value << '\n';
    }
    std::cout << "contains 44: " << (table.count(44) ? "yes" : "no") << '\n';
    std::cout << "contains 7: " << (table.count(7) ? "yes" : "no") << '\n';
    return 0;
}
