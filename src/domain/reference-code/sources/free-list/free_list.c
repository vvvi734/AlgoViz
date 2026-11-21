// Free-space list with First Fit / Best Fit and boundary tags.
// The program is a self-contained simulation over a static array, not a real allocator.
#include <stdio.h>
#include <string.h>

#define MAX_BLOCKS 24
#define MAX_CAPACITY 128
#define MAX_LABEL 4

// A block owns the half-open interval [start, start + size).
typedef struct
{
    int start;
    int size;
    int free;
    char label[MAX_LABEL];
    int head_size;
    int tail_size;
    int head_free;
    int tail_free;
} Block;

static Block blocks[MAX_BLOCKS];
static int count = 0;
static int capacity = 0;
static int policy = 0; // 0 = First Fit, 1 = Best Fit

// Head and tail tags mirror the same size and state.
static void sync_tags(Block *block)
{
    block->head_size = block->size;
    block->tail_size = block->size;
    block->head_free = block->free;
    block->tail_free = block->free;
}

static void init_memory(int total)
{
    count = 0;
    capacity = total;
    blocks[count].start = 0;
    blocks[count].size = total;
    blocks[count].free = 1;
    blocks[count].label[0] = '\0';
    sync_tags(&blocks[count]);
    count = 1;
}

static void insert_block(int index, int start, int size, int free, const char *label)
{
    int position;
    for (position = count; position > index; position -= 1)
    {
        blocks[position] = blocks[position - 1];
    }
    blocks[index].start = start;
    blocks[index].size = size;
    blocks[index].free = free;
    snprintf(blocks[index].label, MAX_LABEL, "%s", label);
    sync_tags(&blocks[index]);
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
    int index;
    int chosen = -1;
    int best_remainder = capacity + 1;

    for (index = 0; index < count; index += 1)
    {
        int remainder;
        if (blocks[index].free == 0 || blocks[index].size < request)
        {
            continue;
        }
        remainder = blocks[index].size - request;
        if (policy == 0)
        {
            chosen = index;
            break;
        }
        if (remainder < best_remainder)
        {
            best_remainder = remainder;
            chosen = index;
        }
    }

    if (chosen == -1)
    {
        return 0;
    }
    if (blocks[chosen].size > request)
    {
        int remainder_start = blocks[chosen].start + request;
        int remainder_size = blocks[chosen].size - request;
        insert_block(chosen + 1, remainder_start, remainder_size, 1, "");
        blocks[chosen].size = request;
    }
    blocks[chosen].free = 0;
    snprintf(blocks[chosen].label, MAX_LABEL, "%s", id);
    sync_tags(&blocks[chosen]);
    return 1;
}

static void merge_left(int index)
{
    Block merged;
    merged.start = blocks[index - 1].start;
    merged.size = blocks[index - 1].size + blocks[index].size;
    merged.free = 1;
    merged.label[0] = '\0';
    sync_tags(&merged);
    blocks[index - 1] = merged;
    remove_block(index);
}

static void merge_right(int index)
{
    Block merged;
    merged.start = blocks[index].start;
    merged.size = blocks[index].size + blocks[index + 1].size;
    merged.free = 1;
    merged.label[0] = '\0';
    sync_tags(&merged);
    blocks[index] = merged;
    remove_block(index + 1);
}

static int release_block(const char *id)
{
    int index;
    int left_free;
    int right_free;
    for (index = 0; index < count; index += 1)
    {
        if (blocks[index].free == 0 && strcmp(blocks[index].label, id) == 0)
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
    sync_tags(&blocks[index]);
    left_free = index > 0 && blocks[index - 1].free;
    right_free = index + 1 < count && blocks[index + 1].free;

    if (left_free)
    {
        merge_left(index);
        index -= 1;
    }
    if (right_free)
    {
        merge_right(index);
    }
    return 1;
}

static void print_blocks(void)
{
    int index;
    for (index = 0; index < count; index += 1)
    {
        if (blocks[index].free)
        {
            printf("free [%d, %d) size=%d\n", blocks[index].start,
                   blocks[index].start + blocks[index].size, blocks[index].size);
        }
        else
        {
            printf("used %s [%d, %d) size=%d head=%d tail=%d\n", blocks[index].label,
                   blocks[index].start, blocks[index].start + blocks[index].size,
                   blocks[index].size, blocks[index].head_size, blocks[index].tail_size);
        }
    }
}

int main(void)
{
    init_memory(64);
    if (!allocate_block("A", 12)) return 1;
    if (!allocate_block("B", 16)) return 1;
    if (!allocate_block("C", 10)) return 1;
    if (!allocate_block("D", 12)) return 1;
    if (!allocate_block("E", 4)) return 1;
    if (!release_block("B")) return 1;
    if (!release_block("D")) return 1;
    if (!allocate_block("F", 8)) return 1;
    if (!release_block("C")) return 1;
    if (!release_block("F")) return 1;
    printf("policy=%s\n", policy == 0 ? "first-fit" : "best-fit");
    print_blocks();
    // The next request is intentionally too large for any contiguous free block.
    printf("request G=40 -> %s\n", allocate_block("G", 40) ? "ok" : "fail");
    print_blocks();
    return 0;
}
