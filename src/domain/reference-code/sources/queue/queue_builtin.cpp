/*
 * 中文导读：用 front/rear 维护先进先出序列；循环数组用取模复用出队留下的空位。
 * 阅读顺序：先看 front/rear 的含义；再看入队写哪个格子、出队读哪个格子；最后看回绕与队空/队满判定。
 * 关键不变量：本文件采用“牺牲一个单元”的约定：front 指队首，rear 指下一个待写入的空位，cap-1 个元素即满。
 * 易错点：把 rear 当成最后一个元素；混用 count 与牺牲单元两套规则；入队/出队移动指针的顺序写反；空队列仍读 front。
 * 复杂度：入队/出队/取队首 O(1)，空间 O(capacity)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入 main 内置的演示操作序列；入队/出队返回成功或队头；main 打印出队顺序。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
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

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
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
