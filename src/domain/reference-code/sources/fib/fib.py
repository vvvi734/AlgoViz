"""AlgoViz reference implementation: naive Fibonacci.

Definition: F(0) = 0, F(1) = 1, F(n) = F(n - 1) + F(n - 2).

Reading guide:
1. The two base cases return their own n.
2. Each non-base call creates two independent child calls.
3. No cache is used, so identical subproblems are recomputed.

Complexity: O(2^n) time (about 2*F(n+1)-1 calls); O(n) call-stack space.
Convention: Input is a non-negative integer; Python integers do not overflow.
"""

from __future__ import annotations


# The two recursive calls are independent and uncached, so identical subproblems are recomputed.
def fib(n: int) -> int:
    """Return F(n) using the naive two-branch recurrence."""
    if n < 0:
        raise ValueError("fib is only defined for non-negative integers")
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)


def main() -> None:
    assert fib(0) == 0
    assert fib(1) == 1
    assert fib(4) == 3
    for n in range(11):
        print(f"fib({n}) = {fib(n)}")


if __name__ == "__main__":
    main()
