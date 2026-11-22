import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "sources/free-list"))
from free_list import FreeList

print("cap8", FreeList(8).allocate("A", 1))
for label, make in [
    ("cap7", lambda: FreeList(7)),
    ("cap129", lambda: FreeList(129)),
]:
    try:
        make()
        print(label, "accepted")
    except ValueError:
        print(label, "error")

memory = FreeList(64)
for label, action in [
    ("empty_id", lambda: memory.allocate("", 1)),
    ("long_id", lambda: memory.allocate("LONG", 1)),
    ("zero_request", lambda: memory.allocate("A", 0)),
    ("negative_request", lambda: memory.allocate("A", -1)),
    ("bool_request", lambda: memory.allocate("A", True)),
]:
    try:
        action()
        print(label, "accepted")
    except ValueError:
        print(label, "error")

print("too_large", memory.allocate("Z", 65))
duplicates = FreeList(64)
print("dup1", duplicates.allocate("D", 1))
try:
    duplicates.allocate("D", 1)
    print("dup2", "accepted")
except ValueError:
    print("dup2", "error")
print("dup_release", duplicates.release("D"), "unknown_release", duplicates.release("X"))

merge = FreeList(64)
print("merge_alloc", merge.allocate("A", 8), merge.allocate("B", 8), merge.allocate("C", 8))
print("merge_release", merge.release("C"), merge.release("B"), merge.release("A"))
print("merge_blocks", [(block.start, block.size, block.free, block.label) for block in merge.blocks])
