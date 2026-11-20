"""AlgoViz reference implementation: factorial.

Original code written for this repository under the MIT License.
Recursive definition: n! = n * (n - 1)!, with 0! = 1.

Reading guide:
1. Base cases: 0! = 1 and 1! = 1.
2. Recurrence: n! = n * (n - 1)!.
3. The recursion unwinds multiplying the pending factors from 1 up to n.

Complexity: O(n) multiplications; extra space O(n) recursion depth.
Convention: Input is a non-negative integer; the result uses the language's integer
  type.
"""

from __future__ import annotations


# Base cases collapse to 1; the unwind multiplies n by the already-computed (n-1)!.
def factorial(number: int) -> int:
    """Return number! for a non-negative integer."""
    if number < 0:
        raise ValueError("factorial is only defined for non-negative integers")
    if number <= 1:
        return 1
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
