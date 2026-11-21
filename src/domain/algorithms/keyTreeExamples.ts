/**
 * TEXTBOOK-09: character trie (key tree) with shared prefixes and terminal
 * markers. Words are lower-case ASCII letters, unique and at most 8 characters;
 * one real node per character, plus one sentinel root whose character is empty.
 */
import type { AlgorithmEntry } from './types';

export const KEY_TREE_ENTRY: AlgorithmEntry = {
  group: 'search',
  icon: '⌥',
  name: ['键树（字符 Trie）', 'Key tree (character trie)'],
  desc: [
    '每个节点代表一个字符，根到节点的路径拼出关键字前缀；只有 terminal 标记才表示一个完整关键字。演示共享前缀、前缀不是单词、缺失分支以及沿已有前缀插入新词。',
    'Each node owns one character; a root-to-node path spells a key prefix, and only a terminal marker means the word exists. Demonstrate shared prefixes, a prefix that is not a word, a missing branch, and insertion under an existing prefix.',
  ],
  time: 'O(L) for a key of length L; independent of dictionary size',
  space: 'O(total characters) with shared prefixes',
  input: undefined,
  code: "trace({type:'array',values:['Key tree: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const KEY_TREE_PRESETS = [
  {
    id: 'shared-prefix-hit',
    label: 'keyTreePresetShared',
    words: ['car', 'card', 'care', 'cat', 'dog', 'do'],
    operation: 'find',
    target: 'care',
  },
  {
    id: 'prefix-is-not-word',
    label: 'keyTreePresetPrefixMiss',
    words: ['car', 'card', 'care', 'cat', 'dog', 'do'],
    operation: 'find',
    target: 'ca',
  },
  {
    id: 'missing-branch',
    label: 'keyTreePresetMissing',
    words: ['car', 'card', 'care', 'cat', 'dog', 'do'],
    operation: 'find',
    target: 'cow',
  },
  {
    id: 'insert-shared',
    label: 'keyTreePresetInsertShared',
    words: ['car', 'card', 'care', 'cat', 'dog', 'do'],
    operation: 'insert',
    target: 'cargo',
  },
  {
    id: 'insert-new-branch',
    label: 'keyTreePresetInsertBranch',
    words: ['car', 'card', 'care', 'cat', 'dog', 'do'],
    operation: 'insert',
    target: 'dot',
  },
  {
    id: 'insert-prefix',
    label: 'keyTreePresetInsertPrefix',
    words: ['car', 'card', 'care', 'cat', 'dog', 'do'],
    operation: 'insert',
    target: 'ca',
  },
] as const;

export type KeyTreePreset = (typeof KEY_TREE_PRESETS)[number];
export type KeyTreePresetId = KeyTreePreset['id'];

export const KEY_TREE_DEFAULT_INPUT: unknown = {
  preset: 'shared-prefix-hit',
  words: ['car', 'card', 'care', 'cat', 'dog', 'do'],
  operation: 'find',
  target: 'care',
};

