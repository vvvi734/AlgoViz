# 中文导读：键树把关键字的每个字符变成一条边，前缀共享，只有终止标记才表示完整关键字。
# 阅读顺序：先看字典节点用一个字符索引孩子；再看 find 如何逐字符下降；最后看 insert 只在缺失后缀建节点并设置 terminal。
# 关键不变量：兄弟边字符唯一；根到节点路径拼出前缀；terminal=True 才是完整单词。
# 易错点：把前缀节点当词；插入重复仍改结构；大小写未统一。
# 复杂度：查找/插入 O(L)，L 为词长；空间 O(总字符数)，共享前缀合并节点。
# 输入/输出：输入小写词列表、目标词与操作；脚本打印词典、命中与插入结果。
# 函数地图：先读 main 的调用顺序，再查看 find、insert 的职责与返回。

"""
Character trie (key tree) in Python 3.

Each edge consumes one lower-case letter. A prefix node is not automatically a
dictionary word; only terminal=True marks a complete key. Insertion creates
nodes only for the missing suffix and rejects duplicates before mutation.
"""


# children is a dict, so edge existence is a hash lookup; dictionary() sorts the result because dict insertion order is not the curriculum's ordering guarantee.
class KeyNode:
    def __init__(self, letter=""):
        self.letter = letter
        self.terminal = False
        self.children = {}


# Purpose: Walk the longest existing prefix and report the last real node plus matched length.
# 作用：沿最长已存在前缀下降，返回最后真实节点与匹配长度。
# The while condition checks both stopping reasons at once: the word ends, or the next character has no edge in the current node.
def walk(root, word):
    node = root
    matched = 0
    # Membership is tested before indexing, so a missing edge ends the walk without a KeyError; matched is left at the last successful prefix length.
    while matched < len(word) and word[matched] in node.children:
        node = node.children[word[matched]]
        matched += 1
    return node, matched


# Purpose: A hit needs every edge and terminal=True; a shared prefix alone is not a word.
# 作用：命中要求每条边都存在且 terminal=True；共享前缀本身不是单词。
# The tuple return separates the hit flag from progress; callers can still inspect matched when the word is absent.
def find(root, word):
    node, matched = walk(root, word)
    return matched == len(word) and node.terminal, matched


# Purpose: Reject duplicates first, then create only missing suffix nodes and mark the end terminal.
# 作用：先拒绝重复，再只为缺失后缀创建节点，并把末端标记为 terminal。
# The loop creates nodes only after a missing edge is observed; an existing prefix therefore stays untouched until the final terminal assignment.
def insert(root, word):
    node = root
    complete_path = True
    for letter in word:
        # get returns None for a missing edge without raising; the newly created child is published into the parent dict before the walk advances.
        child = node.children.get(letter)
        if child is None:
            complete_path = False
            child = KeyNode(letter)
            node.children[letter] = child
        node = child
    if complete_path and node.terminal:
        return False
    node.terminal = True
    return True


# Purpose: DFS with the current prefix; only a terminal at depth > 0 emits a dictionary word.
# 作用：带当前前缀 DFS；只有深度大于 0 的 terminal 才输出词典单词。
# An explicit stack avoids the recursion-depth limit; pushing children in reverse sorted order makes pop visit them in ascending order.
def dictionary(root):
    words = []
    stack = [(root, "")]
    while stack:
        node, prefix = stack.pop()
        if node.terminal and prefix:
            words.append(prefix)
        # reverse=True is paired with stack LIFO: the smallest letter is pushed last and therefore popped first, so the emitted words stay sorted.
        for letter, child in sorted(node.children.items(), reverse=True):
            stack.append((child, prefix + letter))
    return sorted(words)


if __name__ == "__main__":
    root = KeyNode()
    for word in ("car", "card", "care", "cat", "dog", "do"):
        insert(root, word)
    print("dictionary:", dictionary(root))
    for target in ("care", "ca", "cow"):
        hit, matched = find(root, target)
        print(f"find {target}: {hit} matched={matched}")
    print("insert cargo:", insert(root, "cargo"))
    print("insert cargo again:", insert(root, "cargo"))
