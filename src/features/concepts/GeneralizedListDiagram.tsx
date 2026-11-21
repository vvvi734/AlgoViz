import type { Lang } from '../../i18n/types';

interface NodeBoxProps {
  x: number;
  y: number;
  label: string;
  detail: string;
  kind: 'list' | 'atom';
  depth?: string;
}

function NodeBox({ x, y, label, detail, kind, depth }: NodeBoxProps) {
  return (
    <g>
      <rect
        className={`diagram-box ${kind === 'list' ? 'diagram-accent' : 'diagram-chip'}`}
        x={x}
        y={y}
        width="118"
        height="54"
        rx={kind === 'list' ? 9 : 22}
      />
      <text className="diagram-label diagram-label-strong" x={x + 59} y={y + 23} textAnchor="middle">
        {label}
      </text>
      <text className="diagram-note" x={x + 59} y={y + 42} textAnchor="middle">
        {detail}
      </text>
      {depth ? (
        <text className="diagram-note" x={x - 8} y={y + 31} textAnchor="end">
          {depth}
        </text>
      ) : null}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 7;
  const points = [
    `${x2},${y2}`,
    `${x2 - head * Math.cos(angle - Math.PI / 6)},${y2 - head * Math.sin(angle - Math.PI / 6)}`,
    `${x2 - head * Math.cos(angle + Math.PI / 6)},${y2 - head * Math.sin(angle + Math.PI / 6)}`,
  ].join(' ');
  return (
    <g>
      <line className="diagram-line" x1={x1} y1={y1} x2={x2} y2={y2} />
      <polygon className="diagram-arrow" points={points} />
      {label ? (
        <text className="diagram-note" x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7} textAnchor="middle">
          {label}
        </text>
      ) : null}
    </g>
  );
}

/** 5.4/5.5：广义表的嵌套逻辑结构图。 */
export function GeneralizedListDiagram({ lang }: { lang: Lang }) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  return (
    <svg
      className="concept-svg concept-svg-wide"
      viewBox="0 0 900 510"
      role="img"
      aria-label={L('广义表 (a, (b, c), ((d), e)) 的嵌套层级', 'Nesting levels of (a, (b, c), ((d), e))')}
    >
      <text className="diagram-label diagram-label-strong" x="30" y="32">
        {L('广义表 (a, (b, c), ((d), e))：原子与子表可以出现在同一层', 'The list (a, (b, c), ((d), e)): atoms and sublists share one level')}
      </text>
      <text className="diagram-note" x="30" y="55">
        {L('方框是子表，圆角胶囊是原子；连线只表示“属于”关系。', 'Boxes are sublists; pills are atoms. Edges only mean “belongs to”.')}
      </text>

      <Arrow x1={450} y1={124} x2={209} y2={176} />
      <Arrow x1={450} y1={124} x2={390} y2={176} />
      <Arrow x1={450} y1={124} x2={720} y2={176} />

      <NodeBox x={391} y={70} label="R" detail={L('表 · 3 个元素', 'LIST · 3 elements')} kind="list" depth="d=3" />
      <NodeBox x={150} y={176} label="a" detail={L('原子', 'ATOM')} kind="atom" depth="d=0" />
      <NodeBox x={331} y={176} label="B" detail={L('表 (b,c)', 'LIST (b,c)')} kind="list" depth="d=1" />
      <NodeBox x={661} y={176} label="C" detail={L('表 ((d),e)', 'LIST ((d),e)')} kind="list" depth="d=2" />

      <Arrow x1={390} y1={230} x2={312} y2={286} />
      <Arrow x1={390} y1={230} x2={468} y2={286} />
      <Arrow x1={720} y1={230} x2={642} y2={286} />
      <Arrow x1={720} y1={230} x2={798} y2={286} />

      <NodeBox x={253} y={286} label="b" detail={L('原子', 'ATOM')} kind="atom" depth="d=0" />
      <NodeBox x={409} y={286} label="c" detail={L('原子', 'ATOM')} kind="atom" depth="d=0" />
      <NodeBox x={583} y={286} label="D" detail={L('表 (d)', 'LIST (d)')} kind="list" depth="d=1" />
      <NodeBox x={739} y={286} label="e" detail={L('原子', 'ATOM')} kind="atom" depth="d=0" />

      <Arrow x1={642} y1={340} x2={642} y2={394} />
      <NodeBox x={583} y={394} label="d" detail={L('原子', 'ATOM')} kind="atom" depth="d=0" />

      <rect className="diagram-band" x="30" y="458" width="840" height="36" rx="7" />
      <text className="diagram-label" x="450" y="481" textAnchor="middle">
        {L('深度只看嵌套层次：原子 0，空表 1，非空表 = 1 + 子表最大深度；长度只数最外层。', 'Depth counts nesting: atom 0, empty list 1, non-empty list = 1 + deepest child; length counts the outermost elements only.')}
      </text>
    </svg>
  );
}

