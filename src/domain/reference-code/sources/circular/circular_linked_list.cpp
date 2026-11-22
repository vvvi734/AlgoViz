/*
 * 中文导读：让尾结点的 next 指回头结点，使“从任意结点出发都能绕一圈”。
 * 阅读顺序：先看 head_/tail_ 如何表示空表；再看 append 的两条链接顺序；最后看析构函数如何安全释放整圈。
 * 关键不变量：tail_ 非空时 tail_->next == head_；空表时 head_ == tail_ == nullptr；类中没有 length 字段。
 * 易错点：把空表当成“有一个结点”而漏掉 head_ 赋值；先移动 tail_ 再连边导致环断裂；用 while (node != nullptr) 遍历造成死循环。
 * 复杂度：append 为 O(1)，遍历 O(n)，析构 O(n)，额外空间 O(n)。
 * 输入/输出：main 依次追加 1、2、3；append 返回是否分配成功，print 只读输出，异常路径返回非零退出码。
*/

// AlgoViz reference implementation: circular singly linked list (C++17).
// The tail node links back to the head, so a non-empty list has no nullptr terminator.
//
// Reading guide:
// 1. The class stores only `head_` and `tail_`; an empty list has both null. It
//    intentionally has no `length_` member.
// 2. `new (std::nothrow)` makes allocation failure observable as `false`. The first
//    node self-links; later nodes are linked before `tail_` moves.
// 3. Traversal and destruction stop by comparing with `head_`/`tail_`, never by
//    waiting for nullptr. Destruction saves `next` before `delete`.
//
// Complexity: O(1) append, O(n) traversal and destruction; extra space O(n).

#include <iostream>
#include <new>

class CircularList
{
  public:
    struct Node
    {
        int value = 0;
        Node *next = nullptr;
    };

    /*
     * The destructor delegates to `clear` so normal cleanup and explicit clearing
     * follow one code path. A ring never reaches nullptr, so `clear` must stop at
     * `tail_`; saving `next` first is required because `delete node` invalidates
     * the node's own link.
     */
    // Purpose: Release the whole ring through one shared cleanup path.
    // 作用：析构时统一走 clear 的释放路径；本类只维护 head_/tail_，没有 length 需要复位。
    ~CircularList()
    {
        clear();
    }

    // The tail's `next` points back to `head`, so traversal stops after returning to head, not at NULL.
    /*
     * `new (std::nothrow)` turns allocation failure into a null pointer instead of
     * throwing, so `append` can return false without changing the existing ring.
     * For the first node, `next` points to itself and `head_` must be set. For later
     * nodes, both links are established before `tail_` moves; moving `tail_` first
     * would lose the only pointer to the old tail.
     *
     * Purpose: Append one value and preserve the ring's closing link.
     * 作用：在尾部追加一个值，并保持尾结点指回头结点；失败时原链表不变。
     */
    bool append(int value)
    {
        Node *node = new (std::nothrow) Node{value, nullptr};
        if (!node)
        {
            return false;
        }
        if (!tail_)
        {
            node->next = node;
            head_ = node;
        }
        else
        {
            node->next = head_;
            tail_->next = node;
        }
        tail_ = node;
        return true;
    }

    /*
     * A non-empty ring has no nullptr node, so traversal cannot wait for nullptr.
     * The empty case is handled first; do-while prints `head_` before advancing; the
     * comparison with `head_` after advancing detects a complete lap.
     */
    // Purpose: Print one full lap without mutating the ring.
    // 作用：只读打印一整圈；回到 head_ 时停止。
    void print() const
    {
        if (!head_)
        {
            std::cout << "(empty)\n";
            return;
        }
        const Node *node = head_;
        do
        {
            std::cout << node->value << (node->next == head_ ? "" : " ");
            node = node->next;
        } while (node != head_);
        std::cout << '\n';
    }

    // Purpose: Return the tail pointer for read-only access; the tail's next points back to the head.
    // 作用：返回尾指针供只读访问；尾结点的 next 指向头结点。
    const Node *tail() const
    {
        return tail_;
    }

  private:
    /*
     * `tail_` is the exit marker: following links until `head_` would cycle forever.
     * The loop therefore frees every node before the tail, saves each successor
     * before `delete`, then frees the tail separately. A one-node ring skips the
     * loop and still reaches the final delete. Both endpoints become null, which is
     * this class's complete empty state.
     */
    // Purpose: Free every node once and restore the two-pointer empty state.
    // 作用：每个结点只释放一次并恢复空表；释放前保存 next，最后清空 head_/tail_。
    void clear()
    {
        if (!head_)
        {
            return;
        }
        Node *node = head_;
        while (node != tail_)
        {
            Node *next = node->next;
            delete node;
            node = next;
        }
        delete tail_;
        head_ = nullptr;
        tail_ = nullptr;
    }

    Node *head_ = nullptr;
    Node *tail_ = nullptr;
};

/*
 * Each append can fail independently. Returning immediately keeps the demo honest:
 * no later operation assumes a node that was never allocated. Because the
 * destructor runs when `list` leaves scope, earlier successful nodes are still
 * released on an early return. The tail check runs only after all three appends.
 */
int main()
{
    CircularList list;
    if (!list.append(1))
    {
        std::cerr << "append 1 failed\n";
        return 1;
    }
    if (!list.append(2))
    {
        std::cerr << "append 2 failed\n";
        return 1;
    }
    if (!list.append(3))
    {
        std::cerr << "append 3 failed\n";
        return 1;
    }
    std::cout << "circular: ";
    list.print();
    if (!list.tail())
    {
        std::cerr << "tail is unexpectedly NULL\n";
        return 1;
    }
    std::cout << "tail->next: " << list.tail()->next->value << '\n';
    return 0;
}
