/*
 * RISK-06 harness: merge sort must report allocation failure instead of silently leaving data unsorted.
 */
#include <stdlib.h>

static void *fail_malloc(size_t size)
{
    (void)size;
    return NULL;
}

#define malloc fail_malloc
#define main merge_demo_main
#include "../sources/merge/merge_sort.c"
#undef main
#undef malloc

int main(void)
{
    int values[3] = {3, 1, 2};
    if (!MergeSort(values, 3))
    {
        printf("PASS: allocation failure returned 0 and left data untouched\n");
        return 0;
    }
    printf("FAIL: allocation failure was not reported\n");
    return 1;
}
