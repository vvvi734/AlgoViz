/*
 * 中文导读：对比朴素递归的重复子问题与自底向上的迭代解法。
 * 阅读顺序：先看递归版本 F(n)=F(n-1)+F(n-2)；再数 F(5) 中 F(2) 被算了几次；最后看迭代版本只保留两个状态。
 * 关键不变量：递归版本的每个子调用独立；迭代版本始终保存前两项，用常数空间推进。
 * 易错点：把朴素递归误认为 O(n)；n=0/1 边界；迭代时更新顺序写反覆盖旧值；结果溢出 int。
 * 复杂度：朴素递归 O(φⁿ) 时间、O(n) 栈；迭代 O(n) 时间、O(1) 空间。
 */

/*
 * AlgoViz reference implementation: naive Fibonacci.
 * Definition: F(0) = 0, F(1) = 1, F(n) = F(n - 1) + F(n - 2).
 *
 * Reading guide:
 * 1. The two base cases return their own n.
 * 2. Each non-base call creates two independent child calls.
 * 3. No cache is used, so identical subproblems are recomputed.
 *
 * Complexity: O(2^n) time (about 2*F(n+1)-1 calls); O(n) call-stack space.
 * Convention: Input is a non-negative integer; the result fits unsigned long long
 *   for the teaching range used by the visual lab (n <= 8).
 */

#include <stdio.h>

// The two recursive calls are independent and uncached, so identical subproblems are recomputed.
// 作用：朴素递归计算 F(n)；两个子调用彼此独立且没有缓存，因此会重复计算相同子问题。
static unsigned long long fib(unsigned int n)
{
    if (n <= 1U)
    {
        return (unsigned long long)n;
    }
    return fib(n - 1U) + fib(n - 2U);
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    for (unsigned int n = 0U; n <= 10U; n += 1U)
    {
        printf("fib(%u) = %llu\n", n, fib(n));
    }
    return 0;
}
