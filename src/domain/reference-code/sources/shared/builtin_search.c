/*
 * AlgoViz shared convenience implementation: binary search with bsearch().
 * Original code written for this repository under the MIT License.
 * The array must be sorted before calling bsearch(); this returns the first
 * matching index found by the C standard library.
 */

#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>

int compare_int(const void *left, const void *right) {
    int a = *(const int *)left;
    int b = *(const int *)right;
    return (a > b) - (a < b);
}

int binary_search_builtin(const int *values, int length, int target) {
    if (length <= 0) {
        return -1;
    }
    const int *found = (const int *)bsearch(
        &target, values, (size_t)length, sizeof(values[0]), compare_int);
    return found == NULL ? -1 : (int)(found - values);
}

int main(void) {
    int values[] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9};
    int length = (int)(sizeof(values) / sizeof(values[0]));

    printf("target 6 -> %d\n", binary_search_builtin(values, length, 6));
    printf("target 10 -> %d\n", binary_search_builtin(values, length, 10));
    printf("empty -> %d\n", binary_search_builtin(NULL, 0, 6));
    return 0;
}
