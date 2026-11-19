// AlgoViz reference implementation: circular singly linked list (C++17).
// Original code written for this repository under the MIT License.
// The tail node links back to the head, so traversal stops when it returns.

#include <iostream>
#include <new>

class CircularList {
 public:
    struct Node {
        int value = 0;
        Node* next = nullptr;
    };

    ~CircularList() {
        clear();
    }

    bool append(int value) {
        Node* node = new (std::nothrow) Node{value, nullptr};
        if (!node) {
            return false;
        }
        if (!tail_) {
            node->next = node;
            head_ = node;
        } else {
            node->next = head_;
            tail_->next = node;
        }
        tail_ = node;
        return true;
    }

    void print() const {
        if (!head_) {
            std::cout << "(empty)\n";
            return;
        }
        const Node* node = head_;
        do {
            std::cout << node->value << (node->next == head_ ? "" : " ");
            node = node->next;
        } while (node != head_);
        std::cout << '\n';
    }

    const Node* tail() const {
        return tail_;
    }

 private:
    void clear() {
        if (!head_) {
            return;
        }
        Node* node = head_;
        while (node != tail_) {
            Node* next = node->next;
            delete node;
            node = next;
        }
        delete tail_;
        head_ = nullptr;
        tail_ = nullptr;
    }

    Node* head_ = nullptr;
    Node* tail_ = nullptr;
};

int main() {
    CircularList list;
    list.append(1);
    list.append(2);
    list.append(3);
    std::cout << "circular: ";
    list.print();
    std::cout << "tail->next: " << list.tail()->next->value << '\n';
    return 0;
}
