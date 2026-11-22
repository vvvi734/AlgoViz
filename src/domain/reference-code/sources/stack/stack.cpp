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

    Stack() : top_(-1)
    {
    }

    bool empty() const
    {
        return top_ == -1;
    }

    // The capacity check is on the live top, not on data_.size(); data_ is fixed and always has kCapacity slots.
    bool push(int value)
    {
        // The signed cast is required because top_ uses -1; comparing directly with size_t would convert -1 to a huge value.
        if (top_ >= static_cast<int>(kCapacity) - 1)
        {
            return false;
        }
        // Increment first so data_[top_] is the new element; the old top remains readable until the assignment.
        ++top_;
        data_[static_cast<std::size_t>(top_)] = value;
        return true;
    }

    std::optional<int> pop()
    {
        if (empty())
        {
            return std::nullopt;
        }
        // top_ is non-negative here, so the cast is safe; the copy is taken before --top_ destroys the logical top.
        const int value = data_[static_cast<std::size_t>(top_)];
        // Decrementing top_ is the pop; no element needs to be erased from std::array.
        --top_;
        return value;
    }

    // optional distinguishes empty from a stored 0; the caller can test has_value without a sentinel.
    std::optional<int> peek() const
    {
        if (empty())
        {
            return std::nullopt;
        }
        return data_[static_cast<std::size_t>(top_)];
    }

private:
    // The array size is compile-time state; top_ is the only runtime field that says how much is live.
    std::array<int, kCapacity> data_{};
    int top_;
};

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
