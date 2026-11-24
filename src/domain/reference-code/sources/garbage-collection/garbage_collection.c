// Mark-and-sweep and storage compaction over a small object graph.
// Reachability is computed from roots; an object is not garbage merely because
// another unreachable object still points at it.
#include <stdio.h>
#include <string.h>

#define MAX_OBJECTS 16
#define MAX_REFS 24
#define CAPACITY 96
#define MAX_LABEL 4

typedef struct
{
    char id[MAX_LABEL];
    int start;
    int size;
    int free;
    int marked;
} Object;

typedef struct
{
    int from;
    int to;
} Reference;

static Object objects[MAX_OBJECTS];
static int object_count = 0;
static Reference refs[MAX_REFS];
static int ref_count = 0;
static int roots[MAX_OBJECTS];
static int root_count = 0;

// The root set is separate from the object table: not every live object is reachable from index 0.
static void add_root(int index)
{
    if (index >= 0 && index < object_count && root_count < MAX_OBJECTS)
    {
        roots[root_count++] = index;
    }
}

static void add_object(const char *id, int start, int size)
{
    snprintf(objects[object_count].id, MAX_LABEL, "%s", id);
    objects[object_count].start = start;
    objects[object_count].size = size;
    objects[object_count].free = 0;
    objects[object_count].marked = 0;
    object_count += 1;
}

static void add_ref(int from, int to)
{
    refs[ref_count].from = from;
    refs[ref_count].to = to;
    ref_count += 1;
}

static void reset_graph(void)
{
    object_count = 0;
    ref_count = 0;
    root_count = 0;
    add_object("A", 0, 12);
    add_object("E", 12, 8);
    add_object("B", 20, 10);
    add_object("F", 30, 8);
    add_object("C", 38, 8);
    add_object("G", 46, 6);
    add_object("D", 52, 12);
    add_object("H", 64, 8);
    add_root(0); // The demo root set is {A}; real embeddings can append more roots with add_root.
    add_ref(0, 2); // A -> B
    add_ref(0, 4); // A -> C
    add_ref(2, 6); // B -> D
    add_ref(1, 3); // E -> F
    add_ref(3, 1); // F -> E, a two-object cycle
    add_ref(7, 0); // H -> A, but H is itself unreachable
}

static void mark_reachable(void)
{
    int stack[MAX_OBJECTS];
    int top = 0;
    int index;
    for (index = 0; index < object_count; index += 1)
    {
        // Clear marks before every collection; a stale mark from an earlier cycle would make an unreachable object look live.
        objects[index].marked = 0;
    }
    // Seed every explicit root, not just object 0; marking before pushing means each object enters the stack at most once.
    for (index = 0; index < root_count; index += 1)
    {
        int root = roots[index];
        if (root >= 0 && root < object_count && !objects[root].marked)
        {
            objects[root].marked = 1;
            stack[top++] = root;
        }
    }
    // DFS starts from the root set; the stack holds pending objects, not the object table itself.
    // Pop order is LIFO; the exact order is irrelevant to reachability as long as every pending object is processed.
    while (top > 0)
    {
        int current = stack[--top];
        int ref_index;
        // Follow every outgoing edge; the marked test prevents cycles from looping.
        // Scanning every reference for each object costs O(N*E); an adjacency list would make marking O(N+E).
        for (ref_index = 0; ref_index < ref_count; ref_index += 1)
        {
            if (refs[ref_index].from == current && !objects[refs[ref_index].to].marked)
            {
                // Mark on push, not on pop: two parents can reach the same child before either pops, and that must not push it twice.
                objects[refs[ref_index].to].marked = 1;
                stack[top++] = refs[ref_index].to;
            }
        }
    }
}

static void sweep(void)
{
    int index;
    for (index = 0; index < object_count; index += 1)
    {
        // Sweep frees every unmarked object; free is sticky until reset_graph rebuilds the object table.
        if (!objects[index].marked)
        {
            objects[index].free = 1;
        }
    }
}

static void print_spans(void)
{
    int cursor = 0;
    int index;
    // Free spans are the gaps between consecutive live intervals; after compaction only one tail gap remains.
    printf("free spans: ");
    for (index = 0; index < object_count; index += 1)
    {
        if (!objects[index].free)
        {
            if (objects[index].start > cursor)
            {
                printf("[%d, %d) ", cursor, objects[index].start);
            }
            cursor = objects[index].start + objects[index].size;
        }
    }
    if (cursor < CAPACITY)
    {
        printf("[%d, %d) ", cursor, CAPACITY);
    }
    printf("\n");
}

static void print_objects(int live_only)
{
    int index;
    for (index = 0; index < object_count; index += 1)
    {
        if (live_only && objects[index].free)
        {
            continue;
        }
        printf("%s [%d, %d) size=%d %s%s\n", objects[index].id, objects[index].start,
               objects[index].start + objects[index].size, objects[index].size,
               objects[index].free ? "free" : "live",
               objects[index].marked ? " marked" : "");
    }
}

static void mark_and_sweep(void)
{
    printf("mark-sweep\n");
    reset_graph();
    mark_reachable();
    sweep();
    print_objects(0);
    print_spans();
}

static void compact(void)
{
    int cursor = 0;
    int index;
    // compact() calls reset_graph(), so it is an independent demonstration rather than a continuation of mark_and_sweep().
    printf("compaction\n");
    reset_graph();
    mark_reachable();
    sweep();

    // Compaction moves live objects in object-array order; it preserves relative order but does not sort by original address.
    // Move every live object to the first free address after the previous one.
    for (index = 0; index < object_count; index += 1)
    {
        if (!objects[index].free)
        {
            int old_start = objects[index].start;
            objects[index].start = cursor;
            cursor += objects[index].size;
            printf("move %s: %d -> %d\n", objects[index].id, old_start, objects[index].start);
        }
    }

    // References store object indices, not raw addresses; moving start changes the address derived from the object, not the stored index.
    for (index = 0; index < ref_count; index += 1)
    {
        int from = refs[index].from;
        int to = refs[index].to;
        if (!objects[from].free && !objects[to].free)
        {
            printf("ref %s->%s fromStart=%d toStart=%d\n", objects[from].id, objects[to].id,
                   objects[from].start, objects[to].start);
        }
    }
    print_objects(1);
    print_spans();
}

int main(void)
{
    mark_and_sweep();
    compact();
    return 0;
}
