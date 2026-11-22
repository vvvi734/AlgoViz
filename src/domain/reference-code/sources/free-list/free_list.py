"""Free-space list with First Fit / Best Fit and boundary tags."""

# Free-space list: First Fit / Best Fit over one simulated address range.
# A block owns half-open [start, start + size); size is a length, not an inclusive end address.
# blocks is an address-ordered list of Block objects; adjacency is determined by list indices.
# free and label are canonical; head/tail tags are teaching copies of size and occupancy.
class Block:
    # The constructor stores start, size, free and label, then immediately syncs the simulated boundary tags.
    def __init__(self, start, size, is_free, label=""):
        self.start = start
        self.size = size
        self.free = is_free
        self.label = label
        self.sync_tags()

    # sync_tags must follow every size or occupancy change; otherwise the footer describes an old interval.
    def sync_tags(self):
        self.head_size = self.size
        self.tail_size = self.size
        self.head_free = self.free
        self.tail_free = self.free


# The list starts with one free block [0, capacity); every later allocation splits an existing hole.
class FreeList:
    def __init__(self, capacity):
        # capacity records the original simulated size; allocation still uses the current Block.size values.
        self.capacity = capacity
        self.blocks = [Block(0, capacity, True)]

    # best_fit is a per-call policy switch; it does not mutate the list, so later calls may choose differently.
    # The scan follows list order, which is address order; First Fit may stop at the first adequate block.
    def allocate(self, block_id, request, best_fit=False):
        # None is the sentinel for "no candidate"; best_remainder stays None until the first adequate block.
        chosen = None
        best_remainder = None
        for index, block in enumerate(self.blocks):
            # Used blocks and blocks smaller than request cannot yield a non-negative free remainder.
            if not block.free or block.size < request:
                continue
            remainder = block.size - request
            # First Fit breaks immediately; Best Fit keeps the smallest remainder and uses < so ties keep the earlier address.
            if not best_fit:
                chosen = index
                break
            if best_remainder is None or remainder < best_remainder:
                best_remainder = remainder
                chosen = index
        # If chosen is None, return False and leave the list unchanged; no single hole can hold the request.
        if chosen is None:
            return False

        block = self.blocks[chosen]
        # A block larger than the request is split; exact fit skips the split and just changes occupancy.
        if block.size > request:
            self.blocks.insert(
                chosen + 1,
                # The suffix begins at old start+request and has size oldSize-request, so the ranges are adjacent and disjoint.
                Block(block.start + request, block.size - request, True),
            )
            # Insert the suffix before shrinking block: Block(...) reads the old size, and block is an object reference that survives list insertion.
            block.size = request
        # After insertion, block still names the chosen object; set occupancy and label before sync_tags so the footer copies the final state.
        block.free = False
        block.label = block_id
        block.sync_tags()
        return True

    # Only an allocated block with the exact ID can be released; unknown or already-free IDs return False.
    # If neither side is free, the released record remains an independent hole.
    def release(self, block_id):
        index = None
        for position, block in enumerate(self.blocks):
            if not block.free and block.label == block_id:
                index = position
                break
        if index is None:
            return False

        block = self.blocks[index]
        # Mark free and clear the label before neighbour checks, so the released interval is visible as a hole.
        block.free = True
        block.label = ""
        block.sync_tags()
        # left_free and right_free snapshot adjacency before any deletion; only true neighbours may be merged.
        left_free = index > 0 and self.blocks[index - 1].free
        # right_free records the pre-deletion neighbour snapshot; the second branch below rechecks the shifted neighbour instead of trusting this old boolean.
        right_free = index + 1 < len(self.blocks) and self.blocks[index + 1].free

        # A left merge uses the left block's start and the sum of both sizes, then deletes the released record at index.
        if left_free:
            left = self.blocks[index - 1]
            # The merged object starts at left.start and spans both adjacent lengths.
            merged = Block(left.start, left.size + block.size, True)
            self.blocks[index - 1] = merged
            del self.blocks[index]
            # index -= 1 is required because the deletion shifted the merged block one slot left.
            index -= 1
        # After a left deletion, index -= 1 makes index+1 the original right neighbour; the condition must be evaluated anew because the list shifted.
        if index + 1 < len(self.blocks) and self.blocks[index + 1].free:
            right = self.blocks[index + 1]
            # The second merge keeps the current start and adds the right length, covering the adjacent range.
            merged = Block(self.blocks[index].start, self.blocks[index].size + right.size, True)
            self.blocks[index] = merged
            del self.blocks[index + 1]
        return True

    # print_blocks walks the list in address order; visible [start,end) ranges should tile the capacity without gaps.
    def print_blocks(self):
        for block in self.blocks:
            if block.free:
                print(f"free [{block.start}, {block.start + block.size}) size={block.size}")
            else:
                print(
                    f"used {block.label} [{block.start}, {block.start + block.size}) "
                    f"size={block.size} head={block.head_size} tail={block.tail_size}"
                )


# The asserts assume the fixed demonstration sequence succeeds; under -O they disappear, so this is a teaching harness, not a runtime guarantee.
# A-E place adjacent allocations, leaving one trailing free interval.
def main():
    memory = FreeList(64)
    assert memory.allocate("A", 12)
    assert memory.allocate("B", 16)
    assert memory.allocate("C", 10)
    assert memory.allocate("D", 12)
    assert memory.allocate("E", 4)
    # Releasing B and D creates two isolated holes; F reuses the earlier hole under the default First Fit.
    assert memory.release("B")
    assert memory.release("D")
    # F is allocated after the releases, demonstrating hole reuse rather than tail growth.
    assert memory.allocate("F", 8)
    # Releasing C and F exercises two-sided coalescing; G=40 exceeds every remaining hole and must fail.
    assert memory.release("C")
    assert memory.release("F")
    memory.print_blocks()
    print("request G=40 ->", "ok" if memory.allocate("G", 40) else "fail")
    memory.print_blocks()


if __name__ == "__main__":
    main()
