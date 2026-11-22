"""AlgoViz reference implementation: factorial.

Recursive definition: n! = n * (n - 1)!, with 0! = 1.

Reading guide:
1. Base cases: 0! = 1 and 1! = 1.
2. Recurrence: n! = n * (n - 1)!.
3. The recursion unwinds multiplying the pending factors from 1 up to n.

Complexity: O(n) multiplications; extra space O(n) recursion depth.
Convention: Input is a non-negative integer; the result uses the language's integer
  type.
"""
# 中文导读：用递归定义 n! = n * (n-1)!，以 0! 和 1! 作为递归出口。
# 阅读顺序：先看递归出口，再看回溯时的乘法。
# 输入/输出：输入非负整数 n；返回 n!；负数抛 ValueError。
# 不变量：每次递归都把问题规模减一，最终到达 0 或 1。
# 易错点：缺少 n=0 的出口；负数未拒绝。
# 复杂度：O(n) 次乘法，递归空间 O(n)。

from __future__ import annotations


# Base cases collapse to 1; the unwind multiplies n by the already-computed (n-1)!.
# Python integers do not overflow, but deep recursion still hits the interpreter's recursion limit.
def factorial(number: int) -> int:
    """Return number! for a non-negative integer."""
    # Reject negative input before the base case; factorial is undefined there and returning 1 would hide the error.
    if number < 0:
        raise ValueError("factorial is only defined for non-negative integers")
    if number <= 1:
        return 1
    # The multiplication is evaluated after the child returns; each frame holds its own number until then.
    return number * factorial(number - 1)


def main() -> None:
    assert factorial(0) == 1
    assert factorial(1) == 1
    assert factorial(5) == 120
    print("5! =", factorial(5))
    print("0! =", factorial(0))
    print("10! =", factorial(10))


if __name__ == "__main__":
    main()
