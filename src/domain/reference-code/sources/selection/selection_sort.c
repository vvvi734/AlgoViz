/*
 * Selection sort in C11.
 *
 * Each pass finds the minimum in the unsorted suffix and swaps it into the end
 * of the sorted prefix. Swaps may cross equal keys, so the usual implementation
 * is not stable. Time O(n^2), extra space O(1).
 */

#include <stdio.h>

void SelectionSort(int *values, int count)
{
    for (int start = 0; start + 1 < count; ++start) {
        int minimum = start;
        for (int index = start + 1; index < count; ++index) {
            if (values[index] < values[minimum]) {
                minimum = index;
            }
        }
        if (minimum != start) {
            int temporary = values[start];
            values[start] = values[minimum];
            values[minimum] = temporary;
        }
    }
}

int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    SelectionSort(values, count);
    printf("sorted:");
    for (int index = 0; index < count; ++index) {
        printf(" %d", values[index]);
    }
    printf("\n");
    return 0;
}
