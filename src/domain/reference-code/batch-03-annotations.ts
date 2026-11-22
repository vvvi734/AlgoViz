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
  ],
  "stack.c": [
    {
      "en": "The full check uses top, not a count: top == capacity-1 means the next increment would write past the array.",
      "zh": "判满依据是 top 而不是元素计数：top == capacity-1 时再自增就会写出数组边界。"
    },
    {
      "en": "Return before changing top; rejecting a full push must leave every existing element untouched.",
      "zh": "在修改 top 前返回；拒绝满栈压入时不能改动任何已有元素。"
    },
    {
      "en": "Increment before the write: data[top] must name the new live element, while the old top remains valid until then.",
      "zh": "先自增再写入：data[top] 必须指向新的栈顶元素，旧栈顶在此之前仍然有效。"
    },
    {
      "en": "Pop copies the top out and only then decrements; the returned value must survive the state change.",
      "zh": "弹栈先把栈顶复制出去，再减少 top；返回值不能随状态改变而丢失。"
    },
    {
      "en": "The decrement is the removal: the old slot stays in the array but is outside [0, top].",
      "zh": "递减 top 就是删除：旧槽仍留在数组中，但已不属于 [0, top] 的有效区间。"
    },
    {
      "en": "Peek shares the read but omits the decrement, so it is observationally read-only even though it touches data[top].",
      "zh": "Peek 复用同样的读取但不递减，因此虽然访问 data[top]，语义上仍是只读操作。"
    }
  ],
  "stack.cpp": [
    {
      "en": "The capacity check is on the live top, not on data_.size(); data_ is fixed and always has kCapacity slots.",
      "zh": "容量检查针对当前栈顶而不是 data_.size()；data_ 固定拥有 kCapacity 个槽位。"
    },
    {
      "en": "The signed cast is required because top_ uses -1; comparing directly with size_t would convert -1 to a huge value.",
      "zh": "必须转为有符号数，因为 top_ 用 -1 表示空；直接与 size_t 比较会把 -1 变成巨大值。"
    },
    {
      "en": "Increment first so data_[top_] is the new element; the old top remains readable until the assignment.",
      "zh": "先自增，使 data_[top_] 指向新元素；赋值前旧栈顶仍然可读。"
    },
    {
      "en": "top_ is non-negative here, so the cast is safe; the copy is taken before --top_ destroys the logical top.",
      "zh": "这里 top_ 已非负，转换安全；必须在 --top_ 撤销逻辑栈顶前完成复制。"
    },
    {
      "en": "Decrementing top_ is the pop; no element needs to be erased from std::array.",
      "zh": "递减 top_ 就完成弹栈；std::array 中的旧元素不需要擦除。"
    },
    {
      "en": "optional distinguishes empty from a stored 0; the caller can test has_value without a sentinel.",
      "zh": "optional 把空栈和真实值 0 区分开；调用者检查 has_value 即可，无需哨兵。"
    },
    {
      "en": "The array size is compile-time state; top_ is the only runtime field that says how much is live.",
      "zh": "数组大小是编译期状态；top_ 是唯一描述有效元素数量的运行期字段。"
    }
  ],
  "stack.py": [
    {
      "en": "A non-positive capacity makes the first push impossible, so reject it before allocating the backing list.",
      "zh": "容量非正会让第一次压栈就无法进行，因此在分配底层列表前直接拒绝。"
    },
    {
      "en": "_top is the live top index; -1 is the empty state, so the first push writes index 0.",
      "zh": "_top 是当前栈顶下标；-1 表示空栈，因此第一次压栈写入下标 0。"
    },
    {
      "en": "Check the last legal index before incrementing; this is the only thing preventing a write past the list.",
      "zh": "自增前检查最后一个合法下标；这是防止写出列表边界的唯一防线。"
    },
    {
      "en": "Increment before assigning data[_top]; the new top must exist before its value is stored.",
      "zh": "先增加 _top 再写 data[_top]；新栈顶必须先存在，随后才能存值。"
    },
    {
      "en": "None is the empty signal; a stored 0 is a valid value because the check is on _top, not on the returned value.",
      "zh": "None 表示空栈；真实值 0 仍然合法，因为判空看 _top 而不是返回值。"
    },
    {
      "en": "Decrementing _top removes the element logically; the backing list keeps the old object but no operation reads it.",
      "zh": "递减 _top 就在逻辑上删除元素；底层列表仍保留旧对象，但没有任何操作会再读它。"
    },
    {
      "en": "Peek is read-only: it returns data[_top] without changing the count or the top index.",
      "zh": "Peek 是只读操作：返回 data[_top]，不改变元素数量或栈顶下标。"
    }
  ],
  "factorial.c": [
    {
      "en": "The unsigned parameter rules out negative input; the 64-bit return limits exact factorials to a small teaching range.",
      "zh": "无符号参数排除负数输入；64 位返回值也把精确阶乘限制在较小的教学范围。"
    },
    {
      "en": "The multiplication waits for the child call; each frame keeps its own number and pending product on the call stack.",
      "zh": "乘法必须等子调用返回；每一帧都在调用栈上保存自己的 number 和待乘结果。"
    }
  ],
  "factorial.cpp": [
    {
      "en": "The unsigned parameter rules out negative input; the 64-bit return limits exact factorials to a small teaching range.",
      "zh": "无符号参数排除负数输入；64 位返回值也把精确阶乘限制在较小的教学范围。"
    },
    {
      "en": "The multiplication waits for the child call; each frame keeps its own number and pending product on the call stack.",
      "zh": "乘法必须等子调用返回；每一帧都在调用栈上保存自己的 number 和待乘结果。"
    }
  ],
  "factorial.py": [
    {
      "en": "Python integers do not overflow, but deep recursion still hits the interpreter's recursion limit.",
      "zh": "Python 整数不会溢出，但递归过深仍会触发解释器的递归深度限制。"
    },
    {
      "en": "Reject negative input before the base case; factorial is undefined there and returning 1 would hide the error.",
      "zh": "在递归基前拒绝负数；负数阶乘未定义，返回 1 会掩盖错误。"
    },
    {
      "en": "The multiplication is evaluated after the child returns; each frame holds its own number until then.",
      "zh": "乘法在子调用返回后才求值；在此之前每一帧都保存自己的 number。"
    }
  ],
  "fib.c": [
    {
      "en": "The unsigned parameter excludes negative n; 64-bit results overflow quickly beyond the small teaching range.",
      "zh": "无符号参数排除负 n；超出较小教学范围后，64 位结果会迅速溢出。"
    },
    {
      "en": "This single base branch returns 0 for n=0 and 1 for n=1, matching both definitions.",
      "zh": "这个递归基同时处理 n=0 和 n=1，分别返回 0 和 1，符合两条定义。"
    },
    {
      "en": "Each call must finish before the addition; the live stack is only O(n) deep even though the call tree is exponential.",
      "zh": "两次调用都返回后才做加法；虽然调用树指数增长，活动栈深度仍只有 O(n)。"
    }
  ],
  "fib.cpp": [
    {
      "en": "The unsigned parameter excludes negative n; 64-bit results overflow quickly beyond the small teaching range.",
      "zh": "无符号参数排除负 n；超出较小教学范围后，64 位结果会迅速溢出。"
    },
    {
      "en": "This single base branch returns 0 for n=0 and 1 for n=1, matching both definitions.",
      "zh": "这个递归基同时处理 n=0 和 n=1，分别返回 0 和 1，符合两条定义。"
    },
    {
      "en": "Each call must finish before the addition; the live stack is only O(n) deep even though the call tree is exponential.",
      "zh": "两次调用都返回后才做加法；虽然调用树指数增长，活动栈深度仍只有 O(n)。"
    }
  ],
  "fib.py": [
    {
      "en": "Python integers are unbounded, but this naive recursion still has exponential call growth and O(n) depth.",
      "zh": "Python 整数没有位宽上限，但朴素递归仍有指数级调用量，活动栈深度为 O(n)。"
    },
    {
      "en": "Reject negative n before the base cases; F(n) is undefined there.",
      "zh": "在递归基之前拒绝负 n；负下标处的 F(n) 未定义。"
    },
    {
      "en": "The two branches are evaluated independently; the same F(k) is recomputed many times because nothing is cached.",
      "zh": "两个分支独立求值；没有任何缓存，因此同一个 F(k) 会被重复计算多次。"
    }
  ],
  "queue.c": [
    {
      "en": "front and rear start at the same index; that equality is the empty state, so no count field is needed.",
      "zh": "front 与 rear 从同一位置开始；这个相等关系就是空队列，因此无需额外计数字段。"
    },
    {
      "en": "The reserved slot is the one just before front: rear never writes there, so a capacity-8 array holds at most 7 items.",
      "zh": "保留槽就是 front 前面那一格：rear 永不写入它，因此容量 8 的数组最多存 7 个元素。"
    },
    {
      "en": "Fullness is tested before the write; a rejected enqueue must not overwrite the reserved slot or any live item.",
      "zh": "写入前先判满；被拒绝的入队不能覆盖保留槽或任何有效元素。"
    },
    {
      "en": "rear names the next free slot, so write there before advancing; advancing first would overwrite the following slot.",
      "zh": "rear 指向下一个空槽，必须先写再后移；先移动会覆盖后面的槽。"
    },
    {
      "en": "Modulo wraps the physical index without shifting elements; logical order is encoded by the front/rear offsets.",
      "zh": "取模让物理下标回绕而不搬移元素；逻辑顺序由 front/rear 的相对位置编码。"
    },
    {
      "en": "Dequeue reads front before advancing; the value must be copied out before that slot leaves the live range.",
      "zh": "出队先读 front 再前移；必须在槽位离开有效区间前把值复制出去。"
    },
    {
      "en": "Advancing front is the entire removal; the old bytes remain but are outside [front, rear).",
      "zh": "前移 front 就完成删除；旧字节仍在数组中，但已不属于 [front, rear)。"
    },
    {
      "en": "QueueFront is read-only and leaves front unchanged, so the same item can still be dequeued later.",
      "zh": "QueueFront 只读且不移动 front，因此同一元素之后仍可正常出队。"
    }
  ],
  "queue.cpp": [
    {
      "en": "front_ == rear_ is the only empty condition; starting both at zero avoids a separate count.",
      "zh": "front_ == rear_ 是唯一的空队列条件；二者从 0 开始即可，无需额外计数。"
    },
    {
      "en": "One slot is deliberately unused: the ring can hold kCapacity-1 values while still distinguishing full from empty.",
      "zh": "刻意空出一格：环最多容纳 kCapacity-1 个值，同时仍能区分队满与队空。"
    },
    {
      "en": "Check before writing; a full queue must reject the new value without disturbing any live slot.",
      "zh": "写入前先检查；队满时必须拒绝新值，且不能扰动任何有效槽。"
    },
    {
      "en": "rear_ is the next free slot, so the write happens before the modulo advance.",
      "zh": "rear_ 指向下一个空槽，因此必须先写入，再做取模前移。"
    },
    {
      "en": "The modulo is the wrap; without it a full ring would index past the array instead of returning to 0.",
      "zh": "取模完成回绕；没有它，环会在数组末尾越界而不是回到 0。"
    },
    {
      "en": "optional distinguishes an empty queue from a stored 0; the value is copied before front_ moves.",
      "zh": "optional 把空队列和真实值 0 区分开；值在 front_ 移动前先被复制。"
    },
    {
      "en": "Moving front_ is the dequeue; the slot becomes dead without any erase or shift.",
      "zh": "移动 front_ 就是出队；该槽逻辑失效，无需擦除或搬移。"
    },
    {
      "en": "front() is read-only; it observes data_[front_] and leaves the queue state unchanged.",
      "zh": "front() 是只读操作；只观察 data_[front_]，不改变队列状态。"
    }
  ],
  "queue.py": [
    {
      "en": "A ring that reserves one slot needs at least two cells; capacity 1 could never hold an element and still distinguish full from empty.",
      "zh": "保留一格的回绕队列至少需要两个单元；容量 1 既存不了元素，也无法区分空满。"
    },
    {
      "en": "The spare slot sits immediately before front; the modulo makes the comparison work across the array boundary.",
      "zh": "保留槽位于 front 前一格；取模让比较在数组边界处也能成立。"
    },
    {
      "en": "Fullness is checked before the write, so a rejected value cannot overwrite the reserved slot.",
      "zh": "写入前先判满，因此被拒绝的值不会覆盖保留槽。"
    },
    {
      "en": "rear is the next free slot, so store there and advance afterwards.",
      "zh": "rear 指向下一个空槽，必须先存值再前移。"
    },
    {
      "en": "Modulo wraps rear to 0 without moving any existing item; front and rear encode the logical order.",
      "zh": "取模让 rear 回到 0 而不移动已有元素；front 与 rear 共同编码逻辑顺序。"
    },
    {
      "en": "None signals an empty queue; a stored 0 is still valid because emptiness is tested on front == rear.",
      "zh": "None 表示空队列；真实值 0 仍合法，因为判空依据是 front == rear。"
    },
    {
      "en": "Advancing front is the removal; the old list entry remains but is no longer between front and rear.",
      "zh": "前移 front 就完成删除；旧列表项仍在，但已不在 front 与 rear 之间。"
    },
    {
      "en": "front() reads data[front] without moving front, so it is safe to call repeatedly.",
      "zh": "front() 读取 data[front] 且不移动 front，因此可以安全地重复调用。"
    }
  ],
  "inorder.c": [
    {
      "en": "NULL is the empty subtree, so return without touching value or child links; this base case stops every descent.",
      "zh": "NULL 表示空子树，直接返回且不访问 value 或孩子链接；这个递归基终止每一次下降。"
    },
    {
      "en": "The left call must return before the root is printed; the call stack holds ancestors whose right subtrees are still pending.",
      "zh": "左递归必须先返回，之后才能打印根；调用栈保存着右子树仍待处理的祖先。"
    },
    {
      "en": "Visiting between the two recursive calls is the definition of inorder; moving this line changes the traversal order.",
      "zh": "访问语句位于两次递归之间，这正是中序的定义；移动这一行就会改变遍历顺序。"
    },
    {
      "en": "The right subtree runs after the root, so a BST emits keys in ascending order.",
      "zh": "右子树在根之后执行，因此对 BST 来说关键字会按升序输出。"
    }
  ],
  "inorder.cpp": [
    {
      "en": "nullptr is the empty subtree, so return without touching value or child links; this base case stops every descent.",
      "zh": "nullptr 表示空子树，直接返回且不访问 value 或孩子链接；这个递归基终止每一次下降。"
    },
    {
      "en": "The left call must return before the root is printed; the call stack holds ancestors whose right subtrees are still pending.",
      "zh": "左递归必须先返回，之后才能打印根；调用栈保存着右子树仍待处理的祖先。"
    },
    {
      "en": "Visiting between the two recursive calls is the definition of inorder; moving this line changes the traversal order.",
      "zh": "访问语句位于两次递归之间，这正是中序的定义；移动这一行就会改变遍历顺序。"
    },
    {
      "en": "The right subtree runs after the root, so a BST emits keys in ascending order.",
      "zh": "右子树在根之后执行，因此对 BST 来说关键字会按升序输出。"
    }
  ],
  "inorder.py": [
    {
      "en": "None is the empty subtree, so return without touching value or child links; this base case stops every descent.",
      "zh": "None 表示空子树，直接返回且不访问 value 或孩子链接；这个递归基终止每一次下降。"
    },
    {
      "en": "The left call must return before the root is appended; the call stack holds ancestors whose right subtrees are still pending.",
      "zh": "左递归必须先返回，之后才能追加根；调用栈保存着右子树仍待处理的祖先。"
    },
    {
      "en": "Appending between the two recursive calls is the definition of inorder; moving this line changes the traversal order.",
      "zh": "追加语句位于两次递归之间，这正是中序的定义；移动这一行就会改变遍历顺序。"
    },
    {
      "en": "The right subtree runs after the root, so a BST emits keys in ascending order.",
      "zh": "右子树在根之后执行，因此对 BST 来说关键字会按升序输出。"
    }
  ],
  "huffman.c": [
    {
      "en": "Frequency is primary; order breaks ties, so equal weights still produce a deterministic tree shape.",
      "zh": "频率是主键；插入序号用于打破平局，因此相同权值也会得到确定的树形。"
    },
    {
      "en": "Append at the end of the array, then sift up; the heap property is restored along one root path.",
      "zh": "先把结点追加到数组末尾，再上浮；堆性质只沿一条通向根的路径恢复。"
    },
    {
      "en": "The 0-based parent formula; index 0 has no parent and ends the sift-up loop.",
      "zh": "这是 0 基堆的父结点公式；index 为 0 时没有父结点，上浮循环随之结束。"
    },
    {
      "en": "The root is the minimum; removing it must keep the array compact, so the last leaf fills the root.",
      "zh": "根结点就是最小值；删除后必须保持数组紧凑，因此用最后一个叶结点填补根。"
    },
    {
      "en": "Shrink first, then copy the current last live node into the root; the saved top remains the returned minimum.",
      "zh": "先缩小 size，再把当前最后一个有效结点复制到根；已保存的 top 仍是返回的最小值。"
    },
    {
      "en": "Sift-down compares the current node with both children and swaps with the smaller one; stopping when neither child is smaller restores heap order.",
      "zh": "下沉时比较当前结点与两个孩子，并与较小者交换；当两个孩子都不更小时停止，堆序即恢复。"
    },
    {
      "en": "Every node starts with null children; internal nodes use the placeholder symbol, so only leaves are printed as characters.",
      "zh": "每个结点创建时孩子都为空；内部结点使用占位字符，因此只有叶子会打印成字符。"
    },
    {
      "en": "A node with no children is a leaf; its path is complete, so write the terminator and emit the code.",
      "zh": "没有孩子的结点就是叶子；此时路径已完整，写入终止符并输出编码。"
    },
    {
      "en": "Left edges append 0 and right edges append 1; depth indexes the next free character in the shared path buffer.",
      "zh": "左分支追加 0，右分支追加 1；depth 指向共享路径缓冲区中的下一个空字符。"
    },
    {
      "en": "Postorder release is required: children must be freed before the parent whose fields still point at them.",
      "zh": "必须后序释放：先释放孩子，再释放仍然指向它们的孩子结点。"
    }
  ],
  "huffman.cpp": [
    {
      "en": "Reserve the full binary-tree size before taking node references; vector growth would invalidate the MinHeap's reference and all stored indices.",
      "zh": "先预留完整二叉树的容量，再让 MinHeap 持有引用；vector 扩容会使引用失效，并让所有下标失去意义。"
    },
    {
      "en": "The heap stores indices, not Node copies; nodes_ must outlive the heap and never reallocate during merging.",
      "zh": "堆保存的是下标而非 Node 副本；nodes_ 必须比堆活得久，并且合并期间绝不能重新分配。"
    },
    {
      "en": "Frequency is primary and insertion order breaks ties; this total order makes equal-weight merges deterministic.",
      "zh": "频率是主键，插入序号用于打破平局；这个全序让相同权值的合并结果确定。"
    },
    {
      "en": "Append the index at the end of the array, then sift up; the parent of i is (i - 1) / 2.",
      "zh": "把下标追加到数组末尾再上浮；下标 i 的父结点是 (i - 1) / 2。"
    },
    {
      "en": "Save the root index, move the last index into the root, shrink, then sift down; the returned index still names a live node.",
      "zh": "先保存根下标，把末尾下标移到根、缩小堆，再下沉；返回的下标仍指向有效结点。"
    },
    {
      "en": "The scan includes the current node, so no swap occurs when the heap order already holds.",
      "zh": "比较范围包含当前结点，因此堆序已经成立时不会发生交换。"
    },
    {
      "en": "An index whose both child links are -1 is a leaf; its accumulated path is the final prefix code.",
      "zh": "两个子链接都为 -1 的下标是叶子；累积的 path 就是最终前缀码。"
    },
    {
      "en": "Each recursive call receives a new string, so sibling branches cannot corrupt each other's path.",
      "zh": "每次递归都收到一个新的字符串，因此兄弟分支不会破坏彼此的路径。"
    },
    {
      "en": "Internal nodes receive increasing order values after the leaves, keeping ties deterministic without changing frequency order.",
      "zh": "内部结点在叶子之后获得递增序号，从而在不改变频率顺序的前提下保持平局稳定。"
    }
  ],
  "huffman.py": [
    {
      "en": "Frequency is primary and order is the tie-breaker; the symbol is deliberately not compared.",
      "zh": "频率是主键，插入序号用于打破平局；符号本身刻意不参与比较。"
    },
    {
      "en": "Append then sift up; the list is a complete binary tree, so the parent index is (i - 1) // 2.",
      "zh": "先追加再上浮；列表就是完全二叉树，因此父结点下标为 (i - 1) // 2。"
    },
    {
      "en": "Save the root, move the last leaf into it, then sift down; the caller must never pop an empty heap.",
      "zh": "先保存根，把最后一个叶结点移入根，再下沉；调用者绝不能对空堆执行 pop。"
    },
    {
      "en": "Pop the last element first so the array shrinks before the root is replaced; the saved root remains valid.",
      "zh": "先弹出末尾元素，使数组在替换根之前缩短；已保存的根仍然有效。"
    },
    {
      "en": "Each child index is bounds-checked before comparison; equal keys are resolved by order, never by object identity.",
      "zh": "比较前先检查每个孩子下标；相同键由 order 解决，绝不依赖对象身份。"
    },
    {
      "en": "A node with no children is a leaf; its path is complete, so store it under the leaf symbol.",
      "zh": "没有孩子的结点是叶子；此时路径完整，按叶子的符号存入编码表。"
    },
    {
      "en": "Strings are immutable, so concatenation gives each branch an independent path.",
      "zh": "字符串不可变，因此拼接会给每个分支一条独立的路径。"
    },
    {
      "en": "Two pops and one push reduce the forest by one tree; the final root carries the sum of all frequencies.",
      "zh": "两次 pop 加一次 push 使森林减少一棵树；最终根结点保存所有频率之和。"
    }
  ],
  "bfs.c": [
    {
      "en": "The queue holds only discovered vertices; visited is set at enqueue time, so no vertex can enter twice.",
      "zh": "队列中只保存已发现的顶点；visited 在入队时置位，所以同一顶点不可能再次入队。"
    },
    {
      "en": "One zeroed mark per vertex; zero means undiscovered before the start is inserted.",
      "zh": "每个顶点一个清零标记；起点入队前，0 表示尚未发现。"
    },
    {
      "en": "The array is a FIFO ring: head removes, tail inserts, and VERTEX_COUNT bounds the frontier because each vertex is enqueued at most once.",
      "zh": "数组作为 FIFO 环形队列：head 删除、tail 插入；每个顶点最多入队一次，因此 VERTEX_COUNT 足够。"
    },
    {
      "en": "head names the next vertex to remove; tail names the next free slot.",
      "zh": "head 指向下一个要删除的顶点，tail 指向下一个空槽。"
    },
    {
      "en": "Both indices start at zero, so the queue begins empty and no reserved slot is needed.",
      "zh": "两个下标都从 0 开始，队列初始为空，不需要额外保留槽。"
    },
    {
      "en": "Mark the start before enqueueing; the invariant is 'queued implies visited'.",
      "zh": "先把起点标记再入队；循环不变量是“在队列中即已标记”。"
    },
    {
      "en": "Store at tail and post-increment it; the old tail slot now holds the first frontier vertex.",
      "zh": "写入 tail 位置后自增；旧 tail 槽现在保存第一个前沿顶点。"
    },
    {
      "en": "head < tail means live elements remain; the gap between them is the queue length.",
      "zh": "head < tail 表示仍有有效元素；两者之间的差就是队列长度。"
    },
    {
      "en": "Copy the oldest vertex and advance head; post-increment leaves head at the next live slot.",
      "zh": "先复制队首顶点再自增 head；自增后 head 指向下一个有效槽。"
    },
    {
      "en": "Print on removal, so the output is the BFS processing order rather than discovery order.",
      "zh": "出队时才打印，因此输出是 BFS 处理顺序，而不是发现顺序。"
    },
    {
      "en": "The matrix row is scanned left to right; this fixes neighbor order but costs O(V) even for sparse rows.",
      "zh": "按列从左到右扫描矩阵行；这固定了邻居次序，但稀疏行也要 O(V) 时间。"
    },
    {
      "en": "An edge alone is not enough; the visited guard prevents duplicate discovery and repeated queue insertion.",
      "zh": "有边还不够；visited 守卫阻止重复发现和重复入队。"
    },
    {
      "en": "Mark before storing next; a later row that also reaches next must see the mark.",
      "zh": "先标记 next 再写入队列；之后扫描到同一 next 的其他行必须能看到标记。"
    },
    {
      "en": "Discover at the back; next waits behind every vertex already in the queue.",
      "zh": "从队尾发现；next 排在所有已在队列中的顶点之后。"
    }
  ],
  "bfs.cpp": [
    {
      "en": "The queue holds only discovered vertices; visited is set at enqueue time, so each vertex enters at most once.",
      "zh": "队列保存前沿顶点；visited 在入队时置位，因此每个顶点最多进入一次。"
    },
    {
      "en": "One boolean mark per vertex, sized from the adjacency list; false means undiscovered.",
      "zh": "每个顶点一个布尔标记，大小由邻接表顶点数决定；false 表示尚未发现。"
    },
    {
      "en": "The FIFO discipline of std::queue is what makes BFS level ordered; the container order defines the traversal order.",
      "zh": "std::queue 的 FIFO 次序就是 BFS 的层序；容器顺序本身决定访问顺序。"
    },
    {
      "en": "The start is discovered before the loop, so the invariant already includes it.",
      "zh": "起点在循环前就标记并进入前沿，因此循环不变量一开始成立。"
    },
    {
      "en": "Mark before push; marking at pop time would let several predecessors enqueue the same vertex.",
      "zh": "先标记再 push；若等到 pop 才标记，多个前驱会把同一顶点重复入队。"
    },
    {
      "en": "Each iteration consumes exactly one frontier vertex, so the queue eventually drains.",
      "zh": "每轮恰好消费一个前沿顶点，队列最终会排空。"
    },
    {
      "en": "front() observes the oldest vertex; the queue itself decides the breadth-first order.",
      "zh": "front() 只读取最老的顶点；队列本身决定广度优先顺序。"
    },
    {
      "en": "Remove only after copying vertex; pop alone would discard the value before the neighbor scan.",
      "zh": "先复制 vertex 再 pop；单独 pop 会在扫描邻居前丢掉值。"
    },
    {
      "en": "Adjacency lists visit only real neighbors, so this loop is O(deg(vertex)) instead of O(V).",
      "zh": "邻接表只遍历真实邻居，因此这一步是 O(deg(vertex))，而不是 O(V)。"
    },
    {
      "en": "The visited guard is checked before push; an already discovered neighbor is skipped even if another edge reaches it.",
      "zh": "先检查 visited 再入队；即使另一条边也到达同一邻居，已发现的顶点仍被跳过。"
    },
    {
      "en": "Mark before push so a later neighbor scan cannot enqueue the same vertex again.",
      "zh": "先置位再 push，使后续任何邻居扫描都不能再次入队。"
    },
    {
      "en": "Push at the back; all vertices already in the queue are processed first.",
      "zh": "压到队尾；所有已在队列中的顶点都先于它被处理。"
    }
  ],
  "bfs.py": [
    {
      "en": "Visited is set on enqueue, not on dequeue, so a vertex with several predecessors enters the queue once.",
      "zh": "visited 在入队时置位，而不是出队时；有多个前驱的顶点只进入队列一次。"
    },
    {
      "en": "One boolean per vertex; the list length also fixes the valid index range.",
      "zh": "每个顶点一个布尔值；列表长度同时限定合法下标范围。"
    },
    {
      "en": "Mark the start before the loop; the invariant is 'queued implies visited'.",
      "zh": "循环前先标记起点；不变量是“已入队即已标记”。"
    },
    {
      "en": "deque gives O(1) popleft; a list pop(0) would shift the remaining frontier.",
      "zh": "deque 让 popleft 为 O(1)；若用 list.pop(0)，剩余前沿会整体搬移。"
    },
    {
      "en": "Order records dequeue order, which is also nondecreasing distance order for an unweighted graph.",
      "zh": "order 记录出队顺序；在无权图中这也是距离非降的顺序。"
    },
    {
      "en": "The loop ends when the frontier is empty, meaning the start component has been exhausted.",
      "zh": "队列为空时结束，表示起点所在连通分量已经全部处理。"
    },
    {
      "en": "popleft removes the oldest discovery; this FIFO step is what distinguishes BFS from DFS.",
      "zh": "弹出最早发现的顶点；这个 FIFO 步骤正是 BFS 与 DFS 的分界。"
    },
    {
      "en": "Record on removal, not on discovery, so the output matches the processing order.",
      "zh": "在出队时记录，而不是发现时，输出才与处理顺序一致。"
    },
    {
      "en": "Only stored neighbors are scanned; absent entries mean no edge.",
      "zh": "只扫描实际存储的邻居；缺失项表示没有边。"
    },
    {
      "en": "The guard prevents a second enqueue; without it the queue can grow without bound on cycles.",
      "zh": "守卫阻止第二次入队；在环上缺少它会令队列无限增长。"
    },
    {
      "en": "Mark before append; the mark must be visible to any later neighbor scan.",
      "zh": "先标记再 append；之后任何邻居扫描都必须看到这个标记。"
    },
    {
      "en": "Append at the right end; the vertex waits behind everything discovered earlier.",
      "zh": "追加到右端；它排在此前发现的所有顶点之后。"
    }
  ],
  "dfs.c": [
    {
      "en": "visited is shared across recursive calls; the caller owns its storage and initial zeroes.",
      "zh": "visited 由所有递归帧共享；调用者分配并清零，函数只读写不复制。"
    },
    {
      "en": "Mark on entry, before scanning neighbors; this is what stops a cycle from recursing forever.",
      "zh": "进入顶点后立刻标记，再扫描邻居；这是环不会无限递归的原因。"
    },
    {
      "en": "Printing on entry makes this a preorder DFS; moving the print after the loop would produce postorder.",
      "zh": "进入时打印，得到前序 DFS；若把打印移到循环之后就是后序。"
    },
    {
      "en": "The matrix row is scanned left to right; recursion goes as deep as possible before the next sibling.",
      "zh": "矩阵行从左到右扫描；递归会先走完一个邻居的整条分支，再考虑下一个兄弟。"
    },
    {
      "en": "Only unvisited neighbors recurse; the visited check is what turns a cyclic graph into a tree of calls.",
      "zh": "只有未访问邻居才递归；visited 检查把环图变成一棵调用树。"
    },
    {
      "en": "The call returns only after the entire branch below next is exhausted, then the loop continues with the next sibling.",
      "zh": "该调用返回时 next 以下的整条分支已穷尽，外层循环才继续下一个邻居。"
    },
    {
      "en": "One call covers exactly the connected component containing start.",
      "zh": "每次调用从 start 开始，只覆盖 start 所在的一个连通分量。"
    },
    {
      "en": "The array is zero-initialized once; every recursive call receives the same array, not a copy.",
      "zh": "数组只清零一次；每个递归帧接收同一块存储，而不是各自的副本。"
    },
    {
      "en": "The entry call marks and prints every vertex reachable from start; other components keep their zero flags.",
      "zh": "入口调用把起点及其可达顶点全部标记并打印；其他分量保持 0。"
    }
  ],
  "dfs.cpp": [
    {
      "en": "visited is passed by reference so all recursive frames share one set of marks.",
      "zh": "visited 以引用传递，所有递归帧共享同一组标记。"
    },
    {
      "en": "Mark before iterating neighbors; an unmarked vertex on a cycle would be re-entered.",
      "zh": "先标记再遍历邻居；环上未标记的顶点会被再次进入。"
    },
    {
      "en": "Preorder output: the vertex is reported before any of its descendants.",
      "zh": "前序输出：顶点先于它的所有后代被报告。"
    },
    {
      "en": "The range loop visits real neighbors only; recursion explores one neighbor's entire branch before the next.",
      "zh": "范围循环只访问真实邻居；递归会先穷尽一个邻居的分支，再处理下一个。"
    },
    {
      "en": "The guard is evaluated at the parent level; an already visited neighbor is skipped without a call.",
      "zh": "守卫在父层判断；已访问邻居被直接跳过，不产生调用。"
    },
    {
      "en": "Depth is bounded by the number of vertices; on a path graph the stack reaches V frames.",
      "zh": "递归深度以顶点数为上限；路径图上调用栈可达 V 帧。"
    },
    {
      "en": "One call covers exactly the connected component containing start.",
      "zh": "每次从 start 开始，只覆盖该起点可达的一个分量。"
    },
    {
      "en": "The vector is sized to the graph and zero-filled; all frames index the same storage.",
      "zh": "向量按图大小分配并全部清零；所有帧索引同一存储。"
    },
    {
      "en": "Only vertices reachable from start are marked; other components keep their false flags.",
      "zh": "只有起点可达的顶点会被标记；其他分量保持 false。"
    }
  ],
  "dfs.py": [
    {
      "en": "visited and order are shared mutable objects, so recursive calls append to the same result.",
      "zh": "visited 与 order 是共享的可变对象，递归调用都追加到同一个结果。"
    },
    {
      "en": "Mark on entry; the mark must precede the neighbor loop so back edges see it.",
      "zh": "进入时置位；标记必须先于邻居循环，回边才能看到它。"
    },
    {
      "en": "Append on entry gives preorder; the vertex precedes all descendants in the output.",
      "zh": "进入时追加得到前序；顶点在输出中先于所有后代。"
    },
    {
      "en": "Each neighbor is considered once, but recursion may run to the bottom before the next sibling.",
      "zh": "每个邻居只考虑一次，但递归可能先走到底，再返回处理下一个兄弟。"
    },
    {
      "en": "Only unmarked neighbors recurse; marked ones are either ancestors or already finished branches.",
      "zh": "只有未标记邻居才递归；已标记的邻居要么是祖先，要么是已完成分支。"
    },
    {
      "en": "Recursive depth can reach V; Python's recursion limit is the practical constraint on long chains.",
      "zh": "递归深度可达 V；Python 的递归上限是长链上的实际约束。"
    },
    {
      "en": "The wrapper allocates marks and the result list; traversal itself stays in dfs_visit.",
      "zh": "包装函数只负责分配标记与结果，遍历逻辑集中在 dfs_visit。"
    },
    {
      "en": "One False per vertex; the list length is also the valid index boundary.",
      "zh": "每个顶点一个 False；列表长度同时是合法下标边界。"
    },
    {
      "en": "The result list is filled by recursion; the wrapper does not know the order in advance.",
      "zh": "结果列表由递归填充；包装函数不预先知道访问顺序。"
    },
    {
      "en": "One call covers only the component containing start; other components are never touched.",
      "zh": "一次调用只覆盖 start 所在分量；其他分量不会被触碰。"
    }
  ]
};
