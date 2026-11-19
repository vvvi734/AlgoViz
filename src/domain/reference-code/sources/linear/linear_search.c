/*
 * AlgoViz reference implementation: linear search.
 * Original code written for this repository under the MIT License.
 * Scans from left to right and returns the first matching index, or -1.
 */

#include <stddef.h>
#include <stdio.h>

int linear_search(const int *values, int length, int target) {
    for (int index = 0; index < length; ++index) {
        if (values[index] == target) {
            return index;
        }
    }
    return -1;
}

int main(void) {
    int values[] = {4, 7, 2, 9, 1, 5};
    int length = (int)(sizeof(values) / sizeof(values[0]));

    printf("target 9 -> %d\n", linear_search(values, length, 9));
    printf("target 1 -> %d\n", linear_search(values, length, 1));
    printf("target 6 -> %d\n", linear_search(values, length, 6));
    printf("empty -> %d\n", linear_search(NULL, 0, 6));
    return 0;
}
