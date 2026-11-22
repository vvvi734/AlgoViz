/*
 * 中文导读：用 std::array 实现循环队列；front 指队首，rear 指下一个空位。
 * 阅读顺序：先看空/满约定；再看 enqueue 写 rear 后取模；然后看 dequeue 读 front 后取模。
 * 关键不变量：front == rear 为空，(rear + 1) % capacity == front 为满；最多 capacity - 1 个元素。
 * 易错点：把 rear 当最后一个元素；自增后忘记取模；空队列仍读 front；把容量当可存元素数。
 * 复杂度：enqueue/dequeue/front O(1)，空间 O(capacity)。
 * 输入/输出：输入 main 内置的演示操作序列；入队/出队返回成功或队头；main 打印出队顺序。
*/

/*
 * Circular queue in C++17.
 *
 * The fixed array wraps with modulo. front indexes the first live item, rear the
 * next free slot. One slot is reserved: front == rear is empty and
 * (rear + 1) % kCapacity == front is full. Every operation is O(1).
 */

#include <array>
#include <cstddef>
#include <iostream>
#include <optional>

class CircularQueue
{
public:
    static constexpr std::size_t kCapacity = 8;

    // front_ == rear_ is the only empty condition; starting both at zero avoids a separate count.
    CircularQueue() : front_(0), rear_(0)
    {
    }

    bool empty() const
    {
        return front_ == rear_;
    }

    // front == rear means empty; one reserved slot makes (rear + 1) % capacity == front full.

    bool full() const
    {
        // One slot is deliberately unused: the ring can hold kCapacity-1 values while still distinguishing full from empty.
        return (rear_ + 1) % kCapacity == front_;
    }

    bool enqueue(int value)
    {
        // Check before writing; a full queue must reject the new value without disturbing any live slot.
        if (full())
        {
            return false;
        }
        // rear_ is the next free slot, so the write happens before the modulo advance.
        data_[rear_] = value;
        // The modulo is the wrap; without it a full ring would index past the array instead of returning to 0.
        rear_ = (rear_ + 1) % kCapacity;
        return true;
    }

    // optional distinguishes an empty queue from a stored 0; the value is copied before front_ moves.
    std::optional<int> dequeue()
    {
        if (empty())
        {
            return std::nullopt;
        }
        const int value = data_[front_];
        // Moving front_ is the dequeue; the slot becomes dead without any erase or shift.
        front_ = (front_ + 1) % kCapacity;
        return value;
    }

    // front() is read-only; it observes data_[front_] and leaves the queue state unchanged.
    std::optional<int> front() const
    {
        if (empty())
        {
            return std::nullopt;
        }
        return data_[front_];
    }

private:
    std::array<int, kCapacity> data_{};
    std::size_t front_;
    std::size_t rear_;
};

int main()
{
    CircularQueue queue;
    for (int value = 1; value <= static_cast<int>(CircularQueue::kCapacity) - 1; ++value)
    {
        queue.enqueue(value);
    }
    std::cout << "full: " << (queue.full() ? "yes" : "no") << '\n';

    if (const auto front = queue.front())
    {
        std::cout << "front: " << *front << '\n';
    }

    if (const auto value = queue.dequeue())
    {
        std::cout << "dequeue: " << *value << '\n';
    }

    if (queue.enqueue(static_cast<int>(CircularQueue::kCapacity)))
    {
        std::cout << "wrapped rear reached 0\n";
    }

    while (const auto value = queue.dequeue())
    {
        std::cout << "dequeue: " << *value << '\n';
    }
    std::cout << "empty: " << (queue.empty() ? "yes" : "no") << '\n';
    return 0;
}
