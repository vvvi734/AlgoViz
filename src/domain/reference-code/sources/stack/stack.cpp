/*
 * 中文导读：用 std::array 和当前栈顶下标 top 实现后进先出；所有操作只碰栈顶。
 * 阅读顺序：先看 top 的约定；再看 push 的容量检查与 ++top；然后看 pop 读取后 --top；最后看 peek 不修改状态。
 * 关键不变量：有效元素始终占据 data[0..top]，top 指向当前栈顶，top = -1 表示空栈。
 * 易错点：把 top 当成下一个空位；栈满仍写入；空栈仍读取；先移动 top 再读取；peek 修改 top。
 * 复杂度：push/pop/peek O(1)，空间 O(capacity)。
 * 输入/输出：输入 main 内置的演示操作序列；压栈/弹栈返回成功或栈顶；main 打印出栈顺序。
*/

/*
 * Array stack in C++17.
 *
 * The class keeps a fixed array and the index of the live top. top = -1 means
 * empty. Push checks capacity, increments top and writes; pop reads then
 * decrements top; peek only reads. Every operation is O(1).
 */

#include <array>
#include <cstddef>
#include <iostream>
#include <optional>

class Stack
{
public:
    static constexpr std::size_t kCapacity = 8;

    // top is the live top index; -1 means empty.

    // Purpose: Construct an empty stack with top_ = -1, matching the data-structure convention.
    /*
     * 作用：构造空栈。top_ = -1 表示还没有元素，与顶层数据结构约定一致。
     */
    Stack() : top_(-1)
    {
    }

    // Purpose: Read-only empty check; the only condition is top_ == -1.
    /*
     * 作用：只读判断栈是否为空。空栈的唯一条件是 top_ == -1。
     */
    bool empty() const
    {
        return top_ == -1;
    }

    // Purpose: Push value after checking capacity, increment top_, and write data_[top_]; return false when full.
    /*
     * 作用：压入 value。先检查容量，再 ++top_ 并写入 data_[top_]；栈满返回 false。
     */
    bool push(int value)
    {
        if (top_ >= static_cast<int>(kCapacity) - 1)
        {
            return false;
        }
        ++top_;
        data_[static_cast<std::size_t>(top_)] = value;
        return true;
    }

    // Purpose: Pop: return std::nullopt when empty; otherwise read data_[top_] and decrement top_.
    /*
     * 作用：弹出栈顶。空栈返回 std::nullopt；否则读取 data_[top_] 后 --top_。
     */
    std::optional<int> pop()
    {
        if (empty())
        {
            return std::nullopt;
        }
        const int value = data_[static_cast<std::size_t>(top_)];
        --top_;
        return value;
    }

    // Purpose: Read-only peek: return std::nullopt when empty, otherwise data_[top_], without moving top_.
    /*
     * 作用：只读栈顶。空栈返回 std::nullopt，成功时返回 data_[top_]，不移动 top_。
     */
    std::optional<int> peek() const
    {
        if (empty())
        {
            return std::nullopt;
        }
        return data_[static_cast<std::size_t>(top_)];
    }

private:
    std::array<int, kCapacity> data_{};
    int top_;
};

// Purpose: Demonstrate stack creation, push, peek, pop and empty checks, printing each step.
/*
 * 作用：演示建栈、压栈、peek、弹栈与空栈检测，并输出每一步结果。
 */
int main()
{
    Stack stack;
    for (int value = 1; value <= 3; ++value)
    {
        if (!stack.push(value))
        {
            std::cout << "push " << value << " failed: full\n";
        }
    }

    if (const auto top = stack.peek())
    {
        std::cout << "top: " << *top << '\n';
    }

    while (const auto value = stack.pop())
    {
        std::cout << "pop: " << *value << '\n';
    }

    std::cout << "empty: " << (stack.empty() ? "yes" : "no") << '\n';
    std::cout << "underflow: " << (stack.pop() ? "no" : "yes") << '\n';
    return 0;
}
