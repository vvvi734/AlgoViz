/*
 * 中文导读：冲突时在表内继续探测空位；本文件使用线性探测，但教学版本不实现删除，因此没有墓碑状态。
 * 阅读顺序：先看 EMPTY 与“非空键值”两种槽状态；再看 insert 如何从 hash 开始找空位；最后看 search 为何遇到 EMPTY 才停止。
 * 关键不变量：查找路径上若目标存在，一定在第一个 EMPTY 之前被看到；本版本不删除，EMPTY 是唯一终止标记。
 * 易错点：删除直接置 EMPTY 截断后续查找；表满死循环；负载因子过高；负哈希下标。
 * 复杂度：平均 O(1)，最坏 O(n)；空间 O(capacity)。
 * 输入/输出：输入非负整数 key 的插入/查找序列；操作返回布尔；main 打印槽的空/占用状态。
*/

// AlgoViz reference implementation: linear probing hash table (C++17).
// -1 marks an empty slot; insert and search probe forward with wraparound.
//
// Reading guide:
// 1. Map a key to its home slot with key % table_size.
// 2. Linear probing scans forward modulo capacity until it finds the key or an empty
//    slot.
// 3. Insert uses the first empty slot; search stops at an empty slot, which proves
//    absence.
//
// Complexity: Expected time: O(1 + 1/(1-alpha)) per operation, O(n) worst; extra
//   space O(table_size).
// Convention: Fixed-capacity open addressing; this teaching version has no deletion
//   tombstones.

#include <iostream>
#include <vector>

class HashTable
{
  public:
    // Purpose: Construct an open-addressing table by allocating capacity slots and marking them all EMPTY.
    // 作用：构造开放地址散列表：分配 capacity 个槽并全部标为 EMPTY。
    // Capacity is a constructor argument, so the probe modulo uses slots_.size() rather than a global constant; every slot starts as the sentinel.
    explicit HashTable(std::size_t size) : slots_(size, kEmpty)
    {
    }

    // Probe forward modulo capacity; an empty slot both accepts an insert and proves absence.
    // This teaching version has no deletion, so an empty slot ends the probe; adding tombstones would require lookup to continue past them.
    // Purpose: Linear-probe for a free slot; return false for a duplicate key or a full table.
    // 作用：线性探测找空位写入；重复键返回 false，表满返回 false。
    bool insert(int key)
    {
        std::size_t start = hash_index(key);
        for (std::size_t step = 0; step < slots_.size(); ++step)
        {
            std::size_t index = (start + step) % slots_.size();
            // The first empty slot accepts the insert; if the table is full, the loop ends without a write and returns false.
            if (slots_[index] == kEmpty)
            {
                slots_[index] = key;
                return true;
            }
            // A duplicate can appear later in the probe sequence, so the loop must compare every occupied slot until it finds the key or an empty slot.
            if (slots_[index] == key)
            {
                return false;
            }
        }
        return false;
    }

    // Purpose: Linear-probe from the initial slot and stop at EMPTY; without deletion, EMPTY alone proves absence.
    // 作用：从初始槽位线性探测，遇到 EMPTY 停止；本版本没有删除，EMPTY 足以证明不存在。
    // Contains uses the same start index and step order as insert; if it used a different probe order, it could stop at an empty slot before reaching the key.
    bool contains(int key) const
    {
        std::size_t start = hash_index(key);
        for (std::size_t step = 0; step < slots_.size(); ++step)
        {
            std::size_t index = (start + step) % slots_.size();
            if (slots_[index] == kEmpty)
            {
                return false;
            }
            if (slots_[index] == key)
            {
                return true;
            }
        }
        return false;
    }

    // Purpose: Print each slot as empty or occupied with its key; read-only.
    // 作用：输出每个槽是空还是占用及其键值；只读。
    void print() const
    {
        for (std::size_t i = 0; i < slots_.size(); ++i)
        {
            std::cout << '[' << i << "] ";
            if (slots_[i] == kEmpty)
            {
                std::cout << "_\n";
            }
            else
            {
                std::cout << slots_[i] << '\n';
            }
        }
    }

  private:
    // kEmpty is also a legal int key, and this class does not reject -1; inserting -1 would make a real key look empty to contains(). Non-negative keys are therefore an implicit precondition.
    static constexpr int kEmpty = -1;

    // Purpose: Map key to the initial slot in 0..capacity-1.
    // 作用：把 key 映射到 0..capacity-1 的初始槽位。
    // The modulo is computed in int and only then converted to size_t; converting first would make a negative remainder impossible to correct.
    std::size_t hash_index(int key) const
    {
        int index = key % static_cast<int>(slots_.size());
        return static_cast<std::size_t>(index < 0 ? index + static_cast<int>(slots_.size())
                                                  : index);
    }

    std::vector<int> slots_;
};

int main()
{
    HashTable table(11);
    for (int key : {22, 11, 33, 44, 55})
    {
        table.insert(key);
    }
    table.print();
    std::cout << "contains 44: " << (table.contains(44) ? "yes" : "no") << '\n';
    std::cout << "contains 7: " << (table.contains(7) ? "yes" : "no") << '\n';
    return 0;
}
