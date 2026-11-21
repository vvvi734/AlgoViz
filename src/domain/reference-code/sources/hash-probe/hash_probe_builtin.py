"""AlgoViz convenience implementation: hash table with a Python dict.

dict chooses its own collision strategy; no probing loop is visible.

Reading guide:
1. This convenience file uses a Python dict, not a hand-written linear-probe table.
2. The dict owns hashing and collision resolution; probe sequences are not exposed.
3. Use this file to compare the interface, not to inspect slot-by-slot probing.

Complexity: Expected time: O(1) per operation, O(n) worst; extra space O(n).
Convention: Unique integer keys; the internal table layout is unspecified.
"""
# 中文导读：用字典演示开放地址法要解决的查找/删除语义。
# 阅读顺序：先看键值写入，再看删除后的成员判断。
# 输入/输出：输入键序列；输出查找与删除结果。
# 不变量：字典内部自行处理冲突，调用方只看到键值映射。
# 易错点：把字典实现当成线性探测；删除不存在的键。
# 复杂度：平均 O(1)，最坏 O(n)，额外空间 O(n)。

from __future__ import annotations


# 作用：用字典演示插入、查找和删除。
def main() -> None:
    # A dict may use any collision strategy; probe sequences and tombstones are not exposed.
    table: dict[int, str] = {22: "a", 11: "b", 33: "c", 44: "d", 55: "e"}
    for key, value in table.items():
        print(key, "->", value)
    print("contains 44:", 44 in table)
    print("contains 7:", 7 in table)


if __name__ == "__main__":
    main()
