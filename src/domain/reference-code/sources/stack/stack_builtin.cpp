/*
 * 中文导读：本文件用 std::stack 作标准库对照；它是 LIFO 适配器，默认底层 deque，不暴露栈顶下标。
 * 阅读顺序：先看 push；再读 top；最后 pop。
 * 关键不变量：top 是最后压入元素；pop 返回 void；top/pop 前必须非空。
 * 易错点：把 stack 当数组；pop 返回 void 却想取值；空栈调用 top/pop。
 * 复杂度：push/pop/top O(1)，空间 O(n)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入 main 内置的压栈序列；main 读取栈顶并按 LIFO 出栈。
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