export const KEY_TREE_PYTHON = `# Character trie (key tree): one edge per character, shared prefixes, terminal flags.
# Words are unique lower-case ASCII strings of length 1..8. A prefix node is
# not automatically a word: only terminal=True marks the end of a stored key.
import inspect

raw_input = input
if not isinstance(raw_input, dict):
    raw_input = {}
raw_words = raw_input.get("words", [])
if not isinstance(raw_words, list):
    raw_words = []
WORDS = []
for item in raw_words:
    if not isinstance(item, str):
        continue
    word = item.strip().lower()
    if not word or len(word) > 8 or any(ch < "a" or ch > "z" for ch in word):
        continue
    if word in WORDS:
        continue
    WORDS.append(word)
WORDS = WORDS[:8]
OPERATION = raw_input.get("operation", "find")
if OPERATION not in ("find", "insert"):
    OPERATION = "find"
raw_target = raw_input.get("target", "")
TARGET = raw_target.strip().lower() if isinstance(raw_target, str) else ""
if not TARGET or len(TARGET) > 8 or any(ch < "a" or ch > "z" for ch in TARGET):
    TARGET = ""
PRESET = raw_input.get("preset")
if PRESET is not None and not isinstance(PRESET, str):
    PRESET = None

TRACING = False
NODES = []
NEXT_ID = 0


def fmt_word(word):
    return word if word else "(空)"


class TrieNode:
    def __init__(self, node_id, char, parent):
        self.id = node_id
        self.char = char
        self.parent = parent
        self.children = {}
        self.terminal = False


def new_node(char, parent):
    global NEXT_ID
    NEXT_ID += 1
    node = TrieNode("t" + str(NEXT_ID), char, parent)
    NODES.append(node)
    return node


ROOT = new_node("", None)


def node_payload(node):
    return {
        "id": node.id,
        "char": node.char,
        "parentId": node.parent.id if node.parent is not None else None,
        "terminal": node.terminal,
        "children": [child.id for child in node.children.values()],
    }


def dictionary():
    result = []

    def walk(node, prefix):
        if node.terminal:
            result.append(prefix)
        for char in sorted(node.children.keys()):
            walk(node.children[char], prefix + char)

    walk(ROOT, "")
    return result


def path_text(path):
    if not path:
        return "(空)"
    prefix = "".join(node.char for node in path if node.parent is not None)
    return fmt_word(prefix) if prefix else "root"


def emit(operation, message, lesson, current=None, path=None, compare_char=None,
         matched=0, created=None, terminal=None, result=None):
    if not TRACING:
        return
    payload = {
        "kind": "key-tree",
        "preset": PRESET,
        "operation": operation,
        "mode": OPERATION,
        "target": TARGET,
        "rootId": ROOT.id,
        "nodes": [node_payload(node) for node in NODES],
        "dictionary": dictionary(),
        "pathIds": [node.id for node in path] if path else [],
        "currentNodeId": current.id if current is not None else None,
        "compareChar": compare_char,
        "matchedLength": matched,
        "createdNodeId": created.id if created is not None else None,
        "terminalNodeId": terminal.id if terminal is not None else None,
        "result": result,
    }
    variables = {
        "words": len(dictionary()),
        "target": TARGET,
        "matchedLength": matched,
        "nodes": len(NODES),
        "currentChar": current.char if current is not None else "",
        "result": result if result is not None else "pending",
    }
    trace(
        {"type": "array", "values": dictionary(), "done": operation == "done"},
        message,
        line=inspect.currentframe().f_back.f_lineno,
        variables=variables,
        lesson_step=lesson,
        structure=payload,
    )


def existing_path(word):
    node = ROOT
    path = [ROOT]
    matched = 0
    for char in word:
        child = node.children.get(char)
        if child is None:
            break
        node = child
        path.append(node)
        matched += 1
    return node, path, matched


def insert_word(word):
    node = ROOT
    path = [ROOT]
    created_any = False
    for index, char in enumerate(word):
        emit(
            "compare",
            f"第 {index + 1} 个字符 '{char}'：检查是否已有分支 / check the outgoing edge",
            "compare",
            current=node,
            path=path,
            compare_char=char,
            matched=index,
        )
        child = node.children.get(char)
        if child is None:
            child = new_node(char, node)
            node.children[char] = child
            created_any = True
            emit(
                "create",
                f"新建节点 '{char}'：前缀不足以继续 / create the missing edge",
                "create",
                current=child,
                path=path + [child],
                compare_char=char,
                matched=index + 1,
                created=child,
            )
        node = child
        path.append(node)
    node.terminal = True
    emit(
        "terminal",
        f"在路径末端标记终止：'{word}' 成为一个完整关键字 / mark the path terminal",
        "terminal",
        current=node,
        path=path,
        matched=len(word),
        terminal=node,
        result="inserted",
    )
    return "inserted"


def find_word(word):
    if not word:
        emit("not-found", "目标词不是合法关键字 / invalid target", "not-found",
             current=ROOT, path=[ROOT], result="not-found")
        return "not-found"
    node = ROOT
    path = [ROOT]
    for index, char in enumerate(word):
        emit(
            "compare",
            f"第 {index + 1} 个字符 '{char}'：查找对应分支 / look for the next edge",
            "compare",
            current=node,
            path=path,
            compare_char=char,
            matched=index,
        )
        child = node.children.get(char)
        if child is None:
            emit(
                "not-found",
                f"没有 '{char}' 分支：关键字不存在的后缀 / missing suffix edge",
                "not-found",
                current=node,
                path=path,
                compare_char=char,
                matched=index,
                result="not-found",
            )
            return "not-found"
        node = child
        path.append(node)
    if node.terminal:
        emit(
            "found",
            f"路径走完且 terminal=True：命中 '{word}' / path ends at a terminal marker",
            "found",
            current=node,
            path=path,
            matched=len(word),
            terminal=node,
            result="found",
        )
        return "found"
    emit(
        "not-found",
        f"路径存在但末端没有终止标记：'{word}' 只是更长关键字的前缀 / path exists but is not a word",
        "not-found",
        current=node,
        path=path,
        matched=len(word),
        result="not-found",
    )
    return "not-found"


def build_from_words(words):
    for word in words:
        insert_word(word)


TRACING = False
build_from_words(WORDS)
TRACING = True

emit(
    "init",
    f"键树已建立：{len(dictionary())} 个关键字共享字符前缀 / key tree ready with shared prefixes",
    "init",
    current=ROOT,
    path=[ROOT],
)

if OPERATION == "insert":
    if TARGET in dictionary():
        node = ROOT
        path = [ROOT]
        for char in TARGET:
            node = node.children[char]
            path.append(node)
        emit(
            "duplicate",
            f"'{TARGET}' 已存在且 terminal=True：拒绝重复插入 / duplicate word rejected",
            "duplicate",
            current=node,
            path=path,
            matched=len(TARGET),
            terminal=node,
            result="duplicate",
        )
        outcome = "duplicate"
    else:
        outcome = insert_word(TARGET)
else:
    outcome = find_word(TARGET)

done_node, done_path, done_matched = existing_path(TARGET)
emit(
    "done",
    "键树操作完成 / key-tree operation complete",
    "done",
    current=done_node,
    path=done_path,
    matched=done_matched,
    terminal=done_node if done_node.terminal else None,
    result=outcome,
)
`;

export function keyTreePresetFromInput(input: unknown): KeyTreePresetId | null {
  if (!input || typeof input !== 'object') return null;
  const preset = (input as { preset?: unknown }).preset;
  return typeof preset === 'string' && KEY_TREE_PRESETS.some((entry) => entry.id === preset)
    ? (preset as KeyTreePresetId)
    : null;
}

export function keyTreePresetInput(id: KeyTreePresetId): unknown {
  const preset = KEY_TREE_PRESETS.find((entry) => entry.id === id) ?? KEY_TREE_PRESETS[0];
  return {
    preset: preset.id,
    words: [...preset.words],
    operation: preset.operation,
    target: preset.target,
  };
}

export function keyTreePythonExample(): string {
  return KEY_TREE_PYTHON;
}
