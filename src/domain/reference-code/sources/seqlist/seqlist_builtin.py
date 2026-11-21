"""AlgoViz convenience implementation: sequential list with a Python list.

list.insert and list.pop shift elements internally.

Reading guide:
1. This convenience file uses a Python list as a dynamic sequential list.
2. Indexing and append are fast; insert/pop in the middle shift the tail.
3. The adapter does not maintain a separate capacity field.

Complexity: O(1) indexed access, O(n) middle insert/erase, O(1) amortized append;
  extra space O(n).
Convention: Positions are 0-based; insert accepts 0..len, pop requires a valid index.
"""
# 中文导读：用 Python list 演示顺序表的按下标访问、插入和删除。
# 阅读顺序：先看索引访问，再看 insert/remove 的搬移成本。
# 输入/输出：输入整数序列；输出操作后的列表。
# 不变量：顺序表元素在内存中连续，下标访问 O(1)。
# 易错点：忽略中间插入/删除的 O(n) 搬移；越界访问。
# 复杂度：访问 O(1)，插入/删除 O(n)，空间 O(n)。

from __future__ import annotations


# Purpose: Demonstrate basic sequential-list operations with a list.
# 作用：用 list 演示顺序表的基本操作。
def main() -> None:
    # `list.insert/pop` shift the tail; this adapter has no separate capacity field.
    values = [1, 3]
    values.insert(1, 2)
    values.append(4)
    print("after inserts:", values)

    values.pop(1)
    print("after erase:", values)


if __name__ == "__main__":
    main()
