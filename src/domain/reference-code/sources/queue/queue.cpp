/*
 * 中文导读：用 std::array 实现循环队列；front 指队首，rear 指下一个空位。
 * 阅读顺序：先看空/满约定；再看 enqueue 写 rear 后取模；然后看 dequeue 读 front 后取模。
 * 关键不变量：front == rear 为空，(rear + 1) % capacity == front 为满；最多 capacity - 1 个元素。
 * 易错点：把 rear 当最后一个元素；自增后忘记取模；空队列仍读 front；把容量当可存元素数。
 * 复杂度：enqueue/dequeue/front O(1)，空间 O(capacity)。
 * 输入/输出：输入 main 内置的演示操作序列；入队/出队返回成功或队头；main 打印出队顺序。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
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

    /*
     * 作用：构造空队列。front_ 与 rear_ 都从 0 开始，二者相等表示空。
     */
    CircularQueue() : front_(0), rear_(0)
    {
    }

    /*
     * 作用：只读判断是否为空。牺牲单元约定下，front_ == rear_ 就是空。
     */
    bool empty() const
    {
        return front_ == rear_;
    }

    // front == rear means empty; one reserved slot makes (rear + 1) % capacity == front full.

    /*
     * 作用：只读判断是否已满。rear_ 的下一个位置撞上 front_ 时，数组只剩保留空位。
     */
    bool full() const
    {
        return (rear_ + 1) % kCapacity == front_;
    }

    /*
     * 作用：入队。先判满，再写入 data_[rear_] 并让 rear_ 取模后移。
     */
    bool enqueue(int value)
    {
        if (full())
        {
            return false;
        }
        data_[rear_] = value;
        rear_ = (rear_ + 1) % kCapacity;
        return true;
    }

    /*
     * 作用：出队。空队列返回 std::nullopt；否则读取 data_[front_] 后让 front_ 取模后移。
     */
    std::optional<int> dequeue()
    {
        if (empty())
        {
            return std::nullopt;
        }
        const int value = data_[front_];
        front_ = (front_ + 1) % kCapacity;
        return value;
    }

    /*
     * 作用：读取队首但不删除。空队列返回 std::nullopt，否则返回 data_[front_]。
     */
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

/*
 * 作用：演示入队到满、读队首、出队、回绕入队和清空，并打印关键状态。
 */
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