/** 5.5：表头—表尾链式存储；tag、hp 与 tp 各有一条独立语义。 */
export function GeneralizedListStorageDiagram({ lang }: { lang: Lang }) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  return (
    <svg
      className="concept-svg concept-svg-wide"
      viewBox="0 0 900 600"
      role="img"
      aria-label={L('广义表的表头—表尾链式存储', 'Head–tail linked storage for a generalized list')}
    >
      <text className="diagram-label diagram-label-strong" x="30" y="32">
        {L('(a, (b, c)) 的表头—表尾链式存储', 'Head–tail linked storage for (a, (b, c))')}
      </text>
      <text className="diagram-note" x="30" y="55">
        {L('每个节点都有 tag 和 tp；只有表节点用 hp 指向首元素，原子节点用 atom 存值。', 'Every node has tag and tp; only a list node uses hp for its first element, while an atom stores its value.')}
      </text>

      <NodeBox x={40} y={95} label="R · tag=1" detail={L('表', 'LIST')} kind="list" />
      <NodeBox x={230} y={95} label="A · tag=0" detail={L('原子 a', 'ATOM a')} kind="atom" />
      <NodeBox x={420} y={95} label="S · tag=1" detail={L('表 (b,c)', 'LIST (b,c)')} kind="list" />

      <Arrow x1={158} y1={122} x2={230} y2={122} label="hp" />
      <Arrow x1={348} y1={122} x2={420} y2={122} label="tp" />
      <text className="diagram-note" x="40" y="178">tp = NULL</text>
      <text className="diagram-note" x="420" y="196">tp = NULL</text>

      <Arrow x1={479} y1={149} x2={530} y2={216} label="hp" />
      <NodeBox x={500} y={222} label="B · tag=0" detail={L('原子 b', 'ATOM b')} kind="atom" />
      <NodeBox x={690} y={222} label="C · tag=0" detail={L('原子 c', 'ATOM c')} kind="atom" />
      <Arrow x1={618} y1={249} x2={690} y2={249} label="tp" />
      <text className="diagram-note" x="690" y="292">tp = NULL</text>

      <text className="diagram-label" x="40" y="350">{L('两个边界例子', 'Two boundary examples')}</text>
      <NodeBox x={40} y={372} label="E · tag=1" detail={L('空表 ()', 'empty ()')} kind="list" />
      <text className="diagram-note" x="40" y="454">hp = NULL，tp = NULL</text>

      <NodeBox x={300} y={372} label="R2 · tag=1" detail={L('表 (())', 'LIST (())')} kind="list" />
      <Arrow x1={418} y1={399} x2={490} y2={399} label="hp" />
      <NodeBox x={490} y={372} label="E2 · tag=1" detail={L('空子表 ()', 'empty ()')} kind="list" />
      <text className="diagram-note" x="490" y="454">hp = NULL</text>

      <rect className="diagram-band" x="30" y="500" width="840" height="72" rx="8" />
      <text className="diagram-label" x="450" y="524" textAnchor="middle">
        {L('tag=1：ptr.hp 指向子表首元素；tag=0：ptr.atom 保存原子值。', 'tag=1: ptr.hp points at the first child; tag=0: ptr.atom stores the value.')}
      </text>
      <text className="diagram-label" x="450" y="550" textAnchor="middle">
        {L('所有节点的 tp 都指向同层下一个元素，不是二叉树的左右孩子。', 'Every node uses tp for the next sibling at the same level; these are not binary-tree children.')}
      </text>
    </svg>
  );
}

