// Univariate polynomial addition — independent C++ teaching implementation.
// 一元多项式相加——独立 C++ 教学实现。
//
// A and B are exponent-descending singly linked lists. The merge uses two
// cursors, creates a new result chain, and drops any term whose coefficient sum
// is zero. Inputs are left untouched.
//
// 两条链按指数降序；双指针合并，新建结果链；系数和为 0 的项不保留；输入保持不变。
//
// Compile: c++ -std=c++17 -Wall -Wextra polynomial_add.cpp -o polynomial_add
#include <iostream>
#include <memory>
#include <utility>
#include <vector>

struct Term {
    int coefficient;
    int exponent;
};

// A zero coefficient sum must create no node: 0x^k is not a sparse term.

class Polynomial {
public:
    struct Node {
        Term term;
        std::unique_ptr<Node> next;
    };

    void append(const Term& term) {
        auto node = std::make_unique<Node>(Node{term, nullptr});
        Node* raw = node.get();
        if (!head_) head_ = std::move(node);
        else tail_->next = std::move(node);
        tail_ = raw;
    }

    const Node* head() const { return head_.get(); }

    static Polynomial add(const Polynomial& a, const Polynomial& b) {
        Polynomial result;
        const Node* left = a.head();
        const Node* right = b.head();

        while (left != nullptr || right != nullptr) {
            if (left != nullptr && right != nullptr) {
                if (left->term.exponent == right->term.exponent) {
                    const int sum = left->term.coefficient + right->term.coefficient;
                    if (sum != 0) {                 // cancellation creates no node
                        result.append({sum, left->term.exponent});
                    }
                    left = left->next.get();        // both advance
                    right = right->next.get();
                } else if (left->term.exponent > right->term.exponent) {
                    result.append(left->term);
                    left = left->next.get();        // only A advances
                } else {
                    result.append(right->term);
                    right = right->next.get();      // only B advances
                }
            } else if (left != nullptr) {
                result.append(left->term);          // append the remaining A tail
                left = left->next.get();
            } else {
                result.append(right->term);         // append the remaining B tail
                right = right->next.get();
            }
        }
        return result;
    }

    void print(const std::string& label) const {
        std::cout << label << " = ";
        if (!head_) {
            std::cout << "0\n";
            return;
        }
        const Node* node = head_.get();
        bool first = true;
        while (node != nullptr) {
            const int coef = node->term.coefficient;
            const int magnitude = coef < 0 ? -coef : coef;
            if (first) {
                if (coef < 0) std::cout << '-';
            } else {
                std::cout << (coef < 0 ? " - " : " + ");
            }
            if (node->term.exponent == 0) {
                std::cout << magnitude;
            } else if (node->term.exponent == 1) {
                if (magnitude != 1) std::cout << magnitude;
                std::cout << 'x';
            } else {
                if (magnitude != 1) std::cout << magnitude;
                std::cout << "x^" << node->term.exponent;
            }
            first = false;
            node = node->next.get();
        }
        std::cout << '\n';
    }

private:
    std::unique_ptr<Node> head_;
    Node* tail_ = nullptr;
};

int main() {
    Polynomial a;
    Polynomial b;
    // A = 3x^4 + 2x^2 - 5, B = -3x^4 + 4x^3 + 7.
    a.append({3, 4});
    a.append({2, 2});
    a.append({-5, 0});
    b.append({-3, 4});
    b.append({4, 3});
    b.append({7, 0});

    Polynomial result = Polynomial::add(a, b);
    a.print("A");
    b.print("B");
    result.print("A+B");   // 4x^3 + 2x^2 + 2
    return 0;
}
