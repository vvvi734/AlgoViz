"""
中文导读：ISAM 主数据区按关键字有序分块；索引保存每块与溢出链的真实最大键。
查找先按上界选主块，扫描未命中再沿该块专属溢出链继续。插入时主块满则进入溢出区，
必须建立链接并刷新可能变化的上界。最后真实重查新记录，证明它可从结构访问。
易错点：索引上界不是下一块首键；主块命中不读链；新节点必须被链接；插入后不重查。
复杂度：索引 O(E)、主块 O(B)、溢出链 O(C)。所有读取计数只是教学模型。
输入/输出：6 条记录、主块容量 2；插入 105 后从溢出链命中。
"""

from dataclasses import dataclass, field


@dataclass
class Record:
    key: int
    label: str


@dataclass
class OverflowNode:
    records: list[Record] = field(default_factory=list)
    next: int = -1


@dataclass
class MainBlock:
    records: list[Record] = field(default_factory=list)
    overflow_head: int = -1


@dataclass
class IsamFile:
    blocks: list[MainBlock] = field(default_factory=list)
    overflow: list[OverflowNode] = field(default_factory=list)
    bounds: list[int] = field(default_factory=list)
    capacity: int = 2
    main_reads: int = 0
    overflow_reads: int = 0

    # Bounds are rebuilt from the main blocks plus overflow chains; they are never copied from the inserted key.
    def refresh_bounds(self) -> None:
        """作用：重算每块含溢出链的真实最大键，索引不盲目采用新插入值。"""
        self.bounds = [self.block_maximum(index)
        # The list comprehension rebuilds one bound per block; there is no incremental update path that could miss an overflow change.
                       for index in range(len(self.blocks))]

    def block_maximum(self, block_index: int) -> int:
        """作用：扫描主块与全部溢出节点，返回真实最大关键字。"""
        block = self.blocks[block_index]
        maximum = block.records[-1].key
        node = block.overflow_head
        while node >= 0:
            for record in self.overflow[node].records:
                maximum = max(maximum, record.key)
            node = self.overflow[node].next
            # The overflow walk follows next until -1; the chain is private to this main block, so records from other blocks are never examined.
        return maximum

    # The first bound >= target owns the candidate; if target exceeds every bound, the last block is still the only possible owner.
    def choose_block(self, target: int) -> int:
        """作用：选第一个上界不小于目标的主块；超过全部上界时选最后一块。"""
        for block_index, bound in enumerate(self.bounds):
            if bound >= target:
                return block_index
        return len(self.blocks) - 1
        # If no bound covers the target, the last block is still returned; this is a deterministic miss path, not a wraparound.

    def insert(self, record: Record) -> None:
        """作用：主块有空间按序插入；块满则追加到该块专属溢出链。"""
        # The block is fixed before overflow is considered, so a full block never sends the record to another block's chain.
        block_index = self.choose_block(record.key)
        block = self.blocks[block_index]
        if len(block.records) < self.capacity:
            block.records.append(record)
            # The record is appended first and the whole block is sorted afterward; Python's stable sort leaves equal keys in their existing relative order.
            block.records.sort(key=lambda item: item.key)  # 保持块内有序。
            print(f"insert {record.key} into main B{block_index}")
            self.refresh_bounds()
            return

        print(f"B{block_index} full: append {record.key} to overflow")
        if block.overflow_head < 0:
            block.overflow_head = len(self.overflow)
            self.overflow.append(OverflowNode())
            print(f"set B{block_index} overflowHead = O{block.overflow_head}")

        node = block.overflow_head
        while self.overflow[node].next >= 0:
            node = self.overflow[node].next
        if len(self.overflow[node].records) >= self.capacity:
            new_node = len(self.overflow)
            self.overflow.append(OverflowNode())
            # A new overflow node is created lazily only when the current tail is full; the private chain grows without a global preallocation.
            self.overflow[node].next = new_node
            print(f"link O{node} -> O{new_node}")
            node = new_node
        self.overflow[node].records.append(record)
        self.overflow[node].records.sort(key=lambda item: item.key)
        self.refresh_bounds()

    def lookup(self, target: int) -> tuple[int, bool]:
        """作用：主块扫描后沿专属链，分别计主区读取与溢出节点读取。"""
        block_index = self.choose_block(target)
        self.main_reads += 1
        # A main-block access is charged before the record loop; overflow reads are a separate counter charged only after a main miss.
        print(f"bound {self.bounds[block_index]} selects B{block_index}")
        block = self.blocks[block_index]
        for offset, record in enumerate(block.records):
            print(f"  compare main {record.key}")
            if record.key == target:
                return block_index * self.capacity + offset, False

        # A main-area hit returns immediately; the private overflow chain is read only after the main block misses.
        node = block.overflow_head
        while node >= 0:
            self.overflow_reads += 1
            print(f"  read overflow O{node}")
            current = self.overflow[node]
            for offset, record in enumerate(current.records):
                print(f"    compare overflow {record.key}")
                if record.key == target:
                    return node * self.capacity + offset, True
            node = current.next
        return -1, False


def main() -> None:
    records = [
        Record(101, "A"), Record(102, "B"), Record(103, "C"),
        Record(104, "D"), Record(106, "F"), Record(108, "H"),
    ]
    records.sort(key=lambda record: record.key)
    file = IsamFile()
    for start in range(0, len(records), file.capacity):
        file.blocks.append(MainBlock(records[start:start + file.capacity]))
    file.refresh_bounds()

    file.insert(Record(105, "E"))  # B2 已满，105 进入 B2 专属溢出链。
    found, from_overflow = file.lookup(105)
    print(f"lookup 105: {'hit' if found >= 0 else 'miss'} in "
          f"{'overflow' if from_overflow else 'main area'}, "
          f"main reads={file.main_reads}, overflow reads={file.overflow_reads}")


if __name__ == "__main__":
    main()
