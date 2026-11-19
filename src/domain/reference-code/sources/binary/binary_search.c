/*
 * AlgoViz reference implementation: binary search.
 * Original code written for this repository under the MIT License.
 * Precondition and interval conventions follow the classic textbook
 * treatment of ordered-list search, without copying textbook code.
 */

#include <stdio.h>
#include <stddef.h>

int is_non_decreasing(const int *values, size_t length) {
    for (size_t i = 1; i < length; ++i) {
        if (values[i - 1] > values[i]) {
            return 0;
        }
    }
    return 1;
}

/* Closed interval [left, right]. Returns an index, or -1 when absent. */
int binary_search(const int *values, size_t length, int target) {
    if (length == 0) {
        return -1;
    }
    int left = 0;
    int right = (int)length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (values[mid] == target) {
            return mid;
        }
        if (values[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}

int main(void) {
    int sorted[] = {1, 3, 5, 7, 9, 11, 13};
    size_t length = sizeof(sorted) / sizeof(sorted[0]);

    if (!is_non_decreasing(sorted, length)) {
        printf("input must be sorted in non-decreasing order\n");
        return 1;
    }

    int target = 9;
    int index = binary_search(sorted, length, target);
    printf("target=%d index=%d\n", target, index);
    printf("missing=%d index=%d\n", 8, binary_search(sorted, length, 8));
    return 0;
}
