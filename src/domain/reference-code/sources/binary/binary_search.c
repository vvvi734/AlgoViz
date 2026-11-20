/*
 * Binary search in C11.
 *
 * Precondition: values is sorted in non-decreasing order. Keep an inclusive
 * window [low, high], compare the middle value, and discard the half that
 * cannot contain the target. Returns an index, or -1 when absent.
 * Time O(log n), extra space O(1).
 */

#include <stdio.h>

int Binary_Search(const int *values, int count, int target)
{
    int low = 0;
    int high = count - 1;

    while (low <= high) {
        int middle = low + (high - low) / 2;
        if (values[middle] == target) {
            return middle;
        }
        if (values[middle] < target) {
            low = middle + 1;
        } else {
            high = middle - 1;
        }
    }
    return -1;
}

int main(void)
{
    int values[] = {1, 3, 5, 7, 9, 11, 13};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    printf("find 9: index=%d\n", Binary_Search(values, count, 9));
    printf("find 8: index=%d\n", Binary_Search(values, count, 8));
    return 0;
}
