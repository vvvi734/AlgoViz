import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "sources/radix"))
from radix_sort import radix_sort

print("normal", radix_sort([170, 45, 45, 90, 802, 24, 2, 66]))
for label, values in [
    ("empty", []),
    ("negative", [-1]),
    ("too_large", [10000]),
    ("too_many", list(range(1, 18))),
]:
    try:
        radix_sort(values)
        print(label, "accepted")
    except ValueError as error:
        print(label, "ValueError", str(error))

maximum = radix_sort(list(range(16, 0, -1)))
print("max_batch", len(maximum), maximum[0], maximum[-1])
