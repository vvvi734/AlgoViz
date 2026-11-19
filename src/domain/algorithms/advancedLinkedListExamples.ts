/**
 * L1A teaching programs for the doubly linked list and the circular singly
 * linked list.
 *
 * Both programs are executed by the real Pyodide worker. They create actual
 * `DNode` / `CNode` objects, keep stable `n1`, `n2`, ... identities for the life
 * of the run, and emit one snapshot for every pointer assignment. A snapshot is
 * `phase: 'intermediate'` until the structure is whole again, then
 * `phase: 'complete'`, so the schema can validate the invariant without hiding
 * the real order of writes.
 *
 * The circular traversal deliberately stops on `current is head`; it never tests
 * `current.next is None`, which would either fail immediately or loop forever.
 */

export const DOUBLY_DEFAULT_INPUT: unknown = [
  ['insert_head', 5],
  ['insert_tail', 7],
  ['insert_head', 3],
  ['insert_after', 5, 6],
  ['insert_tail', 8],
  ['traverse_forward'],
  ['traverse_reverse'],
  ['find', 6],
  ['find', 99],
  ['delete', 6],
  ['delete_head'],
  ['delete_tail'],
  ['delete', 5],
  ['delete_tail', 7],
  ['insert_head', 9],
  ['insert_tail', 11],
  ['delete_head'],
  ['delete_tail'],
];

