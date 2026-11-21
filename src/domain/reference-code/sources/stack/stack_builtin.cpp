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

int main() {
    // `std::stack::pop()` returns void; read `top()` first and check emptiness before either call.
    std::stack<int> stack;
    stack.push(1);
    stack.push(2);
    stack.push(3);

    std::cout << "top: " << stack.top() << '\n';
    while (!stack.empty()) {
        std::cout << "pop: " << stack.top() << '\n';
        stack.pop();
    }
    std::cout << "empty: " << (stack.empty() ? "yes" : "no") << '\n';
    return 0;
}
