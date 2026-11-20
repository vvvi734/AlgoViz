// AlgoViz reference implementation: factorial (C++17).
// Recursive definition: n! = n * (n - 1)!, with 0! = 1.
//
// Reading guide:
// 1. Base cases: 0! = 1 and 1! = 1.
// 2. Recurrence: n! = n * (n - 1)!.
// 3. The recursion unwinds multiplying the pending factors from 1 up to n.
//
// Complexity: O(n) multiplications; extra space O(n) recursion depth.
// Convention: Input is a non-negative integer; the result uses the language's
//   integer type.

#include <cstdint>
#include <iostream>

// Base cases collapse to 1; the unwind multiplies n by the already-computed (n-1)!.
std::uint64_t factorial(unsigned int number) {
    if (number <= 1U) {
        return 1ULL;
    }
    return static_cast<std::uint64_t>(number) * factorial(number - 1U);
}

int main() {
    std::cout << "5! = " << factorial(5U) << '\n';
    std::cout << "0! = " << factorial(0U) << '\n';
    std::cout << "10! = " << factorial(10U) << '\n';
    return 0;
}
