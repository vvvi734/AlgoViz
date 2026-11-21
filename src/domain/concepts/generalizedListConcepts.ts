import type { ConceptPage } from './types';

/**
 * TEXTBOOK-05：第 5 章新增的广义表与 m 元多项式理论页。
 * 这些页面不驱动播放器；深度/复制递归由独立动态课程负责。
 */
export const GENERALIZED_LIST_CONCEPT_PAGES: readonly ConceptPage[] = [
  {
    id: 'generalized-list-definition',
    topicId: 'generalized-list',
    title: ['广义表的定义、长度与深度', 'Generalized lists: definition, length and depth'],
    chapter: ['第 5 章 · 数组和广义表', 'Chapter 5 · Arrays and generalized lists'],
    summary: [
      '广义表是线性表的推广：元素既可以是原子，也可以是另一个广义表。一个括号表达式就能表示嵌套结构，但长度只数最外层元素，深度才反映嵌套层数。',
      'A generalized list generalizes a linear list: each element may be an atom or another generalized list. One bracketed expression represents nesting, but length counts only the outermost elements while depth captures the nesting.',
    ],
    diagram: 'generalized-list',
    definitions: [
      {
        term: ['原子', 'Atom'],
        text: ['不可再分的数据元素，例如 a、b、42。原子在表达式中不带括号。', 'An indivisible data element such as a, b or 42. An atom appears without parentheses.'],
      },
      {
        term: ['子表', 'Sublist'],
        text: ['作为另一个广义表元素的广义表，用一对括号包住。子表可以继续嵌套。', 'A generalized list used as an element of another list, enclosed in parentheses; it may nest further.'],
      },
      {
        term: ['空表', 'Empty list'],
        text: ['没有任何元素的广义表，记作 ()。空表是合法结构，长度为 0，深度为 1。', 'The list with no elements, written (). It is valid, with length 0 and depth 1.'],
      },
      {
        term: ['长度', 'Length'],
        text: ['最外层元素的个数。子表只算一个元素，不把它的内部元素展开计数。', 'The number of outermost elements. A sublist counts as one element; its interior is not expanded.'],
      },
      {
        term: ['深度', 'Depth'],
        text: ['嵌套层数。约定：原子深度 0；空表深度 1；非空表深度 = 1 + 各子表深度的最大值。', 'Nesting levels: atom depth 0; empty list depth 1; non-empty list depth = 1 + the maximum child depth.'],
      },
      {
        term: ['表头与表尾', 'Head and tail'],
        text: ['表头是第一个元素，可能是原子或子表。表尾是删除第一个元素后剩余元素组成的表，结果一定是表；空表没有表头和表尾。', 'Head is the first element, atom or sublist. Tail is the list of all remaining elements and is always a list. An empty list has neither.'],
      },
    ],
    sections: [
      {
        title: ['递归定义：表里还可以有表', 'Recursive definition: a list inside a list'],
        body: [
          '广义表 LS 或者为空，或者由 n 个元素组成，每个元素可以是原子，也可以是另一个广义表。这个定义直接允许任意层嵌套：外层表里的子表又可以继续含子表。',
          'A generalized list LS is either empty or made of n elements, each an atom or another generalized list. This definition permits arbitrary nesting: a sublist may itself contain sublists.',
        ],
        points: [
          ['括号决定层级；逗号只分隔同一层的元素。', 'Parentheses define levels; commas only separate elements at the same level.'],
          ['原子不能再展开；子表必须继续按同一规则解释。', 'An atom cannot be expanded; a sublist must be interpreted by the same rule.'],
          ['本轮只接受有限、无环、无共享子表的括号表达式。', 'This chapter accepts only finite, acyclic, non-shared bracketed expressions.'],
        ],
      },
      {
        title: ['长度与深度不是一回事', 'Length and depth are different measurements'],
        body: [
          '长度只看最外层有几个元素；深度沿着嵌套往下走，取最深的一条路径。一个表可以很长但很浅，也可以很短但很深。',
          'Length counts only the outermost elements; depth follows nesting and takes the deepest path. A list can be long but shallow, or short but deep.',
        ],
        points: [
          ['(a, b, c)：长度 3，深度 1。', '(a, b, c): length 3, depth 1.'],
          ['(a, (b, c), d)：长度 3，深度 2；中间子表只算一个外层元素。', '(a, (b, c), d): length 3, depth 2; the middle sublist is one outer element.'],
          ['((a, b), (c, d))：长度 2，深度 2。', '((a, b), (c, d)): length 2, depth 2.'],
          ['()：长度 0，深度 1；(())：长度 1，深度 2。', '(): length 0, depth 1; (()): length 1, depth 2.'],
        ],
        formula: 'Depth(atom)=0；Depth(())=1；Depth((e1,…,en))=1+max(Depth(ei))',
      },
      {
        title: ['表头是第一个元素，表尾是剩下的表', 'Head is one element; tail is a list'],
        body: [
          'Head(L) 取第一个元素，结果可能是原子，也可能是子表。Tail(L) 删除第一个元素，把其余元素仍按原顺序组成一个表，所以表尾的类型一定是表，不是最后一个元素。',
          'Head(L) takes the first element, which may be an atom or a sublist. Tail(L) removes it and keeps the remaining elements in order as a list, so tail is always a list — never the last element.',
        ],
        points: [
          ['Head((a, (b, c), d)) = a；Tail((a, (b, c), d)) = ((b, c), d)。', 'Head((a, (b, c), d)) = a; Tail((a, (b, c), d)) = ((b, c), d).'],
          ['Head(((a, b), c)) = (a, b)；Tail(((a, b), c)) = (c)。', 'Head(((a, b), c)) = (a, b); Tail(((a, b), c)) = (c).'],
          ['Tail 的结果即使只有一个元素也要保留外层括号；空表的 Head/Tail 无定义。', 'Even a one-element tail keeps its outer parentheses; Head/Tail of an empty list are undefined.'],
        ],
      },
      {
        title: ['与普通线性表的区别', 'Difference from an ordinary linear list'],
        body: [
          '普通线性表的每个元素都属于同一类型，元素之间只有前驱/后继关系。广义表允许元素类型不同：原子和子表可以混在同一层，因此逻辑结构是递归的层次结构。',
          'Every element of an ordinary linear list has the same type and only predecessor/successor relations. A generalized list mixes atoms and sublists on one level, so its logical structure is recursively hierarchical.',
        ],
      },
    ],
    comparison: {
      title: ['普通线性表与广义表', 'Ordinary linear list vs generalized list'],
      columns: [['比较项', 'Aspect'], ['普通线性表', 'Ordinary list'], ['广义表', 'Generalized list']],
      rows: [
        [['元素类型', 'Element type'], ['同一类型', 'One type'], ['原子或子表', 'Atom or sublist']],
        [['嵌套', 'Nesting'], ['不允许', 'Not allowed'], ['允许任意层', 'Arbitrary levels']],
        [['长度', 'Length'], ['元素个数', 'Number of elements'], ['最外层元素个数', 'Outermost element count']],
        [['深度', 'Depth'], ['通常不讨论', 'Usually not defined'], ['递归嵌套层数', 'Recursive nesting levels']],
        [['终止条件', 'Termination'], ['到达表尾', 'Reach the end'], ['原子或空表', 'Atom or empty list']],
      ],
    },
    takeaway: [
      '先数最外层得到长度，再沿最深的子表路径得到深度；表头是一个元素，表尾一定是一个表。',
      'Count the outermost elements for length, then follow the deepest sublist path for depth. Head is one element; tail is always a list.',
    ],
  },
  {
    id: 'generalized-list-storage',
    topicId: 'generalized-list-storage',
    title: ['广义表的存储结构', 'Storage structure for generalized lists'],
    chapter: ['第 5 章 · 数组和广义表', 'Chapter 5 · Arrays and generalized lists'],
    summary: [
      '广义表通常用带 tag 的链式节点存储：tag 区分原子与子表，原子节点保存值，表节点用 hp 指向首元素；所有节点再用 tp 指向同层的下一个元素。',
      'Generalized lists are usually stored as tagged linked nodes: tag distinguishes atoms from sublists, an atom stores its value, a list node uses hp for its first child, and every node uses tp for its next sibling at the same level.',
    ],
    diagram: 'generalized-list-storage',
    definitions: [
      {
        term: ['tag', 'Tag'],
        text: ['节点类型标志。tag=0 表示原子，tag=1 表示子表；它决定联合体中存的是 atom 还是 hp。', 'A node-type flag. tag=0 means atom and tag=1 means sublist; it decides whether the union stores atom or hp.'],
      },
      {
        term: ['原子节点', 'Atom node'],
        text: ['tag=0，ptr.atom 保存原子值；tp 仍指向同层下一个元素。', 'tag=0; ptr.atom stores the atom value, while tp still points to the next sibling.'],
      },
      {
        term: ['表节点', 'List node'],
        text: ['tag=1，ptr.hp 指向本子表的第一个元素；空子表的 hp 为 NULL。', 'tag=1; ptr.hp points to the first element of this sublist, and hp is NULL for an empty sublist.'],
      },
      {
        term: ['tp 指针', 'tp pointer'],
        text: ['所有节点共有的“同层后继”指针，指向同一层的下一个元素；NULL 表示本层结束。', 'A sibling pointer shared by every node; it points to the next element at the same level, and NULL ends that level.'],
      },
      {
        term: ['表头—表尾表示', 'Head–tail representation'],
        text: ['一个表节点的 hp 指向表头元素，元素节点的 tp 串起表尾；子表节点再拥有自己的 hp 链。', 'A list node’s hp points to its head element, element nodes link the tail through tp, and a sublist node owns its own hp chain.'],
      },
    ],
    sections: [
      {
        title: ['为什么必须有 tag', 'Why a tag is necessary'],
        body: [
          '同一个节点位置可能存原子，也可能存子表。若没有 tag，指针和值共用一块存储时无法判断该按哪种方式解释。tag 是运行时类型标签，不是装饰。',
          'A node position may hold an atom or a sublist. Without a tag, a union holding either a value or a pointer cannot be interpreted safely. The tag is a runtime type discriminant, not decoration.',
        ],
        points: [
          ['tag=1 时只能读 hp，不能把指针当原子值。', 'When tag=1, read hp only; never treat the pointer as an atom value.'],
          ['tag=0 时只能读 atom，不能继续找子表。', 'When tag=0, read atom only; there is no sublist to follow.'],
          ['空子表也用 tag=1 节点表示，hp=NULL 与“没有这个子表”不同。', 'An empty sublist is still a tag=1 node with hp=NULL; that differs from “no sublist”.'],
        ],
      },
      {
        title: ['hp 与 tp 是两条独立语义', 'hp and tp carry independent meanings'],
        body: [
          'hp 回答“这个子表从哪里开始”，只属于表节点；tp 回答“同层下一个元素是谁”，所有节点都有。把 tp 当成右孩子，会把广义表错误地画成二叉树。',
          'hp answers “where does this sublist start” and belongs only to a list node. tp answers “who is the next element at this level” and exists on every node. Treating tp as a right child would wrongly turn the structure into a binary tree.',
        ],
        points: [
          ['根表节点 R 的 hp 指向首元素 A；A 的 tp 指向同层下一个元素。', 'Root list node R’s hp points to first element A; A’s tp points to the next sibling.'],
          ['子表节点 S 的 hp 指向它自己的首元素；S 的 tp 仍是父层的后继。', 'Sublist node S’s hp points to its own first element; S’s tp remains its sibling in the parent level.'],
          ['表节点的 tp=NULL 表示父层到此结束，不表示子表为空。', 'tp=NULL on a list node ends the parent level; it does not mean the sublist is empty.'],
        ],
      },
      {
        title: ['空表与含空表的表', 'Empty lists and lists containing empty lists'],
        body: [
          '() 是根表节点，hp=NULL，长度 0。 (()) 的根表 hp 指向一个空子表节点；根表长度是 1，空子表本身长度 0，整体深度 2。',
          '() is a root list node with hp=NULL and length 0. (()) has a root hp pointing to an empty sublist node; the root length is 1, the sublist length is 0, and the whole depth is 2.',
        ],
        points: [
          ['不能用 hp=NULL 同时表示“空根表”和“没有子表”；要看节点是否真实存在。', 'hp=NULL cannot distinguish “empty root” from “no sublist” by itself; the node’s existence carries that distinction.'],
          ['复制时必须为空子表也分配独立节点，不能只复制一个 NULL。', 'Copying must allocate a node for an empty sublist; copying only NULL would lose a real element.'],
        ],
      },
      {
        title: ['与普通单链表、二叉树的边界', 'Boundary with linked lists and binary trees'],
        body: [
          '普通单链表只有 next 一条链，节点类型统一；广义表有 hp/tp 两条链，节点类型由 tag 区分。二叉树用 left/right 表示两个孩子，广义表的 tp 表示同层后继，不能混用。',
          'An ordinary singly linked list has one next chain and one node type. A generalized list has hp/tp and a tag. A binary tree uses left/right for two children; tp is a sibling link and must not be reused as a child link.',
        ],
      },
    ],
    comparison: {
      title: ['三种链式结构的分工', 'Three linked structures'],
      columns: [['结构', 'Structure'], ['节点类型', 'Node type'], ['指针语义', 'Pointer meaning']],
      rows: [
        [['普通单链表', 'Singly linked list'], ['统一值节点', 'One value node'], ['next 指向后继', 'next points to successor']],
        [['二叉树', 'Binary tree'], ['值和左右孩子', 'Value plus left/right'], ['left/right 是两个孩子', 'left/right are two children']],
        [['广义表', 'Generalized list'], ['tag 区分原子/表', 'tag distinguishes atom/list'], ['hp 首元素，tp 同层后继', 'hp first child, tp sibling']],
      ],
    },
    takeaway: [
      '记住两句话：tag 决定联合体怎么读，hp 进入子表，tp 走到同层下一个元素。空表也是真实节点，不能用 NULL 代替。',
      'Remember: tag decides how the union is read, hp enters a sublist and tp moves to the next sibling. An empty list is a real node, never just NULL.',
    ],
  },
  {
    id: 'multivariate-polynomial',
    topicId: 'm-variable-polynomial',
    title: ['m 元多项式的广义表表示', 'Representing an m-variable polynomial with generalized lists'],
    chapter: ['第 5 章 · 数组和广义表', 'Chapter 5 · Arrays and generalized lists'],
    summary: [
      '一元多项式只需要“系数 + 指数”的有序链；m 元多项式的项数和每项的变量因子数都不固定，因此把项表放在外层，把每项的系数和变量因子放在项内子表，形成嵌套广义表。',
      'A univariate polynomial needs only an ordered chain of coefficient/exponent nodes. An m-variable polynomial has a variable number of terms and factors per term, so the term table is the outer list and each term’s coefficient/factors form an inner sublist.',
    ],
    diagram: 'multivariate-polynomial',
    definitions: [
      {
        term: ['m 元多项式', 'm-variable polynomial'],
        text: ['含两个或更多变量的多项式，例如 P(x,y,z)=3x²y+2xz²+5。每个单项式由系数和若干变量幂组成。', 'A polynomial in two or more variables, such as P(x,y,z)=3x²y+2xz²+5. Each term has a coefficient and several variable powers.'],
      },
      {
        term: ['项表', 'Term table'],
        text: ['外层广义表，每个元素是一个单项式；项数可以增删，所以适合用链式表。', 'The outer generalized list whose elements are terms; terms can grow or shrink, so a linked table is natural.'],
      },
      {
        term: ['项内因子子表', 'Factor sublist inside a term'],
        text: ['每个项本身是子表：先存系数，再用若干“变量/指数”对表示因子。因子个数可变，不能硬编码成固定字段。', 'Each term is a sublist: the coefficient comes first, followed by variable/exponent pairs. The factor count varies and cannot be a fixed set of fields.'],
      },
    ],
    sections: [
      {
        title: ['从一元链到多元嵌套', 'From a univariate chain to nested terms'],
        body: [
          '第 2 章的一元多项式相加把每个非零项存成 coefficient/exponent 节点，按指数递减连成一条链。它只有一个变量，所以“变量是谁”不需要在节点里重复。',
          'Chapter 2’s univariate addition stores each nonzero term as a coefficient/exponent node and chains them by decreasing exponent. With one variable, “which variable” need not be repeated in every node.',
        ],
        points: [
          ['一元：项 = 系数 + 一个指数；整条链按指数排序。', 'Univariate: term = coefficient + one exponent; the chain is ordered by exponent.'],
          ['m 元：项 = 系数 + 多个变量幂；每个项的因子数可能不同。', 'm-variable: term = coefficient + several powers; different terms may have different factor counts.'],
          ['因此外层用项表，项内再用因子子表；这是“表的元素又是表”的直接应用。', 'So the outer level is a term table and each term contains a factor sublist — a direct use of “a list whose elements are lists”.'],
        ],
      },
      {
        title: ['一个短例子的对应关系', 'A short example'],
        body: [
          '把 P(x,y,z)=3x²y + 2xz² + 5 写成外层项表：((3,(x,2),(y,1)), (2,(x,1),(z,2)), (5))。第一项是系数 3 加两个因子，第三项只有一个常数系数。',
          'Write P(x,y,z)=3x²y + 2xz² + 5 as ((3,(x,2),(y,1)), (2,(x,1),(z,2)), (5)). The first term has coefficient 3 and two factors; the last term is only a constant coefficient.',
        ],
        points: [
          ['外层每个元素是一个项子表，项与项之间可以用 tp 或顺序表链接。', 'Each outer element is a term sublist; terms may be linked by tp or stored sequentially.'],
          ['项内第一个位置放系数，后面的位置放变量因子；因子顺序不影响数学值，但要约定统一顺序。', 'The first inner position holds the coefficient and later positions hold factors; factor order does not change the value, but a canonical order should be agreed.'],
          ['常数项没有变量因子，项内只剩系数；空项表表示零多项式。', 'A constant term has no factor; an empty term table represents the zero polynomial.'],
        ],
        formula: 'P = ((3,(x,2),(y,1)), (2,(x,1),(z,2)), (5))',
      },
      {
        title: ['与第 2 章课程的联系和边界', 'Link to chapter 2 and scope boundary'],
        body: [
          '第 2 章已经实现一元多项式相加的真实 Trace。m 元多项式只需要理解“为什么需要嵌套表示”；本轮不新增多元加减乘除动画，也不把一元链式算法直接套到多元项上。',
          'Chapter 2 already has a real Trace for univariate polynomial addition. This chapter only explains why nested representation is needed; it adds no multivariate arithmetic animation and does not force the univariate chain algorithm onto multivariate terms.',
        ],
        points: [
          ['一元链式相加的归并逻辑可以复用，但多元项相等需要比较整个因子子表。', 'The merge idea from univariate addition can be reused, but equality of multivariate terms requires comparing the whole factor sublist.'],
          ['本轮不实现多元多项式计算器；课程只保留结构表示与第 2 章链接。', 'This chapter does not implement a multivariate calculator; it only teaches representation and links back to chapter 2.'],
        ],
      },
    ],
    comparison: {
      title: ['一元与 m 元多项式表示', 'Univariate vs m-variable representation'],
      columns: [['比较项', 'Aspect'], ['一元多项式', 'Univariate'], ['m 元多项式', 'm-variable']],
      rows: [
        [['变量数', 'Variables'], ['1', '1'], ['m ≥ 2', 'm ≥ 2']],
        [['项结构', 'Term structure'], ['系数 + 指数', 'Coefficient + exponent'], ['系数 + 多个因子', 'Coefficient + several factors']],
        [['外层结构', 'Outer structure'], ['一条有序链', 'One ordered chain'], ['项表（每个元素是项子表）', 'Term table of term sublists']],
        [['本章处理', 'Handled here'], ['已有真实 Trace', 'Existing real Trace'], ['只讲表示，不新增运算动画', 'Representation only, no arithmetic animation']],
      ],
    },
    takeaway: [
      '一元多项式用一条“系数/指数”链；m 元多项式把“项”做成外层表，把“系数 + 因子”做成项内子表。嵌套是因为项数和每项因子数都不固定。',
      'A univariate polynomial uses one coefficient/exponent chain; an m-variable polynomial uses an outer term table and inner coefficient/factor sublists because both term and factor counts vary.',
    ],
  },
];
