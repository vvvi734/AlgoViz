"""LSD 十进制基数排序的 Python 原理实现。

阅读顺序：
1. digit_at() 用 (value // power) % 10 取出当前位；不足的位自然得到 0。
2. radix_sort() 每一趟先清空十个桶，再按当前序列逐项追加，最后按 0..9 收集。
3. 所有趟都结束后才得到最终的稳定升序序列；没有任何一趟使用比较排序。

中文导读：桶是 FIFO 队列，先进入的记录先被收集；桶内次序保证稳定性。
复杂度：O(d(n+10))，d 是最大十进制位数；额外空间 O(n+10)。
输入/输出：main 使用官方多位整数，排序后打印 (关键字, 原始身份)。
"""

# Purpose: Extract the decimal digit selected by the current place value.
# 作用：按当前位权取出一个十进制数位；不足位自然得到 0。
def digit_at(value, power):
    return (value // power) % 10


# Purpose: Run stable LSD passes; the result is built only by distribution and collection.
# 作用：执行稳定的 LSD 各趟；最终结果只由分配和收集产生。
def radix_sort(values):
    if not 1 <= len(values) <= 16:
        raise ValueError("radix sort needs 1..16 records")
    for value in values:
        if value < 0:
            raise ValueError("radix sort only accepts non-negative integers")
        if value > 9999:
            raise ValueError("radix sort only accepts values up to 9999")

    records = [
        {"value": value, "original_index": index}
        for index, value in enumerate(values)
    ]
    maximum = max(record["value"] for record in records)
    max_digits = 1
    while maximum >= 10:
        maximum //= 10
        max_digits += 1

    order = list(range(len(records)))
    power = 1
    for _pass in range(max_digits):
        buckets = [[] for _ in range(10)]
        for record_index in order:
            digit = digit_at(records[record_index]["value"], power)
            buckets[digit].append(record_index)
        order = [record_index for bucket in buckets for record_index in bucket]
        power *= 10
    return [records[record_index] for record_index in order]


def main():
    ordered = radix_sort([170, 45, 75, 90, 802, 24, 2, 66])
    labels = [f"({record['value']},{chr(ord('A') + record['original_index'])})" for record in ordered]
    print(" -> ".join(labels))


if __name__ == "__main__":
    main()
