// Buddy-system allocation and release over a power-of-two capacity.
// The program uses a static block table, so it never dereferences a real address.
#include <stdio.h>
#include <string.h>

#define MAX_BLOCKS 32
#define MAX_LABEL 4

typedef struct
{
    int start;
    int size;
    int level;
    int free;
    char label[MAX_LABEL];
} Block;

static Block blocks[MAX_BLOCKS];
static int count = 0;
static int capacity = 0;
static int max_level = 0;

static int power_of_two(int value)
{
    return value > 0 && (value & (value - 1)) == 0;
}

static int level_of(int size)
{
    int level = 0;
    while ((1 << level) < size)
    {
        level += 1;
    }
    return level;
}

static void init_memory(int total)
{
    count = 1;
    capacity = total;
    max_level = level_of(total);
    blocks[0].start = 0;
    blocks[0].size = total;
    blocks[0].level = max_level;
    blocks[0].free = 1;
    blocks[0].label[0] = '\0';
}

static void insert_block(int index, int start, int size, int free)
{
    int position;
    for (position = count; position > index; position -= 1)
    {
        blocks[position] = blocks[position - 1];
    }
    blocks[index].start = start;
    blocks[index].size = size;
    blocks[index].level = level_of(size);
    blocks[index].free = free;
    blocks[index].label[0] = '\0';
    count += 1;
}

static void remove_block(int index)
{
    int position;
    for (position = index; position + 1 < count; position += 1)
    {
        blocks[position] = blocks[position + 1];
    }
    count -= 1;
}

static int allocate_block(const char *id, int request)
{
    int target_level = level_of(request);
    int level;
    int index = -1;
    if (!power_of_two(capacity) || request <= 0 || request > capacity)
    {
        return 0;
    }

    // Find the smallest free block at or above the rounded target level.
    for (level = target_level; level <= max_level && index == -1; level += 1)
    {
        int position;
        for (position = 0; position < count; position += 1)
        {
            if (blocks[position].free && blocks[position].level == level)
            {
                index = position;
                break;
            }
        }
    }
    if (index == -1)
    {
        return 0;
    }

    // Halve the chosen block repeatedly; the left half stays the working block.
    while (blocks[index].level > target_level)
    {
        int half = blocks[index].size / 2;
        blocks[index].size = half;
        blocks[index].level -= 1;
        insert_block(index + 1, blocks[index].start + half, half, 1);
    }
    blocks[index].free = 0;
    snprintf(blocks[index].label, MAX_LABEL, "%s", id);
    return 1;
}

static int release_block(const char *id)
{
    int index;
    for (index = 0; index < count; index += 1)
    {
        if (!blocks[index].free && strcmp(blocks[index].label, id) == 0)
        {
            break;
        }
    }
    if (index == count)
    {
        return 0;
    }

    blocks[index].free = 1;
    blocks[index].label[0] = '\0';
    while (blocks[index].level < max_level)
    {
        int buddy_start = blocks[index].start ^ blocks[index].size;
        int buddy = -1;
        int position;
        for (position = 0; position < count; position += 1)
        {
            if (position != index && blocks[position].free &&
                blocks[position].start == buddy_start &&
                blocks[position].size == blocks[index].size)
            {
                buddy = position;
                break;
            }
        }
        if (buddy == -1)
        {
            break;
        }
        // The merged block starts at the smaller address and doubles its size.
        if (blocks[buddy].start < blocks[index].start)
        {
            blocks[index].start = blocks[buddy].start;
        }
        blocks[index].size *= 2;
        blocks[index].level += 1;
        if (buddy < index)
        {
            index -= 1;
        }
        remove_block(buddy);
    }
    return 1;
}

static void print_blocks(void)
{
    int index;
    for (index = 0; index < count; index += 1)
    {
        printf("[%d, %d) size=%d level=%d %s%s\n", blocks[index].start,
               blocks[index].start + blocks[index].size, blocks[index].size,
               blocks[index].level, blocks[index].free ? "free" : "used ",
               blocks[index].free ? "" : blocks[index].label);
    }
}

int main(void)
{
    init_memory(32);
    if (!allocate_block("A", 3)) return 1;
    if (!allocate_block("B", 5)) return 1;
    if (!allocate_block("C", 2)) return 1;
    if (!release_block("B")) return 1;
    if (!release_block("C")) return 1;
    print_blocks();
    // A 32-byte request cannot fit once the root has been split and used.
    printf("request D=32 -> %s\n", allocate_block("D", 32) ? "ok" : "fail");
    print_blocks();
    return 0;
}
