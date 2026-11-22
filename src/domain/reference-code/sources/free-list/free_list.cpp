// Free-space list: First Fit / Best Fit over one simulated address range.
// A descriptor owns half-open [start, start + size); this program models block records, not raw pointer memory.
// The vector stays in address order, so adjacency is decided by neighbouring indices.
// head/tail tags are teaching copies of size and occupancy, not independent allocator metadata.
#include <iostream>
#include <string>
#include <vector>

// start and size define [start, start + size); size is a length, not an inclusive address.
// free and label are canonical occupancy state; the four tag fields only mirror them.
struct Block
{
    int start;
    int size;
    bool free;
    std::string label;
    int head_size;
    int tail_size;
    bool head_free;
    bool tail_free;

    // sync_tags must run after every size or state change, or the printed footer becomes stale.
    void sync_tags()
    {
        head_size = size;
        tail_size = size;
        head_free = free;
        tail_free = free;
    }
};

// FreeList owns a vector of Block records; no manual new/delete is involved, and vector growth moves elements but not logical addresses.
class FreeList
{
public:
    // The constructor creates one free block [0,total); capacity_ is kept as a sentinel bound and as the original memory size.
    explicit FreeList(int total) : capacity_(total), policy_(false)
    {
        Block root{0, total, true, "", 0, 0, true, true};
        root.sync_tags();
        blocks_.push_back(root);
    }

    // The scan follows vector order, which is address order; First Fit can return at the first adequate block.
    bool allocate(const std::string &id, int request)
    {
        // chosen<0 and capacity_+1 encode "no candidate"; any real remainder is smaller than the sentinel.
        int chosen = -1;
        int best_remainder = capacity_ + 1;
        for (int index = 0; index < static_cast<int>(blocks_.size()); ++index)
        {
            // block is a reference, not a copy; it must not survive vector::insert/erase, so later code re-indexes blocks_[chosen].
            const Block &block = blocks_[index];
            // Used blocks and blocks too small for the request cannot produce a valid free prefix.
            if (!block.free || block.size < request)
            {
                continue;
            }
            int remainder = block.size - request;
            // First Fit breaks immediately; Best Fit continues to compare remainders and uses < so ties keep the earlier block.
            if (!policy_)
            {
                chosen = index;
                break;
            }
            if (remainder < best_remainder)
            {
                best_remainder = remainder;
                chosen = index;
            }
        }
        // If no candidate exists, return false and leave blocks_ unchanged; the request has no single contiguous hole.
        if (chosen < 0)
        {
            return false;
        }
        // A block larger than the request is split; exact fit skips the split and simply changes occupancy.
        if (blocks_[chosen].size > request)
        {
            Block remainder;
            // The suffix starts at start+request and has size oldSize-request, so prefix and suffix are adjacent and disjoint.
            remainder.start = blocks_[chosen].start + request;
            remainder.size = blocks_[chosen].size - request;
            remainder.free = true;
            remainder.sync_tags();
            // vector::insert shifts later records right; after it returns, refer to blocks_[chosen], not the old reference.
            blocks_.insert(blocks_.begin() + chosen + 1, remainder);
            // Shrink the chosen prefix after insertion; its start is unchanged and the new suffix remains at chosen+1.
            blocks_[chosen].size = request;
        }
        // Set occupancy and label before sync_tags, then let the footer copy the finished state.
        blocks_[chosen].free = false;
        blocks_[chosen].label = id;
        blocks_[chosen].sync_tags();
        return true;
    }

    // Only an allocated block with the exact label can be released; missing or already-free IDs return false.
    // If neither side is free, the released record remains an independent hole.
    bool release(const std::string &id)
    {
        int index = -1;
        for (int position = 0; position < static_cast<int>(blocks_.size()); ++position)
        {
            if (!blocks_[position].free && blocks_[position].label == id)
            {
                index = position;
                break;
            }
        }
        if (index < 0)
        {
            return false;
        }

        // Mark free and clear the label before neighbour checks, so the released interval is visible as a hole.
        blocks_[index].free = true;
        blocks_[index].label.clear();
        blocks_[index].sync_tags();
        // left_free and right_free snapshot adjacency before any erase; vector::erase shifts indices but preserves address order.
        bool left_free = index > 0 && blocks_[index - 1].free;
        bool right_free = index + 1 < static_cast<int>(blocks_.size()) && blocks_[index + 1].free;

        // A left merge uses the left neighbour's start and the sum of both sizes, then erases the released record.
        if (left_free)
        {
            Block merged;
            // The merged range starts at the left neighbour because the released block is immediately to its right.
            merged.start = blocks_[index - 1].start;
            merged.size = blocks_[index - 1].size + blocks_[index].size;
            merged.free = true;
            merged.sync_tags();
            blocks_[index - 1] = merged;
            blocks_.erase(blocks_.begin() + index);
            // index -= 1 is required because erase removed the old current element; the merged block now sits one slot left.
            index -= 1;
        }
        // right_free was captured before the left erase; after index-- it still names the block immediately right of the merged range.
        if (right_free)
        {
            Block merged;
            // The second merge keeps the current start; the right neighbour begins at current start + current size.
            merged.start = blocks_[index].start;
            merged.size = blocks_[index].size + blocks_[index + 1].size;
            merged.free = true;
            merged.sync_tags();
            blocks_[index] = merged;
            blocks_.erase(blocks_.begin() + index + 1);
        }
        return true;
    }

    // policy_ is a list-level switch read by the next allocate; it does not change existing blocks.
    void set_best_fit(bool enabled)
    {
        policy_ = enabled;
    }

    // print() only reads the vector, so address order and tag consistency can be inspected without mutation.
    void print() const
    {
        for (const Block &block : blocks_)
        {
            if (block.free)
            {
                std::cout << "free [" << block.start << ", "
                          << block.start + block.size << ") size=" << block.size << '\n';
            }
            else
            {
                std::cout << "used " << block.label << " [" << block.start << ", "
                          << block.start + block.size << ") size=" << block.size
                          << " head=" << block.head_size << " tail=" << block.tail_size << '\n';
            }
        }
    }

private:
    std::vector<Block> blocks_;
    int capacity_;
    // policy_ stores the policy for this list: false is First Fit, true is Best Fit.
    bool policy_;
};

// A-E allocate adjacent prefixes, leaving one trailing free interval.
// The demonstration assumes a fixed sequence and enough capacity; it is not a general input parser.
int main()
{
    FreeList memory(64);
    if (!memory.allocate("A", 12)) return 1;
    if (!memory.allocate("B", 16)) return 1;
    if (!memory.allocate("C", 10)) return 1;
    if (!memory.allocate("D", 12)) return 1;
    if (!memory.allocate("E", 4)) return 1;
    // Releasing B and D produces two isolated holes; F reuses the earlier hole under First Fit.
    if (!memory.release("B")) return 1;
    if (!memory.release("D")) return 1;
    // F is allocated after the releases, so it demonstrates hole reuse rather than tail growth.
    if (!memory.allocate("F", 8)) return 1;
    // Releasing C joins both sides, then releasing F joins the right hole; this exercises two-sided coalescing.
    if (!memory.release("C")) return 1;
    if (!memory.release("F")) return 1;
    memory.print();
    // G=40 exceeds every remaining contiguous hole, so allocate must return false and leave the table unchanged.
    std::cout << "request G=40 -> " << (memory.allocate("G", 40) ? "ok" : "fail") << '\n';
    memory.print();
    return 0;
}
