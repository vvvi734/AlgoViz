/*
 * Test-only allocation harness for circular_linked_list.c.
 * It is not shipped with the reference-code panel.
 */
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>

extern int circular_app_main(void);

#define MAX_TRACKED 16
static void *tracked[MAX_TRACKED];
static int tracked_count;
static int allocation_calls;
static int fail_call;

void *test_malloc(size_t size)
{
    allocation_calls += 1;
    if (allocation_calls == fail_call)
    {
        return NULL;
    }
    void *ptr = malloc(size);
    if (ptr != NULL)
    {
        tracked[tracked_count++] = ptr;
    }
    return ptr;
}

void test_free(void *ptr)
{
    if (ptr == NULL)
    {
        return;
    }
    for (int i = 0; i < tracked_count; ++i)
    {
        if (tracked[i] == ptr)
        {
            tracked[i] = tracked[tracked_count - 1];
            tracked_count -= 1;
            break;
        }
    }
    free(ptr);
}

int main(int argc, char **argv)
{
    fail_call = argc > 1 ? atoi(argv[1]) : 0;
    int rc = circular_app_main();
    printf("TRACKED_OUTSTANDING=%d\n", tracked_count);
    printf("ALLOCATION_CALLS=%d\n", allocation_calls);
    return rc;
}
