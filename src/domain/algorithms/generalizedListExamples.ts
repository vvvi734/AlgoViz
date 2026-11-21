/**
 * 第 5 章广义表动态课程源。
 *
 * 两门课程共用同一套表达式解析器和限制，但分别执行不同递归：
 *   - 深度：原子返回 0，空表返回 1，非空表返回 1 + 子表最大深度；
 *   - 复制：先分配新节点，再递归复制子表，复制结果与原结构等价但节点独立。
 *
 * 每一帧都由真实 Python 递归函数发出，UI 不预生成递归树。
 */
import type { AlgorithmEntry } from './types';

export const GL_DEPTH_DEFAULT_INPUT: unknown = {
  expression: '(a, (b, c), ((d), e))',
};

export const GL_COPY_DEFAULT_INPUT: unknown = {
  expression: '(a, (b, c), ((d), e))',
};

const GL_COMMON = `# 广义表输入：只接受括号、逗号、字母/数字/下划线原子。
# 空表合法；根必须是表；节点最多 40 个，嵌套最多 8 层。
raw = input if isinstance(input, dict) else {}
expression = raw.get("expression", "")
if not isinstance(expression, str):
    expression = ""
source = expression.strip()
if source == "":
    raise ValueError("expression must not be empty")
if len(source) > 80:
    raise ValueError("expression is longer than 80 characters")

pos = 0
next_id = 0
node_count = 0


def skip_spaces():
    global pos
    while pos < len(source) and source[pos].isspace():
        pos += 1


def allocate(kind, atom=None):
    global next_id, node_count
    node_count += 1
    if node_count > 40:
        raise ValueError("too many nodes (max 40)")
    node = {"id": "n" + str(next_id), "kind": kind, "atom": atom,
            "sourceId": None, "children": []}
    next_id += 1
    return node


def parse_element():
    global pos
    skip_spaces()
    if pos < len(source) and source[pos] == "(":
        return parse_list()
    start = pos
    while pos < len(source) and (source[pos].isalnum() or source[pos] == "_"):
        pos += 1
    if start == pos:
        raise ValueError("expected an atom or a sublist")
    atom = source[start:pos]
    if len(atom) > 8:
        raise ValueError("atom is longer than 8 characters")
    return allocate("atom", atom)


def parse_list():
    global pos
    skip_spaces()
    if pos >= len(source) or source[pos] != "(":
        raise ValueError("expected '('")
    pos += 1
    node = allocate("list")
    skip_spaces()
    if pos < len(source) and source[pos] == ")":
        pos += 1
        return node
    while True:
        node["children"].append(parse_element())
        skip_spaces()
        if pos < len(source) and source[pos] == ",":
            pos += 1
            skip_spaces()
            if pos >= len(source) or source[pos] in "),":
                raise ValueError("empty element between commas")
            continue
        if pos < len(source) and source[pos] == ")":
            pos += 1
            return node
        raise ValueError("expected ',' or ')'")


root = parse_list()
skip_spaces()
if pos != len(source):
    raise ValueError("unexpected trailing characters")


def walk(node):
    result = [node]
    for child in node["children"]:
        result.extend(walk(child))
    return result


all_nodes = walk(root)
total_nodes = len(all_nodes)


def depth_of(node):
    if node["kind"] == "atom":
        return 0
    if not node["children"]:
        return 1
    return 1 + max(depth_of(child) for child in node["children"])


if depth_of(root) > 8:
    raise ValueError("nesting is deeper than 8 levels")


def format_list(node):
    if node["kind"] == "atom":
        return node["atom"]
    return "(" + ",".join(format_list(child) for child in node["children"]) + ")"
`;

export const GL_DEPTH_PYTHON = `${GL_COMMON}

depths = []


def mark_depth(node, value):
    depths[:] = [entry for entry in depths if entry["id"] != node["id"]]
    depths.append({"id": node["id"], "depth": value})


def emit(operation, message, lesson, active_id=None, parent_id=None,
         depth_level=0, max_child_depth=None, current_depth=None,
         result_depth=None):
    trace(
        {"type": "tree", "root": root["id"]},
        message,
        variables={"expression": source, "active": active_id,
                   "depth": result_depth, "levels": depth_level},
        lesson_step=lesson,
        structure={
            "kind": "generalized-list", "mode": "depth", "operation": operation,
            "expression": source, "original": root, "copy": None,
            "activeId": active_id, "parentId": parent_id,
            "copyId": None, "parentCopyId": None,
            "depthLevel": depth_level, "maxChildDepth": max_child_depth,
            "currentDepth": current_depth, "depths": depths[:],
            "resultDepth": result_depth, "copiedCount": 0,
            "totalNodes": total_nodes, "resultExpression": None,
        },
    )


def measure(node, level=0, parent=None):
    emit("enter", f"进入{'原子 ' + node['atom'] if node['kind'] == 'atom' else '子表'}，递归层 {level} / Enter level {level}",
         "enter", node["id"], parent, depth_level=level)
    if node["kind"] == "atom":
        mark_depth(node, 0)
        emit("atom-return", f"原子 {node['atom']} 返回深度 0 / Atom returns depth 0",
             "atom-return", node["id"], parent, depth_level=level, current_depth=0)
        return 0
    if not node["children"]:
        mark_depth(node, 1)
        emit("empty-return", "空表返回深度 1 / Empty list returns depth 1",
             "empty-return", node["id"], parent, depth_level=level, current_depth=1)
        return 1
    best = 0
    for child in node["children"]:
        child_depth = measure(child, level + 1, node["id"])
        if child_depth > best:
            best = child_depth
    total = 1 + best
    mark_depth(node, total)
    emit("return", f"子表最大子深度 {best}，本层返回 1 + {best} = {total} / Return {total}",
         "return", node["id"], parent, depth_level=level,
         max_child_depth=best, current_depth=total)
    return total


emit("init", f"读入 {source}，准备从根开始递归 / Read the list and start at the root",
     "init")
answer = measure(root, 0, None)
emit("done", f"根返回广义表深度 {answer} / The generalized list depth is {answer}",
     "done", result_depth=answer)
`;

