import type { Lesson } from './types';

/**
 * 第 5 章广义表递归课程。
 *
 * stepId 与 `generalizedListExamples.ts` 中真实 Python 的 lesson_step 值一一
 * 对应；页面不会预先编造递归树，所有节点、层级和返回值都来自实际执行。
 */
export const glDepthLesson: Lesson = {
  lessonId: 'generalized-list-depth',
  algorithmId: 'gl-depth',
  contentVersion: '1.0.0',
  title: { zh: '广义表深度：沿最深的子表递归', en: 'Generalized list depth: recurse along the deepest sublist' },
  oneLiner: {
    zh: '对每个元素判断原子或子表：原子返回 0，空表返回 1，非空表先递归求出所有子表深度，取最大值再加 1。',
    en: 'Classify every element: an atom returns 0, an empty list returns 1, and a non-empty list recursively obtains all child depths, takes the maximum and adds 1.',
  },
  overview: {
    zh: '深度衡量广义表的嵌套层数，而不是元素个数。本课采用教材约定：原子的深度为 0；空表 () 的深度为 1；非空表 (e1,…,en) 的深度为 1 + max(Depth(ei))。真实 Python 从根开始先序遍历，进入节点时记录当前递归层，遇到原子立即返回 0，遇到空子表立即返回 1，遇到非空子表则逐个递归子元素，最后把最大子深度加 1 返回。每个返回值都会写回深度账本，UI 只呈现真实 Trace。输入限制为 80 字符、40 个节点、最深 8 层；不支持循环引用、自引用或共享子结构。',
    en: 'Depth measures nesting levels, not element count. This course uses the textbook convention: an atom has depth 0, the empty list () has depth 1, and a non-empty list (e1,…,en) has depth 1 + max(Depth(ei)). Real Python walks preorder from the root: entering a node records the recursion level, an atom immediately returns 0, an empty sublist immediately returns 1, and a non-empty sublist recursively measures each child before returning the largest child depth plus 1. Every return value updates the depth ledger; the UI renders only the real Trace. Inputs are limited to 80 characters, 40 nodes and 8 nesting levels; cyclic, self-referential or shared structures are not supported.',
  },
  intuition: {
    zh: '把广义表看成一棵“表节点在外、元素在内”的层次图。要问整张表有多深，就先问每个子表有多深；子表又问它自己的子表。原子和空表是递归的终点，分别回答 0 和 1。一个表有多个子表时，最深的那个决定整张表的深度，所以最后取最大值再加当前这一层。',
    en: 'View the list as a hierarchy of list nodes containing elements. To know how deep the whole list is, ask how deep each sublist is; each sublist asks its own children. Atoms and empty lists are the base cases, answering 0 and 1. When a list has several children, the deepest one determines its depth, so take the maximum and add the current level.',
  },
  prerequisites: {
    zh: ['知道原子、子表、空表、长度与深度的定义', '理解递归的终止条件与返回值合并', '能区分“当前递归层”和“当前节点的深度”'],
    en: ['Atoms, sublists, empty lists, length and depth', 'Recursive base cases and combining return values', 'Distinguish the current recursion level from a node’s depth'],
  },
  complexity: {
    time: 'O(n)',
    space: 'O(h)',
    note: {
      zh: '每个节点恰好进入一次，原子和空表在常数时间内返回，因此总时间为 O(n)，n 为节点总数。递归调用栈的深度等于最大嵌套层数 h，最坏额外空间为 O(h)；本课把 h 限制在 8 层，保证调用栈与连线都能清楚显示。',
      en: 'Each node is entered exactly once and atoms/empty lists return in constant time, so total time is O(n) for n nodes. The call stack grows to the maximum nesting h, giving O(h) extra space; this course caps h at 8 so the stack and links remain legible.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 解析表达式，建立节点编号', en: '① Parse the expression and assign node ids' },
      explanation: {
        zh: '真实 Python 先检查长度、括号和原子字符，再按先序为每个节点分配 n0、n1… 编号；每个表节点保存 children，每个原子节点保存 atom。此时还没有开始递归，深度账本为空。',
        en: 'Real Python first validates length, parentheses and atom characters, then assigns n0, n1… in preorder. List nodes store children and atom nodes store atom. Recursion has not started and the depth ledger is empty.',
      },
      tip: { zh: '编号来自真实解析顺序；图上的节点和账本使用同一批 id，不能用位置猜测。', en: 'Ids come from real parsing order; the diagram and ledger share them, so never guess by position.' },
    },
    {
      stepId: 'enter',
      title: { zh: '② 进入一个节点，记下递归层', en: '② Enter a node and record its recursion level' },
      explanation: {
        zh: 'measure(node, level, parent) 被调用时发出 enter 帧，记录当前节点、父节点和递归层。随后才判断节点类型：原子走终止分支，空表走空表分支，非空表继续向下递归。',
        en: 'When measure(node, level, parent) is called it emits an enter frame with the current node, parent and recursion level. Only then does it classify the node: an atom takes the base branch, an empty list takes the empty branch, and a non-empty list recurses.',
      },
      tip: { zh: 'enter 只表示“刚进入”，还没有产生返回值；不要把当前层直接当成最终深度。', en: 'enter only means “just arrived”; no value exists yet. Do not mistake the level for the final depth.' },
    },
    {
      stepId: 'atom-return',
      title: { zh: '③ 原子是终止条件：返回 0', en: '③ An atom is a base case: return 0' },
      explanation: {
        zh: '原子没有子表，不能再展开，因此深度为 0。真实 Python 把该节点的 depth 写入账本后立即返回 0，调用者拿这个 0 参与最大值比较。',
        en: 'An atom has no sublist and cannot expand, so its depth is 0. Real Python writes that depth into the ledger and returns 0 immediately; the caller uses it in the maximum comparison.',
      },
      tip: { zh: '原子的 0 不代表“不存在”，而是“这一支不再贡献嵌套层数”。', en: 'Zero for an atom does not mean absence; it means this branch adds no further nesting.' },
    },
    {
      stepId: 'empty-return',
      title: { zh: '④ 空表也是终止条件，但返回 1', en: '④ An empty list is also a base case, returning 1' },
      explanation: {
        zh: '() 没有任何元素，无法继续递归，但它本身占一层括号，因此深度约定为 1。空表与原子必须在图上区分：空表仍是 list 节点，原子是 atom 节点。',
        en: '() has no elements and cannot recurse, but it still occupies one pair of brackets, so its depth is 1. The diagram must distinguish it from an atom: an empty list remains a list node, while an atom is an atom node.',
      },
      tip: { zh: '这就是 (()) 深度为 2 的原因：外层表 1 层，加空子表的 1 层。', en: 'This is why (()) has depth 2: one level for the outer list plus one for the empty sublist.' },
    },
    {
      stepId: 'return',
      title: { zh: '⑤ 子表递归完成：取最大值再加 1', en: '⑤ Children done: take the maximum and add 1' },
      explanation: {
        zh: '非空表依次调用每个子元素，真实 Python 用 best 保存已见最大子深度。所有子调用返回后，本节点深度为 1 + best，并写回账本、发出 return 帧。当前层只加一次，不能把每个子表的层数相加。',
        en: 'A non-empty list calls each child in turn and Python keeps best as the largest child depth seen. After all calls return, this node’s depth is 1 + best; it is written to the ledger and a return frame is emitted. Add the current level once; never sum every child’s levels.',
      },
      tip: { zh: '深度取 max，长度才是数元素个数；两者不能混用。', en: 'Depth uses max; length counts elements. Do not conflate them.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑥ 根返回，得到整表深度', en: '⑥ The root returns the whole depth' },
      explanation: {
        zh: '最外层 measure(root,0) 的返回值就是整张广义表的深度。done 帧显示结果，并把根节点的深度账本项标为完成；若根是 ()，结果为 1，若根是 (a,b,c)，结果为 1。',
        en: 'The value returned by the outermost measure(root,0) is the depth of the whole list. The done frame shows it and marks the root ledger entry complete; the result is 1 for () and also 1 for (a,b,c).',
      },
      tip: { zh: '默认输入 (a,(b,c),((d),e)) 的深度是 3，最深路径经过 ((d),e)。', en: 'The default (a,(b,c),((d),e)) has depth 3; the deepest path goes through ((d),e).' },
    },
  ],
  commonMistakes: {
    zh: [
      '把空表深度当成 0，导致 (()) 被算成 1。',
      '把长度和深度混为一谈，用元素个数代替嵌套层数。',
      '子表有多支时把各支深度相加，而不是取最大值。',
      '忘记当前层要加 1，只返回子表深度。',
      '把原子节点也当成子表继续展开，造成空指针或死循环。',
      '使用预设递归树而不是真实 Trace，回退后层级与账本对不上。',
    ],
    en: [
      'Treating an empty list as depth 0, which makes (()) come out as 1.',
      'Confusing length with depth and using element count instead of nesting.',
      'Summing child depths instead of taking the maximum when a list has several branches.',
      'Forgetting to add 1 for the current level.',
      'Expanding an atom as if it were a list, causing null access or endless recursion.',
      'Rendering a prewritten recursion tree instead of the real Trace, so stepping back desynchronises levels and ledger.',
    ],
  },
};

