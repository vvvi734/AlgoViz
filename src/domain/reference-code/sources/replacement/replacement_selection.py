"""置换选择排序的 Python 原理实现。

阅读顺序：
1. 初始工作区装入前 M 条记录，全部 eligible。
2. emit_smallest() 选出最小可输出记录，放入当前段，并补读一条新记录。
3. 新记录不小于 lastOutput 时继续 eligible，否则 frozen；没有可输出记录时封段并解冻。

关键不变量：当前段按 (value, original_index) 非降序；冻结记录仍占工作区槽位。
易错点：把输入按固定长度切片；冻结记录被删除；解冻后忘记清空阈值；
把空槽当成关键字 0；只验证段内有序而不检查输入多重集合。
复杂度：每条输出扫描至多 M 个槽位，O(n × M)，额外空间 O(M + n)。
输入/输出：main 使用 [7,3,9,1,8,2,6,4,5] 和工作区 3，打印每个初始段。
"""


# The tuple key falls back to input position, so equal values preserve their original order.
def comes_before(left, right):
    return (left["value"], left["original_index"]) < (right["value"], right["original_index"])


# Purpose: Run replacement selection over a fixed workspace and return the runs.
# 作用：真实运行置换选择，返回所有初始归并段。
def replacement_selection(values, capacity):
    if not 1 <= len(values) <= 20:
        raise ValueError("replacement selection needs 1..20 records")
    if not 2 <= capacity <= 6:
        raise ValueError("workspace capacity must be 2..6")

    records = [
        {"value": value, "original_index": index}
        for index, value in enumerate(values)
    ]
    # workspace stores resident candidates; current is a separate list, so the emitted run can grow beyond capacity.
    workspace = [
        {"item": records[index], "state": "eligible"} if index < min(capacity, len(records))
        else {"item": None, "state": "empty"}
        for index in range(capacity)
    ]
    input_index = min(capacity, len(records))
    runs = []
    # current is appended in nondecreasing key order: every eligible refill is checked against last_output.
    current = []
    # None is the no-threshold sentinel; it distinguishes the first output from a real threshold value of 0.
    last_output = None

    while True:
        # Only eligible slots compete; frozen records remain resident but are invisible to the selector.
        eligible = [slot for slot in workspace if slot["state"] == "eligible"]
        if eligible:
            winner = min(eligible, key=lambda slot: (slot["item"]["value"], slot["item"]["original_index"]))
            # Append the winner to the run buffer before refilling; the run is outside workspace and may exceed capacity.
            current.append(winner["item"])
            last_output = winner["item"]["value"]
            winner["item"] = None
            # The winner's slot becomes empty and can receive exactly one replacement; a frozen slot is never overwritten.
            winner["state"] = "empty"

            if input_index < len(records):
                empty = next(slot for slot in workspace if slot["state"] == "empty")
                incoming = records[input_index]
                input_index += 1
                empty["item"] = incoming
                # Equality is eligible: only a key below last_output would break the current run's sorted order.
                empty["state"] = (
                    "eligible"
                    if last_output is None or incoming["value"] >= last_output
                    else "frozen"
                )
            continue

        # No eligible record ends the run; append the completed buffer before unfreezing records for the next run.
        if current:
            runs.append(current)
            current = []

        unfrozen = 0
        for slot in workspace:
            # Unfreezing only changes state to eligible; the same record stays in the same slot with the same key.
            if slot["state"] == "frozen":
                slot["state"] = "eligible"
                unfrozen += 1
        if unfrozen == 0:
            if input_index >= len(records):
                break
            raise ValueError("remaining input without a resident record")
        # A new run has no threshold; keeping the previous last_output would freeze records that are now valid.
        last_output = None

    for run in runs:
        for left, right in zip(run, run[1:]):
            if not comes_before(left, right):
                raise ValueError("a generated run is not sorted")
    emitted = [item for run in runs for item in run]
    if len(emitted) != len(records):
        raise ValueError("generated runs do not cover every input record")
    return runs


def main():
    runs = replacement_selection([7, 3, 9, 1, 8, 2, 6, 4, 5], 3)
    for index, run in enumerate(runs):
        values = " ".join(str(item["value"]) for item in run)
        print(f"run{chr(ord('A') + index)} length={len(run)}: {values}")
    print(f"runs={len(runs)} records={sum(len(run) for run in runs)} workspace=3")


if __name__ == "__main__":
    main()
