"""AlgoViz convenience implementation: factorial with math.factorial.

This delegates the whole computation to the CPython standard library.

Reading guide:
1. This convenience file delegates to math.factorial instead of writing the recursion.
2. The C implementation multiplies the factors internally and returns an
   arbitrary-precision int.
3. No Python recursion limit is involved.

Complexity: O(n) multiplications; extra space depends on the big-integer result,
  not Python stack depth.
Convention: Input must be a non-negative integer; math.factorial raises ValueError
  otherwise.
"""

from __future__ import annotations

from math import factorial


def main() -> None:
    assert factorial(0) == 1
    assert factorial(5) == 120
    print("5! =", factorial(5))
    print("0! =", factorial(0))
    print("10! =", factorial(10))


if __name__ == "__main__":
    main()
