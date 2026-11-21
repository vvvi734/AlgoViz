"""AlgoViz convenience implementation: hash table with a Python dict.

dict performs hashing and collision resolution internally.

Reading guide:
1. This convenience file uses a Python dict instead of hand-written bucket chains.
2. Membership and insertion are expected O(1), with O(n) worst case.
3. The dict owns hashing and collision resolution; insertion order is preserved as an
   incidental detail.

Complexity: Expected time: O(1) per operation, O(n) worst; extra space O(n).
Convention: Unique integer keys; do not rely on ordering for hash-table semantics.
"""
# 中文导读：用字典演示链地址法的查找语义，说明哈希表平均 O(1) 的原因。
# 阅读顺序：先看键到桶的映射，再看重复键覆盖行为。
# 输入/输出：输入键序列；输出查找、删除结果。
# 不变量：同一个键在字典中只保留一个值。
# 易错点：把字典的无序迭代当成有序输出；忽略哈希冲突的极端情况。
# 复杂度：平均 O(1)，最坏 O(n)，额外空间 O(n)。

from __future__ import annotations


# Purpose: Demonstrate insertion, lookup and deletion with a dictionary.
# 作用：用字典演示插入、查找和删除。
def main() -> None:
    # A dict owns hashing and collision resolution; insertion order is incidental, not a hash-table guarantee.
    table: dict[int, str] = {15: "alpha", 22: "beta", 8: "gamma", 29: "delta"}
    for key, value in table.items():
        print(key, "->", value)
    print("contains 29:", 29 in table)
    print("contains 7:", 7 in table)


if __name__ == "__main__":
    main()