/** 5.6：m 元多项式的外层项表与项内因子子表。 */
export function MultivariatePolynomialDiagram({ lang }: { lang: Lang }) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  return (
    <svg
      className="concept-svg concept-svg-wide"
      viewBox="0 0 900 430"
      role="img"
      aria-label={L('m 元多项式的广义表表示', 'Generalized-list representation of an m-variable polynomial')}
    >
      <text className="diagram-label diagram-label-strong" x="30" y="32">
        {L('P(x,y,z) = 3x²y + 2xz² + 5 的嵌套表示', 'Nested representation of P(x,y,z) = 3x²y + 2xz² + 5')}
      </text>
      <text className="diagram-note" x="30" y="55">
        {L('外层每个元素是一项；项本身又是子表，系数与变量因子放在项内。', 'Each outer element is one term; a term is itself a sublist holding its coefficient and variable factors.')}
      </text>

      <NodeBox x={360} y={82} label={L('项表', 'term list')} detail={L('3 个项', '3 terms')} kind="list" />
      {[
        {
          x: 80,
          label: L('项 1', 'term 1'),
          detail: '3 · x² · y¹',
          note: L('系数 + 因子子表', 'coefficient + factor sublist'),
        },
        {
          x: 360,
          label: L('项 2', 'term 2'),
          detail: '2 · x¹ · z²',
          note: L('系数 + 因子子表', 'coefficient + factor sublist'),
        },
        {
          x: 640,
          label: L('项 3', 'term 3'),
          detail: '5',
          note: L('常数项，无变量因子', 'constant term, no variable factors'),
        },
      ].map((term) => (
        <g key={term.label}>
          <Arrow x1={419} y1={136} x2={term.x + 80} y2={196} />
          <rect className="diagram-box" x={term.x} y="202" width="160" height="82" rx="8" />
          <text className="diagram-label diagram-label-strong" x={term.x + 80} y="226" textAnchor="middle">{term.label}</text>
          <text className="diagram-note" x={term.x + 80} y="250" textAnchor="middle">{term.detail}</text>
          <text className="diagram-note" x={term.x + 80} y="271" textAnchor="middle">
            {term.note}
          </text>
        </g>
      ))}

      <rect className="diagram-band" x="30" y="318" width="400" height="82" rx="8" />
      <text className="diagram-label" x="230" y="343" textAnchor="middle">{L('一元多项式（第 2 章）', 'Univariate polynomial (chapter 2)')}</text>
      <text className="diagram-note" x="230" y="368" textAnchor="middle">{L('每个节点存 coefficient 与 exponent，按指数递减成链。', 'Each node stores coefficient and exponent, chained by decreasing exponent.')}</text>
      <text className="diagram-note" x="230" y="389" textAnchor="middle">{L('加减只需按指数归并两条链。', 'Addition merges two chains by exponent.')}</text>

      <rect className="diagram-band" x="470" y="318" width="400" height="82" rx="8" />
      <text className="diagram-label" x="670" y="343" textAnchor="middle">{L('m 元多项式（本章）', 'm-variable polynomial (this chapter)')}</text>
      <text className="diagram-note" x="670" y="368" textAnchor="middle">{L('项数不固定、每项变量因子数也不固定，因此需要嵌套表。', 'The number of terms and factors per term both vary, so nesting is required.')}</text>
      <text className="diagram-note" x="670" y="389" textAnchor="middle">{L('不新增多元加减动画；只保留与一元链式表示的联系。', 'No multivariate arithmetic animation is added; only the link to the univariate chain remains.')}</text>
    </svg>
  );
}
