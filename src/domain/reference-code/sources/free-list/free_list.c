// Free-space list: First Fit / Best Fit over one simulated address range.
// A descriptor owns the half-open range [start, start + size); the byte at start + size belongs to the next block.
// This is a block-table simulation, not a real allocator: head/tail tags are teaching fields, not hardware boundary tags.
// Descriptors stay in increasing address order so adjacent blocks can be recognized by index, not by searching addresses.
#include <stdio.h>
#include <string.h>

#define MAX_BLOCKS 24
#define MAX_CAPACITY 128
#define MAX_LABEL 4

// start and size describe [start, start + size): size is a length, not an inclusive end address.
// free=1 means the block is reusable; label names an allocated request and is empty for free blocks.
// head_size/tail_size and head_free/tail_free duplicate the block size/state for teaching boundary tags; they are not independent truth.
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

// blocks[] plus count form an address-ordered descriptor table; count is the number of valid records, not the memory capacity.
// capacity is the original simulated size; it also supplies a sentinel larger than any possible best-fit remainder.
static Block blocks[MAX_BLOCKS];
static int count = 0;
static int capacity = 0;
// policy is a list-level switch: 0 selects First Fit, 1 selects Best Fit; it is read anew on every allocation.
static int policy = 0;

// sync_tags is the only routine that writes the simulated head/tail tags; every size or state change must call it.
static void sync_tags(Block *block)
{
    block->head_size = block->size;
    block->tail_size = block->size;
    block->head_free = block->free;
    block->tail_free = block->free;
}

// Initial state is exactly one free descriptor [0, total); later allocations split this single hole.
static void init_memory(int total)
{
    count = 0;
    capacity = total;
    blocks[count].start = 0;
    blocks[count].size = total;
    blocks[count].free = 1;
    blocks[count].label[0] = '\0';
    sync_tags(&blocks[count]);
    // count becomes 1 only after start, size, free and tags are complete, so the first scan always sees a valid record.
    count = 1;
}

// Inserting a split remainder must preserve address order, so every descriptor at and after index moves one slot right.
// MAX_BLOCKS bounds this teaching table; the code does not reject overflow, so callers must keep count below the limit.
static void insert_block(int index, int start, int size, int free, const char *label)
{
    int position;
    // The copy loop runs backwards from count to index; a forward loop would overwrite a record before it is moved.
    for (position = count; position > index; position -= 1)
    {
        blocks[position] = blocks[position - 1];
    }
    blocks[index].start = start;
    blocks[index].size = size;
    blocks[index].free = free;
    snprintf(blocks[index].label, MAX_LABEL, "%s", label);
    sync_tags(&blocks[index]);
    // count increases last, after the new record and its tags are complete; no later loop can observe a half-written slot.
    count += 1;
}

// Removing a descriptor closes the gap by moving every later record one slot left; this edits the simulation table only.
static void remove_block(int index)
{
    int position;
    for (position = index; position + 1 < count; position += 1)
    {
        blocks[position] = blocks[position + 1];
    }
    // count decreases after the shift, so the stale last slot is never visited again.
    count -= 1;
}

// First Fit can stop at the first adequate block; Best Fit cannot, because a later block may leave a smaller remainder.
static int allocate_block(const char *id, int request)
{
    int index;
    // chosen=-1 means "no candidate"; best_remainder starts at capacity+1 so any real remainder beats that sentinel.
    int chosen = -1;
    int best_remainder = capacity + 1;

    for (index = 0; index < count; index += 1)
    {
        int remainder;
        // A used block cannot be allocated, and a block smaller than request cannot be split into a non-negative remainder.
        if (blocks[index].free == 0 || blocks[index].size < request)
        {
            continue;
        }
        // remainder is the free tail after a split; an exact fit leaves remainder 0 and needs no new descriptor.
        remainder = blocks[index].size - request;
        // First Fit selects the first adequate block in address order and breaks immediately.
        if (policy == 0)
        {
            chosen = index;
            break;
        }
        // Best Fit must inspect every candidate; "<" keeps the earlier address when two blocks leave the same remainder.
        if (remainder < best_remainder)
        {
            best_remainder = remainder;
            chosen = index;
        }
    }

    // No chosen block means the request cannot fit in any single free interval; return 0 leaves the table unchanged.
    if (chosen == -1)
    {
        return 0;
    }
    // Only a strictly larger block is split; the free suffix starts exactly at the old start plus the allocated prefix.
    if (blocks[chosen].size > request)
    {
        // remainder_start is old start + request; it marks the first byte that the allocated prefix does not own.
        int remainder_start = blocks[chosen].start + request;
        // remainder_size is old size minus request, so [start, start+request) and the suffix are adjacent and never overlap.
        int remainder_size = blocks[chosen].size - request;
        // Insert the suffix before shrinking the chosen block: the split uses the old size, and chosen keeps its index.
        insert_block(chosen + 1, remainder_start, remainder_size, 1, "");
        // Shrink the prefix only after the suffix exists, so the table always covers the original interval.
        blocks[chosen].size = request;
    }
    // After the split, mark the prefix used and attach the request label; then sync tags so the footer describes the final state.
    blocks[chosen].free = 0;
    snprintf(blocks[chosen].label, MAX_LABEL, "%s", id);
    sync_tags(&blocks[chosen]);
    return 1;
}

