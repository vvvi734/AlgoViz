/*
 * Merge sort in C11.
 *
 * Split the range into two halves, sort each half recursively, then merge the
 * two sorted halves into a temporary buffer. Taking the left item on equality
 * keeps the sort stable. O(n log n) on every input; O(n) extra space.
 */

#include <stdio.h>
#include <stdlib.h>

static void MergeRange(int *values, int low, int middle, int high, int *buffer)
{
    int left = low;
    int right = middle + 1;
    int write = low;

    while (left <= middle && right <= high) {
        if (values[left] <= values[right]) {
            buffer[write++] = values[left++];
        } else {
            buffer[write++] = values[right++];
        }
    }
    while (left <= middle) {
        buffer[write++] = values[left++];
    }
    while (right <= high) {
        buffer[write++] = values[right++];
    }
    for (int index = low; index <= high; ++index) {
        values[index] = buffer[index];
    }
}

static void MergeSortRange(int *values, int low, int high, int *buffer)
{
    if (low >= high) {
        return;
    }
    int middle = low + (high - low) / 2;
    MergeSortRange(values, low, middle, buffer);
    MergeSortRange(values, middle + 1, high, buffer);
    MergeRange(values, low, middle, high, buffer);
}

void MergeSort(int *values, int count)
{
    if (count <= 1) {
        return;
    }
    int *buffer = (int *)malloc((size_t)count * sizeof(int));
    if (buffer == NULL) {
        return;
    }
    MergeSortRange(values, 0, count - 1, buffer);
    free(buffer);
}

int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    MergeSort(values, count);
    printf("sorted:");
    for (int index = 0; index < count; ++index) {
        printf(" %d", values[index]);
    }
    printf("\n");
    return 0;
}
