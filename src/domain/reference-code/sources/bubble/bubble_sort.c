/*
 * Bubble sort in C11.
 *
 * Repeatedly compare adjacent pairs and swap inverted pairs. After pass k the
 * largest k values are fixed at the right end. A pass without a swap proves the
 * remaining prefix is sorted, so the algorithm stops early.
 * Stable; O(n^2) worst and average, O(n) best, extra space O(1).
 */

#include <stdio.h>

// After pass k the largest k values sit at the right end; an unchanged pass ends the sort early.
void BubbleSort(int *values, int count)
{
    for (int end = count - 1; end > 0; --end) {
        int swapped = 0;
        for (int index = 0; index < end; ++index) {
            if (values[index] > values[index + 1]) {
                int temporary = values[index];
                values[index] = values[index + 1];
                values[index + 1] = temporary;
                swapped = 1;
            }
        }
        if (!swapped) {
            break;
        }
    }
}

static void PrintValues(const int *values, int count)
{
    for (int index = 0; index < count; ++index) {
        printf("%d%s", values[index], index + 1 == count ? "\n" : " ");
    }
}

int main(void)
{
    int values[] = {5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    int count = (int)(sizeof(values) / sizeof(values[0]));

    BubbleSort(values, count);
    printf("sorted: ");
    PrintValues(values, count);
    return 0;
}