// Merge the current block into its left neighbour; both records are adjacent and free.
static void merge_left(int index)
{
    Block merged;
    // The union starts at the left neighbour's address because the released block lies immediately after it.
    merged.start = blocks[index - 1].start;
    // The merged size is the sum of two adjacent lengths; no address gap exists between them.
    merged.size = blocks[index - 1].size + blocks[index].size;
    merged.free = 1;
    merged.label[0] = '\0';
    sync_tags(&merged);
    blocks[index - 1] = merged;
    // Assign the union to the left slot and delete the current record, keeping one descriptor for the continuous range.
    remove_block(index);
}

// Merge the current block with its right neighbour; both records are adjacent and free.
static void merge_right(int index)
{
    Block merged;
    // The union keeps the current start because the right neighbour begins exactly at current start + current size.
    merged.start = blocks[index].start;
    // The merged size adds the right length; deleting the right record leaves a single descriptor for the union.
    merged.size = blocks[index].size + blocks[index + 1].size;
    merged.free = 1;
    merged.label[0] = '\0';
    sync_tags(&merged);
    blocks[index] = merged;
    remove_block(index + 1);
}

// Release accepts only an allocated record with the exact ID; free blocks and unknown IDs are not valid releases.
// If neither neighbour is free, the released descriptor stays as an independent hole.
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

    // Mark the block free and clear its label before neighbour checks, so the search sees the released interval as a hole.
    blocks[index].free = 1;
    blocks[index].label[0] = '\0';
    sync_tags(&blocks[index]);
    // left_free and right_free snapshot physical adjacency; only an actually adjacent free block may be merged.
    left_free = index > 0 && blocks[index - 1].free;
    right_free = index + 1 < count && blocks[index + 1].free;

    // A left merge absorbs the released record into the previous descriptor and removes one record.
    if (left_free)
    {
        merge_left(index);
        // After a left merge the unified block sits at index-1, so index must decrease before checking the right side.
        index -= 1;
    }
    // right_free was captured before the left merge; after index-- it still names the block immediately right of the union.
    if (right_free)
    {
        merge_right(index);
    }
    return 1;
}

// print_blocks walks the address order and prints [start, end), making gaps or overlaps visible.
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

// A-E allocate adjacent blocks from low addresses, so the only untouched space is the trailing free suffix.
// The demonstration assumes enough capacity and a correct fixed operation sequence; it is not a general input parser.
int main(void)
{
    init_memory(64);
    if (!allocate_block("A", 12)) return 1;
    if (!allocate_block("B", 16)) return 1;
    if (!allocate_block("C", 10)) return 1;
    if (!allocate_block("D", 12)) return 1;
    if (!allocate_block("E", 4)) return 1;
    // Releasing B and D creates two isolated holes; F can reuse the earlier hole under First Fit.
    if (!release_block("B")) return 1;
    if (!release_block("D")) return 1;
    // F is allocated after the two releases, so it demonstrates reuse of a hole rather than growth of the tail.
    if (!allocate_block("F", 8)) return 1;
    // Releasing C joins both neighbours, then releasing F joins the remaining right hole; this demonstrates two-sided coalescing.
    if (!release_block("C")) return 1;
    if (!release_block("F")) return 1;
    printf("policy=%s\n", policy == 0 ? "first-fit" : "best-fit");
    print_blocks();
    // G=40 is deliberately larger than every remaining contiguous hole, so the final call must fail without changing the table.
    printf("request G=40 -> %s\n", allocate_block("G", 40) ? "ok" : "fail");
    print_blocks();
    return 0;
}
