// CODE-DOC-04-BATCH-03 reviewed bilingual teaching annotations.
// Entries are merged after the base map so earlier reviewed anchors stay active.
export const BATCH_03_ANNOTATIONS: Record<
  string,
  readonly { en: string; zh: string }[]
> = {
  "seqlist.c": [
    {
      "en": "Insertion accepts index == length as append, but rejects length == capacity: the legal range is bounded by both the live count and the physical array.",
      "zh": "插入允许 index == length 表示追加，但 length == capacity 时必须拒绝：合法范围同时受有效元素数和物理数组容量约束。"
    },
    {
      "en": "Copy backwards from the tail; moving from index upward would overwrite values that still have to be shifted.",
      "zh": "从尾部向前复制；若从 index 向后搬移，就会覆盖尚未搬走的元素。"
    },
    {
      "en": "Publish the new element only after values[index] is written; length is the boundary every traversal trusts.",
      "zh": "先写入 values[index]，最后才增加 length；length 是后续所有遍历信任的有效边界。"
    },
    {
      "en": "Save the removed value before the shift overwrites its slot; the caller still receives the original element.",
      "zh": "在搬移覆盖之前保存被删元素；这样调用者拿到的仍是原位置上的值。"
    },
    {
      "en": "Copy forward from index+1; each write fills the hole left by the previous copy, and the last slot becomes dead.",
      "zh": "从 index+1 开始向前复制；每次写入填上前一次留下的空位，最后一个槽位随即失效。"
    },
    {
      "en": "Print exactly [0, length): slots from length to capacity-1 are allocated but not part of the list.",
      "zh": "只输出 [0, length)：从 length 到 capacity-1 的槽位虽然已分配，但不属于当前顺序表。"
    }
  ],
  "seqlist.cpp": [
    {
      "en": "size_t cannot be negative, so only the upper bound is needed here; index == size_ is a legal append position.",
      "zh": "size_t 不可能为负，因此这里只需检查上界；index == size_ 是合法的追加位置。"
    },
    {
      "en": "Shift the live suffix right from the end; i starts at size_, the first unused slot, so each write happens before its source is read.",
      "zh": "从末尾向前搬移有效后缀；i 从 size_（第一个未用槽）开始，保证先写后读、不覆盖源值。"
    },
    {
      "en": "Update size_ after items_[index] is assigned; until then the new slot is not part of the live range.",
      "zh": "items_[index] 赋值完成后才增加 size_；在此之前新槽不属于有效区间。"
    },
    {
      "en": "optional<T> separates no element from a stored value such as 0; erase can return any T without a sentinel.",
      "zh": "optional<T> 把“没有元素”和真实值 0 区分开；erase 无需哨兵值就能返回任意 T。"
    },
    {
      "en": "Fill the hole left to right; after the last copy, slot size_-1 is outside the live range and may be overwritten later.",
      "zh": "从左向右填空；最后一次复制后，size_-1 已在有效区间之外，之后可被新插入覆盖。"
    },
    {
      "en": "Decrement only after the gap is closed; removed still holds a copy of the erased value.",
      "zh": "空洞填完后才减少 size_；removed 已经保存了被删除值的副本。"
    }
  ],
  "seqlist.py": [
    {
      "en": "A non-positive capacity would make every insert fail and every erase index invalid, so reject it at construction.",
      "zh": "容量非正会让所有插入失败、删除下标全部非法，因此在构造时直接拒绝。"
    },
    {
      "en": "The chained bound accepts index == _size for append and rejects negative indices before any list access.",
      "zh": "链式比较允许 index == _size 表示追加，并在访问列表前拒绝负下标。"
    },
    {
      "en": "range starts at _size and stops above index, so each assignment consumes a slot that was already copied.",
      "zh": "range 从 _size 开始、停在 index 之上；每次赋值都使用已经复制过的槽位。"
    },
    {
      "en": "The new value is visible before _size grows; no reader can treat an unwritten slot as live.",
      "zh": "先让新值可见，再增加 _size；任何读取者都不会把未写的槽当成有效元素。"
    },
    {
      "en": "This loop touches pairs (i, i+1) inside the live prefix; the old last element is left beyond the new _size.",
      "zh": "循环只处理有效前缀内的 (i, i+1) 对；旧末尾元素会落到新 _size 之外。"
    },
    {
      "en": "Slicing copies only the live prefix, so callers cannot mutate the backing capacity or see dead slots.",
      "zh": "切片只复制有效前缀，调用者既不能改到底层容量，也看不到失效槽位。"
    }
  ],
  "singly_linked_list.c": [
    {
      "en": "Allocate before linking; next is set to NULL so a partially built node never exposes an uninitialized link.",
      "zh": "先分配再接入；next 立即置 NULL，避免半成品结点暴露未初始化链接。"
    },
    {
      "en": "Stop on the predecessor at index-1; walking to index itself would leave no node to relink.",
      "zh": "循环停在 index-1 的前驱；若走到 index，就没有结点可供重接。"
    },
    {
      "en": "The predecessor search failed past the end; return before allocating so a rejected index cannot leak a node.",
      "zh": "前驱搜索越过表尾失败；在分配前返回，避免非法下标造成结点泄漏。"
    },
    {
      "en": "Save next before free; after the free the node's fields are no longer readable.",
      "zh": "释放前保存 next；free 之后结点字段已不可再读取。"
    }
  ],
  "singly_linked_list.cpp": [
    {
      "en": "The three fields form one invariant: length_ counts nodes reachable from head_, and tail_ is either the last such node or null.",
      "zh": "三个字段共同维持不变量：length_ 统计从 head_ 可达的结点数，tail_ 要么是最后一个结点，要么为空。"
    },
    {
      "en": "An empty list has no old tail, so the first inserted node must become both head_ and tail_.",
      "zh": "空表没有旧尾结点，因此第一个插入的结点必须同时成为 head_ 和 tail_。"
    },
    {
      "en": "Stop either at the node whose next is target or at the last node; the final check distinguishes a hit from a miss.",
      "zh": "循环停在“next 指向 target”的结点或最后一个结点；末尾判断区分命中与未命中。"
    },
    {
      "en": "Link the new node to the old successor first; then prev->next can safely point at the new node.",
      "zh": "先让新结点接住旧后继；随后 prev->next 才能安全改为指向新结点。"
    },
    {
      "en": "Inserting after the current tail extends the list, so tail_ must move to the new node.",
      "zh": "在当前尾结点之后插入会延长链表，因此 tail_ 必须移到新结点。"
    },
    {
      "en": "Save the successor before delete; clear must never dereference a node after releasing it.",
      "zh": "释放前先保存后继；clear 绝不能在 delete 之后再次解引用结点。"
    }
  ],
  "singly_linked_list.py": [
    {
      "en": "None is overloaded here: it means no list, no target, or the target is the head. Callers must not treat it as a generic predecessor.",
      "zh": "这里的 None 同时表示空表、空目标或目标就是头结点；调用者不能把它当成通用前驱。"
    },
    {
      "en": "A full walk that never finds target returns None; the caller rejects that value instead of linking after an unknown node.",
      "zh": "走完整条链仍未找到 target 就返回 None；调用者会拒绝该值，而不是接在未知结点后面。"
    },
    {
      "en": "Attach the new node to the old successor before changing prev.next; this preserves the tail of the list.",
      "zh": "先让新结点接住旧后继，再改 prev.next；这样链表尾部不会丢失。"
    },
    {
      "en": "The head has no predecessor, so removal must replace self.head rather than rewrite a prev.next field.",
      "zh": "头结点没有前驱，删除时必须替换 self.head，而不是改写某个 prev.next。"
    },
    {
      "en": "The unlink is complete before the count shrinks; no state is observed with a reachable node missing from length.",
      "zh": "摘链完成后才减少 length；不会出现结点仍可达但 length 已少算的中间状态。"
    }
  ],
  "doubly_linked_list.c": [
    {
      "en": "Both endpoints are cleared together; this implementation keeps no count, so those two nulls fully describe the empty state.",
      "zh": "两个端点必须一起清空；本实现没有计数，这两个 NULL 就完整描述了空表状态。"
    },
    {
      "en": "The new node's prev is the old tail before tail moves; next stays NULL because append always creates the new last node.",
      "zh": "新结点的 prev 记录旧尾结点；next 保持 NULL，因为尾插产生的总是新的最后结点。"
    },
    {
      "en": "Patch the old tail's next before publishing the new tail; otherwise the backward chain would end at a node with no forward partner.",
      "zh": "先修补旧尾结点的 next，再发布新尾结点；否则反向链会在一个没有正向伙伴的结点处结束。"
    },
    {
      "en": "Only an empty list reaches this branch: the new node is both head and tail, so head must be set explicitly.",
      "zh": "只有空表会进入这个分支：新结点同时是头和尾，因此必须显式设置 head。"
    },
    {
      "en": "Head removal has no predecessor to patch, so it must move list->head to node->next instead.",
      "zh": "删除头结点时没有前驱可修补，必须改为把 list->head 移到 node->next。"
    },
    {
      "en": "Tail removal has no successor to patch, so list->tail retreats to node->prev.",
      "zh": "删除尾结点时没有后继可修补，list->tail 必须退回 node->prev。"
    },
    {
      "en": "This is a linear doubly linked list, not a ring: following next from head reaches NULL exactly once per node.",
      "zh": "这是线性双向链表而不是环：从 head 沿 next 前进，每个结点只经过一次并最终到达 NULL。"
    }
  ],
  "doubly_linked_list.cpp": [
    {
      "en": "Moving head_->next into head_ releases the old head; tail_ is only an observer and is never dereferenced after destruction.",
      "zh": "把 head_->next 移入 head_ 会释放旧头结点；tail_ 只是观察者，析构后不再被解引用。"
    },
    {
      "en": "make_unique establishes ownership before any link is changed; unlike the C version, allocation failure throws instead of returning null.",
      "zh": "make_unique 在改链前建立所有权；与 C 版不同，分配失败会抛出异常而不是返回 NULL。"
    },
    {
      "en": "Keep the raw address because moving the unique_ptr transfers ownership; tail_ must observe the node, not own it.",
      "zh": "保留裸地址是因为移动 unique_ptr 会转移所有权；tail_ 只观察结点，不拥有结点。"
    },
    {
      "en": "A non-empty list attaches through the old tail's owning next; an empty list must install the node as head_ instead.",
      "zh": "非空表通过旧尾结点的 owning next 接入；空表则必须把新结点装成 head_。"
    },
    {
      "en": "tail_ moves only after the new node is reachable from head_; updating early would expose a node with no inbound link.",
      "zh": "只有新结点已从 head_ 可达后才移动 tail_；提前更新会暴露一个没有入链的结点。"
    },
    {
      "en": "Capture prev and the tail relation before moving node->next: the move may destroy node once ownership is reassigned.",
      "zh": "移动 node->next 前先保存 prev 和尾结点关系；所有权重新赋值后 node 可能立即被销毁。"
    },
    {
      "en": "Moving next out of node makes the successor owned by the local variable; the later assignment transfers it to prev or head_.",
      "zh": "把 next 移出 node 后，后继由局部变量拥有；之后的赋值再把它转交给 prev 或 head_。"
    },
    {
      "en": "tail_ must retreat before the final owning assignment may delete node; after deletion node->prev is unreadable.",
      "zh": "tail_ 必须在最终所有权赋值可能删除 node 之前退回；删除后 node->prev 不可读。"
    }
  ],
  "doubly_linked_list.py": [
    {
      "en": "The constructor records the old tail as prev; next remains None because the new node is about to become the last node.",
      "zh": "构造时把旧尾结点记为 prev；next 保持 None，因为新结点即将成为最后结点。"
    },
    {
      "en": "An empty list has no old tail, so the new node is both head and tail; otherwise only the old tail's next changes.",
      "zh": "空表没有旧尾结点，新结点同时成为 head 和 tail；否则只需改旧尾结点的 next。"
    },
    {
      "en": "tail moves last, after the forward link exists; moving it first would lose the attachment point.",
      "zh": "tail 最后移动，此时正向链接已存在；先移动会丢失接入点。"
    },
    {
      "en": "Head removal replaces self.head; there is no predecessor whose next could be rewritten.",
      "zh": "删除头结点要替换 self.head；此时没有前驱的 next 可改写。"
    },
    {
      "en": "Tail removal moves self.tail back to node.prev; the successor branch handles every non-tail node.",
      "zh": "删除尾结点要把 self.tail 退回 node.prev；后继分支处理所有非尾结点。"
    },
    {
      "en": "Detach the removed node's own links after the list is repaired; stale links would keep the rest of the list reachable from a dead node.",
      "zh": "链表修好后清空被删结点自身的链接；残留链接会让死结点仍能到达链表其余部分。"
    }
  ]
};
