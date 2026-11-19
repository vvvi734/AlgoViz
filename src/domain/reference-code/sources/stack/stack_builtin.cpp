// AlgoViz convenience implementation: stack with std::stack (C++17).
// Original code written for this repository under the MIT License.
// std::stack is an adapter; its default container is std::deque.

#include <iostream>
#include <stack>

int main() {
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
