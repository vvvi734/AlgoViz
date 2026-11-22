#include <stdio.h>
#include <string.h>

#define main free_list_app_main
#include "../sources/free-list/free_list.c"
#undef main

static int PartitionCovers(int total)
{
    int end = 0;
    for (int index = 0; index < count; ++index)
    {
        if (blocks[index].start != end || blocks[index].size <= 0)
        {
            return 0;
        }
        end += blocks[index].size;
    }
    return end == total;
}

int main(void)
{
    if (!init_memory(8))
    {
        printf("CAP8=0\n");
        return 1;
    }
    printf("CAP8=1 CAP=%d\n", capacity);

    init_memory(64);
    int previous_count = count;
    int previous_capacity = capacity;
    printf("BAD_LOW=%d\n", init_memory(7));
    printf("BAD_LOW_KEEPS=%d,%d,%d\n", count, capacity, count == previous_count && capacity == previous_capacity);
    printf("BAD_HIGH=%d\n", init_memory(129));
    printf("BAD_HIGH_KEEPS=%d,%d,%d\n", count, capacity, count == previous_count && capacity == previous_capacity);

    init_memory(64);
    printf("NULL_ID=%d\n", allocate_block(NULL, 1));
    printf("EMPTY_ID=%d\n", allocate_block("", 1));
    printf("LONG_ID=%d\n", allocate_block("LONG", 1));
    printf("ZERO_REQUEST=%d\n", allocate_block("A", 0));
    printf("NEGATIVE_REQUEST=%d\n", allocate_block("A", -1));
    printf("COUNT_AFTER_INVALID=%d SIZE=%d\n", count, blocks[0].size);

    init_memory(64);
    int first_duplicate = allocate_block("D", 1);
    int second_duplicate = allocate_block("D", 1);
    printf("DUP1=%d DUP2=%d\n", first_duplicate, second_duplicate);
    printf("DUP_RELEASE=%d\n", release_block("D"));
    printf("UNKNOWN_RELEASE=%d NULL_RELEASE=%d\n", release_block("X"), release_block(NULL));

    init_memory(64);
    printf("MERGE_ALLOC=%d,%d,%d\n", allocate_block("A", 8), allocate_block("B", 8), allocate_block("C", 8));
    printf("MERGE_RELEASE=%d,%d,%d\n", release_block("C"), release_block("B"), release_block("A"));
    printf("MERGE_COUNT=%d MERGE_SIZE=%d MERGE_FREE=%d MERGE_COVERS=%d\n",
           count, blocks[0].size, blocks[0].free, PartitionCovers(64));

    init_memory(128);
    int allocated = 0;
    char id[4];
    for (int index = 0; index < 24; ++index)
    {
        snprintf(id, sizeof(id), "A%02d", index);
        if (!allocate_block(id, 1))
        {
            break;
        }
        allocated += 1;
    }
    printf("DESCRIPTOR_LIMIT=%d ALLOCATED=%d COUNT=%d COVERS=%d\n", allocated, allocated, count, PartitionCovers(128));
    printf("MAX_BLOCKS=%d MAX_CAPACITY=%d MAX_LABEL=%d\n", MAX_BLOCKS, MAX_CAPACITY, MAX_LABEL);
    return 0;
}
