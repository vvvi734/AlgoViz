// AlgoViz reference implementation: hash table with chained buckets (C++17).
// Original code written for this repository under the MIT License.
// Each bucket is a singly linked list; collisions append to the same chain.

#include <iostream>
#include <vector>

class HashTable {
 public:
    bool insert(int key) {
        std::size_t index = hash_index(key);
        for (int existing : buckets_[index]) {
            if (existing == key) {
                return false;
            }
        }
        buckets_[index].push_back(key);
        return true;
    }

    bool contains(int key) const {
        std::size_t index = hash_index(key);
        for (int existing : buckets_[index]) {
            if (existing == key) {
                return true;
            }
        }
        return false;
    }

    void print() const {
        for (std::size_t i = 0; i < buckets_.size(); ++i) {
            std::cout << '[' << i << ']';
            for (int key : buckets_[i]) {
                std::cout << " -> " << key;
            }
            std::cout << '\n';
        }
    }

 private:
    std::size_t hash_index(int key) const {
        int index = key % static_cast<int>(buckets_.size());
        return static_cast<std::size_t>(index < 0 ? index + static_cast<int>(buckets_.size()) : index);
    }

    std::vector<std::vector<int>> buckets_ = std::vector<std::vector<int>>(7);
};

int main() {
    HashTable table;
    for (int key : {15, 22, 8, 29, 36, 50}) {
        table.insert(key);
    }
    table.print();
    std::cout << "contains 29: " << (table.contains(29) ? "yes" : "no") << '\n';
    std::cout << "contains 7: " << (table.contains(7) ? "yes" : "no") << '\n';
    return 0;
}
