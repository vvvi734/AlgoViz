/**
 * TEXTBOOK-02 — chapter 2 runnable examples.
 *
 * Two real Python programs drive the new chapter-2 animations:
 *  - a static linked list whose nodes live in a fixed array and use cursors;
 *  - univariate polynomial addition over two ordered linked lists.
 *
 * Every teaching frame is produced by the executed program. The trace payload
 * is a complete structural snapshot, so playback, stepping backwards and
 * jumping to an arbitrary frame never has to replay or infer an earlier state.
 *
 * The textbook is used for the algorithm ideas only. The implementations below
 * are independent teaching versions written for AlgoViz.
 */

export const STATIC_LINKED_DEFAULT_INPUT = {
  capacity: 8,
  values: [10, 20, 30],
  operations: [
    ['insert', 2, 25],
    ['delete', 3],
    ['traverse'],
  ],
};

export const STATIC_LINKED_PYTHON = `# Static linked list: nodes live in one fixed array; cur is an array index.
# 静态链表：结点存放在固定数组中，cur 保存的是数组下标而不是地址。
cfg = input if isinstance(input, dict) else {}
capacity = cfg.get("capacity", 8)
if isinstance(capacity, bool) or not isinstance(capacity, int):
    capacity = 8
capacity = max(4, min(capacity, 10))
raw_values = cfg.get("values", [])
if not isinstance(raw_values, list):
    raw_values = []
values = [value for value in raw_values if isinstance(value, (int, float)) and not isinstance(value, bool)]
values = values[:capacity]
operations = cfg.get("operations", [])
if not isinstance(operations, list):
    operations = []

data = [None] * capacity       # data domain; None marks an unused slot
cur = [None] * capacity        # cursor domain; None is this program's NULL
head = None                    # first logical node, as an array index
free_head = None               # first slot on the free chain


def chain(start):
    """Follow cursors from start; the returned list is the real logical order."""
    order = []
    seen = set()
    node = start
    while node is not None and node not in seen:
        seen.add(node)
        order.append(node)
        node = cur[node]
    return order


def emit(operation, action, phase, lesson, message, focus=None, **extra):
    logical = chain(head)
    free_nodes = chain(free_head)
    payload = {
        "kind": "static-linked-list",
        "operation": operation,
        "action": action,
        "phase": phase,
        "capacity": capacity,
        "head": head,
        "freeHead": free_head,
        "slots": [
            {"index": i, "data": data[i], "cursor": cur[i]}
            for i in range(capacity)
        ],
        "logical": logical,
        "freeList": free_nodes,
    }
    if focus is not None:
        payload["focusIndex"] = focus
    for key, value in extra.items():
        if value is not None:
            payload[key] = value
    trace(
        {"type": "array", "values": [data[i] for i in logical], "focus": logical},
        message,
        variables={
            "head": head,
            "freeHead": free_head,
            "logical": logical,
            "data": data[:],
            "cur": cur[:],
            "capacity": capacity,
        },
        lesson_step=lesson,
        structure=payload,
    )


def reject(lesson, message, error):
    emit("insert" if lesson == "insert" else "delete", "reject", "complete", "reject",
         message, focus=None, error=error)


# Initialise both chains: the live prefix is linked in order, the remaining
# slots form the free chain. data and cur are the only physical state.
initial_length = len(values)
for i in range(initial_length):
    data[i] = values[i]
    cur[i] = i + 1 if i + 1 < initial_length else None
head = 0 if initial_length else None
free_head = initial_length if initial_length < capacity else None
for i in range(initial_length, capacity):
    cur[i] = i + 1 if i + 1 < capacity else None

emit("init", "complete", "complete", "init",
     "初始化：有效结点按 cur 串成逻辑链，其余槽位组成空闲链 / init: live chain and free chain share one array",
     focus=head)


def length():
    return len(chain(head))


def node_at(rank):
    node = head
    for _ in range(rank):
        node = cur[node]
    return node


def predecessor(position):
    # position is 1-based, matching the textbook's linear-list positions.
    if position == 1:
        return None
    return node_at(position - 2)


for entry in operations:
    if not isinstance(entry, list) or not entry:
        continue
    operation = entry[0]
    if operation == "insert":
        position = entry[1] if len(entry) > 1 else 0
        value = entry[2] if len(entry) > 2 else 0
        if not isinstance(position, int) or isinstance(position, bool):
            reject("insert", "插入位置必须是整数 / insertion position must be an integer", "bad-position")
            continue
        live = length()
        if position < 1 or position > live + 1:
            reject("insert", "插入位置非法：必须满足 1 ≤ position ≤ length+1 / invalid position", "position-out-of-range")
            continue
        if free_head is None:
            reject("insert", "数组已满：空闲链为空，无法申请结点 / full: the free chain is empty", "capacity-full")
            continue
        # Borrow the first free slot; the free chain moves to its successor.
        new_index = free_head
        free_head = cur[new_index]
        cur[new_index] = None
        emit("insert", "allocate", "intermediate", "allocate",
             "申请空闲结点：freeHead 后移 / allocate a slot from the free chain",
             focus=new_index, allocatedIndex=new_index)
        data[new_index] = value
        emit("insert", "write", "intermediate", "insert",
             "写入数据域 data[" + str(new_index) + "] = " + str(value) + " / write the data field",
             focus=new_index, allocatedIndex=new_index)
        prev = predecessor(position)
        successor = cur[prev] if prev is not None else head
        cur[new_index] = successor
        if prev is None:
            head = new_index
        else:
            cur[prev] = new_index
        emit("insert", "link", "intermediate", "insert",
             "接入逻辑链：new.cur = 原后继，前驱.cur = new / link after the predecessor",
             focus=new_index, allocatedIndex=new_index, predecessorIndex=prev,
             change={"index": new_index, "beforeCursor": None, "afterCursor": successor})
        emit("insert", "complete", "complete", "insert",
             "插入完成：数组位置与逻辑位置互相独立 / insertion complete",
             focus=new_index, allocatedIndex=new_index)

    elif operation == "delete":
        position = entry[1] if len(entry) > 1 else 0
        if not isinstance(position, int) or isinstance(position, bool):
            reject("delete", "删除位置必须是整数 / deletion position must be an integer", "bad-position")
            continue
        live = length()
        if position < 1 or position > live:
            reject("delete", "删除位置非法：必须满足 1 ≤ position ≤ length / invalid position", "position-out-of-range")
            continue
        target = node_at(position - 1)
        prev = predecessor(position)
        removed = data[target]
        successor = cur[target]
        if prev is None:
            head = successor
        else:
            cur[prev] = successor
        emit("delete", "unlink", "intermediate", "remove",
             "摘链：前驱越过目标，逻辑链不再包含它 / unlink the target first",
             focus=target, removedIndex=target, removedValue=removed,
             predecessorIndex=prev)
        # Return the slot to the front of the free chain. data is cleared here;
        # the textbook may keep the old value, which is harmless because the slot
        # is no longer reachable from head.
        data[target] = None
        cur[target] = free_head
        free_head = target
        emit("delete", "release", "intermediate", "free",
             "归还空闲链：target.cur = freeHead，freeHead = target / recycle the slot",
             focus=target, removedIndex=target, removedValue=removed,
             change={"index": target, "beforeCursor": successor, "afterCursor": cur[target]})
        emit("delete", "complete", "complete", "delete",
             "删除完成：被删结点已可从空闲链重新申请 / deletion complete",
             focus=head, removedIndex=target, removedValue=removed)

    elif operation == "traverse":
        node = head
        order = []
        while node is not None:
            order.append(node)
            emit("traverse", "visit", "intermediate", "traverse",
                 "按 cur 访问：数组下标 " + str(node) + "，值 " + str(data[node]) + " / follow cur, not array order",
                 focus=node, visited=list(order))
            node = cur[node]
        emit("traverse", "complete", "complete", "traverse",
             "遍历结束：访问顺序由 cur 决定 / traversal follows cursors",
             visited=order)

emit("done", "complete", "complete", "done",
     "演示结束：物理数组顺序不等于逻辑链表顺序 / done",
     focus=head)
`;

