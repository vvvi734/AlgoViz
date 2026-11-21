// Buddy-system allocation and release over a power-of-two capacity.
// Blocks are interval records in a vector; no pointer arithmetic is involved.
#include <iostream>
#include <string>
#include <vector>

struct Block
{
    int start;
    int size;
    int level;
    bool free;
    std::string label;
};

class BuddyHeap
{
public:
    explicit BuddyHeap(int total) : capacity_(total), max_level_(level_of(total))
    {
        blocks_.push_back({0, total, max_level_, true, ""});
    }

    bool allocate(const std::string &id, int request)
    {
        if (request <= 0 || request > capacity_ || !power_of_two(capacity_))
        {
            return false;
        }
        int target = level_of(request);
        int chosen = -1;
        // Find the smallest free block at or above the rounded target level.
        for (int level = target; level <= max_level_ && chosen < 0; ++level)
        {
            for (int index = 0; index < static_cast<int>(blocks_.size()); ++index)
            {
                if (blocks_[index].free && blocks_[index].level == level)
                {
                    chosen = index;
                    break;
                }
            }
        }
        if (chosen < 0)
        {
            return false;
        }

        // Halve the chosen block repeatedly; the left half stays the working block.
        while (blocks_[chosen].level > target)
        {
            int half = blocks_[chosen].size / 2;
            blocks_[chosen].size = half;
            blocks_[chosen].level -= 1;
            Block right{blocks_[chosen].start + half, half, blocks_[chosen].level, true, ""};
            blocks_.insert(blocks_.begin() + chosen + 1, right);
        }
        blocks_[chosen].free = false;
        blocks_[chosen].label = id;
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
        while (blocks_[index].level < max_level_)
        {
            int buddy_start = blocks_[index].start ^ blocks_[index].size;
            int buddy = -1;
            for (int position = 0; position < static_cast<int>(blocks_.size()); ++position)
            {
                if (position != index && blocks_[position].free &&
                    blocks_[position].start == buddy_start &&
                    blocks_[position].size == blocks_[index].size)
                {
                    buddy = position;
                    break;
                }
            }
            if (buddy < 0)
            {
                break;
            }
            // The merged block starts at the smaller address and doubles its size.
            if (blocks_[buddy].start < blocks_[index].start)
            {
                blocks_[index].start = blocks_[buddy].start;
            }
            blocks_[index].size *= 2;
            blocks_[index].level += 1;
            if (buddy < index)
            {
                index -= 1;
            }
            blocks_.erase(blocks_.begin() + buddy);
        }
        return true;
    }

    void print() const
    {
        for (const Block &block : blocks_)
        {
            std::cout << "[" << block.start << ", " << block.start + block.size
                      << ") size=" << block.size << " level=" << block.level << ' '
                      << (block.free ? "free" : "used " + block.label) << '\n';
        }
    }

private:
    static bool power_of_two(int value)
    {
        return value > 0 && (value & (value - 1)) == 0;
    }

    static int level_of(int size)
    {
        int level = 0;
        while ((1 << level) < size)
        {
            ++level;
        }
        return level;
    }

    std::vector<Block> blocks_;
    int capacity_;
    int max_level_;
};

int main()
{
    BuddyHeap memory(32);
    if (!memory.allocate("A", 3)) return 1;
    if (!memory.allocate("B", 5)) return 1;
    if (!memory.allocate("C", 2)) return 1;
    if (!memory.release("B")) return 1;
    if (!memory.release("C")) return 1;
    memory.print();
    // A 32-byte request cannot fit once the root has been split and used.
    std::cout << "request D=32 -> " << (memory.allocate("D", 32) ? "ok" : "fail") << '\n';
    memory.print();
    return 0;
}
