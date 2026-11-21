/**
 * 广义表表达式的共享解析与语义工具。
 *
 * 动态课程、输入校验和 Trace Schema 必须使用完全相同的括号语法、节点编号
 * 顺序、空表规则和深度定义，否则“输入通过但 Trace 拒绝”会成为隐蔽的错误。
 * 本模块只依赖字符串，不依赖 React、Zod 或具体算法。
 */

export type GeneralizedListNodeKind = 'atom' | 'list';

export interface GeneralizedListNode {
  /** 先序编号：n0 是根，随后按 children 从左到右递增。 */
  id: string;
  kind: GeneralizedListNodeKind;
  /** 原子值；表节点固定为 null。 */
  atom: string | null;
  children: GeneralizedListNode[];
}

export const GL_MAX_EXPRESSION_LENGTH = 80;
export const GL_MAX_NODES = 40;
export const GL_MAX_DEPTH = 8;
export const GL_MAX_ATOM_LENGTH = 8;

export type GeneralizedListParseError =
  | 'GL_ERROR_EMPTY'
  | 'GL_ERROR_LENGTH'
  | 'GL_ERROR_SYNTAX'
  | 'GL_ERROR_ATOM'
  | 'GL_ERROR_NODES'
  | 'GL_ERROR_DEPTH';

export type GeneralizedListParseResult =
  | { ok: true; root: GeneralizedListNode; expression: string }
  | { ok: false; error: GeneralizedListParseError };

const ATOM_CHAR = /^[A-Za-z0-9_]$/u;

/** 解析 `(a, (b, c), (()))` 这类小规模广义表；根必须是表。 */
export function parseGeneralizedList(source: string): GeneralizedListParseResult {
  const text = source.trim();
  if (text === '') return { ok: false, error: 'GL_ERROR_EMPTY' };
  if (text.length > GL_MAX_EXPRESSION_LENGTH) return { ok: false, error: 'GL_ERROR_LENGTH' };

  let pos = 0;
  let nextId = 0;
  let nodeCount = 0;

  const fail = (error: GeneralizedListParseError): never => {
    throw new GeneralizedListParseFailure(error);
  };
  const skip = () => {
    while (pos < text.length && /\s/u.test(text[pos]!)) pos += 1;
  };
  const allocate = (kind: GeneralizedListNodeKind, atom: string | null): GeneralizedListNode => {
    nodeCount += 1;
    if (nodeCount > GL_MAX_NODES) fail('GL_ERROR_NODES');
    const node: GeneralizedListNode = { id: `n${nextId}`, kind, atom, children: [] };
    nextId += 1;
    return node;
  };

  const parseList = (): GeneralizedListNode => {
    skip();
    if (text[pos] !== '(') fail('GL_ERROR_SYNTAX');
    pos += 1;
    const list = allocate('list', null);
    skip();
    if (text[pos] === ')') {
      pos += 1;
      return list;
    }
    while (true) {
      list.children.push(parseElement());
      skip();
      if (text[pos] === ',') {
        pos += 1;
        skip();
        if (text[pos] === ')' || text[pos] === ',') fail('GL_ERROR_SYNTAX');
        continue;
      }
      if (text[pos] === ')') {
        pos += 1;
        return list;
      }
      fail('GL_ERROR_SYNTAX');
    }
  };

  const parseElement = (): GeneralizedListNode => {
    skip();
    if (text[pos] === '(') return parseList();
    let end = pos;
    while (end < text.length && ATOM_CHAR.test(text[end]!)) end += 1;
    if (end === pos) fail('GL_ERROR_SYNTAX');
    const atom = text.slice(pos, end);
    if (atom.length > GL_MAX_ATOM_LENGTH) fail('GL_ERROR_ATOM');
    pos = end;
    return allocate('atom', atom);
  };

  try {
    const root = parseList();
    skip();
    if (pos !== text.length) fail('GL_ERROR_SYNTAX');
    if (generalizedListDepth(root) > GL_MAX_DEPTH) fail('GL_ERROR_DEPTH');
    return { ok: true, root, expression: formatGeneralizedList(root) };
  } catch (error) {
    if (error instanceof GeneralizedListParseFailure) {
      return { ok: false, error: error.code };
    }
    return { ok: false, error: 'GL_ERROR_SYNTAX' };
  }
}

class GeneralizedListParseFailure extends Error {
  constructor(readonly code: GeneralizedListParseError) {
    super(code);
  }
}

/**
 * 教材深度约定：原子深度 0；空表深度 1；非空表深度 = 1 + 子表最大深度。
 * 因此 `()` 是 1，`(())` 是 2，`(a,b)` 是 1。
 */
export function generalizedListDepth(node: GeneralizedListNode): number {
  if (node.kind === 'atom') return 0;
  if (node.children.length === 0) return 1;
  let maxChild = 0;
  for (const child of node.children) {
    const childDepth = generalizedListDepth(child);
    if (childDepth > maxChild) maxChild = childDepth;
  }
  return 1 + maxChild;
}

/** 输出无空格的标准表达式，便于比较输入和最终复制结果。 */
export function formatGeneralizedList(node: GeneralizedListNode): string {
  if (node.kind === 'atom') return node.atom ?? '';
  return `(${node.children.map(formatGeneralizedList).join(',')})`;
}

export interface GeneralizedListWalkEntry {
  node: GeneralizedListNode;
  depth: number;
}

/** 先序展开，供可视化布局与统计使用。 */
export function walkGeneralizedList(
  node: GeneralizedListNode,
  depth = 0,
): GeneralizedListWalkEntry[] {
  return [
    { node, depth },
    ...node.children.flatMap((child) => walkGeneralizedList(child, depth + 1)),
  ];
}

/** 结构等价比较；复制课程只比较标签、原子值与嵌套形状，不比较节点身份。 */
export function generalizedListEquivalent(a: GeneralizedListNode, b: GeneralizedListNode): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'atom' && a.atom !== b.atom) return false;
  if (a.children.length !== b.children.length) return false;
  return a.children.every((child, index) => generalizedListEquivalent(child, b.children[index]!));
}