export const POLYNOMIAL_ADD_DEFAULT_INPUT = {
  a: [
    { coefficient: 3, exponent: 4 },
    { coefficient: 2, exponent: 2 },
    { coefficient: -5, exponent: 0 },
  ],
  b: [
    { coefficient: -3, exponent: 4 },
    { coefficient: 4, exponent: 3 },
    { coefficient: 7, exponent: 0 },
  ],
};

export const POLYNOMIAL_ADD_PYTHON = `# Polynomial addition: two exponent-ordered singly linked lists are merged.
# 一元多项式相加：两条按指数降序排列的链表，用双指针合并成一条结果链。
cfg = input if isinstance(input, dict) else {}


def integer(value):
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError("coefficient and exponent must be integers")
    return value


def read_terms(key):
    raw = cfg.get(key, [])
    if not isinstance(raw, list):
        raise ValueError(key + " must be a list of terms")
    terms = []
    previous = None
    for item in raw:
        if not isinstance(item, dict):
            raise ValueError("each term needs a coefficient and an exponent")
        coefficient = integer(item.get("coefficient"))
        exponent = integer(item.get("exponent"))
        if coefficient == 0:
            raise ValueError("zero-coefficient terms must be removed before merging")
        if exponent < 0:
            raise ValueError("exponents must be non-negative")
        if previous is not None and exponent >= previous:
            raise ValueError("terms must be strictly ordered by decreasing exponent")
        previous = exponent
        terms.append((coefficient, exponent))
    return terms


class PolyNode:
    def __init__(self, node_id, coefficient, exponent):
        self.node_id = node_id
        self.coefficient = coefficient
        self.exponent = exponent
        self.next = None


def build_chain(terms, prefix):
    first = None
    tail = None
    for index, (coefficient, exponent) in enumerate(terms, start=1):
        node = PolyNode(prefix + str(index), coefficient, exponent)
        if first is None:
            first = node
        else:
            tail.next = node
        tail = node
    return first


def nodes_from(start):
    nodes = []
    seen = set()
    node = start
    while node is not None and node.node_id not in seen:
        seen.add(node.node_id)
        nodes.append({
            "id": node.node_id,
            "coefficient": node.coefficient,
            "exponent": node.exponent,
            "nextId": node.next.node_id if node.next is not None else None,
        })
        node = node.next
    return nodes


a_head = build_chain(read_terms("a"), "a")
b_head = build_chain(read_terms("b"), "b")
result_head = None
result_tail = None
a_cursor = a_head
b_cursor = b_head
result_sequence = 0


def expression(start):
    pieces = []
    node = start
    while node is not None:
        coefficient = node.coefficient
        exponent = node.exponent
        if exponent == 0:
            pieces.append(str(coefficient))
        elif exponent == 1:
            pieces.append((str(coefficient) if coefficient != 1 else "") + "x")
        else:
            pieces.append((str(coefficient) if coefficient != 1 else "") + "x^" + str(exponent))
        node = node.next
    return " + ".join(pieces).replace("+ -", "- ") if pieces else "0"


def emit(operation, action, phase, lesson, message, focus_side=None, comparison=None):
    payload = {
        "kind": "polynomial",
        "operation": operation,
        "action": action,
        "phase": phase,
        "aHeadId": a_head.node_id if a_head is not None else None,
        "bHeadId": b_head.node_id if b_head is not None else None,
        "resultHeadId": result_head.node_id if result_head is not None else None,
        "aNodes": nodes_from(a_head),
        "bNodes": nodes_from(b_head),
        "resultNodes": nodes_from(result_head),
        "aCurrentId": a_cursor.node_id if a_cursor is not None else None,
        "bCurrentId": b_cursor.node_id if b_cursor is not None else None,
        "resultTailId": result_tail.node_id if result_tail is not None else None,
    }
    if focus_side is not None:
        payload["focusSide"] = focus_side
    if comparison is not None:
        payload["comparison"] = comparison
    trace(
        {"type": "linked", "values": [node["coefficient"] for node in nodes_from(result_head)], "focus": []},
        message,
        variables={
            "A": expression(a_head),
            "B": expression(b_head),
            "result": expression(result_head),
            "a_current": a_cursor.exponent if a_cursor is not None else None,
            "b_current": b_cursor.exponent if b_cursor is not None else None,
        },
        lesson_step=lesson,
        structure=payload,
    )


def append_result(coefficient, exponent):
    global result_head, result_tail, result_sequence
    result_sequence += 1
    node = PolyNode("r" + str(result_sequence), coefficient, exponent)
    if result_head is None:
        result_head = node
    else:
        result_tail.next = node
    result_tail = node
    return node


emit("init", "complete", "complete", "init",
     "初始化：A、B 已按指数降序，结果链为空 / init: A and B are ordered, result is empty",
     focus_side="both")

while a_cursor is not None or b_cursor is not None:
    a_exp = a_cursor.exponent if a_cursor is not None else None
    b_exp = b_cursor.exponent if b_cursor is not None else None

    if a_cursor is not None and b_cursor is not None:
        emit("compare", "compare", "intermediate", "compare",
             "比较指数：A 的 " + str(a_exp) + " 与 B 的 " + str(b_exp) + " / compare exponents",
             focus_side="both", comparison={"aExp": a_exp, "bExp": b_exp})
        if a_exp == b_exp:
            total = a_cursor.coefficient + b_cursor.coefficient
            if total == 0:
                # Equal exponents whose coefficients cancel produce no node at
                # all: keeping a 0x^k term would break the sparse representation.
                emit("cancel", "cancel", "intermediate", "cancel",
                     "指数相等且系数之和为 0：不保留该项 / coefficients cancel, keep no term",
                     focus_side="both", comparison={"aExp": a_exp, "bExp": b_exp})
            else:
                append_result(total, a_exp)
                emit("merge", "merge", "intermediate", "equal",
                     "指数相等：系数相加为 " + str(total) + "，生成一个结果结点 / merge equal exponents",
                     focus_side="result", comparison={"aExp": a_exp, "bExp": b_exp})
            a_cursor = a_cursor.next
            b_cursor = b_cursor.next
        elif a_exp > b_exp:
            append_result(a_cursor.coefficient, a_exp)
            emit("take-a", "take-a", "intermediate", "take-a",
                 "A 的指数更大：把 A 当前项加入结果，只移动 A 指针 / take the A term",
                 focus_side="a", comparison={"aExp": a_exp, "bExp": b_exp})
            a_cursor = a_cursor.next
        else:
            append_result(b_cursor.coefficient, b_exp)
            emit("take-b", "take-b", "intermediate", "take-b",
                 "B 的指数更大：把 B 当前项加入结果，只移动 B 指针 / take the B term",
                 focus_side="b", comparison={"aExp": a_exp, "bExp": b_exp})
            b_cursor = b_cursor.next
    elif a_cursor is not None:
        append_result(a_cursor.coefficient, a_cursor.exponent)
        emit("append-a", "append-a", "intermediate", "append",
             "B 已空：依次追加 A 的剩余项 / append the remaining A terms",
             focus_side="a", comparison={"aExp": a_exp, "bExp": None})
        a_cursor = a_cursor.next
    else:
        append_result(b_cursor.coefficient, b_cursor.exponent)
        emit("append-b", "append-b", "intermediate", "append",
             "A 已空：依次追加 B 的剩余项 / append the remaining B terms",
             focus_side="b", comparison={"aExp": None, "bExp": b_exp})
        b_cursor = b_cursor.next

emit("done", "complete", "complete", "done",
     "相加完成：结果仍按指数降序，系数为 0 的项没有结点 / done",
     focus_side="result")

print("A:", expression(a_head))
print("B:", expression(b_head))
print("A+B:", expression(result_head))
`;

