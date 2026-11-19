"""AlgoViz reference implementation: factorial.

Original code written for this repository under the MIT License.
Recursive definition: n! = n * (n - 1)!, with 0! = 1.
"""

from __future__ import annotations


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