export const DOUBLY_PYTHON = `# Doubly linked list: DNode.prev and DNode.next are real references.
operations = input
nodes = []
sequence = 0
head = None
tail = None


class DNode:
    __slots__ = ("node_id", "value", "prev", "next")

    def __init__(self, node_id, value):
        self.node_id = node_id
        self.value = value
        self.prev = None
        self.next = None


def make_node(value):
    global sequence
    sequence += 1
    node = DNode("n" + str(sequence), value)
    nodes.append(node)
    return node


def chain_nodes():
    ordered = []
    seen = set()
    current = head
    while current is not None and current.node_id not in seen and len(ordered) < len(nodes):
        seen.add(current.node_id)
        ordered.append(current)
        current = current.next
    return ordered


def node_json(node):
    return {
        "id": node.node_id,
        "value": node.value,
        "prevId": node.prev.node_id if node.prev is not None else None,
        "nextId": node.next.node_id if node.next is not None else None,
    }


def emit(operation, message, line, lesson, target=None, change=None,
         phase="complete", search_value=None, found=None):
    ordered = chain_nodes()
    payload = {
        "kind": "doubly-linked-list",
        "operation": operation,
        "phase": phase,
        "headId": head.node_id if head is not None else None,
        "tailId": tail.node_id if tail is not None else None,
        "nodes": [node_json(node) for node in nodes],
    }
    if target is not None:
        payload["targetId"] = target.node_id
    if change is not None:
        node, field, before = change
        after = node.prev if field == "prev" else node.next
        payload["change"] = {
            "nodeId": node.node_id,
            "field": field,
            "beforeId": before.node_id if before is not None else None,
            "afterId": after.node_id if after is not None else None,
        }
    if search_value is not None:
        payload["searchValue"] = search_value
    if found is not None:
        payload["found"] = found
    variables = {
        "head": head.value if head is not None else None,
        "tail": tail.value if tail is not None else None,
        "current": target.value if target is not None else None,
        "current_id": target.node_id if target is not None else None,
        "length": len(ordered),
        "ids": [node.node_id for node in ordered],
    }
    trace(
        {"type": "linked", "values": [node.value for node in ordered],
         "focus": [target.node_id] if target is not None else []},
        message,
        line=line, variables=variables, lesson_step=lesson, structure=payload,
    )


def find_by_value(value, lesson):
    current = head
    while current is not None and current.value != value:
        emit("visit", f"沿 next 查找 {value}：当前是 {current.value} / walk next for {value}", 104, lesson, target=current)
        current = current.next
    if current is None:
        emit("not-found", f"查找 {value}：已到 NULL，未命中 / reached NULL, miss", 108, lesson,
             search_value=value, found=False)
        return None
    emit("found", f"查找 {value}：命中 {current.node_id} / found {current.node_id}", 110, lesson,
         target=current, search_value=value, found=True)
    return current


def insert_head(value):
    global head, tail
    node = make_node(value)
    emit("create", f"创建节点 {value}：prev/next 都是空 / create node with empty links", 120, "insert-head", target=node, phase="intermediate")
    if head is None:
        head = node
        emit("set-head", f"head = new：空表头指针指向 {value} / head points at the first node", 123, "insert-head", target=node, phase="intermediate")
        tail = node
        emit("set-tail", f"tail = new：空表只有一个节点 / one-node list has head = tail", 125, "insert-head", target=node)
        return
    before_next = node.next
    node.next = head
    emit("set-next", f"new.next = 旧 head：新节点先接住旧链 / new.next keeps the old head", 128, "insert-head", target=node,
         change=(node, "next", before_next), phase="intermediate")
    before_prev = head.prev
    head.prev = node
    emit("set-prev", f"旧 head.prev = new：旧头反向接住新节点 / old head points back", 130, "insert-head", target=head,
         change=(head, "prev", before_prev), phase="intermediate")
    head = node
    emit("set-head", f"head = new：带头节点的双向链完成 / head moves to the new node", 132, "insert-head", target=node)


def insert_tail(value):
    global head, tail
    node = make_node(value)
    emit("create", f"创建尾节点 {value} / create tail node", 138, "insert-tail", target=node, phase="intermediate")
    if head is None:
        head = node
        emit("set-head", f"head = new：空表建立第一个节点 / first node", 141, "insert-tail", target=node, phase="intermediate")
        tail = node
        emit("set-tail", f"tail = new：头尾是同一个节点 / head and tail are one node", 143, "insert-tail", target=node)
        return
    before_next = tail.next
    tail.next = node
    emit("set-next", f"tail.next = new：旧尾先指向新节点 / old tail points forward", 146, "insert-tail", target=tail,
         change=(tail, "next", before_next), phase="intermediate")
    before_prev = node.prev
    node.prev = tail
    emit("set-prev", f"new.prev = 旧 tail：新节点反向接住旧尾 / new node points back", 148, "insert-tail", target=node,
         change=(node, "prev", before_prev), phase="intermediate")
    tail = node
    emit("set-tail", f"tail = new：尾指针更新，双向链完成 / tail moves to the new node", 150, "insert-tail", target=node)


def insert_after(previous_value, value):
    global tail
    target = find_by_value(previous_value, "insert-middle")
    if target is None:
        return
    node = make_node(value)
    emit("create", f"创建节点 {value}：尚未接入 / create a detached node", 158, "insert-middle", target=node, phase="intermediate")
    successor = target.next
    before_next = node.next
    node.next = successor
    emit("set-next", f"new.next = target.next：新节点接住后继 / new node keeps the successor", 161, "insert-middle", target=node,
         change=(node, "next", before_next), phase="intermediate")
    if successor is not None:
        before_prev = successor.prev
        successor.prev = node
        emit("set-prev", f"后继.prev = new：后继反向接住新节点 / successor points back", 164, "insert-middle", target=successor,
             change=(successor, "prev", before_prev), phase="intermediate")
    before_prev = node.prev
    node.prev = target
    emit("set-prev", f"new.prev = target：新节点反向接住前驱 / new node points back to target", 166, "insert-middle", target=node,
         change=(node, "prev", before_prev), phase="intermediate")
    if successor is None:
        tail = node
        emit("set-tail", f"target 原来是尾节点：tail 更新为 {value} / inserted node becomes tail", 169, "insert-middle", target=node, phase="intermediate")
    before_next = target.next
    target.next = node
    emit("set-next", f"target.next = new：前驱改指新节点，插入完成 / predecessor points to the new node", 171, "insert-middle", target=target,
         change=(target, "next", before_next))


def detach_node(target, lesson):
    global head, tail
    previous = target.prev
    successor = target.next
    if previous is not None:
        before_next = previous.next
        previous.next = successor
        emit("set-next", f"{previous.node_id}.next = target.next：前驱越过目标 / predecessor bypasses target", 181, lesson, target=previous,
             change=(previous, "next", before_next), phase="intermediate")
    else:
        head = successor
        emit("set-head", f"head = target.next：删除原头节点 / head moves past the removed node", 184, lesson,
             target=successor if successor is not None else None, phase="intermediate")
    if successor is not None:
        before_prev = successor.prev
        successor.prev = previous
        emit("set-prev", f"后继.prev = target.prev：后继越过目标 / successor bypasses target", 187, lesson, target=successor,
             change=(successor, "prev", before_prev), phase="intermediate")
    else:
        tail = previous
        emit("set-tail", f"tail = target.prev：删除原尾节点 / tail moves back", 190, lesson,
             target=previous if previous is not None else None, phase="intermediate")
    before_prev = target.prev
    target.prev = None
    emit("set-prev", f"target.prev = None：解除目标的反向引用 / clear the removed node's prev", 193, lesson, target=target,
         change=(target, "prev", before_prev), phase="intermediate")
    before_next = target.next
    target.next = None
    emit("set-next", f"target.next = None：解除目标的正向引用 / clear the removed node's next", 195, lesson, target=target,
         change=(target, "next", before_next), phase="intermediate")
    emit("detach", f"节点 {target.node_id} 已脱离链表，但对象仍然存在 / node detached from the list, object still exists", 197, lesson, target=target)


def delete_value(value, lesson="delete-middle"):
    target = find_by_value(value, lesson)
    if target is not None:
        detach_node(target, lesson)


def delete_head(lesson="delete-head"):
    if head is None:
        emit("init", "空链表：head 与 tail 都是 None，无法删除头节点 / empty list has no head to delete", 205, lesson)
        return
    detach_node(head, lesson)


def delete_tail(lesson="delete-tail"):
    if tail is None:
        emit("init", "空链表：head 与 tail 都是 None，无法删除尾节点 / empty list has no tail to delete", 210, lesson)
        return
    detach_node(tail, lesson)


def traverse_forward():
    current = head
    while current is not None:
        emit("visit", f"正向访问 {current.value}，然后 current = current.next / visit forward, then follow next", 216, "traverse-forward", target=current)
        current = current.next
    if head is None:
        emit("init", "空链表没有节点可遍历 / empty list has nothing to traverse", 218, "traverse-forward")


def traverse_reverse():
    current = tail
    while current is not None:
        emit("visit", f"反向访问 {current.value}，然后 current = current.prev / visit backward, then follow prev", 224, "traverse-reverse", target=current)
        current = current.prev
    if tail is None:
        emit("init", "空链表没有节点可反向遍历 / empty list has nothing to traverse backward", 226, "traverse-reverse")


emit("init", "空的双向链表：head = None，tail = None / Empty doubly linked list", 232, "init")

for entry in operations:
    op = entry[0]
    if op == "insert_head":
        insert_head(entry[1])
    elif op == "insert_tail":
        insert_tail(entry[1])
    elif op == "insert_after":
        insert_after(entry[1], entry[2])
    elif op == "delete":
        delete_value(entry[1], "delete-middle")
    elif op == "delete_head":
        delete_head("delete-head")
    elif op == "delete_tail":
        delete_tail("delete-tail")
    elif op == "traverse_forward":
        traverse_forward()
    elif op == "traverse_reverse":
        traverse_reverse()
    elif op == "find":
        find_by_value(entry[1], "find")

emit("done", "双向链表演示结束：head.prev 与 tail.next 都是 None / Done: both ends are null", 247, "done")
`;

