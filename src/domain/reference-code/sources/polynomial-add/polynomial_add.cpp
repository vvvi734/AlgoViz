/*
 * 中文导读：用按指数递减的单链表保存非零项，合并同类项并释放不再需要的结点。
 * 阅读顺序：先看 Term 的 coef/exp/next；再看两个链表按指数比较的三路分支；最后看相等指数相加为 0 时如何删除结点。
 * 关键不变量：每条链表内部指数严格递减且无零系数项；结果链表同样保持这个不变量。
 * 易错点：同指数相加为 0 仍保留结点；指针提前移动丢失后继；结果链表尾插未更新尾指针；释放了仍在使用的结点。
 * 复杂度：O(m+n) 时间，O(1) 额外空间（复用原结点时）。
 * 输入/输出：输入两个按指数降序排列的稀疏多项式链；返回新链，输入不变；main 打印和式。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

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

struct Term
{
    int coefficient;
    int exponent;
};

// A zero coefficient sum must create no node: 0x^k is not a sparse term.

class Polynomial
{
  public:
    struct Node
    {
        Term term;
        std::unique_ptr<Node> next;
    };

    // 作用：在多项式尾部追加一项；维护尾指针，保证按指数顺序链接。
    void append(const Term &term)
    {
        auto node = std::make_unique<Node>(Node{term, nullptr});
        Node *raw = node.get();
        if (!head_)
            head_ = std::move(node);
        else
            tail_->next = std::move(node);
        tail_ = raw;
    }

    // 作用：返回多项式头指针供只读访问。
    const Node *head() const
    {
        return head_.get();
    }

    // 作用：按指数从高到低合并两条多项式；相等指数相加，零系数项丢弃。
    static Polynomial add(const Polynomial &a, const Polynomial &b)
    {
        Polynomial result;
        const Node *left = a.head();
        const Node *right = b.head();

        while (left != nullptr || right != nullptr)
        {
            if (left != nullptr && right != nullptr)
            {
                if (left->term.exponent == right->term.exponent)
                {
                    const int sum = left->term.coefficient + right->term.coefficient;
                    if (sum != 0)
                    { // cancellation creates no node
                        result.append({sum, left->term.exponent});
                    }
                    left = left->next.get(); // both advance
                    right = right->next.get();
                }
                else if (left->term.exponent > right->term.exponent)
                {
                    result.append(left->term);
                    left = left->next.get(); // only A advances
                }
                else
                {
                    result.append(right->term);
                    right = right->next.get(); // only B advances
                }
            }
            else if (left != nullptr)
            {
                result.append(left->term); // append the remaining A tail
                left = left->next.get();
            }
            else
            {
                result.append(right->term); // append the remaining B tail
                right = right->next.get();
            }
        }
        return result;
    }

    // 作用：只读遍历并输出当前结构；不会修改数据，适合在每一步后核对状态。
    void print(const std::string &label) const
    {
        std::cout << label << " = ";
        if (!head_)
        {
            std::cout << "0\n";
            return;
        }
        const Node *node = head_.get();
        bool first = true;
        while (node != nullptr)
        {
            const int coef = node->term.coefficient;
            const int magnitude = coef < 0 ? -coef : coef;
            if (first)
            {
                if (coef < 0)
                    std::cout << '-';
            }
            else
            {
                std::cout << (coef < 0 ? " - " : " + ");
            }
            if (node->term.exponent == 0)
            {
                std::cout << magnitude;
            }
            else if (node->term.exponent == 1)
            {
                if (magnitude != 1)
                    std::cout << magnitude;
                std::cout << 'x';
            }
            else
            {
                if (magnitude != 1)
                    std::cout << magnitude;
                std::cout << "x^" << node->term.exponent;
            }
            first = false;
            node = node->next.get();
        }
        std::cout << '\n';
    }

  private:
    std::unique_ptr<Node> head_;
    Node *tail_ = nullptr;
};

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
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
    result.print("A+B"); // 4x^3 + 2x^2 + 2
    return 0;
}
