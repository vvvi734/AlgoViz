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
    add_object("A", 0, 12);
    add_object("E", 12, 8);
    add_object("B", 20, 10);
    add_object("F", 30, 8);
    add_object("C", 38, 8);
    add_object("G", 46, 6);
    add_object("D", 52, 12);
    add_object("H", 64, 8);
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
    int root = 0; // The demo has one root, A.
    int index;
    for (index = 0; index < object_count; index += 1)
    {
        objects[index].marked = 0;
    }
    stack[top++] = root;
    while (top > 0)
    {
        int current = stack[--top];
        int ref_index;
        if (objects[current].marked)
        {
            continue;
        }
        objects[current].marked = 1;
        // Follow every outgoing edge; the marked test prevents cycles from looping.
        for (ref_index = 0; ref_index < ref_count; ref_index += 1)
        {
            if (refs[ref_index].from == current && !objects[refs[ref_index].to].marked)
            {
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
    printf("compaction\n");
    reset_graph();
    mark_reachable();
    sweep();

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

    // Every reference stores an address, so all endpoints must be refreshed.
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
