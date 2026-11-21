/*
 * 中文导读：每个桶挂一条链表，冲突的元素共享同一个桶但保留为独立结点。
 * 阅读顺序：先看 hash 函数和桶数组；再看 insert 为什么先查重；最后看 remove 如何跨过待删结点重接链表。
 * 关键不变量：同一个键最多出现一次；每个结点只属于其哈希值对应的桶。
 * 易错点：删除头结点不更新桶指针；哈希为负未取模；扩容后没有重新散列；比较键时只比哈希值。
 * 复杂度：平均 O(1)，最坏 O(n)（全部冲突）；空间 O(n+buckets)。
 * 输入/输出：输入非负整数 key 的插入/查找/删除序列；操作返回布尔或值；main 打印桶链状态。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz reference implementation: hash table with chained buckets (C++17).
// Each bucket is a singly linked list; collisions append to the same chain.
//
// Reading guide:
// 1. Map a key to bucket key % table_size.
// 2. Each bucket is a chain of nodes holding colliding keys.
// 3. Insert rejects duplicates; search scans only the target bucket's chain.
//
// Complexity: Expected time: O(1 + alpha) per operation, O(n) worst; extra space O(n
//   + table_size).
// Convention: Non-negative integer keys; table size is fixed at compile/construction
//   time.

#include <iostream>
#include <vector>

class HashTable
{
  public:
    // Search the target bucket before appending; the chain holds only colliding keys.
    // Each bucket owns a chain; inserting at the bucket head is O(1), and duplicates are rejected before allocation.
    // 作用：头插到对应桶；先查重，重复键返回 false。
    bool insert(int key)
    {
        std::size_t index = hash_index(key);
        for (int existing : buckets_[index])
        {
            if (existing == key)
            {
                return false;
            }
        }
        buckets_[index].push_back(key);
        return true;
    }

    // 作用：只读遍历目标桶，比较真实键而不是只比较哈希值。
    bool contains(int key) const
    {
        std::size_t index = hash_index(key);
        for (int existing : buckets_[index])
        {
            if (existing == key)
            {
                return true;
            }
        }
        return false;
    }

    // 作用：逐桶输出链地址散列表的内容，用于观察冲突链；只读。
    void print() const
    {
        for (std::size_t i = 0; i < buckets_.size(); ++i)
        {
            std::cout << '[' << i << ']';
            for (int key : buckets_[i])
            {
                std::cout << " -> " << key;
            }
            std::cout << '\n';
        }
    }

  private:
    // 作用：把 key 映射到 0..bucket_count-1 的桶下标；负键要先转成非负。
    std::size_t hash_index(int key) const
    {
        int index = key % static_cast<int>(buckets_.size());
        return static_cast<std::size_t>(index < 0 ? index + static_cast<int>(buckets_.size())
                                                  : index);
    }

    std::vector<std::vector<int>> buckets_ = std::vector<std::vector<int>>(7);
};

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    HashTable table;
    for (int key : {15, 22, 8, 29, 36, 50})
    {
        table.insert(key);
    }
    table.print();
    std::cout << "contains 29: " << (table.contains(29) ? "yes" : "no") << '\n';
    std::cout << "contains 7: " << (table.contains(7) ? "yes" : "no") << '\n';
    return 0;
}
