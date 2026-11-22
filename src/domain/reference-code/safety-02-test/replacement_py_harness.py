import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "sources/replacement"))
from replacement_selection import replacement_selection

values = [7, 3, 9, 1, 8, 2, 6, 4, 5]
runs = replacement_selection(values, 3)
print("VALID_RUNS", len(runs))
print("VALID_SORTED", all(
    all((left["value"], left["original_index"]) <= (right["value"], right["original_index"]) for left, right in zip(run, run[1:]))
    for run in runs
))
print("VALID_COVER", sorted(item["original_index"] for run in runs for item in run) == list(range(len(values))))

maximum = list(range(20, 0, -1))
maximum_runs = replacement_selection(maximum, 2)
print("MAX_BATCH_RUNS", len(maximum_runs))
print("MAX_BATCH_SORTED", all(
    all((left["value"], left["original_index"]) <= (right["value"], right["original_index"]) for left, right in zip(run, run[1:]))
    for run in maximum_runs
))
print("MAX_BATCH_COVER", sorted(item["original_index"] for run in maximum_runs for item in run) == list(range(20)))

for label, args in [
    ("empty", ([], 3)),
    ("capacity_one", (values, 1)),
    ("capacity_seven", (values, 7)),
    ("too_many", (list(range(1, 22)), 3)),
    ("bool_capacity", (values, True)),
]:
    try:
        replacement_selection(*args)
        print(label, "accepted")
    except ValueError as error:
        print(label, "ValueError", str(error))
