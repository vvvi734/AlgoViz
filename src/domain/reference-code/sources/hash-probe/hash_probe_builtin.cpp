/*
 * 中文导读：冲突时在表内继续探测空位；本文件使用线性探测并处理删除墓碑。
 * 阅读顺序：先看 EMPTY/OCCUPIED/DELETED 三种槽状态；再看 insert 如何从 hash 开始找空位；最后看 search 何时可以停止。
 * 关键不变量：查找路径上若目标存在，一定在第一个 EMPTY 之前被看到；DELETED 不能被当成空位截断查找。
 * 易错点：删除直接置 EMPTY 截断后续查找；表满死循环；负载因子过高；负哈希下标。
 * 复杂度：平均 O(1)，最坏 O(n)；空间 O(capacity)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
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

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
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
