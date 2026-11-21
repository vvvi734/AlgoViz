/*
 * 中文导读：用完全二叉树数组实现优先队列：堆顶最大，插入和删除后通过上浮/下沉恢复堆序。
 * 阅读顺序：先记 0 基下标关系 parent=(i-1)/2、children=2i+1/2i+2；再看 sift_up 与 sift_down 的交换方向；最后看建堆为什么从最后一个非叶结点倒着下沉。
 * 关键不变量：每个父结点都不小于它的孩子；数组的前 size 个位置构成完全树。
 * 易错点：1 基/0 基公式混用；下沉只比较一个孩子；删除堆顶后忘记把末尾元素放到根；建堆从根往下。
 * 复杂度：取最大 O(1)，插入/删除 O(log n)，建堆 O(n)，空间 O(n)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入 push/pop 操作序列；push 无返回值，pop 返回当前最大值；main 打印堆数组与弹出值。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz convenience implementation: max heap with std::priority_queue.
// std::priority_queue is a max-heap by default.
//
// Reading guide:
// 1. This convenience file uses std::priority_queue with std::less, which is a
//    max-heap.
// 2. top reads the maximum; push and pop let the library maintain the heap property.
// 3. No manual sift-up or sift-down code is present in this version.
//
// Complexity: O(1) top, O(log n) push/pop; extra space O(n).
// Convention: The largest element is on top; equal keys have unspecified relative
//   order.

#include <iostream>
#include <queue>
#include <vector>

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    // `std::priority_queue` is a max-heap by default; equal keys have unspecified relative order.
    std::priority_queue<int> heap;
    for (int value : {5, 3, 8, 1, 9, 2})
    {
        heap.push(value);
    }

    std::cout << "extract: ";
    while (!heap.empty())
    {
        std::cout << heap.top() << ' ';
        heap.pop();
    }
    std::cout << "\nempty: " << (heap.empty() ? "yes" : "no") << '\n';
    return 0;
}
