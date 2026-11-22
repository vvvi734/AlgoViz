# 中文导读：先为每个连续数据块建立“块最大值”索引，再先查索引、后查一个块。
# 阅读顺序：先看 build_index 的切块与范围检查；再看 block_search 如何选第一个 max≥target 的块；最后看块内线性扫描。
# 关键不变量：块覆盖原列表且不重排；块最大值严格递增；后一块的所有值都大于前一块最大值。
# 易错点：为了“满足索引条件”静默排序；把块内有序也当成前提；目标大于所有最大值时仍进入最后一块。
# 复杂度：建索引 O(n)，查找 O(b+s)，b 为块数、s 为块大小；空间 O(b)。
# 输入/输出：输入原始列表、块大小与目标；返回真实下标或 -1；脚本打印索引与两阶段比较次数。
# 函数地图：先读 main 的调用顺序，再看 build_index、block_search 的职责与返回。

"""
Indexed sequential (block) search in Python 3.

Values stay in their original order; block_size only partitions the prefix.
Every index entry stores the real block maximum. The index is valid only when
maxima strictly increase and every later block lies above the previous maximum.
Inside one block the values may be unsorted, so the second stage is a real
linear scan rather than binary search.
"""

MAX_BLOCKS = 8
MAX_BLOCK_SIZE = 8


# Reject an unusable block size before building entries; otherwise slicing and max() would describe a partition the index cannot guarantee.
def build_index(data, block_size):
    if not data or not 1 <= block_size <= MAX_BLOCK_SIZE:
        raise ValueError("block size must be within 1..8")
    # Ceiling division allocates an index entry for the final short block; floor division would omit the tail whenever the length is not an exact multiple.
    blocks = (len(data) + block_size - 1) // block_size
    if blocks > MAX_BLOCKS:
        raise ValueError("too many blocks")
    index = []
    for block in range(blocks):
        start = block * block_size
        # Slice only the current block; the last chunk may be shorter than block_size, and max(chunk) must use its real length rather than a fixed width.
        chunk = data[start:start + block_size]
        maximum = max(chunk)
        # The index contract requires both strictly increasing maxima and every value above the previous maximum. Checking only the maximum would miss a small value hidden in a later block.
        if block > 0:
            if maximum <= index[-1]["max"]:
                raise ValueError("block maxima must strictly increase")
            if min(chunk) <= index[-1]["max"]:
                raise ValueError("later blocks must start above the previous maximum")
        index.append({"max": maximum, "start": start, "length": len(chunk)})
    return index


# Index probing and block scanning are separate stages; the returned counts keep their costs visible instead of collapsing them.
def block_search(data, block_size, target):
    index = build_index(data, block_size)
    index_comparisons = 0
    selected = None
    for block, entry in enumerate(index):
        index_comparisons += 1
        # The first block whose maximum is at least target is the only possible block: earlier maxima are too small, and later blocks all start above this maximum.
        if target <= entry["max"]:
            selected = block
            break
    # No maximum reaches target means the value exceeds every record; return -1 without scanning a block.
    if selected is None:
        return -1, index_comparisons, 0
    entry = index[selected]
    block_comparisons = 0
    for offset in range(entry["length"]):
        block_comparisons += 1
        # The selected block is scanned linearly because the index never promises sorted values inside a block. Only equality is a valid test here.
        if data[entry["start"] + offset] == target:
            return entry["start"] + offset, index_comparisons, block_comparisons
    return -1, index_comparisons, block_comparisons


if __name__ == "__main__":
    values = [22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69]
    for block, entry in enumerate(build_index(values, 4), start=1):
        print(f"block {block}: [{entry['start']}, {entry['start'] + entry['length']}) max={entry['max']}")
    for target in (38, 60):
        position, index_count, block_count = block_search(values, 4, target)
        print(f"find {target}: index={position} indexComparisons={index_count} blockComparisons={block_count}")
