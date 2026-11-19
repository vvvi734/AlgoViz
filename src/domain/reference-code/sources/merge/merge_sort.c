/*
 * AlgoViz reference implementation: merge sort.
 * Original code written for this repository under the MIT License.
 * The stable merge and divide-and-conquer structure follow the classic
 * textbook treatment, without copying textbook code.
 */

#include <stdio.h>
#include <stdlib.h>

static void merge_range(int *values, int *buffer, int left, int middle, int right) {
    int i = left;
    int j = middle + 1;
    int k = left;

    while (i <= middle && j <= right) {
        /* Take the left run on ties so equal keys keep their order. */
        if (values[i] <= values[j]) {
            buffer[k++] = values[i++];
        } else {
            buffer[k++] = values[j++];
        }
    }
    while (i <= middle) {
        buffer[k++] = values[i++];
    }
    while (j <= right) {
        buffer[k++] = values[j++];
    }
    for (k = left; k <= right; ++k) {
        values[k] = buffer[k];
    }
}

static void merge_sort_range(int *values, int *buffer, int left, int right) {
    if (left >= right) {
        return;
    }
    int middle = left + (right - left) / 2;
    merge_sort_range(values, buffer, left, middle);
    merge_sort_range(values, buffer, middle + 1, right);
    merge_range(values, buffer, left, middle, right);
}

int merge_sort(int *values, int length) {
    if (length <= 1) {
        return 1;
    }
    int *buffer = (int *)malloc((size_t)length * sizeof(int));
    if (buffer == NULL) {
        return 0;
    }
    merge_sort_range(values, buffer, 0, length - 1);
    free(buffer);
    return 1;
}

int main(void) {
    int values[] = {9, 4, 7, 2, 6, 1, 3, 8, 5};
    int length = (int)(sizeof(values) / sizeof(values[0]));

    if (!merge_sort(values, length)) {
        printf("allocation failed\n");
        return 1;
    }

    printf("sorted:");
    for (int i = 0; i < length; ++i) {
        printf(" %d", values[i]);
    }
    printf("\n");
    return 0;
}
