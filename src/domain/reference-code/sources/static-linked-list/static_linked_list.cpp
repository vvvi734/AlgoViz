/*
 * 中文导读：用数组下标代替指针，在固定数组中维护数据链表和空闲链表。
 * 阅读顺序：先看 Node 的 data/next 与两个头游标；再看 malloc/salloc 如何从空闲链表取结点；最后看插入删除只改游标。
 * 关键不变量：数据链表和空闲链表互不重叠，合起来覆盖所有数组槽；next=-1 表示结束。
 * 易错点：游标 -1/0 混用；分配后忘记更新空闲头；删除结点没回收；数组满仍分配；把下标当真实地址。
 * 复杂度：已知位置插删 O(1)，查找 O(n)，空间 O(capacity)。
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

// Keep the successor first, then redirect the predecessor; reversing loses the tail.
class StaticList
{
  public:
    static constexpr int kCapacity = 8;
    static constexpr int kNull = -1;

    // 作用：用给定值构造静态链表：建立数据链表并把剩余槽串成空闲链表。
    explicit StaticList(const std::vector<int> &values)
    {
        initialise(values);
    }

    // 作用：在 position 前插入 value：先从空闲链表取结点，再重接游标；失败返回 false。
    bool insert(int position, int value)
    {
        const int length = size();
        if (position < 1 || position > length + 1)
            return false; // precondition
        if (freeHead_ == kNull)
            return false; // array is full

        const int fresh = freeHead_;
        freeHead_ = cells_[fresh].cur; // borrow the cell

        cells_[fresh].data = value;
        cells_[fresh].cur = kNull;

        const int previous = predecessor(position);
        const int successor = previous == kNull ? head_ : cells_[previous].cur;

        // The new node keeps the successor before the predecessor is changed.
        cells_[fresh].cur = successor;
        if (previous == kNull)
            head_ = fresh;
        else
            cells_[previous].cur = fresh;
        return true;
    }

    // 作用：删除 position 位置结点，把结点归还空闲链表，并返回被删值。
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
        cells_[target].cur = freeHead_;
        freeHead_ = target;
        return removed;
    }

    // 作用：只读遍历并输出当前结构；不会修改数据，适合在每一步后核对状态。
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
        int cur = kNull;
    };

    // 作用：按给定值重建静态链表，并重置数据链表头与空闲链表头。
    void initialise(const std::vector<int> &values)
    {
        int count = static_cast<int>(values.size());
        if (count > kCapacity)
            count = kCapacity;
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
        freeHead_ = count < kCapacity ? count : kNull;
    }

    // 作用：返回数据链表长度；直接读维护的 length 字段。
    int size() const
    {
        int count = 0;
        for (int current = head_; current != kNull; current = cells_[current].cur)
            ++count;
        return count;
    }

    // 作用：返回 position 前驱的数组下标；position=0 时返回数据链表头游标。
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

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
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
