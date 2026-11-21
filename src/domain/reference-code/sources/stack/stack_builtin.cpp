/*
 * 中文导读：用数组和一个栈顶下标实现后进先出；push/pop 只允许在栈顶发生。
 * 阅读顺序：先看 top 的含义（本文件 top 是下一个空位还是当前栈顶）；再看 push 的容量检查、pop 的空栈检查；最后看 peek 只读不弹。
 * 关键不变量：有效元素始终在数组的一端连续存放；top 指向的位置决定空/满与下一次读写。
 * 易错点：top 约定与 push/pop 顺序不一致；栈满仍写入；空栈仍读出；peek 修改了 top；容量与元素数混淆。
 * 复杂度：push/pop/peek O(1)，空间 O(capacity)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 */

// AlgoViz convenience implementation: stack with std::stack (C++17).
// std::stack is an adapter; its default container is std::deque.
//
// Reading guide:
// 1. This convenience file wraps std::stack, which is LIFO by contract.
// 2. push adds to the top; top reads it; pop removes it.
// 3. The adapter only demonstrates the interface, not a hand-written array stack.
//
// Complexity: O(1) per push/pop/top; extra space O(n).
// Convention: Calling top/pop on an empty stack is undefined; the demo checks size
//   first.

#include <iostream>
#include <stack>

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    // `std::stack::pop()` returns void; read `top()` first and check emptiness before either call.
    std::stack<int> stack;
    stack.push(1);
    stack.push(2);
    stack.push(3);

    std::cout << "top: " << stack.top() << '\n';
    while (!stack.empty())
    {
        std::cout << "pop: " << stack.top() << '\n';
        stack.pop();
    }
    std::cout << "empty: " << (stack.empty() ? "yes" : "no") << '\n';
    return 0;
}
