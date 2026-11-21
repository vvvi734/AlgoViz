// AlgoViz reference implementation: naive Fibonacci.
// Definition: F(0) = 0, F(1) = 1, F(n) = F(n - 1) + F(n - 2).
//
// Reading guide:
// 1. The two base cases return their own n.
// 2. Each non-base call creates two independent child calls.
// 3. No cache is used, so identical subproblems are recomputed.
//
// Complexity: O(2^n) time (about 2*F(n+1)-1 calls); O(n) call-stack space.
// Convention: Input is a non-negative integer; the result uses unsigned long long.

#include <iostream>

unsigned long long fib(unsigned int n) {
    if (n <= 1U) {
        return static_cast<unsigned long long>(n);
    }
    return fib(n - 1U) + fib(n - 2U);
}

int main() {
    for (unsigned int n = 0U; n <= 10U; n += 1U) {
        std::cout << "fib(" << n << ") = " << fib(n) << '\n';
    }
    return 0;
}
