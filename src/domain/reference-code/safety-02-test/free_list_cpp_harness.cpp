#include <cstdio>
#include <exception>
#include <string>

#define main free_list_app_main
#include "../sources/free-list/free_list.cpp"
#undef main

template <typename Function>
static int throws_invalid(Function function)
{
    try
    {
        function();
    }
    catch (const std::invalid_argument &)
    {
        return 1;
    }
    return 0;
}

int main()
{
    printf("CAP8=%d\n", (int)FreeList(8).allocate("A", 1));
    printf("CAP7_THROWS=%d\n", throws_invalid([] { FreeList(7); }));
    printf("CAP129_THROWS=%d\n", throws_invalid([] { FreeList(129); }));

    FreeList memory(64);
    printf("NULL_ID_THROWS=%d\n", throws_invalid([&] { memory.allocate("", 1); }));
    printf("LONG_ID_THROWS=%d\n", throws_invalid([&] { memory.allocate("LONG", 1); }));
    printf("ZERO_REQUEST_THROWS=%d\n", throws_invalid([&] { memory.allocate("A", 0); }));
    printf("NEGATIVE_REQUEST_THROWS=%d\n", throws_invalid([&] { memory.allocate("A", -1); }));
    printf("TOO_LARGE_RETURNS=%d\n", (int)!memory.allocate("Z", 65));

    FreeList duplicates(64);
    printf("DUP1=%d\n", (int)duplicates.allocate("D", 1));
    printf("DUP2_THROWS=%d\n", throws_invalid([&] { duplicates.allocate("D", 1); }));
    printf("DUP_RELEASE=%d UNKNOWN_RELEASE=%d\n", (int)duplicates.release("D"), (int)duplicates.release("X"));

    FreeList merge(64);
    printf("MERGE_ALLOC=%d,%d,%d\n", (int)merge.allocate("A", 8), (int)merge.allocate("B", 8), (int)merge.allocate("C", 8));
    printf("MERGE_RELEASE=%d,%d,%d\n", (int)merge.release("C"), (int)merge.release("B"), (int)merge.release("A"));
    return 0;
}
