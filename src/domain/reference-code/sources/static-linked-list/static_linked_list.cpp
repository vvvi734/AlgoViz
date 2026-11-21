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
class StaticList {
public:
    static constexpr int kCapacity = 8;
    static constexpr int kNull = -1;

    explicit StaticList(const std::vector<int>& values) { initialise(values); }

    bool insert(int position, int value) {
        const int length = size();
        if (position < 1 || position > length + 1) return false;  // precondition
        if (freeHead_ == kNull) return false;                     // array is full

        const int fresh = freeHead_;
        freeHead_ = cells_[fresh].cur;                            // borrow the cell

        cells_[fresh].data = value;
        cells_[fresh].cur = kNull;

        const int previous = predecessor(position);
        const int successor = previous == kNull ? head_ : cells_[previous].cur;

        // The new node keeps the successor before the predecessor is changed.
        cells_[fresh].cur = successor;
        if (previous == kNull) head_ = fresh;
        else cells_[previous].cur = fresh;
        return true;
    }

    std::optional<int> remove(int position) {
        if (position < 1 || position > size()) return std::nullopt;
        const int previous = predecessor(position);
        const int target = previous == kNull ? head_ : cells_[previous].cur;
        const int successor = cells_[target].cur;
        const int removed = cells_[target].data;

        // Unlink, then recycle to the front of the free chain.
        if (previous == kNull) head_ = successor;
        else cells_[previous].cur = successor;
        cells_[target].data = 0;
        cells_[target].cur = freeHead_;
        freeHead_ = target;
        return removed;
    }

    void print() const {
        std::cout << "physical rows:\n";
        for (int i = 0; i < kCapacity; ++i) {
            std::cout << "  [" << i << "] data=" << cells_[i].data
                      << " cur=" << cells_[i].cur << '\n';
        }
        std::cout << "logical:";
        for (int current = head_; current != kNull; current = cells_[current].cur) {
            std::cout << " [" << current << "]=" << cells_[current].data;
        }
        std::cout << " -> NULL\n";
    }

private:
    struct Cell { int data = 0; int cur = kNull; };

    void initialise(const std::vector<int>& values) {
        int count = static_cast<int>(values.size());
        if (count > kCapacity) count = kCapacity;
        for (int i = 0; i < count; ++i) {
            cells_[i].data = values[i];
            cells_[i].cur = i + 1 < count ? i + 1 : kNull;
        }
        head_ = count > 0 ? 0 : kNull;
        for (int i = count; i < kCapacity; ++i) {
            cells_[i].cur = i + 1 < kCapacity ? i + 1 : kNull;
        }
        freeHead_ = count < kCapacity ? count : kNull;
    }

    int size() const {
        int count = 0;
        for (int current = head_; current != kNull; current = cells_[current].cur) ++count;
        return count;
    }

    int predecessor(int position) const {
        if (position == 1) return kNull;  // 1-based logical positions
        int previous = head_;
        for (int step = 1; step < position - 1; ++step) {
            previous = cells_[previous].cur;
        }
        return previous;
    }

    Cell cells_[kCapacity];
    int head_ = kNull;
    int freeHead_ = kNull;
};

int main() {
    StaticList list({10, 20, 30});
    list.print();
    list.insert(2, 25);
    list.remove(3);
    std::cout << "after insert/delete:\n";
    list.print();
    return 0;
}
