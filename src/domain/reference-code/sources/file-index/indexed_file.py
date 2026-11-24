"""
中文导读：记录按主关键字排序后切成文件块。稠密索引为每条记录保留一项；
稀疏索引只为每块最后一条记录保留上界。查找先线性检查索引，选“不大于目标的最后一项”，
再读一个数据块并在块内确认。失败也读取一个块，因此成功与失败 I/O 可比。
易错点：稀疏索引误选第一个更大的项；命中索引后不再比较记录；把模拟块计数当真实磁盘。
复杂度：索引检查 O(E)，块内比较 O(B)。本文件不访问真实文件系统。
输入/输出：固定 8 条记录、块容量 3，打印稠密/稀疏命中与失败。
"""

from dataclasses import dataclass, field


@dataclass
class Record:
    key: int
    label: str


@dataclass
class Block:
    records: list[Record] = field(default_factory=list)


@dataclass
class Entry:
    key: int
    block_index: int


@dataclass
class Io:
    probes: int = 0
    block_reads: int = 0


def build_blocks(records: list[Record], capacity: int) -> list[Block]:
    """作用：按块容量切块；块号就是索引项地址。"""
    return [Block(records[start:start + capacity])
    # List slicing already truncates at the end, so the final block is partial without an explicit min() or padding step.
            for start in range(0, len(records), capacity)]


# Dense mode emits every record; sparse mode emits only the last key of each block as an upper bound.
def build_index(blocks: list[Block], dense: bool) -> list[Entry]:
    """作用：稠密每记录一项；稀疏每块一项，使用块内最后键作为上界。"""
    index: list[Entry] = []
    for block_index, block in enumerate(blocks):
        if dense:
            for record in block.records:
                index.append(Entry(record.key, block_index))
        else:
            index.append(Entry(block.records[-1].key, block_index))
            # The sparse entry uses the block's last key as an inclusive upper bound and records the block index for the later probe.
    return index


def lookup(blocks: list[Block], index: list[Entry], target: int,
           capacity: int) -> tuple[int, Io]:
    """作用：选不大于目标的最后一项，读一个块，再在块内逐条比较；位置按同一容量换算。"""
    io = Io()
    # chosen starts at 0 so a target above every entry still selects the last valid block.
    chosen = 0
    # chosen is pre-seeded so a target below every bound still selects block 0 and the lookup has a defined one-block cost.
    for position, entry in enumerate(index):
        io.probes += 1
        if entry.key == target:
        # An exact hit ends the probe immediately; there is no reason to inspect larger upper bounds after the owning block is known.
            chosen = position
            break
        if entry.key > target:
            break
        chosen = position

    # A miss still reads the selected block once; in-block comparisons are record checks, not extra block I/O.
    block_index = index[chosen].block_index
    io.block_reads = 1
    # The counter records block reads, not Python comparisons; in-block record checks do not add to it.
    print(f"index chooses block B{block_index} (entry {index[chosen].key})")
    for offset, record in enumerate(blocks[block_index].records):
        print(f"  compare {record.key} ({record.label})")
        if record.key == target:
            return block_index * capacity + offset, io
            # The capacity comes from the same layout used by build_blocks; a literal 3 here would break as soon as the block size changes.
    return -1, io


def main() -> None:
    records = [
        Record(107, "G"), Record(101, "A"), Record(105, "E"), Record(103, "C"),
        Record(102, "B"), Record(108, "H"), Record(104, "D"), Record(106, "F"),
    ]
    records.sort(key=lambda record: record.key)  # 稳定排序：相等键保持输入次序。
    blocks = build_blocks(records, 3)

    for dense in (True, False):
        index = build_index(blocks, dense)
        found, io = lookup(blocks, index, 106, 3)
        kind = "dense" if dense else "sparse"
        print(f"{kind} index: {len(index)} entries")
        print(f"lookup 106: {'hit' if found >= 0 else 'miss'}, "
              f"probes={io.probes}, block reads={io.block_reads}")

    index = build_index(blocks, True)
    missing, io = lookup(blocks, index, 109, 3)
    print(f"lookup 109: {'hit' if missing >= 0 else 'miss'}, "
          f"probes={io.probes}, block reads={io.block_reads}")


if __name__ == "__main__":
    main()
