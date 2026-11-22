/*
 * 中文导读：本文件用 std::queue 作标准库对照；它是 FIFO 适配器，默认底层为 deque，不暴露 front/rear 下标。
 * 阅读顺序：先看 push 入队；再读 front；最后 pop 出队。
 * 关键不变量：front 是最早元素；pop 返回 void；front/pop 前必须非空。
 * 易错点：把 queue 当循环数组；pop 后继续用旧 front；空队列调用 front。
 * 复杂度：push/pop/front O(1)，空间 O(n)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入 main 内置的入队序列；main 读取队首并按 FIFO 出队。
*/

// AlgoViz convenience implementation: queue with std::queue (C++17).
// std::queue is an adapter; its default container is std::deque.
//
// Reading guide:
// 1. This convenience file wraps std::queue, which is FIFO by contract.
// 2. push adds at the back; front reads the oldest element; pop removes it.
// 3. No circular-buffer indices are exposed by this adapter.
//
// Complexity: O(1) per push/pop/front; extra space O(n).
// Convention: front/pop require a non-empty queue; the demo checks empty() first.

#include <iostream>
#include <queue>

int main()
{
    // `std::queue::pop()` returns void; read `front()` before removing the oldest element.
    std::queue<int> queue;
    for (int value = 1; value <= 4; ++value)
    {
        queue.push(value);
    }

    std::cout << "front: " << queue.front() << '\n';
    while (!queue.empty())
    {
        std::cout << "dequeue: " << queue.front() << '\n';
        queue.pop();
    }
    std::cout << "empty: " << (queue.empty() ? "yes" : "no") << '\n';
    return 0;
}