export const glCopyLesson: Lesson = {
  lessonId: 'generalized-list-copy',
  algorithmId: 'gl-copy',
  contentVersion: '1.0.0',
  title: { zh: '广义表复制：先序分配、递归接回子表', en: 'Copying a generalized list: allocate preorder, relink children' },
  oneLiner: {
    zh: '访问源节点时先为它分配一个新节点，原子直接复制值，子表再递归复制每个子元素并把新节点接到新父节点后面。',
    en: 'On visiting a source node, allocate a new node first; copy the atom value directly, or recursively copy each child of a sublist and attach new nodes to the new parent.',
  },
  overview: {
    zh: '复制不是把根指针返回一次，而是构造一棵与源结构同形、节点完全独立的新表。真实 Python 采用先序构造：clone(node, level, parent_copy, parent_id) 一进入就分配新节点，根节点记入 copy_root，其余节点追加到新父节点的 children；原子在这里复制值并直接返回，表节点继续遍历源 children，对每个子元素递归，全部完成后返回自己的新节点。新节点编号 c0、c1…，并保留 sourceId 指向源节点，便于对照；但新节点的 children 只连接新节点，绝不指向源节点。',
    en: 'Copying is not returning a root pointer once; it builds a new list with the same shape and completely independent nodes. Real Python constructs preorder: clone(node, level, parent_copy, parent_id) allocates a new node on entry, records the root in copy_root and appends other nodes to the new parent’s children; an atom copies its value and returns immediately, while a list walks its source children, recurses on each and returns its own new node after all are done. New nodes are c0, c1… with sourceId kept for comparison, but their children link only to new nodes, never to source nodes.',
  },
  intuition: {
    zh: '像照着原表重新搭一遍积木：每到一个原节点，就先拿出一块同类型的新积木（原子写同样的字，子表先空着），再把它接到新父积木上。子表的新积木有了位置后，才逐个处理原表里的孩子。全部孩子处理完，这块新积木才算完成，并被交回上一层。',
    en: 'Rebuild the structure with fresh blocks: at every source node, take a new block of the same type (write the same atom value, or leave a new list empty), then attach it to the new parent. Only after the new list block has a position do you process its source children one by one. When all children are done, that block is complete and returned to the caller.',
  },
  prerequisites: {
    zh: ['理解原子节点、表节点与 tag 的区别', '理解先序递归与函数返回值', '知道“结构等价”和“节点相同”不是一回事'],
    en: ['Atom nodes, list nodes and the tag distinction', 'Preorder recursion and function return values', 'Structural equivalence versus node identity'],
  },
  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    note: {
      zh: '每个源节点恰好访问一次，并恰好分配一个新节点，因此时间为 O(n)。新表本身占 O(n) 个节点；递归调用栈另外占 O(h)，h 为嵌套深度。本课把节点总数限制在 40、深度限制在 8，避免画布拥挤。',
      en: 'Each source node is visited once and exactly one new node is allocated, so time is O(n). The new list itself uses O(n) nodes; the call stack adds O(h) for nesting h. This course caps nodes at 40 and depth at 8 to keep the canvas readable.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 解析源表，准备独立副本', en: '① Parse the source and prepare an independent copy' },
      explanation: {
        zh: '真实 Python 用同一套解析器建立源树，分配 n0、n1… 编号；随后 copy_root 置空、复制计数器归零。此时还没有任何新节点，左右两棵树只在计划中存在。',
        en: 'Real Python builds the source tree with the same parser and assigns n0, n1…; copy_root is empty and the copy counter is zero. No new node exists yet; the two trees exist only as a plan.',
      },
      tip: { zh: '源树的 id 与复制树的 c 前缀分开，复制帧才能证明两边不是同一批节点。', en: 'Source ids and c-prefixed copy ids are separate so the Trace can prove the two sides are not the same nodes.' },
    },
    {
      stepId: 'enter',
      title: { zh: '② 进入源节点，判断原子或子表', en: '② Enter a source node and classify it' },
      explanation: {
        zh: 'clone 被调用时发出 enter 帧，显示当前源节点、父源节点和递归层。此刻新节点还未分配，所以 copyId 为空；下一步才根据 kind 走原子或子表分支。',
        en: 'clone emits enter with the current source node, its source parent and the recursion level. The new node has not been allocated, so copyId is empty; the next step chooses the atom or list branch by kind.',
      },
      tip: { zh: 'enter 帧的 copyId 为空是正常状态，不代表复制失败。', en: 'An empty copyId at enter is expected, not a failed copy.' },
    },
    {
      stepId: 'alloc-list',
      title: { zh: '③ 为子表先分配新节点并接到新父节点', en: '③ Allocate a new list node and attach it to the new parent' },
      explanation: {
        zh: '表节点进入后立即分配一个同类型新节点，children 暂为空。若它是根，则写入 copy_root；否则追加到 parent_copy.children。先建立父子连接，再递归孩子，后续新节点才有明确归宿。',
        en: 'A list node immediately allocates a new node of the same kind with empty children. If it is the root it becomes copy_root; otherwise it is appended to parent_copy.children. The parent link exists before children are recursed, giving later nodes a destination.',
      },
      tip: { zh: '这一步只建立空壳，不代表子表内容已复制；copyId 此时指向空的新表节点。', en: 'This creates an empty shell only; sublist contents are not copied yet. copyId points to the empty new list.' },
    },
    {
      stepId: 'copy-atom',
      title: { zh: '④ 原子：分配新节点并复制值', en: '④ Atom: allocate a new node and copy the value' },
      explanation: {
        zh: '原子节点分配新节点时同时写入相同的 atom 文本，并追加到新父节点的 children，然后立即返回这个新节点。返回的是新节点而不是源节点，调用者不能用它继续访问源结构。',
        en: 'An atom allocates a new node, writes the same atom text, appends it to the new parent’s children and returns that new node immediately. The returned object is the copy, not the source; callers must not use it to reach source structure.',
      },
      tip: { zh: '原子复制完成后不会再发 return 帧；copy-atom 本身就是该分支的完成点。', en: 'An atom emits no separate return frame; copy-atom itself completes that branch.' },
    },
    {
      stepId: 'copy-empty',
      title: { zh: '⑤ 空表：保留一个真实的空表节点', en: '⑤ Empty list: keep a real empty list node' },
      explanation: {
        zh: '空子表在 alloc-list 阶段已经分配了新节点，copy-empty 确认它没有孩子并直接返回。不能把空表简化成 NULL，否则 (()) 复制后会丢掉那个空表元素，结构不再等价。',
        en: 'The empty sublist already received a new node during alloc-list; copy-empty confirms it has no children and returns it. Never collapse it to NULL, or (()) would lose its empty-list element and cease to be equivalent.',
      },
      tip: { zh: '空表节点的存在本身就是数据；hp=NULL 只表示它没有首元素。', en: 'The empty-list node’s existence is data; hp=NULL only means it has no first element.' },
    },
    {
      stepId: 'inspect',
      title: { zh: '⑥ 准备递归一个子元素', en: '⑥ Prepare to recurse into one child' },
      explanation: {
        zh: '复制完当前表节点后，真实 Python 按源 children 顺序逐个处理。inspect 帧显示即将访问的源子节点、它在新表中的父节点，以及当前新表节点；这一步只是定位，还没有复制该子元素。',
        en: 'After creating the current list node, Python processes source children in order. The inspect frame shows the source child about to be visited, its new parent and the current new list node; it locates the target but has not copied that child yet.',
      },
      tip: { zh: 'inspect 的 parentCopyId 指向当前新表节点，用来确认下一个新节点会接在哪里。', en: 'inspect’s parentCopyId points to the current new list node, showing where the next new node will attach.' },
    },
    {
      stepId: 'return',
      title: { zh: '⑦ 所有子元素完成，返回新表节点', en: '⑦ All children done, return the new list node' },
      explanation: {
        zh: '当前源表的所有 children 都递归完成后，新表节点的 children 也全部接好。return 帧表示这棵新子表构造完成，并把新节点交回上一层；上一层再把它接到自己的 children。',
        en: 'After every source child has been recursed, the new list’s children are fully linked. The return frame marks this new subtree complete and hands the new node back; the caller attaches it to its own children.',
      },
      tip: { zh: 'return 的 copyId 是本层新节点，不是刚复制的最后一个孩子。', en: 'The return copyId is this level’s new node, not the last child copied.' },
    },
    {
      stepId: 'done',
      title: { zh: '⑧ 复制完成：结构等价、节点独立', en: '⑧ Copy complete: equivalent shape, independent nodes' },
      explanation: {
        zh: '根 clone 返回后得到 copy_root，done 帧比较源表达式与复制表达式的文本，两者应完全一致。复制计数应等于源节点总数；所有复制节点带 sourceId 仅用于教学对照，它们的 children 全部是 c 前缀新节点。',
        en: 'The root clone returns copy_root, and the done frame compares the source and copy expressions, which must match exactly. The copied count equals the source node count; every new node carries sourceId only for teaching comparison, while all children are c-prefixed new nodes.',
      },
      tip: { zh: '复制成功的判据是结构等价且没有任何新节点直接指向源节点，而不只是文本相同。', en: 'Success requires structural equivalence with no new node pointing at a source node — not merely equal text.' },
    },
  ],
  commonMistakes: {
    zh: [
      '只返回源根指针，误以为“赋值引用”就是复制。',
      '先递归孩子、后分配父节点，导致孩子没有可接入的新父节点。',
      '把空表复制成 NULL，丢掉 () 或 (()) 中的真实空表元素。',
      '新节点的 children 直接复用源 children，表面结构相同但节点不独立。',
      '原子返回源节点而不是新节点，后续修改会污染原表。',
      '忘记把新节点追加到 parent_copy.children，复制完成后出现孤岛节点。',
    ],
    en: [
      'Returning the source root pointer and mistaking reference assignment for a copy.',
      'Recursing into children before allocating the parent, leaving no new parent to attach them to.',
      'Copying an empty list as NULL and losing the real empty-list element in () or (()).',
      'Reusing source children directly in new nodes, which looks equivalent but is not independent.',
      'Returning the source atom instead of its new node, so later edits mutate the original.',
      'Forgetting to append a new node to parent_copy.children, leaving orphan nodes after the copy.',
    ],
  },
};
