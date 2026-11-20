import type { Lang } from '../../i18n/types';

export type QueueConceptDiagramKind = 'circular-queue' | 'stack-queue-storage';

/**
 * QUEUE-01 diagrams are static SVGs: one page explains the circular-queue
 * state machine, the other compares the four physical stack/queue layouts.
 * No trace, player or animation state is involved.
 */
export function QueueConceptDiagram({
  kind,
  lang,
}: {
  kind: QueueConceptDiagramKind;
  lang: Lang;
}) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  if (kind === 'circular-queue') {
    const capacity = 6;
    const cells = [0, 1, 2, 3, 4, 5];
    const cardW = 224;
    const cardH = 184;
    const cellW = 25;
    const cellGap = 4;
    const cardX = [420, 656];
    const cardY = [86, 274];
    const states = [
      {
        title: L('① 初始化', '1. Initialise'),
        subtitle: L('front = 0，rear = 0', 'front = 0, rear = 0'),
        values: [null, null, null, null, null, null],
        front: 0,
        rear: 0,
        count: 0,
        status: L('空', 'empty'),
        statusClass: 'diagram-state-empty',
        note: L('空：front == rear', 'empty: front == rear'),
      },
      {
        title: L('② 连续入队 A–E', '2. Enqueue A–E'),
        subtitle: L('front = 0，rear = 5', 'front = 0, rear = 5'),
        values: ['A', 'B', 'C', 'D', 'E', null],
        front: 0,
        rear: 5,
        count: 5,
        status: L('满', 'full'),
        statusClass: 'diagram-state-full',
        note: L('满：(5 + 1) % 6 = 0 = front', 'full: (5 + 1) % 6 = 0 = front'),
      },
      {
        title: L('③ 出队 A', '3. Dequeue A'),
        subtitle: L('front = 1，rear = 5', 'front = 1, rear = 5'),
        values: [null, 'B', 'C', 'D', 'E', null],
        front: 1,
        rear: 5,
        count: 4,
        status: '4 / 5',
        statusClass: 'diagram-state-wrap',
        note: L('0 号格空出；rear 仍为 5', 'slot 0 is free; rear stays at 5'),
      },
      {
        title: L('④ 入队 F，再出队 B', '4. F in, B out'),
        subtitle: L('front = 2，rear = 0', 'front = 2, rear = 0'),
        values: [null, null, 'C', 'D', 'E', 'F'],
        front: 2,
        rear: 0,
        count: 4,
        status: L('回绕', 'wrapped'),
        statusClass: 'diagram-state-wrap',
        note: L('F 入 5 号 → rear=0', 'F enters slot 5 → rear=0'),
      },
    ];

    const ring = [
      { index: 0, x: 205, y: 132, value: null, free: true },
      { index: 1, x: 307, y: 192, value: null, free: true },
      { index: 2, x: 307, y: 328, value: 'C', free: false },
      { index: 3, x: 205, y: 388, value: 'D', free: false },
      { index: 4, x: 103, y: 328, value: 'E', free: false },
      { index: 5, x: 103, y: 192, value: 'F', free: false },
    ];
    const ringFront = 2;
    const ringRear = 0;

    const ordinaryCells = (
      values: Array<string | null>,
      front: number,
      rear: number,
      y: number,
    ) =>
      values.map((value, index) => {
        const x = 280 + index * 40;
        const classes = ['diagram-cell'];
        if (value === null) classes.push('diagram-cell-free');
        if (index === front) classes.push('diagram-cell-front');
        if (index === rear) classes.push('diagram-cell-rear');
        return (
          <g key={`ordinary-${y}-${index}`}>
            <rect className={classes.join(' ')} x={x} y={y} width="34" height="34" rx="5" />
            <text className="diagram-label" x={x + 17} y={y + 23} textAnchor="middle">
              {value ?? '·'}
            </text>
            {index === front ? (
              <text className="diagram-pointer-front" x={x + 11} y={y - 6} textAnchor="middle">
                F
              </text>
            ) : null}
            {index === rear ? (
              <text className="diagram-pointer-rear" x={x + 23} y={y - 6} textAnchor="middle">
                R
              </text>
            ) : null}
            <text className="diagram-note" x={x + 17} y={y + 48} textAnchor="middle">
              {index}
            </text>
          </g>
        );
      });

    const ordinaryQueue = (
      <svg
        className="concept-svg concept-svg-wide"
        viewBox="0 0 900 280"
        role="img"
        aria-label={L(
          '普通顺序队列的假溢出：rear 到达末端后，前部空位无法使用',
          'False overflow in an ordinary array queue: rear reaches the end while earlier slots are free',
        )}
      >
        <text className="diagram-label diagram-label-strong" x="28" y="26">
          {L('普通顺序队列：rear 到末端后无法继续入队', 'Ordinary array queue: rear stops at the end')}
        </text>
        <text className="diagram-note" x="872" y="26" textAnchor="end">
          {L('容量 6 · rear 不回绕', 'capacity 6 · rear never wraps')}
        </text>
        <text className="diagram-note" x="28" y="48">
          {L('元素连续入队，前面再出队；rear 只向右走，空出的前部无法复用。', 'Elements enqueue from the left and dequeue from the front; rear only moves right, so freed front slots cannot be reused.')}
        </text>

        <rect className="diagram-box" x="28" y="62" width="844" height="84" rx="9" />
        <text className="diagram-label diagram-label-strong" x="44" y="86">
          {L('① 连续入队 A–E', '1. Enqueue A–E')}
        </text>
        <text className="diagram-note" x="44" y="108">
          {L('front=0；rear=5', 'front=0; rear=5')}
        </text>
        {ordinaryCells(['A', 'B', 'C', 'D', 'E', null], 0, 5, 78)}
        <text className="diagram-note" x="560" y="92">
          {L('front=0，rear=5', 'front=0, rear=5')}
        </text>
        <text className="diagram-note" x="560" y="114">
          {L('rear 指向空位 5', 'rear points at empty slot 5')}
        </text>
        <text className="diagram-note" x="560" y="136">
          {L('下一次入队写这里', 'the next enqueue goes here')}
        </text>

        <rect className="diagram-box" x="28" y="154" width="844" height="86" rx="9" />
        <text className="diagram-label diagram-label-strong" x="44" y="178">
          {L('② 出队 A、B：前部空出', '2. Dequeue A and B')}
        </text>
        <text className="diagram-note" x="44" y="200">
          {L('front=2；0、1 空闲', 'front=2; 0/1 free')}
        </text>
        {ordinaryCells([null, null, 'C', 'D', 'E', null], 2, 5, 168)}
        <text className="diagram-note" x="560" y="182">
          {L('front=2，rear=5', 'front=2, rear=5')}
        </text>
        <text className="diagram-note" x="560" y="204">
          {L('再入队：rear + 1 = 6 越界', 'next enqueue: rear + 1 = 6 is out of range')}
        </text>
        <text className="diagram-state-full" x="560" y="226">
          {L('假溢出', 'false overflow')}
        </text>

        <text className="diagram-note" x="28" y="262">
          {L('前部明明有空位，却无法继续入队；搬移所有元素可以腾空间，但代价是 O(n)。', 'Front slots are free, but enqueue fails; shifting costs O(n).')}
        </text>
        <text className="diagram-note" x="560" y="262">
          {L('循环队列：rear = (5 + 1) % 6 = 0', 'circular queue: rear = (5 + 1) % 6 = 0')}
        </text>
      </svg>
    );

    return (
      <div className="diagram-stack">
        {ordinaryQueue}
        <svg
        className="concept-svg concept-svg-wide"
        viewBox="0 0 900 744"
        role="img"
        aria-label={L(
          '容量 6 的循环队列：四个线性状态与对应的环形数组',
          'Circular queue with capacity 6: four linear states and the corresponding ring array',
        )}
      >
        <text className="diagram-label diagram-label-strong" x="30" y="30">
          {L('循环队列：容量 6，牺牲 1 个单元', 'Circular queue: capacity 6, one slot sacrificed')}
        </text>
        <text className="diagram-note" x="870" y="30" textAnchor="end">
          {L('F = 队首 front · R = 下一次入队 rear · 虚线 = 空闲', 'F = front · R = next rear · dashed = free')}
        </text>
        <text className="diagram-note" x="30" y="54">
          {L('线性数组 0..5 首尾相接，逻辑上是环；front 指向队首元素，rear 指向下一次入队位置。', 'The linear array 0..5 is logically a ring; front points at the head element and rear at the next insertion slot.')}
        </text>

        <circle className="diagram-ring" cx="205" cy="260" r="118" />
        <text className="diagram-label diagram-label-strong" x="205" y="74" textAnchor="middle">
          {L('环形数组（第④状态）', 'Ring array (state 4)')}
        </text>
        <text className="diagram-note" x="205" y="94" textAnchor="middle">
          {L('物理下标仍是 0..5', 'physical indices remain 0..5')}
        </text>

        {ring.map((cell) => {
          const classes = ['diagram-cell'];
          if (cell.free) classes.push('diagram-cell-free');
          if (cell.index === ringFront) classes.push('diagram-cell-front');
          if (cell.index === ringRear) classes.push('diagram-cell-rear');
          return (
            <g key={cell.index}>
              <rect
                className={classes.join(' ')}
                x={cell.x - 28}
                y={cell.y - 19}
                width="56"
                height="38"
                rx="7"
              />
              <text className="diagram-label diagram-label-strong" x={cell.x} y={cell.y + 5} textAnchor="middle">
                {cell.value ? cell.value : '·'}
              </text>
              <text className="diagram-note" x={cell.x} y={cell.y + 34} textAnchor="middle">
                {cell.index}
              </text>
            </g>
          );
        })}

        <text className="diagram-pointer-front" x="356" y="332" textAnchor="start">
          front
        </text>
        <line className="diagram-line diagram-directed" x1="350" y1="328" x2="336" y2="328" />
        <polygon className="diagram-arrow" points="332,328 342,323 342,333" />

        <text className="diagram-pointer-rear" x="205" y="108" textAnchor="middle">
          rear
        </text>
        <polygon className="diagram-arrow" points="205,119 200,110 210,110" />

        <path className="diagram-curve" d="M 112 174 C 104 124 146 104 176 116" />
        <polygon className="diagram-arrow" points="180,117 169,112 172,123" />
        <text className="diagram-note" x="112" y="136" textAnchor="start">
          {L('5 → 0 回绕', '5 → 0 wrap')}
        </text>

        <text className="diagram-label diagram-label-strong" x="205" y="250" textAnchor="middle">
          {L('逻辑相邻', 'logically adjacent')}
        </text>
        <text className="diagram-label" x="205" y="276" textAnchor="middle">
          {L('rear = 0 · front = 2', 'rear = 0 · front = 2')}
        </text>
        <text className="diagram-note" x="205" y="300" textAnchor="middle">
          {L('count = 4 / 上限 5', 'count = 4 / limit 5')}
        </text>

        <text className="diagram-note" x="205" y="430" textAnchor="middle">
          {L('0、1 空闲；2..5 依次是 C、D、E、F', '0 and 1 are free; 2..5 hold C, D, E and F')}
        </text>

        {states.map((state, stateIndex) => {
          const x = cardX[stateIndex % 2];
          const y = cardY[stateIndex % 2];
          const cellY = y + 76;
          return (
            <g key={state.title}>
              <rect className="diagram-box" x={x} y={y} width={cardW} height={cardH} rx="10" />
              <text className="diagram-label diagram-label-strong" x={x + 12} y={y + 24}>
                {state.title}
              </text>
              <text className={state.statusClass} x={x + cardW - 12} y={y + 24} textAnchor="end">
                {state.status}
              </text>
              <text className="diagram-note" x={x + 12} y={y + 45}>
                {state.subtitle}
              </text>

              {cells.map((index) => {
                const cellX = x + 12 + index * (cellW + cellGap);
                const classes = ['diagram-cell'];
                if (state.values[index] === null) classes.push('diagram-cell-free');
                if (index === state.front) classes.push('diagram-cell-front');
                if (index === state.rear) classes.push('diagram-cell-rear');
                return (
                  <g key={`${state.title}-${index}`}>
                    <rect
                      className={classes.join(' ')}
                      x={cellX}
                      y={cellY}
                      width={cellW}
                      height="30"
                      rx="5"
                    />
                    <text className="diagram-label" x={cellX + cellW / 2} y={cellY + 20} textAnchor="middle">
                      {state.values[index] ?? '·'}
                    </text>
                    {index === state.front ? (
                      <text className="diagram-pointer-front" x={cellX + cellW / 2 - 6} y={cellY - 6} textAnchor="middle">
                        F
                      </text>
                    ) : null}
                    {index === state.rear ? (
                      <text className="diagram-pointer-rear" x={cellX + cellW / 2 + 6} y={cellY - 6} textAnchor="middle">
                        R
                      </text>
                    ) : null}
                    <text className="diagram-note" x={cellX + cellW / 2} y={cellY + 45} textAnchor="middle">
                      {index}
                    </text>
                  </g>
                );
              })}

              <text className="diagram-note" x={x + 12} y={y + 132}>
                {L(
                  `count = (${state.rear} - ${state.front} + ${capacity}) % ${capacity} = ${state.count}`,
                  `count = (${state.rear} - ${state.front} + ${capacity}) % ${capacity} = ${state.count}`,
                )}
              </text>
              <text className="diagram-note" x={x + 12} y={y + 154}>
                {state.note}
              </text>
              {stateIndex === 3 ? (
                <text className="diagram-note" x={x + 12} y={y + 172}>
                  {L('B 出队 → front=2', 'B leaves → front=2')}
                </text>
              ) : null}
            </g>
          );
        })}

        <rect className="diagram-band" x="28" y="476" width="844" height="252" rx="9" />
        <text className="diagram-label diagram-label-strong" x="48" y="502">
          {L('统一约定：牺牲一个单元区分队空与队满', 'Convention: sacrifice one slot to distinguish empty from full')}
        </text>
        <text className="diagram-note" x="48" y="526">
          {L('front → 队首；rear → 下一次入队；capacity = 6。', 'front → head; rear → next insertion; capacity = 6.')}
        </text>
        <text className="diagram-label" x="48" y="558">
          rear = (rear + 1) % capacity
        </text>
        <text className="diagram-label" x="48" y="584">
          front = (front + 1) % capacity
        </text>
        <text className="diagram-label" x="48" y="610">
          count = (rear - front + capacity) % capacity
        </text>
        <text className="diagram-label" x="48" y="642">
          {L('空：front == rear', 'empty: front == rear')}
        </text>
        <text className="diagram-label" x="48" y="668">
          {L('满：(rear + 1) % capacity == front', 'full: (rear + 1) % capacity == front')}
        </text>
        <text className="diagram-note" x="48" y="696">
          {L('实际可存元素上限 = capacity - 1 = 5。', 'usable capacity = capacity - 1 = 5.')}
        </text>

        <text className="diagram-label" x="470" y="558">
          {L('第②状态：rear=5，count=5，队满', 'State 2: rear=5, count=5, full')}
        </text>
        <text className="diagram-label" x="470" y="584">
          {L('第③状态：出队 A 后 front=1', 'State 3: dequeue A, front=1')}
        </text>
        <text className="diagram-label" x="470" y="610">
          {L('第④状态：rear 5→0；再出 B 后 front=2', 'State 4: rear 5→0; after B, front=2')}
        </text>
        <text className="diagram-note" x="470" y="638">
          {L('最终 C..F 在 2..5，0、1 空闲，count=4。', 'C..F occupy 2..5; 0 and 1 are free; count=4.')}
        </text>
        <text className="diagram-note" x="470" y="666">
          {L('count 计数器法：0 空，capacity 满。', 'count method: 0 empty, capacity full.')}
        </text>
        <text className="diagram-note" x="470" y="694">
          {L('不要与牺牲一个单元的公式混用。', 'do not mix it with the sacrificed-slot tests.')}
        </text>
      </svg>
      </div>
    );
  }

  const stackValues = ['A', 'B', 'C', null, null];
  const queueValues = [null, null, 'B', 'C', 'D', null];
  const queueFront = 2;
  const queueRear = 5;

  return (
    <svg
      className="concept-svg concept-svg-wide"
      viewBox="0 0 900 730"
      role="img"
      aria-label={L(
        '顺序栈、链栈、顺序队列与带头结点链式队列的物理结构对比',
        'Physical structures of array stack, linked stack, array queue and headed linked queue',
      )}
    >
      <text className="diagram-label diagram-label-strong" x="28" y="30">
        {L('栈与队列：同一逻辑结构，四种物理存储', 'Stacks and queues: one logical structure, four physical layouts')}
      </text>
      <text className="diagram-note" x="872" y="30" textAnchor="end">
        {L('F = 队首 · R = 下一次入队 · 虚线 = 空闲', 'F = front · R = rear next · dashed = free')}
      </text>
      <text className="diagram-note" x="28" y="54">
        {L('逻辑结构规定 LIFO / FIFO；存储结构决定数组、指针、容量与空满判断。', 'The logical structure fixes LIFO/FIFO; the storage layout decides arrays, pointers, capacity and empty/full tests.')}
      </text>

      {/* ① 顺序栈 */}
      <rect className="diagram-box" x="28" y="72" width="410" height="250" rx="10" />
      <text className="diagram-label diagram-label-strong" x="44" y="98">
        {L('① 顺序栈 · 连续数组 + top', '1. Array stack · contiguous array + top')}
      </text>
      <text className="diagram-note" x="44" y="118">
        {L('top = 2，栈顶元素是 C', 'top = 2, the top element is C')}
      </text>

      {stackValues.map((value, index) => {
        const y = 134 + index * 34;
        return (
          <g key={`stack-${index}`}>
            <rect
              className={value === null ? 'diagram-cell diagram-cell-free' : index === 2 ? 'diagram-cell diagram-cell-front' : 'diagram-cell'}
              x="62"
              y={y}
              width="72"
              height="34"
              rx="5"
            />
            <text className="diagram-label" x="98" y={y + 22} textAnchor="middle">
              {value ?? '·'}
            </text>
            <text className="diagram-note" x="52" y={y + 22} textAnchor="end">
              {index}
            </text>
          </g>
        );
      })}

      <text className="diagram-pointer-front" x="150" y="223">
        top
      </text>
      <line className="diagram-line diagram-directed" x1="146" y1="219" x2="136" y2="219" />
      <polygon className="diagram-arrow" points="132,219 142,214 142,224" />

      <text className="diagram-note" x="200" y="146">
        {L('空栈：top == -1', 'empty: top == -1')}
      </text>
      <text className="diagram-note" x="200" y="170">
        {L('满栈：top == MAXSIZE - 1', 'full: top == MAXSIZE - 1')}
      </text>
      <text className="diagram-note" x="200" y="198">
        {L('入栈：++top; S[top] = x', 'push: ++top; S[top] = x')}
      </text>
      <text className="diagram-note" x="200" y="222">
        {L('出栈：x = S[top--]', 'pop: x = S[top--]')}
      </text>
      <text className="diagram-note" x="200" y="252">
        {L('top 指向当前栈顶元素，不是下一个空位。', 'top → current top element.')}
      </text>
      <text className="diagram-note" x="200" y="276">
        {L('随机访问；容量固定，溢出需扩容。', 'Random access; fixed capacity.')}
      </text>

      {/* ② 链栈 */}
      <rect className="diagram-box" x="462" y="72" width="410" height="250" rx="10" />
      <text className="diagram-label diagram-label-strong" x="478" y="98">
        {L('② 链栈 · top 指向首节点', '2. Linked stack · top points at the first node')}
      </text>
      <text className="diagram-note" x="478" y="118">
        {L('节点 C → B → A → NULL；push/pop 都在表头', 'nodes C → B → A → NULL; push/pop at the head')}
      </text>

      {['C', 'B', 'A'].map((value, index) => {
        const x = 500 + index * 85;
        const y = 142;
        return (
          <g key={`linked-stack-${value}`}>
            <rect className="diagram-node" x={x} y={y} width="72" height="40" rx="6" />
            <line className="diagram-divider" x1={x + 46} y1={y} x2={x + 46} y2={y + 40} />
            <text className="diagram-label diagram-label-strong" x={x + 23} y={y + 25} textAnchor="middle">
              {value}
            </text>
            <line className="diagram-line diagram-directed" x1={x + 72} y1={y + 20} x2={x + 81} y2={y + 20} />
            <polygon className="diagram-arrow" points={`${x + 85},${y + 20} ${x + 75},${y + 15} ${x + 75},${y + 25}`} />
          </g>
        );
      })}
      <text className="diagram-note" x="758" y="167">
        NULL
      </text>

      <text className="diagram-pointer-front" x="478" y="167">
        top
      </text>
      <line className="diagram-line diagram-directed" x1="494" y1="162" x2="498" y2="162" />
      <polygon className="diagram-arrow" points="502,162 492,157 492,167" />

      <text className="diagram-note" x="478" y="214">
        {L('入栈：new→next = top; top = new', 'push: new→next = top; top = new')}
      </text>
      <text className="diagram-note" x="478" y="238">
        {L('出栈：top = top→next', 'pop: top = top→next')}
      </text>
      <text className="diagram-note" x="478" y="262">
        {L('O(1)；节点不必连续，但每个节点多一个指针。', 'O(1); nodes may be scattered; one extra pointer.')}
      </text>
      <text className="diagram-note" x="478" y="286">
        {L('空栈：top == NULL', 'empty: top == NULL')}
      </text>

      {/* ③ 顺序队列 */}
      <rect className="diagram-box" x="28" y="338" width="410" height="250" rx="10" />
      <text className="diagram-label diagram-label-strong" x="44" y="364">
        {L('③ 顺序队列 · front 与 rear 标记区间', '3. Array queue · front and rear bound the range')}
      </text>
      <text className="diagram-note" x="44" y="384">
        {L('front = 2，rear = 5；B、C、D 是有效元素', 'front = 2, rear = 5; B, C and D are live')}
      </text>

      {queueValues.map((value, index) => {
        const x = 58 + index * 48;
        const classes = ['diagram-cell'];
        if (value === null) classes.push('diagram-cell-free');
        if (index === queueFront) classes.push('diagram-cell-front');
        if (index === queueRear) classes.push('diagram-cell-rear');
        return (
          <g key={`queue-${index}`}>
            <rect className={classes.join(' ')} x={x} y="432" width="44" height="34" rx="5" />
            <text className="diagram-label" x={x + 22} y="454" textAnchor="middle">
              {value ?? '·'}
            </text>
            {index === queueFront ? (
              <text className="diagram-pointer-front" x={x + 15} y="424" textAnchor="middle">
                F
              </text>
            ) : null}
            {index === queueRear ? (
              <text className="diagram-pointer-rear" x={x + 29} y="424" textAnchor="middle">
                R
              </text>
            ) : null}
            <text className="diagram-note" x={x + 22} y="482" textAnchor="middle">
              {index}
            </text>
          </g>
        );
      })}

      <text className="diagram-note" x="44" y="510">
        {L('front 指向队首 B；rear 指向下一次入队位置 5。', 'front points at head B; rear points at next slot 5.')}
      </text>
      <text className="diagram-note" x="44" y="534">
        {L('0、1 已空出，但 rear 已到 5，不能回头 → 假溢出。', '0/1 free; rear cannot rewind → false overflow.')}
      </text>
      <text className="diagram-note" x="44" y="558">
        {L('普通数组队列的判满通常只能看 rear 是否越界；', 'Array queue tests only if rear passed the end;')}
      </text>
      <text className="diagram-note" x="44" y="582">
        {L('回绕与取模公式见「循环队列」专题，本页不重复。', 'see the circular-queue page for wrapping.')}
      </text>
      <rect className="diagram-chip diagram-accent" x="44" y="596" width="320" height="26" rx="6" />
      <text className="diagram-label" x="56" y="613">
        {L('改进：循环队列复用 0..capacity-1', 'improve: circular queue reuses slots')}
      </text>

      {/* ④ 链式队列 */}
      <rect className="diagram-box" x="462" y="338" width="410" height="250" rx="10" />
      <text className="diagram-label diagram-label-strong" x="478" y="364">
        {L('④ 链式队列 · 统一采用带头结点', '4. Linked queue · headed convention')}
      </text>
      <text className="diagram-note" x="478" y="384">
        {L('front → 头结点；rear → 最后一个数据结点 B', 'front → head node; rear → last data node B')}
      </text>

      {[
        { value: L('头', 'head'), x: 500 },
        { value: 'A', x: 585 },
        { value: 'B', x: 670 },
      ].map((node, index) => (
        <g key={`linked-queue-${node.value}`}>
          <rect className="diagram-node" x={node.x} y="438" width="72" height="40" rx="6" />
          <line className="diagram-divider" x1={node.x + 46} y1="438" x2={node.x + 46} y2="478" />
          <text className="diagram-label diagram-label-strong" x={node.x + 23} y="463" textAnchor="middle">
            {node.value}
          </text>
          {index < 2 ? (
            <>
              <line className="diagram-line diagram-directed" x1={node.x + 72} y1="458" x2={node.x + 81} y2="458" />
              <polygon className="diagram-arrow" points={`${node.x + 85},458 ${node.x + 75},453 ${node.x + 75},463`} />
            </>
          ) : null}
        </g>
      ))}
      <text className="diagram-note" x="758" y="463">
        NULL
      </text>

      <text className="diagram-pointer-front" x="536" y="428" textAnchor="middle">
        front
      </text>
      <line className="diagram-line diagram-directed" x1="536" y1="432" x2="536" y2="434" />
      <polygon className="diagram-arrow" points="536,438 531,430 541,430" />

      <text className="diagram-pointer-rear" x="706" y="428" textAnchor="middle">
        rear
      </text>
      <line className="diagram-line diagram-directed" x1="706" y1="432" x2="706" y2="434" />
      <polygon className="diagram-arrow" points="706,438 701,430 711,430" />

      <text className="diagram-note" x="478" y="510">
        {L('入队：rear→next = new; rear = new', 'enqueue: rear→next = new; rear = new')}
      </text>
      <text className="diagram-note" x="478" y="534">
        {L('出队：p = front→next; front→next = p→next', 'dequeue: p = front→next; front→next = p→next')}
      </text>
      <text className="diagram-note" x="478" y="558">
        {L('若删除的是最后一个结点，令 rear = front。', 'if the last node is removed, set rear = front.')}
      </text>
      <text className="diagram-note" x="478" y="582">
        {L('空：front == rear == 头结点，且 头→next == NULL。', 'empty: front == rear == head, and head→next == NULL.')}
      </text>
      <text className="diagram-note" x="478" y="606">
        {L('无固定容量；每个结点多一个 next 指针。', 'no fixed capacity; one extra pointer per node.')}
      </text>
    </svg>
  );
}
