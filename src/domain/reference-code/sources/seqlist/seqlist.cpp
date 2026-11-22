/*
 * 中文导读：用连续数组和 length 保存线性表，随机访问 O(1)，中间插入删除要搬移元素。
 * 阅读顺序：先看 data/length/capacity；再看下标合法性检查；最后看插入时从后往前搬、删除时从前往后搬。
 * 关键不变量：有效元素在 data[0..length)，length <= capacity；下标 i 的合法范围由 length 决定。
 * 易错点：把 capacity 当 length；插入从前往后搬覆盖数据；删除漏搬最后一个；length 与搬移顺序不同步。
 * 复杂度：访问 O(1)，按位置插删 O(n)，空间 O(capacity)。
 * 输入/输出：输入容量与演示操作序列；插入/删除返回成功，查找返回下标；main 打印表内容。
*/

// AlgoViz reference implementation: sequential list (C++17).
// Fixed-capacity array with manual shifting in insert and erase.
//
// Reading guide:
// 1. Values occupy a contiguous array; length is the number of valid slots.
// 2. Insertion shifts [index, length) one slot right, then writes the new value.
// 3. Erasure shifts (index, length) one slot left and decreases length.
//
// Complexity: O(n) insert/erase, O(1) indexed access; extra space O(capacity).
// Convention: Valid element indices are 0..length-1; insertion also accepts
//   index == length; erasure returns the removed value.

#include <array>
#include <iostream>
#include <optional>

template <typename T, std::size_t Capacity> class SeqList
{
  public:
    // Insert shifts [index, length) one slot right, then writes the new value.
    // `size_` is the live element count, not capacity; insert/erase shift only the live range and then update it.
    bool insert(std::size_t index, const T &value)
    {
        // size_t cannot be negative, so only the upper bound is needed here; index == size_ is a legal append position.
        if (size_ >= Capacity || index > size_)
        {
            return false;
        }
        // Shift the live suffix right from the end; i starts at size_, the first unused slot, so each write happens before its source is read.
        for (std::size_t i = size_; i > index; --i)
        {
            items_[i] = items_[i - 1];
        }
        items_[index] = value;
        // Update size_ after items_[index] is assigned; until then the new slot is not part of the live range.
        ++size_;
        return true;
    }

    // optional<T> separates no element from a stored value such as 0; erase can return any T without a sentinel.
    std::optional<T> erase(std::size_t index)
    {
        if (index >= size_)
        {
            return std::nullopt;
        }
        T removed = items_[index];
        // Fill the hole left to right; after the last copy, slot size_-1 is outside the live range and may be overwritten later.
        for (std::size_t i = index; i + 1 < size_; ++i)
        {
            items_[i] = items_[i + 1];
        }
        // Decrement only after the gap is closed; removed still holds a copy of the erased value.
        --size_;
        return removed;
    }

    void print() const
    {
        for (std::size_t i = 0; i < size_; ++i)
        {
            std::cout << items_[i] << (i + 1 == size_ ? "" : " ");
        }
        std::cout << '\n';
    }

  private:
    std::array<T, Capacity> items_{};
    std::size_t size_ = 0;
};

int main()
{
    SeqList<int, 8> list;
    list.insert(0, 1);
    list.insert(1, 3);
    list.insert(1, 2);
    list.insert(3, 4);
    std::cout << "after inserts: ";
    list.print();

    if (auto removed = list.erase(1))
    {
        std::cout << "removed: " << *removed << '\n';
    }
    std::cout << "after erase: ";
    list.print();
    std::cout << "insert at 9: " << (list.insert(9, 5) ? "ok" : "rejected") << '\n';
    return 0;
}
