/*
 * 中文导读：用最简递归展示“压栈—到达递归基—逐层返回”的调用栈过程。
 * 阅读顺序：先看 base case；再看 n * factorial(n-1) 为什么必须先算出子调用；最后在 main 里跟 n=4 的返回顺序。
 * 关键不变量：每次调用只负责当前的 n；更小的 n 由下一层负责，结果通过返回值交回。
 * 易错点：缺少 base case；n 为负数未定义；把递归写成循环却忘了累乘；递归深度过大导致栈溢出。
 * 复杂度：时间 O(n)，递归栈空间 O(n)。
 * 输入/输出：输入非负整数 n；返回 n!；负数拒绝；main 打印递归结果。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

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
// Purpose: Compute n! recursively; n = 0 or 1 are the base cases, otherwise multiply after factorial(n-1) returns.
// 作用：递归计算 n!；n=0/1 是递归基，其余情况等待 factorial(n-1) 返回后再相乘。
std::uint64_t factorial(unsigned int number)
{
    if (number <= 1U)
    {
        return 1ULL;
    }
    return static_cast<std::uint64_t>(number) * factorial(number - 1U);
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    std::cout << "5! = " << factorial(5U) << '\n';
    std::cout << "0! = " << factorial(0U) << '\n';
    std::cout << "10! = " << factorial(10U) << '\n';
    return 0;
}
