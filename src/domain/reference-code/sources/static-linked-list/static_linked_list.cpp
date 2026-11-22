/*
 * 中文导读：用数组下标代替指针，在固定数组中维护数据链表和空闲链表。
 * 阅读顺序：先看 Cell 的 data/cur 与两个头游标；再看 initialise 如何串空闲链表、insert 如何借结点；最后看插入删除只改游标。
 * 关键不变量：数据链表和空闲链表互不重叠，合起来覆盖所有数组槽；cur=kNull（-1）表示结束。
 * 易错点：游标 -1/0 混用；分配后忘记更新空闲头；删除结点没回收；数组满仍分配；把下标当真实地址。
 * 复杂度：按位置插删需先 O(n) 找前驱；已知前驱时改游标 O(1)，空间 O(capacity)。
 * 输入/输出：输入固定容量 8 的初始值序列与演示操作；插入/删除返回成功，遍历返回逻辑顺序；main 打印 data/cur。
*/

// Static linked list — independent C++ teaching implementation.
// 静态链表——独立 C++ 教学实现。
//
// The array remains the physical owner of every node. cur is an index, not an
// address; freeHead keeps the recycle chain. This version uses -1 as NULL and
// does not reserve slot 0 as a header, which keeps “index 0” and “empty”
// visibly different.
//
// Compile: c++ -std=c++17 -Wall -Wextra static_linked_list.cpp -o static_list
#include <iostream>
#include <optional>
#include <vector>

class StaticList
{
  public:
    static constexpr int kCapacity = 8;
    static constexpr int kNull = -1;

    // Build a static list from the given values, linking the data list and chaining leftover slots into the free list.
    // 用给定值构造静态链表：建立数据链表并把剩余槽串成空闲链表。
    explicit StaticList(const std::vector<int> &values)
    {
        initialise(values);
    }

    // Insert value before position by taking a node from the free list and rewiring cursors; return false on failure.
    // 在 position 前插入 value：先从空闲链表取结点，再重接游标；失败返回 false。
    // Keep the successor first, then redirect the predecessor; reversing loses the tail.
    bool insert(int position, int value)
    {
        const int length = size();
        if (position < 1 || position > length + 1)
            return false; // precondition
        if (freeHead_ == kNull)
            return false; // array is full

        // `fresh` keeps the cell that is about to leave the free chain. It must be saved before `freeHead_` moves, because after that move the old head index is no longer stored anywhere.
        const int fresh = freeHead_;
        // The free chain uses the same cur field as the live chain. Advancing freeHead_ to the borrowed cell's successor is the actual removal from the free list.
        freeHead_ = cells_[fresh].cur; // borrow the cell

        cells_[fresh].data = value;
        cells_[fresh].cur = kNull;

        const int previous = predecessor(position);
        const int successor = previous == kNull ? head_ : cells_[previous].cur;

        // The new node keeps the successor before the predecessor is changed.
        // Link the fresh cell to its successor before changing `head_` or the predecessor's cur. The reverse order would overwrite the only pointer to the remaining tail.
        cells_[fresh].cur = successor;
        if (previous == kNull)
            // A null predecessor means insertion at the front, so only this branch rewrites `head_`; a middle or tail insert rewrites exactly one predecessor's cur.
            head_ = fresh;
        else
            cells_[previous].cur = fresh;
        return true;
    }

    // Delete the node at position, recycle it into the free list, and return the removed value.
    // 删除 position 位置结点，把结点归还空闲链表，并返回被删值。
    std::optional<int> remove(int position)
    {
        if (position < 1 || position > size())
            return std::nullopt;
        const int previous = predecessor(position);
        const int target = previous == kNull ? head_ : cells_[previous].cur;
        const int successor = cells_[target].cur;
        const int removed = cells_[target].data;

        // Unlink, then recycle to the front of the free chain.
        if (previous == kNull)
            head_ = successor;
        else
            cells_[previous].cur = successor;
        cells_[target].data = 0;
        // Recycle only after the live chain is unlinked. Pushing target to the front of the free chain reuses the cell without disturbing any live sibling.
        cells_[target].cur = freeHead_;
        freeHead_ = target;
        return removed;
    }

    // Traverse and print the current structure without modifying data, so each step can be checked.
    // 只读遍历并输出当前结构；不会修改数据，适合在每一步后核对状态。
    void print() const
    {
        std::cout << "physical rows:\n";
        for (int i = 0; i < kCapacity; ++i)
        {
            std::cout << "  [" << i << "] data=" << cells_[i].data << " cur=" << cells_[i].cur
                      << '\n';
        }
        std::cout << "logical:";
        for (int current = head_; current != kNull; current = cells_[current].cur)
        {
            std::cout << " [" << current << "]=" << cells_[current].data;
        }
        std::cout << " -> NULL\n";
    }

  private:
    struct Cell
    {
        int data = 0;
        // cur is an array index, and kNull=-1 is deliberately outside 0..kCapacity-1. That makes a real first cell (index 0) different from the end marker.
        int cur = kNull;
    };

    // Rebuild the static list from the given values and reset both the data-list head and the free-list head.
    // 按给定值重建静态链表，并重置数据链表头与空闲链表头。
    void initialise(const std::vector<int> &values)
    {
        int count = static_cast<int>(values.size());
        if (count > kCapacity)
            count = kCapacity;
        // The live prefix occupies cells 0..count-1. Linking it in array order is correct only for this initial state; later inserts may make logical order differ from physical order.
        for (int i = 0; i < count; ++i)
        {
            cells_[i].data = values[i];
            cells_[i].cur = i + 1 < count ? i + 1 : kNull;
        }
        head_ = count > 0 ? 0 : kNull;
        for (int i = count; i < kCapacity; ++i)
        {
            cells_[i].cur = i + 1 < kCapacity ? i + 1 : kNull;
        }
        // The free suffix starts immediately after the live prefix. If the array is full, a null head makes the next insert fail before any cell is touched.
        freeHead_ = count < kCapacity ? count : kNull;
    }

    // Count live nodes by walking cur from head; this class keeps no length field.
    // 从 head 沿 cur 计数；本类没有维护 length 字段。
    int size() const
    {
        // There is no `length_` field: this O(n) walk from `head_` is the authoritative size and always agrees with the actual cur chain after inserts and deletes.
        int count = 0;
        for (int current = head_; current != kNull; current = cells_[current].cur)
            ++count;
        return count;
    }

    // Return the array index of 1-based position's predecessor; position 1 returns the head sentinel.
    // 返回 1 基位置 position 的前驱数组下标；position=1 返回头哨兵。
    int predecessor(int position) const
    {
        if (position == 1)
            return kNull; // 1-based logical positions
        int previous = head_;
        for (int step = 1; step < position - 1; ++step)
        {
            previous = cells_[previous].cur;
        }
        return previous;
    }

    Cell cells_[kCapacity];
    int head_ = kNull;
    int freeHead_ = kNull;
};

int main()
{
    StaticList list({10, 20, 30});
    list.print();
    list.insert(2, 25);
    list.remove(3);
    std::cout << "after insert/delete:\n";
    list.print();
    return 0;
}
