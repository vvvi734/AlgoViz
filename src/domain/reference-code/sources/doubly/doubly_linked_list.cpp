// AlgoViz reference implementation: doubly linked list (C++17).
// Original code written for this repository under the MIT License.
// Nodes own their successors through unique_ptr and keep raw prev pointers.

#include <iostream>
#include <memory>

class DoublyList {
 public:
    struct Node {
        int value = 0;
        Node* prev = nullptr;
        std::unique_ptr<Node> next;
    };

    ~DoublyList() {
        while (head_) {
            head_ = std::move(head_->next);
        }
    }

    Node* append(int value) {
        auto node = std::make_unique<Node>();
        node->value = value;
        node->prev = tail_;
        Node* raw = node.get();
        if (tail_) {
            tail_->next = std::move(node);
        } else {
            head_ = std::move(node);
        }
        tail_ = raw;
        return raw;
    }

    void remove(Node* node) {
        std::unique_ptr<Node> next = std::move(node->next);
        if (next) {
            next->prev = node->prev;
        }
        if (node->prev) {
            node->prev->next = std::move(next);
        } else {
            head_ = std::move(next);
        }
        if (tail_ == node) {
            tail_ = node->prev;
        }
    }

    void print_forward() const {
        for (Node* node = head_.get(); node; node = node->next.get()) {
            std::cout << node->value << (node->next ? " " : "");
        }
        std::cout << '\n';
    }

    void print_backward() const {
        for (Node* node = tail_; node; node = node->prev) {
            std::cout << node->value << (node->prev ? " " : "");
        }
        std::cout << '\n';
    }

    std::unique_ptr<Node> head_;
    Node* tail_ = nullptr;
};

int main() {
    DoublyList list;
    auto* one = list.append(1);
    auto* two = list.append(2);
    list.append(3);

    std::cout << "forward: ";
    list.print_forward();
    std::cout << "backward: ";
    list.print_backward();

    list.remove(two);
    std::cout << "after remove 2: ";
    list.print_forward();
    std::cout << "head: " << one->value << '\n';
    return 0;
}
