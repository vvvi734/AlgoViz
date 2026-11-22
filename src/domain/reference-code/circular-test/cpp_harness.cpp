/*
 * Test-only nothrow-new harness for circular_linked_list.cpp.
 * It is not shipped with the reference-code panel.
 */
#include <cstddef>
#include <cstdio>
#include <cstdlib>
#include <new>

extern int circular_cpp_app_main();

#define MAX_TRACKED 16
static void *tracked[MAX_TRACKED];
static int tracked_count;
static int allocation_calls;
static int fail_call;

static void track(void *ptr)
{
    tracked[tracked_count++] = ptr;
}

static void untrack_and_free(void *ptr) noexcept
{
    if (ptr == nullptr)
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
    std::free(ptr);
}

void *operator new(std::size_t size, const std::nothrow_t &) noexcept
{
    allocation_calls += 1;
    if (allocation_calls == fail_call)
    {
        return nullptr;
    }
    void *ptr = std::malloc(size);
    if (ptr != nullptr)
    {
        track(ptr);
    }
    return ptr;
}

void operator delete(void *ptr) noexcept
{
    untrack_and_free(ptr);
}

void operator delete(void *ptr, std::size_t) noexcept
{
    untrack_and_free(ptr);
}

void operator delete(void *ptr, const std::nothrow_t &) noexcept
{
    untrack_and_free(ptr);
}

int main(int argc, char **argv)
{
    fail_call = argc > 1 ? std::atoi(argv[1]) : 0;
    int rc = circular_cpp_app_main();
    std::printf("TRACKED_OUTSTANDING=%d\n", tracked_count);
    std::printf("ALLOCATION_CALLS=%d\n", allocation_calls);
    return rc;
}
