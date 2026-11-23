"""Buddy-system allocation and release over a power-of-two capacity."""


class Block:
    def __init__(self, start, size, is_free, label=""):
        self.start = start
        self.size = size
        # For a power-of-two block size, bit_length()-1 is exactly log2(size).
        self.level = size.bit_length() - 1
        self.free = is_free
        self.label = label


class BuddyHeap:
    def __init__(self, capacity):
        if capacity <= 0 or capacity & (capacity - 1):
            # Capacity is rejected at construction; later XOR buddy math would be invalid for a non-power-of-two range.
            raise ValueError("capacity must be a power of two")
        self.capacity = capacity
        self.max_level = capacity.bit_length() - 1
        self.blocks = [Block(0, capacity, True)]

    def allocate(self, block_id, request):
        if request <= 0 or request > self.capacity:
            return False
        # This expression rounds request up to its level; request 3 becomes level 2 (size 4).
        target = (request - 1).bit_length()
        chosen = None
        # Find the smallest free block at or above the rounded target level.
        # Scan from the rounded level upward; the first free level avoids needless extra splitting.
        for level in range(target, self.max_level + 1):
            for index, block in enumerate(self.blocks):
                if block.free and block.level == level:
                    chosen = index
                    break
            if chosen is not None:
                break
        if chosen is None:
            return False

        # Halve the chosen block repeatedly; the left half stays the working block.
        # The split loop keeps the left half and inserts the right half after it, preserving address order.
        while self.blocks[chosen].level > target:
            block = self.blocks[chosen]
            half = block.size // 2
            block.size = half
            block.level -= 1
            self.blocks.insert(chosen + 1, Block(block.start + half, half, True))
        # Only after all splits is the chosen block marked used; a half-split block must remain free.
        self.blocks[chosen].free = False
        self.blocks[chosen].label = block_id
        return True

    def release(self, block_id):
        index = None
        for position, block in enumerate(self.blocks):
            if not block.free and block.label == block_id:
                index = position
                break
        if index is None:
            return False

        self.blocks[index].free = True
        self.blocks[index].label = ""
        while self.blocks[index].level < self.max_level:
            block = self.blocks[index]
            # XOR is the sibling address because size is a power of two and the block is aligned.
            buddy_start = block.start ^ block.size
            buddy = None
            for position, candidate in enumerate(self.blocks):
                if (
                    position != index
                    and candidate.free
                    and candidate.start == buddy_start
                    and candidate.size == block.size
                ):
                    buddy = position
                    break
            # A missing, used or differently sized buddy prevents merging at this level.
            if buddy is None:
                break
            # The merged block starts at the smaller address and doubles its size.
            # The merged block starts at the smaller address; otherwise its address and level no longer match.
            if self.blocks[buddy].start < block.start:
                block.start = self.blocks[buddy].start
            block.size *= 2
            block.level += 1
            if buddy < index:
                index -= 1
            del self.blocks[buddy]
        return True

    def print_blocks(self):
        for block in self.blocks:
            state = "free" if block.free else f"used {block.label}"
            print(
                f"[{block.start}, {block.start + block.size}) "
                f"size={block.size} level={block.level} {state}"
            )


def main():
    memory = BuddyHeap(32)
    assert memory.allocate("A", 3)
    assert memory.allocate("B", 5)
    assert memory.allocate("C", 2)
    assert memory.release("B")
    assert memory.release("C")
    memory.print_blocks()
    # A 32-byte request cannot fit once the root has been split and used.
    print("request D=32 ->", "ok" if memory.allocate("D", 32) else "fail")
    memory.print_blocks()


if __name__ == "__main__":
    main()
