// AlgoViz reference implementation: factorial (C++17).
// Original code written for this repository under the MIT License.
// Recursive definition: n! = n * (n - 1)!, with 0! = 1.

#include <cstdint>
#include <iostream>

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
