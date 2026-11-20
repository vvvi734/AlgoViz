// AlgoViz reference implementation: singly linked list (C++17).
//
// Reading guide:
// 1. A node stores one value and one next pointer; the list owns a head pointer and
//    a length.
// 2. Head insertion links the new node before the old head, then updates head and
//    length.
// 3. Insertion/removal after a known node rewires next pointers; search first finds
//    that predecessor.
// 4. Traversal follows next until NULL; clear frees every node and resets the list.
//
// Complexity: O(1) head insertion, O(n) search/delete; extra space O(n).
// Convention: NULL terminates the list; node positions are 0-based when printed.

#include <cstddef>
#include <iostream>

struct Node {
    int value;
    Node* next;

    explicit Node(int value_) : value(value_), next(nullptr) {}
};

class SinglyLinkedList {
public:
    SinglyLinkedList() : head_(nullptr), tail_(nullptr), length_(0) {}

    // Raw-pointer ownership: copying would duplicate ownership and double free.
    SinglyLinkedList(const SinglyLinkedList&) = delete;
    SinglyLinkedList& operator=(const SinglyLinkedList&) = delete;

    ~SinglyLinkedList() {
        clear();
    }

    Node* head() const { return head_; }

    void insert_head(int value) {
        Node* node = new Node(value);
        node->next = head_;
        head_ = node;
        if (tail_ == nullptr) {
            tail_ = node;
        }
        ++length_;
    }

    Node* find_prev(const Node* target) const {
        if (head_ == nullptr || target == nullptr || target == head_) {
            return nullptr;
        }
        Node* prev = head_;
        while (prev->next != nullptr && prev->next != target) {
            prev = prev->next;
        }
        return prev->next == target ? prev : nullptr;
    }

    bool insert_after(Node* prev, int value) {
        if (prev == nullptr) {
            return false;
        }
        Node* node = new Node(value);
        node->next = prev->next;
        prev->next = node;
        if (prev == tail_) {
            tail_ = node;
        }
        ++length_;
        return true;
    }

    bool remove_value(int value) {
        Node* prev = nullptr;
        Node* current = head_;
        while (current != nullptr && current->value != value) {
            prev = current;
            current = current->next;
        }
        if (current == nullptr) {
            return false;
        }
        if (prev == nullptr) {
            head_ = current->next;
        } else {
            prev->next = current->next;
        }
        if (current == tail_) {
            tail_ = prev;
        }
        delete current;
        --length_;
        return true;
    }

    void print() const {
        std::cout << "list:";
        for (const Node* current = head_; current != nullptr; current = current->next) {
            std::cout << ' ' << current->value;
        }
        std::cout << '\n';
    }

    std::size_t length() const { return length_; }

    void clear() {
        Node* current = head_;
        while (current != nullptr) {
            Node* next = current->next;
            delete current;
            current = next;
        }
        head_ = nullptr;
        tail_ = nullptr;
        length_ = 0;
    }

private:
    Node* head_;
    Node* tail_;
    std::size_t length_;
};

int main() {
    SinglyLinkedList list;
    list.insert_head(5);
    list.insert_head(8);
    list.insert_head(3);

    // Insert 6 between the head (3) and the second node (8).
    Node* prev = list.head();
    list.insert_after(prev, 6);

    list.remove_value(8);
    list.print();
    std::cout << "length=" << list.length() << '\n';
    list.clear();
    return 0;
}