export const CIRCULAR_DEFAULT_INPUT: unknown = [
  ['insert_head', 5],
  ['insert_tail', 7],
  ['insert_head', 3],
  ['insert_after', 5, 6],
  ['insert_tail', 8],
  ['traverse_circle'],
  ['find', 6],
  ['find', 99],
  ['delete', 6],
  ['delete_head'],
  ['delete_tail'],
  ['delete', 5],
  ['delete_tail', 7],
  ['insert_head', 9],
  ['insert_tail', 11],
  ['delete_head'],
  ['delete_tail'],
];

export const CIRCULAR_PYTHON = `# Circular singly linked list: tail.next is a real reference back to head.
operations = input
nodes = []
sequence = 0
head = None
tail = None


class CNode:
    __slots__ = ("node_id", "value", "next")

    def __init__(self, node_id, value):
        self.node_id = node_id
        self.value = value
        self.next = None


def make_node(value):
    global sequence
    sequence += 1
    node = CNode("n" + str(sequence), value)
    nodes.append(node)
    return node


def chain_nodes():
    ordered = []
    seen = set()
    current = head
    while current is not None and current.node_id not in seen and len(ordered) < len(nodes):
        seen.add(current.node_id)
        ordered.append(current)
        current = current.next
        if current is head:
            break
    return ordered


def node_json(node):
    return {
        "id": node.node_id,
        "value": node.value,
        "nextId": node.next.node_id if node.next is not None else None,
    }


def emit(operation, message, line, lesson, target=None, change=None,
         phase="complete", search_value=None, found=None):
    ordered = chain_nodes()
    payload = {
        "kind": "circular-linked-list",
        "operation": operation,
        "phase": phase,
        "headId": head.node_id if head is not None else None,
        "tailId": tail.node_id if tail is not None else None,
        "nodes": [node_json(node) for node in nodes],
    }
    if target is not None:
        payload["targetId"] = target.node_id
    if change is not None:
        node, field, before = change
        after = node.next
        payload["change"] = {
            "nodeId": node.node_id,
            "field": field,
            "beforeId": before.node_id if before is not None else None,
            "afterId": after.node_id if after is not None else None,
        }
    if search_value is not None:
        payload["searchValue"] = search_value
    if found is not None:
        payload["found"] = found
    variables = {
        "head": head.value if head is not None else None,
        "tail": tail.value if tail is not None else None,
        "current": target.value if target is not None else None,
        "current_id": target.node_id if target is not None else None,
        "length": len(ordered),
        "ids": [node.node_id for node in ordered],
    }
    trace(
        {"type": "linked", "values": [node.value for node in ordered],
         "focus": [target.node_id] if target is not None else []},
        message,
        line=line, variables=variables, lesson_step=lesson, structure=payload,
    )


def find_by_value(value, lesson):
    current = head
    while current is not None:
        emit("visit", f"沿 next 查找 {value}：当前是 {current.value} / walk next for {value}", 104, lesson, target=current)
        if current.value == value:
            emit("found", f"查找 {value}：命中 {current.node_id}，立即停止整圈扫描 / found before returning to head", 107, lesson,
                 target=current, search_value=value, found=True)
            return current
        current = current.next
        if current is head:
            break
    emit("not-found", f"查找 {value}：回到 head 仍未命中，停止循环 / returned to head, miss", 111, lesson,
         search_value=value, found=False)
    return None


def insert_head(value):
    global head, tail
    node = make_node(value)
    emit("create", f"创建节点 {value}：next 暂时为空 / create node with next = None", 120, "insert-head", target=node, phase="intermediate")
    if head is None:
        head = node
        emit("set-head", f"head = new：空表建立首节点 / first node", 123, "insert-head", target=node, phase="intermediate")
        tail = node
        emit("set-tail", f"tail = new：单节点时 head = tail / one node is both ends", 125, "insert-head", target=node, phase="intermediate")
        before_next = node.next
        node.next = node
        emit("set-next", f"new.next = new：单节点自环闭合 / the single node points to itself", 127, "insert-head", target=node,
             change=(node, "next", before_next))
        return
    before_next = node.next
    node.next = head
    emit("set-next", f"new.next = 旧 head：新节点指向旧首节点 / new node points at the old head", 130, "insert-head", target=node,
         change=(node, "next", before_next), phase="intermediate")
    before_next = tail.next
    tail.next = node
    emit("set-next", f"tail.next = new：回环改指新首节点 / tail's return arrow moves to the new head", 132, "insert-head", target=tail,
         change=(tail, "next", before_next), phase="intermediate")
    head = node
    emit("set-head", f"head = new：头插入完成，tail.next 已指回新 head / head insertion complete", 134, "insert-head", target=node)


def insert_tail(value):
    global head, tail
    node = make_node(value)
    emit("create", f"创建尾节点 {value} / create tail node", 140, "insert-tail", target=node, phase="intermediate")
    if head is None:
        head = node
        emit("set-head", f"head = new：空表建立首节点 / first node", 143, "insert-tail", target=node, phase="intermediate")
        tail = node
        emit("set-tail", f"tail = new：单节点时 head = tail / one node is both ends", 145, "insert-tail", target=node, phase="intermediate")
        before_next = node.next
        node.next = node
        emit("set-next", f"new.next = new：单节点自环闭合 / the single node points to itself", 147, "insert-tail", target=node,
             change=(node, "next", before_next))
        return
    before_next = tail.next
    tail.next = node
    emit("set-next", f"旧 tail.next = new：旧尾先指向新节点 / old tail points to the new node", 150, "insert-tail", target=tail,
         change=(tail, "next", before_next), phase="intermediate")
    before_next = node.next
    node.next = head
    emit("set-next", f"new.next = head：新节点指回首节点 / new node closes the circle", 152, "insert-tail", target=node,
         change=(node, "next", before_next), phase="intermediate")
    tail = node
    emit("set-tail", f"tail = new：尾指针更新为 {value} / tail moves to the new node", 154, "insert-tail", target=node)


def insert_after(previous_value, value):
    global tail
    target = find_by_value(previous_value, "insert-middle")
    if target is None:
        return
    node = make_node(value)
    emit("create", f"创建节点 {value}：尚未接入 / create a detached node", 162, "insert-middle", target=node, phase="intermediate")
    before_next = node.next
    node.next = target.next
    emit("set-next", f"new.next = target.next：新节点先接住后继 / new node keeps the successor", 165, "insert-middle", target=node,
         change=(node, "next", before_next), phase="intermediate")
    was_tail = target is tail
    before_next = target.next
    target.next = node
    emit("set-next", f"target.next = new：前驱改指新节点 / predecessor points to the new node", 167, "insert-middle", target=target,
         change=(target, "next", before_next), phase="intermediate" if was_tail else "complete")
    if was_tail:
        tail = node
        emit("set-tail", f"target 原来是尾节点：tail = new，回环闭合 / tail moves, circle closes", 170, "insert-middle", target=node)


def detach_node(target, lesson):
    global head, tail
    if head is target and tail is target:
        head = None
        emit("set-head", "head = None：删除唯一节点 / removing the only node", 178, lesson, phase="intermediate")
        tail = None
        emit("set-tail", "tail = None：链表变空 / the list is empty", 180, lesson, phase="intermediate")
        before_next = target.next
        target.next = None
        emit("set-next", "target.next = None：自环解除 / the self-loop is cleared", 182, lesson, target=target,
             change=(target, "next", before_next), phase="intermediate")
        emit("detach", f"节点 {target.node_id} 已脱离，head 与 tail 均为 None / detached, list is empty", 184, lesson, target=target)
        return
    previous = head
    while previous.next is not target:
        previous = previous.next
    successor = target.next
    if target is head:
        head = successor
        emit("set-head", f"head = target.next：删除头节点 / head moves to the next node", 189, lesson, target=head, phase="intermediate")
        before_next = tail.next
        tail.next = head
        emit("set-next", "tail.next = head：回环改指新首节点 / tail's return arrow follows the new head", 191, lesson, target=tail,
             change=(tail, "next", before_next), phase="intermediate")
    elif target is tail:
        tail = previous
        emit("set-tail", f"tail = target.prev：删除尾节点 / tail moves back", 194, lesson, target=tail, phase="intermediate")
        before_next = previous.next
        previous.next = head
        emit("set-next", "previous.next = head：新尾指回 head / new tail points back to head", 196, lesson, target=previous,
             change=(previous, "next", before_next), phase="intermediate")
    else:
        before_next = previous.next
        previous.next = successor
        emit("set-next", f"previous.next = target.next：前驱越过目标 / predecessor bypasses target", 199, lesson, target=previous,
             change=(previous, "next", before_next), phase="intermediate")
    before_next = target.next
    target.next = None
    emit("set-next", "target.next = None：解除目标的 next / clear the removed node's next", 202, lesson, target=target,
         change=(target, "next", before_next), phase="intermediate")
    emit("detach", f"节点 {target.node_id} 已脱离链表 / node detached, no stale reference remains", 204, lesson, target=target)


def delete_value(value, lesson="delete-middle"):
    target = find_by_value(value, lesson)
    if target is not None:
        detach_node(target, lesson)


def delete_head(lesson="delete-head"):
    if head is None:
        emit("init", "空链表：head 与 tail 都是 None，无法删除头节点 / empty list has no head to delete", 210, lesson)
        return
    detach_node(head, lesson)


def delete_tail(lesson="delete-tail"):
    if tail is None:
        emit("init", "空链表：head 与 tail 都是 None，无法删除尾节点 / empty list has no tail to delete", 216, lesson)
        return
    detach_node(tail, lesson)


def traverse_circle():
    if head is None:
        emit("init", "空链表没有节点可遍历 / empty list has nothing to traverse", 222, "traverse-circle")
        return
    current = head
    while True:
        emit("visit", f"访问 {current.value}，继续 current = current.next / visit, then follow next", 226, "traverse-circle", target=current)
        current = current.next
        if current is head:
            break


emit("init", "空的循环单链表：head = None，tail = None / Empty circular singly linked list", 231, "init")

for entry in operations:
    op = entry[0]
    if op == "insert_head":
        insert_head(entry[1])
    elif op == "insert_tail":
        insert_tail(entry[1])
    elif op == "insert_after":
        insert_after(entry[1], entry[2])
    elif op == "delete":
        delete_value(entry[1], "delete-middle")
    elif op == "delete_head":
        delete_head("delete-head")
    elif op == "delete_tail":
        delete_tail("delete-tail")
    elif op == "traverse_circle":
        traverse_circle()
    elif op == "find":
        find_by_value(entry[1], "find")

emit("done", "循环单链表演示结束：非空时 tail.next 一定回到 head / Done: tail.next returns to head", 245, "done")
`;

export function defaultDoublyInput(): unknown {
  return DOUBLY_DEFAULT_INPUT;
}

export function defaultCircularInput(): unknown {
  return CIRCULAR_DEFAULT_INPUT;
}
