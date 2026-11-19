// AlgoViz reference implementation: linear probing hash table (C++17).
// Original code written for this repository under the MIT License.
// -1 marks an empty slot; insert and search probe forward with wraparound.

#include <iostream>
#include <vector>

class HashTable {
 public:
    explicit HashTable(std::size_t size) : slots_(size, kEmpty) {}

    bool insert(int key) {
        std::size_t start = hash_index(key);
        for (std::size_t step = 0; step < slots_.size(); ++step) {
            std::size_t index = (start + step) % slots_.size();
            if (slots_[index] == kEmpty) {
                slots_[index] = key;
                return true;
            }
            if (slots_[index] == key) {
                return false;
            }
        }
        return false;
    }

    bool contains(int key) const {
        std::size_t start = hash_index(key);
        for (std::size_t step = 0; step < slots_.size(); ++step) {
            std::size_t index = (start + step) % slots_.size();
            if (slots_[index] == kEmpty) {
                return false;
            }
            if (slots_[index] == key) {
                return true;
            }
        }
        return false;
    }

    void print() const {
        for (std::size_t i = 0; i < slots_.size(); ++i) {
            std::cout << '[' << i << "] ";
            if (slots_[i] == kEmpty) {
                std::cout << "_\n";
            } else {
                std::cout << slots_[i] << '\n';
            }
        }
    }

 private:
    static constexpr int kEmpty = -1;

    std::size_t hash_index(int key) const {
        int index = key % static_cast<int>(slots_.size());
        return static_cast<std::size_t>(index < 0 ? index + static_cast<int>(slots_.size()) : index);
    }

    std::vector<int> slots_;
};

int main() {
    HashTable table(11);
    for (int key : {22, 11, 33, 44, 55}) {
        table.insert(key);
    }
    table.print();
    std::cout << "contains 44: " << (table.contains(44) ? "yes" : "no") << '\n';
    std::cout << "contains 7: " << (table.contains(7) ? "yes" : "no") << '\n';
    return 0;
}
