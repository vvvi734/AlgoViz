// AlgoViz reference implementation: sequential list (C++17).
// Original code written for this repository under the MIT License.
// Fixed-capacity array with manual shifting in insert and erase.

#include <array>
#include <iostream>
#include <optional>

template <typename T, std::size_t Capacity>
class SeqList {
 public:
    bool insert(std::size_t index, const T& value) {
        if (size_ >= Capacity || index > size_) {
            return false;
        }
        for (std::size_t i = size_; i > index; --i) {
            items_[i] = items_[i - 1];
        }
        items_[index] = value;
        ++size_;
        return true;
    }

    std::optional<T> erase(std::size_t index) {
        if (index >= size_) {
            return std::nullopt;
        }
        T removed = items_[index];
        for (std::size_t i = index; i + 1 < size_; ++i) {
            items_[i] = items_[i + 1];
        }
        --size_;
        return removed;
    }

    void print() const {
        for (std::size_t i = 0; i < size_; ++i) {
            std::cout << items_[i] << (i + 1 == size_ ? "" : " ");
        }
        std::cout << '\n';
    }

 private:
    std::array<T, Capacity> items_{};
    std::size_t size_ = 0;
};

int main() {
    SeqList<int, 8> list;
    list.insert(0, 1);
    list.insert(1, 3);
    list.insert(1, 2);
    list.insert(3, 4);
    std::cout << "after inserts: ";
    list.print();

    if (auto removed = list.erase(1)) {
        std::cout << "removed: " << *removed << '\n';
    }
    std::cout << "after erase: ";
    list.print();
    std::cout << "insert at 9: " << (list.insert(9, 5) ? "ok" : "rejected") << '\n';
    return 0;
}
