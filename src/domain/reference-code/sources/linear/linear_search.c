/*
 * Linear search in C11.
 *
 * Compare every element from left to right. The array does not need to be
 * sorted; the first equal element wins. Returns its index, or -1 if absent.
 * Worst-case time O(n), extra space O(1).
 */

#include <stdio.h>

// Return the first matching index; -1 is correct only after the entire array has been scanned.
int LinearSearch(const int *values, int count, int target)
{
    for (int index = 0; index < count; ++index) {
        if (values[index] == target) {
            return index;
        }
    }
    return -1;
}

int main(void)
{
    int values[] = {7, 2, 9, 4, 4, 1};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    printf("find 4: index=%d\n", LinearSearch(values, count, 4));
    printf("find 8: index=%d\n", LinearSearch(values, count, 8));
    return 0;
}
