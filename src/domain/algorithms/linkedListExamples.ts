/**
 * Stage 7C singly linked-list Python teaching program.
 *
 * This is real Python source executed by the Pyodide worker. Every `emit` call
 * records a complete snapshot of the Node objects that still exist, the current
 * HEAD, the node targeted by the operation, and the exact pointer assignment
 * (`change`) that produced the frame. The program never wraps a Python list and
 * calls it a linked list: `Node.next` is a real reference to another Node.
 *
 * The default operation list builds `3 -> 8 -> 5`, inserts `6` between `3` and
 * `8`, deletes `8` (first reconnecting the predecessor, then clearing the
 * removed node's own `next`), and finally traverses the resulting
 * `3 -> 6 -> 5 -> None` chain. Extra operations are available for custom input
 * (`insert_head`, `insert_after`, `delete`, `insert_tail`, `traverse`).
 */
export const LINKED_DEFAULT_INPUT: unknown = [
  ['insert_head', 5],
  ['insert_head', 8],
  ['insert_head', 3],
  ['insert_after', 3, 6],
  ['delete', 8],
  ['traverse'],
];

export const LINKED_PYTHON = `# Singly linked list: every frame comes from real Node objects.
operations = input
nodes = []
sequence = 0
head = None


class Node:
    def __init__(self, node_id, value):
        self.node_id = node_id
        self.value = value
        self.next = None


def make_node(value):
    global sequence
    sequence += 1
    node = Node("n" + str(sequence), value)
    nodes.append(node)
    return node


def chain_nodes():
    ordered = []
    seen = set()
    current = head
    while current is not None and current.node_id not in seen:
        seen.add(current.node_id)
        ordered.append(current)
        current = current.next
    return ordered


def node_json(node):
    return {
        "id": node.node_id,
        "value": node.value,
        "nextId": node.next.node_id if node.next is not None else None,
    }


def emit(operation, message, line, lesson, target=None, change=None):
    ordered = chain_nodes()
    payload = {
        "kind": "linked-list",
        "operation": operation,
        "headId": head.node_id if head is not None else None,
        "nodes": [node_json(node) for node in nodes],
    }
    if target is not None:
        payload["targetId"] = target.node_id
    if change is not None:
        node, before = change
        payload["change"] = {
            "nodeId": node.node_id,
            "beforeNextId": before.node_id if before is not None else None,
            "afterNextId": node.next.node_id if node.next is not None else None,
        }
    variables = {
        "head": head.value if head is not None else None,
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


def insert_head(value):
    global head
    node = make_node(value)
    emit("create", f"创建节点 {value}：先放在链表外 / create node outside the chain", 77, "create", target=node)
    if head is not None:
        before = node.next
        node.next = head
        emit("set-next", f"new.next = head：新节点指向旧头 / new.next points to old HEAD", 81, "connect", target=node, change=(node, before))
    head = node
    emit("set-head", f"head = new：HEAD 改为 {value} / HEAD moves to the new node", 83, "insert", target=node)


def insert_after(previous_value, value):
    current = head
    while current is not None and current.value != previous_value:
        emit("visit", f"沿 next 查找前驱：当前是 {current.value} / looking for previous", 89, "find", target=current)
        current = current.next
    if current is None:
        return
    emit("visit", f"找到前驱 {previous_value} / found previous node", 93, "find", target=current)
    node = make_node(value)
    emit("create", f"创建节点 {value}：尚未接入 / create detached node", 95, "create", target=node)
    before = node.next
    node.next = current.next
    emit("set-next", f"new.next = previous.next：先接住后继 / new.next keeps the successor", 98, "connect", target=node, change=(node, before))
    before = current.next
    current.next = node
    emit("set-next", f"previous.next = new：前驱改指新节点 / predecessor points to new node", 101, "insert", target=current, change=(current, before))


def delete_value(value):
    global head
    previous = None
    current = head
    while current is not None and current.value != value:
        emit("visit", f"沿 next 查找待删除节点：当前是 {current.value} / looking for target", 109, "find", target=current)
        previous = current
        current = current.next
    if current is None:
        return
    emit("visit", f"定位到待删除节点 {value} / target found", 114, "find", target=current)
    if previous is None:
        head = current.next
        emit("set-head", f"head = target.next：删除头节点 / bypass the old HEAD", 117, "unlink", target=head)
    else:
        before = previous.next
        previous.next = current.next
        emit("set-next", f"previous.next = target.next：前驱绕过目标 / predecessor bypasses target", 121, "unlink", target=previous, change=(previous, before))
    before = current.next
    current.next = None
    emit("detach", f"target.next = None：解除目标引用 / clear the removed node's next", 124, "unlink", target=current, change=(current, before))


def insert_tail(value):
    global head
    node = make_node(value)
    emit("create", f"创建尾节点 {value} / create tail node", 130, "create", target=node)
    if head is None:
        head = node
        emit("set-head", f"head = new：空链表直接建立 HEAD / HEAD on the first node", 133, "insert", target=node)
    else:
        current = head
        while current.next is not None:
            current = current.next
        before = current.next
        current.next = node
        emit("set-next", f"tail.next = new：尾节点接入 / append at the tail", 140, "insert", target=current, change=(current, before))


def traverse():
    current = head
    while current is not None:
        emit("visit", f"访问 {current.value}，然后 current = current.next / visit then follow next", 146, "traverse", target=current)
        current = current.next


emit("init", "空链表：HEAD -> NULL / Empty list: HEAD -> NULL", 150, "init")

for entry in operations:
    op = entry[0]
    if op == "insert_head":
        insert_head(entry[1])
    elif op == "insert_after":
        insert_after(entry[1], entry[2])
    elif op == "delete":
        delete_value(entry[1])
    elif op == "insert_tail":
        insert_tail(entry[1])
    elif op == "traverse":
        traverse()

emit("done", "演示结束：指针关系来自真实 Node / Done: pointers come from real Nodes", 165, "done")
`;

export function defaultLinkedInput(): unknown {
  return LINKED_DEFAULT_INPUT;
}
