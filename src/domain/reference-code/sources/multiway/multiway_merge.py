"""k 路平衡归并的 Python 原理实现。

阅读顺序：
1. fill_run() 把一个模拟块读入某段输入缓冲区，只有队首会成为候选。
2. merge_runs() 反复比较 k 个队首，输出最小记录并推进对应段。
3. flush_output() 在输出缓冲区满时写出一块；循环结束后还要写残余块。

关键不变量：每段缓冲区是尚未消费记录的一个连续前缀；候选只来自各段缓冲区头。
易错点：把整段都当候选；段耗尽后仍保留旧候选；丢掉最后不满块；
把 READ_BLOCKS / WRITE_BLOCKS 误认为浏览器真实磁盘访问。
复杂度：线性扫描 k 个候选为 O(n × k)；败者树可把选择降到 O(n log k)。
输入/输出：main 合并 [2,5,9] 与 [1,6,10]，打印稳定结果和模拟块计数。
"""


def comes_before(left, right):
    return (left["value"], left["original_index"]) < (right["value"], right["original_index"])


# Purpose: Read one simulated block into the free tail of a run's FIFO buffer.
# 作用：向某段输入缓冲区尾部读入一个模拟块；缓冲区满或没有剩余记录时不读。
def fill_run(run, block_size, capacity, counters):
    free_slots = capacity - len(run["buffer"])
    remaining = len(run["records"]) - run["cursor"]
    take = min(block_size, free_slots, remaining)
    if take <= 0:
        return
    run["buffer"].extend(range(run["cursor"], run["cursor"] + take))
    run["cursor"] += take
    counters["reads"] += 1


# Purpose: Merge exactly k ordered runs, returning written records and I/O counters.
# 作用：执行一趟 k 路归并，返回已写出记录与模拟读写计数。
def merge_runs(runs, capacity, block_size):
    counters = {"reads": 0, "writes": 0}
    output_buffer = []
    written = []

    for run in runs:
        fill_run(run, block_size, capacity, counters)

    while True:
        candidates = [
            (run_index, run["buffer"][0])
            for run_index, run in enumerate(runs)
            if run["buffer"]
        ]
        if not candidates:
            break

        winner_run = None
        winner_record = None
        for run_index, record_index in candidates:
            record = runs[run_index]["records"][record_index]
            if winner_record is None or comes_before(record, winner_record):
                winner_run = run_index
                winner_record = record

        owner = runs[winner_run]
        owner["buffer"].pop(0)
        output_buffer.append(winner_record)

        if len(output_buffer) == capacity:
            written.extend(output_buffer)
            output_buffer.clear()
            counters["writes"] += 1

        if not owner["buffer"]:
            fill_run(owner, block_size, capacity, counters)

    # The final partial block still counts as one simulated write.
    if output_buffer:
        written.extend(output_buffer)
        counters["writes"] += 1

    if len(written) != sum(len(run["records"]) for run in runs):
        raise ValueError("merge did not output every record")
    for left, right in zip(written, written[1:]):
        if not comes_before(left, right):
            raise ValueError("merge output is not stably sorted")
    return written, counters


def main():
    runs = [
        {
            "records": [
                {"value": 2, "original_index": 0},
                {"value": 5, "original_index": 1},
                {"value": 9, "original_index": 2},
            ],
            "cursor": 0,
            "buffer": [],
        },
        {
            "records": [
                {"value": 1, "original_index": 3},
                {"value": 6, "original_index": 4},
                {"value": 10, "original_index": 5},
            ],
            "cursor": 0,
            "buffer": [],
        },
    ]
    written, counters = merge_runs(runs, 2, 1)
    labels = [f"({record['value']},{chr(ord('A') + record['original_index'])})" for record in written]
    print("merged: " + " ".join(labels))
    print(
        f"records={len(written)} readBlocks={counters['reads']} "
        f"writeBlocks={counters['writes']} mergePasses=1"
    )
    print("note: simulated teaching I/O, not browser disk access")


if __name__ == "__main__":
    main()
