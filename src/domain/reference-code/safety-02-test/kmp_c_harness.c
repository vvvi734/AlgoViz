#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>

static int fail_next_allocation = 0;
static void *real_malloc(size_t size);

void *test_malloc(size_t size)
{
    if (fail_next_allocation)
    {
        fail_next_allocation = 0;
        return NULL;
    }
    return real_malloc(size);
}

#define malloc test_malloc
#define main kmp_app_main
#include "../sources/kmp/kmp.c"
#undef main
#undef malloc

static void *real_malloc(size_t size)
{
    return malloc(size);
}

int main(void)
{
    printf("OVERLAP=%d\n", KMP("aaaaa", "aa"));
    printf("NO_MATCH=%d\n", KMP("abcdef", "xyz"));
    printf("EMPTY_PATTERN=%d\n", KMP("abc", ""));
    printf("EMPTY_TEXT=%d\n", KMP("", "a"));
    printf("NULL_TEXT=%d\n", KMP(NULL, "a"));
    printf("NULL_PATTERN=%d\n", KMP("a", NULL));
    fail_next_allocation = 1;
    printf("ALLOCATION_FAILURE=%d\n", KMP("aaaaa", "aa"));
    return 0;
}