export const GL_COPY_PYTHON = `${GL_COMMON}

copy_root = None
next_copy = 0
copied_count = 0


def allocate_copy(node, parent_copy):
    global next_copy, copied_count, copy_root
    copied = {"id": "c" + str(next_copy), "kind": node["kind"],
              "atom": node["atom"], "sourceId": node["id"], "children": []}
    next_copy += 1
    copied_count += 1
    if parent_copy is None:
        copy_root = copied
    else:
        parent_copy["children"].append(copied)
    return copied


def emit(operation, message, lesson, active_id=None, parent_id=None,
         copy_id=None, parent_copy_id=None, depth_level=0):
    trace(
        {"type": "tree", "root": root["id"]},
        message,
        variables={"expression": source, "active": active_id,
                   "copied": copied_count, "levels": depth_level},
        lesson_step=lesson,
        structure={
            "kind": "generalized-list", "mode": "copy", "operation": operation,
            "expression": source, "original": root, "copy": copy_root,
            "activeId": active_id, "parentId": parent_id,
            "copyId": copy_id, "parentCopyId": parent_copy_id,
            "depthLevel": depth_level, "maxChildDepth": None,
            "currentDepth": None, "depths": [],
            "resultDepth": None, "copiedCount": copied_count,
            "totalNodes": total_nodes,
            "resultExpression": format_list(copy_root) if copy_root is not None else None,
        },
    )


def clone(node, level=0, parent_copy=None, parent_id=None):
    emit("enter", f"进入{'原子 ' + node['atom'] if node['kind'] == 'atom' else '子表'}，递归层 {level} / Enter level {level}",
         "enter", node["id"], parent_id, depth_level=level)
    if node["kind"] == "atom":
        copied = allocate_copy(node, parent_copy)
        emit("copy-atom", f"复制原子 {node['atom']}，新节点 {copied['id']} / Copy atom into {copied['id']}",
             "copy-atom", node["id"], parent_id, copied["id"],
             parent_copy["id"] if parent_copy is not None else None, level)
        return copied
    copied = allocate_copy(node, parent_copy)
    emit("alloc-list", f"为子表分配新节点 {copied['id']} / Allocate list node {copied['id']}",
         "alloc-list", node["id"], parent_id, copied["id"],
         parent_copy["id"] if parent_copy is not None else None, level)
    if not node["children"]:
        emit("copy-empty", f"空表 {node['id']} 复制为 {copied['id']} / Empty list copied",
             "copy-empty", node["id"], parent_id, copied["id"],
             parent_copy["id"] if parent_copy is not None else None, level)
        return copied
    for child in node["children"]:
        emit("inspect", f"准备递归复制子元素 {child['id']} / Recurse into {child['id']}",
             "inspect", child["id"], node["id"], copied["id"], copied["id"], level + 1)
        clone(child, level + 1, copied, node["id"])
    emit("return", f"子表 {copied['id']} 的所有子元素复制完成 / Subtree copied",
         "return", node["id"], parent_id, copied["id"],
         parent_copy["id"] if parent_copy is not None else None, level)
    return copied


emit("init", f"读入 {source}，准备建立一棵节点独立的新表 / Read the list and prepare an independent copy",
     "init")
copy_root = clone(root, 0, None)
emit("done", f"复制完成：{format_list(copy_root)} / Copy complete",
     "done", copy_id=copy_root["id"])
`;

export const GL_DEPTH_ENTRY: AlgorithmEntry = {
  group: 'ds',
  icon: '⤢',
  name: ['广义表深度', 'Generalized list depth'],
  desc: [
    '真实 Python 递归遍历原子与子表：原子返回 0，空表返回 1，非空表取子表最大深度加 1，并逐层展示返回值。',
    'Real Python recursively visits atoms and sublists: atoms return 0, empty lists return 1, and a non-empty list returns one plus its deepest child.',
  ],
  time: 'O(n)',
  space: 'O(h) 递归栈',
  input: GL_DEPTH_DEFAULT_INPUT,
  code: "trace({type:'tree',root:'n0'},'请在 Python 模式运行 / Run the Python preset');",
};

export const GL_COPY_ENTRY: AlgorithmEntry = {
  group: 'ds',
  icon: '⧉',
  name: ['广义表复制', 'Copy a generalized list'],
  desc: [
    '真实 Python 递归分配新节点、复制原子并接回子表，最终得到结构等价但节点完全独立的新广义表。',
    'Real Python allocates new nodes, copies atoms and relinks sublists, producing an equivalent list whose nodes are entirely independent.',
  ],
  time: 'O(n)',
  space: 'O(n)',
  input: GL_COPY_DEFAULT_INPUT,
  code: "trace({type:'tree',root:'n0'},'请在 Python 模式运行 / Run the Python preset');",
};
