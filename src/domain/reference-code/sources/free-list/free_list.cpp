// Free-space list with First Fit / Best Fit and boundary tags.
// The simulation owns a vector of interval records; no real pointer arithmetic.
#include <iostream>
#include <string>
#include <vector>

// A block owns the half-open interval [start, start + size).
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

    // Head and tail tags mirror the same size and state.
    void sync_tags()
    {
        head_size = size;
        tail_size = size;
        head_free = free;
        tail_free = free;
    }
};

class FreeList
{
public:
    explicit FreeList(int total) : capacity_(total), policy_(false)
    {
        Block root{0, total, true, "", 0, 0, true, true};
        root.sync_tags();
        blocks_.push_back(root);
    }

    bool allocate(const std::string &id, int request)
    {
        int chosen = -1;
        int best_remainder = capacity_ + 1;
        for (int index = 0; index < static_cast<int>(blocks_.size()); ++index)
        {
            const Block &block = blocks_[index];
            if (!block.free || block.size < request)
            {
                continue;
            }
            int remainder = block.size - request;
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
        if (chosen < 0)
        {
            return false;
        }
        if (blocks_[chosen].size > request)
        {
            Block remainder;
            remainder.start = blocks_[chosen].start + request;
            remainder.size = blocks_[chosen].size - request;
            remainder.free = true;
            remainder.sync_tags();
            blocks_.insert(blocks_.begin() + chosen + 1, remainder);
            blocks_[chosen].size = request;
        }
        blocks_[chosen].free = false;
        blocks_[chosen].label = id;
        blocks_[chosen].sync_tags();
        return true;
    }

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

        blocks_[index].free = true;
        blocks_[index].label.clear();
        blocks_[index].sync_tags();
        bool left_free = index > 0 && blocks_[index - 1].free;
        bool right_free = index + 1 < static_cast<int>(blocks_.size()) && blocks_[index + 1].free;

        if (left_free)
        {
            Block merged;
            merged.start = blocks_[index - 1].start;
            merged.size = blocks_[index - 1].size + blocks_[index].size;
            merged.free = true;
            merged.sync_tags();
            blocks_[index - 1] = merged;
            blocks_.erase(blocks_.begin() + index);
            index -= 1;
        }
        if (right_free)
        {
            Block merged;
            merged.start = blocks_[index].start;
            merged.size = blocks_[index].size + blocks_[index + 1].size;
            merged.free = true;
            merged.sync_tags();
            blocks_[index] = merged;
            blocks_.erase(blocks_.begin() + index + 1);
        }
        return true;
    }

    void set_best_fit(bool enabled)
    {
        policy_ = enabled;
    }

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
    bool policy_; // false = First Fit, true = Best Fit
};

int main()
{
    FreeList memory(64);
    if (!memory.allocate("A", 12)) return 1;
    if (!memory.allocate("B", 16)) return 1;
    if (!memory.allocate("C", 10)) return 1;
    if (!memory.allocate("D", 12)) return 1;
    if (!memory.allocate("E", 4)) return 1;
    if (!memory.release("B")) return 1;
    if (!memory.release("D")) return 1;
    if (!memory.allocate("F", 8)) return 1;
    if (!memory.release("C")) return 1;
    if (!memory.release("F")) return 1;
    memory.print();
    // The next request is intentionally too large for any contiguous free block.
    std::cout << "request G=40 -> " << (memory.allocate("G", 40) ? "ok" : "fail") << '\n';
    memory.print();
    return 0;
}
