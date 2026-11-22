"""AlgoViz reference implementation: naive Fibonacci.

Definition: F(0) = 0, F(1) = 1, F(n) = F(n - 1) + F(n - 2).

Reading guide:
1. The two base cases return their own n.
2. Each non-base call creates two independent child calls.
3. No cache is used, so identical subproblems are recomputed.

Complexity: O(2^n) time (about 2*F(n+1)-1 calls); O(n) call-stack space.
Convention: Input is a non-negative integer; Python integers do not overflow.
"""
# 中文导读：按定义 F(n)=F(n-1)+F(n-2) 递归计算斐波那契数，故意保留重复子问题。
# 阅读顺序：先看两个递归出口，再看两次独立递归调用。
# 输入/输出：输入非负整数 n；返回 F(n)；负数抛 ValueError。
# 不变量：F(0)=0、F(1)=1，之后每项等于前两项之和。
# 易错点：把 F(0) 写成 1；误以为递归会自动缓存。
# 复杂度：O(2^n) 时间，递归空间 O(n)。

from __future__ import annotations


# The two recursive calls are independent and uncached, so identical subproblems are recomputed.
# Python integers are unbounded, but this naive recursion still has exponential call growth and O(n) depth.
def fib(n: int) -> int:
    """Return F(n) using the naive two-branch recurrence."""
    # Reject negative n before the base cases; F(n) is undefined there.
    if n < 0:
        raise ValueError("fib is only defined for non-negative integers")
    if n <= 1:
        return n
    # The two branches are evaluated independently; the same F(k) is recomputed many times because nothing is cached.
    return fib(n - 1) + fib(n - 2)


def main() -> None:
    assert fib(0) == 0
    assert fib(1) == 1
    assert fib(4) == 3
    for n in range(11):
        print(f"fib({n}) = {fib(n)}")


if __name__ == "__main__":
    main()
