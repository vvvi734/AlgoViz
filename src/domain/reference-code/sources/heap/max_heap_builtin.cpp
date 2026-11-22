/*
 * 中文导读：本文件用 std::priority_queue 作标准库对照；默认是最大堆，但上浮/下沉过程不在接口中暴露。
 * 阅读顺序：先看 push 建堆；再看 top 读最大值；最后看 pop 删除堆顶。
 * 关键不变量：top 始终是当前最大元素；push/pop 由库维护堆序；相等键的相对次序未指定。
 * 易错点：把 priority_queue 当最小堆；pop 返回 void 却想取值；在空堆上调用 top/pop。
 * 复杂度：top O(1)，push/pop O(log n)，空间 O(n)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入 push/pop 操作序列；main 打印堆顶与弹出值；不展示内部数组。
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
