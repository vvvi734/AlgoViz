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

class HashTable {
 public:
    explicit HashTable(std::size_t size) : slots_(size, kEmpty) {}

    // Probe forward modulo capacity; an empty slot both accepts an insert and proves absence.
    // This teaching version has no deletion, so an empty slot ends the probe; adding tombstones would require lookup to continue past them.
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
