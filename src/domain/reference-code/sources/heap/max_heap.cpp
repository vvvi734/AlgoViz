/*
 * 中文导读：用完全二叉树数组实现优先队列：堆顶最大，插入和删除后通过上浮/下沉恢复堆序。
 * 阅读顺序：先记 0 基下标关系 parent=(i-1)/2、children=2i+1/2i+2；再看 sift_up 与 sift_down 的交换方向；最后看建堆为什么从最后一个非叶结点倒着下沉。
 * 关键不变量：每个父结点都不小于它的孩子；数组的前 size 个位置构成完全树。
 * 易错点：1 基/0 基公式混用；下沉只比较一个孩子；删除堆顶后忘记把末尾元素放到根；建堆从根往下。
 * 复杂度：取最大 O(1)，插入/删除 O(log n)，建堆 O(n)，空间 O(n)。
 */

// AlgoViz reference implementation: max heap (C++17).
// Array-backed binary heap with sift-up on insert and sift-down on pop.
//
// Reading guide:
// 1. Store the complete binary tree in an array without holes.
// 2. For index i, the parent is (i - 1) / 2 and the children are 2i + 1, 2i + 2.
// 3. Push appends and sifts up; pop moves the last value to the root and sifts down.
//
// Complexity: O(log n) push/pop, O(1) top; extra space O(n).
// Convention: Max-heap property: every parent is >= its children; 0-based array
//   indices.

#include <iostream>
#include <optional>
#include <vector>

class MaxHeap
{
  public:
    // 作用：把 value 放到数组末尾，再上浮恢复最大堆；堆满返回 false。
    bool push(int value)
    {
        items_.push_back(value);
        sift_up(items_.size() - 1);
        return true;
    }

    // 作用：弹出堆顶最大值，把末尾元素移到根后下沉；空堆返回空 optional。
    std::optional<int> pop()
    {
        if (items_.empty())
        {
            return std::nullopt;
        }
        int top = items_.front();
        items_.front() = items_.back();
        items_.pop_back();
        if (!items_.empty())
        {
            sift_down(0);
        }
        return top;
    }

    // 作用：只读遍历并输出当前结构；不会修改数据，适合在每一步后核对状态。
    void print() const
    {
        for (std::size_t i = 0; i < items_.size(); ++i)
        {
            std::cout << items_[i] << (i + 1 == items_.size() ? "" : " ");
        }
        std::cout << '\n';
    }

  private:
    // Sift up while the parent is smaller; stop when the heap property holds or root is reached.
    // 作用：从 index 向上与父结点比较并交换，直到堆序恢复或到达根。
    void sift_up(std::size_t index)
    {
        while (index > 0)
        {
            std::size_t parent = (index - 1) / 2;
            if (items_[parent] >= items_[index])
            {
                break;
            }
            std::swap(items_[parent], items_[index]);
            index = parent;
        }
    }

    // For index i the children are 2*i+1 and 2*i+2; sift-down swaps with the larger child until the parent is >= both.
    // 作用：从 index 向下与较大的孩子交换，直到堆序恢复或到达叶子。
    void sift_down(std::size_t index)
    {
        while (true)
        {
            std::size_t left = index * 2 + 1;
            std::size_t right = left + 1;
            std::size_t largest = index;
            if (left < items_.size() && items_[left] > items_[largest])
            {
                largest = left;
            }
            if (right < items_.size() && items_[right] > items_[largest])
            {
                largest = right;
            }
            if (largest == index)
            {
                return;
            }
            std::swap(items_[index], items_[largest]);
            index = largest;
        }
    }

    std::vector<int> items_;
};

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    MaxHeap heap;
    for (int value : {5, 3, 8, 1, 9, 2})
    {
        heap.push(value);
    }
    std::cout << "heap array: ";
    heap.print();

    std::cout << "extract: ";
    while (auto value = heap.pop())
    {
        std::cout << *value << ' ';
    }
    std::cout << "\nempty pop: " << (heap.pop() ? "no" : "yes") << '\n';
    return 0;
}
