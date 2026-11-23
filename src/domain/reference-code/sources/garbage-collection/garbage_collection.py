"""Mark-and-sweep and storage compaction over a small object graph."""

# Reachability is computed from roots; an object is not garbage merely because
# another unreachable object still points at it.


class Object:
    def __init__(self, object_id, start, size):
        self.id = object_id
        self.start = start
        self.size = size
        self.free = False
        self.marked = False


class MemoryGraph:
    def __init__(self):
        self.objects = []
        self.refs = []
        self.reset_graph()

    def reset_graph(self):
        self.objects = [
            Object("A", 0, 12),
            Object("E", 12, 8),
            Object("B", 20, 10),
            Object("F", 30, 8),
            Object("C", 38, 8),
            Object("G", 46, 6),
            Object("D", 52, 12),
            Object("H", 64, 8),
        ]
        # Each pair is (from index, to index); a reference stores both endpoints.
        self.refs = [(0, 2), (0, 4), (2, 6), (1, 3), (3, 1), (7, 0)]

    def mark_reachable(self):
        for obj in self.objects:
            # Clear marks before each collection; a stale True would make unreachable objects survive the sweep.
            obj.marked = False
        # The demo has one root, A at index 0; a real collector must enumerate a root set.
        stack = [0]  # The demo has one root, A.
        # The list is a LIFO pending stack; the order does not affect which objects are reachable.
        while stack:
            current = stack.pop()
            if self.objects[current].marked:
                continue
            # Mark at pop time; different parents may append the same object before it is first marked.
            self.objects[current].marked = True
            # Follow every outgoing edge; the marked test prevents cycles from looping.
            # Scanning every reference for each popped object is O(N*E); an adjacency list would make marking O(N+E).
            for source, target in self.refs:
                if source == current and not self.objects[target].marked:
                    stack.append(target)

    def sweep(self):
        for obj in self.objects:
            # Sweep frees every unmarked object; the free flag persists until reset_graph creates a fresh table.
            if not obj.marked:
                obj.free = True

    def print_spans(self):
        cursor = 0
        spans = []
        for obj in self.objects:
            if not obj.free:
                if obj.start > cursor:
                    spans.append((cursor, obj.start))
                cursor = obj.start + obj.size
        if cursor < 96:
            spans.append((cursor, 96))
        # Free spans are the gaps between live intervals; after compaction there is one tail span.
        print("free spans:", spans)

    def print_objects(self, live_only=False):
        for obj in self.objects:
            if live_only and obj.free:
                continue
            state = "free" if obj.free else "live"
            mark = " marked" if obj.marked else ""
            print(f"{obj.id} [{obj.start}, {obj.start + obj.size}) size={obj.size} {state}{mark}")

    def mark_and_sweep(self):
        print("mark-sweep")
        self.reset_graph()
        self.mark_reachable()
        self.sweep()
        self.print_objects()
        self.print_spans()

    def compact(self):
        # compact() resets the graph, so it is an independent compaction demo rather than a continuation of mark_and_sweep().
        print("compaction")
        self.reset_graph()
        self.mark_reachable()
        self.sweep()

        cursor = 0
        # Move every live object to the first free address after the previous one.
        # Compaction walks the object array, not the address-sorted list; relative order is preserved but not re-sorted by start.
        for obj in self.objects:
            if not obj.free:
                old_start = obj.start
                obj.start = cursor
                cursor += obj.size
                print(f"move {obj.id}: {old_start} -> {obj.start}")

        # References store object indices, not raw addresses; moving start changes the address derived from the object, not the stored index.
        for source, target in self.refs:
            source_obj = self.objects[source]
            target_obj = self.objects[target]
            if not source_obj.free and not target_obj.free:
                print(
                    f"ref {source_obj.id}->{target_obj.id} "
                    f"fromStart={source_obj.start} toStart={target_obj.start}"
                )
        self.print_objects(live_only=True)
        self.print_spans()


def main():
    graph = MemoryGraph()
    graph.mark_and_sweep()
    graph.compact()


if __name__ == "__main__":
    main()
