"""Free-space list with First Fit / Best Fit and boundary tags."""

# A block owns the half-open interval [start, start + size).
class Block:
    def __init__(self, start, size, is_free, label=""):
        self.start = start
        self.size = size
        self.free = is_free
        self.label = label
        self.sync_tags()

    # Head and tail tags mirror the same size and state.
    def sync_tags(self):
        self.head_size = self.size
        self.tail_size = self.size
        self.head_free = self.free
        self.tail_free = self.free


class FreeList:
    def __init__(self, capacity):
        self.capacity = capacity
        self.blocks = [Block(0, capacity, True)]

    def allocate(self, block_id, request, best_fit=False):
        chosen = None
        best_remainder = None
        for index, block in enumerate(self.blocks):
            if not block.free or block.size < request:
                continue
            remainder = block.size - request
            if not best_fit:
                chosen = index
                break
            if best_remainder is None or remainder < best_remainder:
                best_remainder = remainder
                chosen = index
        if chosen is None:
            return False

        block = self.blocks[chosen]
        if block.size > request:
            self.blocks.insert(
                chosen + 1,
                Block(block.start + request, block.size - request, True),
            )
            block.size = request
        block.free = False
        block.label = block_id
        block.sync_tags()
        return True

    def release(self, block_id):
        index = None
        for position, block in enumerate(self.blocks):
            if not block.free and block.label == block_id:
                index = position
                break
        if index is None:
            return False

        block = self.blocks[index]
        block.free = True
        block.label = ""
        block.sync_tags()
        left_free = index > 0 and self.blocks[index - 1].free
        right_free = index + 1 < len(self.blocks) and self.blocks[index + 1].free

        if left_free:
            left = self.blocks[index - 1]
            merged = Block(left.start, left.size + block.size, True)
            self.blocks[index - 1] = merged
            del self.blocks[index]
            index -= 1
        if index + 1 < len(self.blocks) and self.blocks[index + 1].free:
            right = self.blocks[index + 1]
            merged = Block(self.blocks[index].start, self.blocks[index].size + right.size, True)
            self.blocks[index] = merged
            del self.blocks[index + 1]
        return True

    def print_blocks(self):
        for block in self.blocks:
            if block.free:
                print(f"free [{block.start}, {block.start + block.size}) size={block.size}")
            else:
                print(
                    f"used {block.label} [{block.start}, {block.start + block.size}) "
                    f"size={block.size} head={block.head_size} tail={block.tail_size}"
                )


def main():
    memory = FreeList(64)
    assert memory.allocate("A", 12)
    assert memory.allocate("B", 16)
    assert memory.allocate("C", 10)
    assert memory.allocate("D", 12)
    assert memory.allocate("E", 4)
    assert memory.release("B")
    assert memory.release("D")
    assert memory.allocate("F", 8)
    assert memory.release("C")
    assert memory.release("F")
    memory.print_blocks()
    # The next request is intentionally too large for any contiguous free block.
    print("request G=40 ->", "ok" if memory.allocate("G", 40) else "fail")
    memory.print_blocks()


if __name__ == "__main__":
    main()
