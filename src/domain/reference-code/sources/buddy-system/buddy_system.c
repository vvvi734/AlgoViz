// Buddy-system allocation and release over a power-of-two capacity.
// The program uses a static block table, so it never dereferences a real address.
#include <stdio.h>
#include <string.h>

#define MAX_BLOCKS 128
#define MAX_LABEL 32

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
    // Only exact powers of two keep every split aligned; zero and non-power capacities are rejected before splitting begins.
    return value > 0 && (value & (value - 1)) == 0;
}

static int level_of(int size)
{
    int level = 0;
    // level is ceil(log2(size)); request 3 therefore needs a level-2 block of size 4.
    while ((1 << level) < size)
    {
        level += 1;
    }
    return level;
}

static int init_memory(int total)
{
    // Reject the capacity before publishing it: a non-power-of-two heap cannot be split into aligned buddies, and allocate_block would fail later.
    if (!power_of_two(total))
    {
        return 0;
    }
    count = 1;
    capacity = total;
    max_level = level_of(total);
    blocks[0].start = 0;
    blocks[0].size = total;
    blocks[0].level = max_level;
    // The heap starts as one free root covering [0, capacity); for the required power-of-two capacity, max_level is log2(capacity).
    blocks[0].free = 1;
    blocks[0].label[0] = '\0';
    return 1;
}

static int insert_block(int index, int start, int size, int free)
{
    int position;
    // The table is fixed; a caller must reserve capacity before splitting rather than writing past blocks[MAX_BLOCKS - 1].
    if (count >= MAX_BLOCKS)
    {
        return 0;
    }
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
    return 1;
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
    int target_level;
    int level;
    int index = -1;
    // The label is copied into a fixed field, so an empty, overlong or duplicate id must be rejected before any block is marked used.
    if (id == NULL || id[0] == '\0' || strlen(id) >= MAX_LABEL)
    {
        return 0;
    }
    for (int existing = 0; existing < count; existing += 1)
    {
        if (!blocks[existing].free && strcmp(blocks[existing].label, id) == 0)
        {
            return 0;
        }
    }
    // Validate the request before level_of(): computing ceil(log2()) on an out-of-range value could shift past the int width.
    if (!power_of_two(capacity) || request <= 0 || request > capacity)
    {
        return 0;
    }
    target_level = level_of(request);

    // Find the smallest free block at or above the rounded target level.
    // Search upward from the rounded target level and stop at the first free level; taking a larger block would split more than necessary.
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
    // Each split keeps the left half in place and inserts the right half immediately after it; address order and the chosen index stay valid.
    if (count + (blocks[index].level - target_level) > MAX_BLOCKS)
    {
        return 0;
    }
    while (blocks[index].level > target_level)
    {
        int half = blocks[index].size / 2;
        blocks[index].size = half;
        blocks[index].level -= 1;
        if (!insert_block(index + 1, blocks[index].start + half, half, 1))
        {
            return 0;
        }
    }
    // The block is marked used only after all splits, so it stays free until every split has completed.
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
        // XOR works because size is a power of two and the block is aligned; it gives the sibling address, not an arbitrary block.
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
        // Merge only with a free buddy of exactly the same size; an allocated or differently sized neighbour blocks coalescing.
        if (buddy == -1)
        {
            break;
        }
        // The merged block starts at the smaller address and doubles its size.
        // The merged interval starts at the smaller address; otherwise level and address no longer describe the same block.
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
    if (!init_memory(32)) return 1;
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
