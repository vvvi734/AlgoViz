/*
 * 教材素材说明
 * 用户提供的《数据结构与算法（Windows版）》未包含本算法的对应实现。
 * 本文件保留 AlgoViz 原创 C 实现与现有注释，未冒充教材原文。
 */

/*
 * AlgoViz reference implementation: factorial.
 * Original code written for this repository under the MIT License.
 * Recursive definition: n! = n * (n - 1)!, with 0! = 1.
 *
 * Reading guide:
 * 1. Base cases: 0! = 1 and 1! = 1.
 * 2. Recurrence: n! = n * (n - 1)!.
 * 3. The recursion unwinds multiplying the pending factors from 1 up to n.
 *
 * Complexity: O(n) multiplications; extra space O(n) recursion depth.
 * Convention: Input is a non-negative integer; the result uses the language's
 *   integer type.
 */

#include <stddef.h>
#include <stdio.h>

// Base cases collapse to 1; the unwind multiplies n by the already-computed (n-1)!.
unsigned long long factorial(unsigned int number) {
    if (number <= 1U) {
        return 1ULL;
    }
    return (unsigned long long)number * factorial(number - 1U);
}

int main(void) {
    printf("5! = %llu\n", factorial(5U));
    printf("0! = %llu\n", factorial(0U));
    printf("10! = %llu\n", factorial(10U));
    return 0;
}
