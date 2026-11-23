// Mark-and-sweep and storage compaction over a small object graph.
// Reachability is computed from roots; an object is not garbage merely because
// another unreachable object still points at it.
#include <iostream>
#include <string>
#include <vector>

struct Object
{
    std::string id;
    int start;
    int size;
    bool free;
    bool marked;
};

struct Reference
{
    int from;
    int to;
};

class MemoryGraph
{
public:
    MemoryGraph() { reset_graph(); }

    void mark_and_sweep()
    {
        std::cout << "mark-sweep\n";
        reset_graph();
        mark_reachable();
        sweep();
        print_objects(false);
        print_spans();
    }

    void compact()
    {
        // compact() resets the graph first, so it demonstrates compaction independently of the preceding mark-sweep output.
        std::cout << "compaction\n";
        reset_graph();
        mark_reachable();
        sweep();

        int cursor = 0;
        // Compaction moves objects in object-array order; the relative order is preserved, but it is not sorted by original address.
        // Move every live object to the first free address after the previous one.
        for (Object &object : objects_)
        {
            if (!object.free)
            {
                int old_start = object.start;
                object.start = cursor;
                cursor += object.size;
                std::cout << "move " << object.id << ": " << old_start
                          << " -> " << object.start << '\n';
            }
        }

        // References store object indices, not raw addresses; moving start changes the address derived from the object, not the stored index.
        for (const Reference &ref : refs_)
        {
            const Object &from = objects_[ref.from];
            const Object &to = objects_[ref.to];
            if (!from.free && !to.free)
            {
                std::cout << "ref " << from.id << "->" << to.id
                          << " fromStart=" << from.start << " toStart=" << to.start << '\n';
            }
        }
        print_objects(true);
        print_spans();
    }

private:
    void reset_graph()
    {
        objects_ = {
            {"A", 0, 12, false, false}, {"E", 12, 8, false, false},
            {"B", 20, 10, false, false}, {"F", 30, 8, false, false},
            {"C", 38, 8, false, false}, {"G", 46, 6, false, false},
            {"D", 52, 12, false, false}, {"H", 64, 8, false, false},
        };
        refs_ = {{0, 2}, {0, 4}, {2, 6}, {1, 3}, {3, 1}, {7, 0}};
    }

    void mark_reachable()
    {
        std::vector<int> stack;
        for (Object &object : objects_)
        {
            // Clear marks before each collection; a mark left from the previous cycle would keep garbage alive.
            object.marked = false;
        }
        // The demo has one root, A at index 0; a general collector must iterate a real root set.
        stack.push_back(0); // The demo has one root, A.
        // The vector is a LIFO pending stack; reachability is independent of the traversal order.
        while (!stack.empty())
        {
            int current = stack.back();
            stack.pop_back();
            if (objects_[current].marked)
            {
                continue;
            }
            // Mark at pop time; an object can be pushed by several parents before its first pop marks it.
            objects_[current].marked = true;
            // Follow every outgoing edge; the marked test prevents cycles from looping.
            // Scanning all references for every popped object is O(N*E); an adjacency list would reduce marking to O(N+E).
            for (const Reference &ref : refs_)
            {
                if (ref.from == current && !objects_[ref.to].marked)
                {
                    stack.push_back(ref.to);
                }
            }
        }
    }

    void sweep()
    {
        for (Object &object : objects_)
        {
            // Sweep frees every unmarked object; free is not cleared until reset_graph builds a fresh table.
            if (!object.marked)
            {
                object.free = true;
            }
        }
    }

    void print_spans() const
    {
        int cursor = 0;
        // Free spans are gaps between live intervals; compaction leaves one contiguous tail span.
        std::cout << "free spans: ";
        for (const Object &object : objects_)
        {
            if (!object.free)
            {
                if (object.start > cursor)
                {
                    std::cout << "[" << cursor << ", " << object.start << ") ";
                }
                cursor = object.start + object.size;
            }
        }
        if (cursor < 96)
        {
            std::cout << "[" << cursor << ", " << 96 << ") ";
        }
        std::cout << '\n';
    }

    void print_objects(bool live_only) const
    {
        for (const Object &object : objects_)
        {
            if (live_only && object.free)
            {
                continue;
            }
            std::cout << object.id << " [" << object.start << ", "
                      << object.start + object.size << ") size=" << object.size
                      << (object.free ? " free" : " live")
                      << (object.marked ? " marked" : "") << '\n';
        }
    }

    std::vector<Object> objects_;
    std::vector<Reference> refs_;
};

int main()
{
    MemoryGraph graph;
    graph.mark_and_sweep();
    graph.compact();
    return 0;
}