export const STATIC_LINKED_ENTRY = {
  group: 'ds',
  icon: '▤',
  name: ['静态链表', 'Static linked list'],
  desc: [
    '结点存放在固定数组中，data 保存元素、cur 保存后继下标。动画同时展示上方数组存储区和下方逻辑链：申请空闲结点、插入、删除归还、按游标遍历，物理顺序与逻辑顺序始终分开。',
    'Nodes live in a fixed array: data stores the element and cur stores the successor index. The animation shows the array and the logical chain together across allocation, insertion, deletion with recycling, and cursor traversal.',
  ],
  time: '插入/删除 O(n) 定位 + O(1) 改游标 · 遍历 O(n)',
  space: 'O(capacity)',
  input: STATIC_LINKED_DEFAULT_INPUT,
  code: "trace({type:'array',values:['Static linked list: use the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const POLYNOMIAL_ADD_ENTRY = {
  group: 'ds',
  icon: '∑',
  name: ['一元多项式相加', 'Polynomial addition'],
  desc: [
    '两个稀疏多项式各用一条按指数降序的单链表表示。双指针比较当前指数：相等则系数相加（和为 0 时丢弃该项），不等则先取指数较大项，最后追加未走完的剩余段。',
    'Two sparse polynomials are stored as exponent-descending singly linked lists. Two cursors compare exponents: equal exponents add their coefficients and drop a zero sum, otherwise the larger exponent is taken first; the unfinished tail is appended at the end.',
  ],
  time: 'O(m+n)',
  space: 'O(m+n)（结果链新建结点）',
  input: POLYNOMIAL_ADD_DEFAULT_INPUT,
  code: "trace({type:'linked',values:['Polynomial addition: use the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};
