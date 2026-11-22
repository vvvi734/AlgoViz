import type { Lang } from '../../i18n/types';
import type { ConceptDiagramKind } from '../../domain/concepts/types';

function useLabels(lang: Lang) {
  return (zh: string, en: string) => (lang === 'zh' ? zh : en);
}

export function SearchConceptDiagram({
  kind,
  lang,
}: {
  kind: Extract<ConceptDiagramKind, 'search-basics' | 'static-tree-table' | 'hashing-basics' | 'search-comparison'>;
  lang: Lang;
}) {
  const L = useLabels(lang);
  const aria = {
    'search-basics': L('查找表、关键字与静态/动态查找的关系', 'Search table, keys and static versus dynamic search'),
    'static-tree-table': L('静态查找表的判定树与加权路径长度', 'Decision tree and weighted path length for a static table'),
    'hashing-basics': L('哈希函数、桶、冲突与装填因子', 'Hash function, buckets, collisions and load factor'),
    'search-comparison': L('九种查找结构的条件与成本对照', 'Preconditions and costs of nine search structures'),
  }[kind];

  if (kind === 'search-basics') {
    return (
      <svg className="concept-svg" viewBox="0 0 800 380" role="img" aria-label={aria}>
        <rect className="diagram-band" x="20" y="14" width="760" height="36" rx="8" />
        <text className="diagram-label diagram-label-strong" x="400" y="38" textAnchor="middle">
          {L('查找表 = 记录集合 + 可按关键字比较的访问方式', 'Search table = records + an access path ordered by key')}
        </text>

        <rect className="diagram-box" x="30" y="70" width="310" height="204" rx="9" />
        <text className="diagram-label diagram-label-strong" x="185" y="94" textAnchor="middle">
          {L('查找表（n = 8）', 'Search table (n = 8)')}
        </text>
        <text className="diagram-note" x="70" y="116" textAnchor="middle">i</text>
        <text className="diagram-note" x="165" y="116" textAnchor="middle">{L('关键字 key', 'key')}</text>
        <text className="diagram-note" x="270" y="116" textAnchor="middle">{L('记录 record', 'record')}</text>
        <line className="diagram-line" x1="42" y1="126" x2="328" y2="126" />
        {[
          ['0', '8', 'R8'],
          ['1', '15', 'R15'],
          ['2', '22', 'R22'],
          ['3', '31', 'R31'],
          ['4', '45', 'R45'],
          ['5', '57', 'R57'],
          ['6', '66', 'R66'],
          ['7', '78', 'R78'],
        ].map(([index, key, record], row) => (
          <g key={index}>
            <text className="diagram-note" x="70" y={148 + row * 15.5} textAnchor="middle">{index}</text>
            <text className="diagram-label" x="165" y={148 + row * 15.5} textAnchor="middle">{key}</text>
            <text className="diagram-note" x="270" y={148 + row * 15.5} textAnchor="middle">{record}</text>
          </g>
        ))}

        <rect className="diagram-box diagram-accent" x="365" y="70" width="190" height="94" rx="9" />
        <text className="diagram-label diagram-label-strong" x="460" y="96" textAnchor="middle">{L('静态查找表', 'Static search table')}</text>
        {[
          L('只查不改：顺序 / 二分 / 分块', 'Read-only: sequential / binary / block'),
          L('结构在查询期间保持不变', 'Structure stays fixed during queries'),
          L('ASL 由表长、树形或索引决定', 'ASL depends on length, tree or index'),
        ].map((line, index) => (
          <text key={line} className="diagram-note" x="460" y={117 + index * 15} textAnchor="middle">{line}</text>
        ))}

        <rect className="diagram-box" x="570" y="70" width="200" height="94" rx="9" />
        <text className="diagram-label diagram-label-strong" x="670" y="96" textAnchor="middle">{L('动态查找表', 'Dynamic search table')}</text>
        {[
          L('边查边改：插入 / 删除同步发生', 'Search plus update: insert / delete'),
          L('BST、AVL、B 树、B+ 树、哈希', 'BST, AVL, B-tree, B+ tree, hashing'),
          L('必须维护结构不变量', 'Must preserve structural invariants'),
        ].map((line, index) => (
          <text key={line} className="diagram-note" x="670" y={117 + index * 15} textAnchor="middle">{line}</text>
        ))}

        <rect className="diagram-box" x="365" y="182" width="405" height="92" rx="9" />
        <text className="diagram-label" x="567" y="208" textAnchor="middle">
          {L('比较次数 c 的期望：成功与失败分开', 'Expected comparisons c: success and failure separately')}
        </text>
        <text className="diagram-label" x="567" y="236" textAnchor="middle">
          ASL_succ = Σ pᵢ cᵢ · ASL_fail = Σ qⱼ cⱼ
        </text>
        <text className="diagram-note" x="567" y="260" textAnchor="middle">
          {L('概率假设不同，同一个结构的 ASL 就不同', 'Different probability assumptions give a different ASL')}
        </text>

        <rect className="diagram-band" x="30" y="292" width="740" height="66" rx="8" />
        <text className="diagram-label" x="400" y="317" textAnchor="middle">
          {L('查找成功：命中记录；查找失败：确定不存在', 'Success: a record is hit; failure: proven absent')}
        </text>
        <text className="diagram-note" x="400" y="340" textAnchor="middle">
          {L('有序性、索引、哈希函数与平衡性，都是为缩短比较路径而付出的前置条件', 'Order, indexes, hash functions and balance are preconditions paid to shorten comparison paths')}
        </text>
      </svg>
    );
  }

  if (kind === 'static-tree-table') {
    return (
      <svg className="concept-svg" viewBox="0 0 800 380" role="img" aria-label={aria}>
        <rect className="diagram-band" x="20" y="14" width="760" height="36" rx="8" />
        <text className="diagram-label diagram-label-strong" x="400" y="38" textAnchor="middle">
          {L('静态查找表：查询集合固定时，把比较路径做成树', 'A static table: turn comparison paths into a tree when the key set is fixed')}
        </text>

        <rect className="diagram-box" x="30" y="72" width="330" height="236" rx="9" />
        <text className="diagram-label diagram-label-strong" x="195" y="96" textAnchor="middle">
          {L('普通判定树（等权示例）', 'Ordinary decision tree (equal weights)')}
        </text>
        <line className="diagram-line" x1="195" y1="140" x2="115" y2="186" />
        <line className="diagram-line" x1="195" y1="140" x2="275" y2="186" />
        <line className="diagram-line" x1="115" y1="186" x2="75" y2="232" />
        <line className="diagram-line" x1="115" y1="186" x2="155" y2="232" />
        <line className="diagram-line" x1="275" y1="186" x2="235" y2="232" />
        <line className="diagram-line" x1="275" y1="186" x2="315" y2="232" />
        {[
          [195, 140, '45'],
          [115, 186, '27'],
          [275, 186, '63'],
          [75, 232, '18'],
          [155, 232, '36'],
          [235, 232, '54'],
          [315, 232, '72'],
        ].map(([x, y, label]) => (
          <g key={`${x}-${y}`}>
            <circle className="diagram-node" cx={x} cy={y} r="18" />
            <text className="diagram-label" x={x} y={Number(y) + 5} textAnchor="middle">{label}</text>
          </g>
        ))}
        <text className="diagram-note" data-testid="static-tree-asl-notes" x="48" y="276">
          {L('成功比较次数 = 节点层号', 'success cost = node level')}
        </text>
        <text className="diagram-note" x="48" y="298">
          {L('等权：总路径最短 ⇔ ASL 最小', 'equal weights: min total path ⇔ min ASL')}
        </text>

        <rect className="diagram-box" x="380" y="72" width="390" height="112" rx="9" />
        <text className="diagram-label diagram-label-strong" x="575" y="98" textAnchor="middle">
          {L('静态树表的核心量：加权路径长度', 'Core quantity: weighted path length')}
        </text>
        <text className="diagram-label" x="575" y="130" textAnchor="middle">WPL = Σ wᵢ · depthᵢ</text>
        <text className="diagram-note" x="575" y="156" textAnchor="middle">
          {L('次优查找树：不追求全局最优，但构造代价更低', 'near-minimal WPL; cheaper to build')}
        </text>

        <rect className="diagram-box" x="380" y="196" width="390" height="112" rx="9" />
        <text className="diagram-label" x="575" y="222" textAnchor="middle">
          {L('适用条件', 'When it applies')}
        </text>
        {[
          L('查找集合与权值基本固定，插入删除很少', 'Key set and weights are nearly fixed; updates are rare'),
          L('可用判定树 / 次优查找树降低平均比较次数', 'Decision or nearly optimal trees reduce mean comparisons'),
          L('不是动态结构：更新后通常需要重建', 'Not dynamic: an update usually requires rebuilding'),
        ].map((line, index) => (
          <text key={line} className="diagram-note" x="575" y={246 + index * 18} textAnchor="middle">{line}</text>
        ))}
        <rect className="diagram-band" x="30" y="324" width="740" height="38" rx="8" />
        <text className="diagram-label" x="400" y="348" textAnchor="middle">
          {L('静态树表用“一次建树”换“多次查询”；ASL 与具体权值和树形绑定', 'A static tree pays once to build and saves on repeated queries; ASL depends on weights and shape')}
        </text>
      </svg>
    );
  }

  if (kind === 'hashing-basics') {
    return (
      <svg className="concept-svg" viewBox="0 0 800 450" role="img" aria-label={aria}>
        <rect className="diagram-band" x="20" y="14" width="760" height="36" rx="8" />
        <text className="diagram-label diagram-label-strong" x="400" y="38" textAnchor="middle">
          {L('哈希查找：关键字经 h(k) 直接映射到桶，冲突必须显式处理', 'Hashing maps a key through h(k) to a bucket; collisions must be handled explicitly')}
        </text>

        <text className="diagram-note" x="90" y="88" textAnchor="middle">{L('关键字', 'keys')}</text>
        {[['18', 116], ['25', 148], ['32', 180], ['39', 212]].map(([key, y]) => (
          <g key={key}>
            <rect className="diagram-box" x="45" y={Number(y) - 13} width="90" height="26" rx="12" />
            <text className="diagram-label" x="90" y={Number(y) + 5} textAnchor="middle">{key}</text>
          </g>
        ))}
        {[116, 148, 180, 212].map((y) => (
          <line key={y} className="diagram-line" x1="138" y1={y} x2="205" y2={y} />
        ))}
        <rect className="diagram-box diagram-accent" x="205" y="100" width="115" height="126" rx="10" />
        <text className="diagram-label diagram-label-strong" x="262" y="148" textAnchor="middle">h(k)</text>
        <text className="diagram-note" x="262" y="174" textAnchor="middle">{L('例如 k mod 7', 'e.g. k mod 7')}</text>

        <text className="diagram-note" x="475" y="88" textAnchor="middle">{L('桶数组（m = 7）', 'bucket array (m = 7)')}</text>
        {[0, 1, 2, 3, 4, 5, 6].map((slot, index) => {
          const y = 106 + index * 30;
          return (
            <g key={slot} data-bucket-index={slot}>
              <rect className="diagram-box" x="400" y={y} width="150" height="25" rx="4" />
              <text className="diagram-note" x="414" y={y + 17}>{slot}</text>
              {[18, 25, 32, 39].filter((key) => key % 7 === slot).map((key, chain) => (
                <g key={key}>
                  {chain > 0 ? <line className="diagram-line" x1={452 + (chain - 1) * 44} y1={y + 12} x2={460 + (chain - 1) * 44} y2={y + 12} /> : null}
                  <rect className="diagram-box diagram-accent" x={446 + chain * 44} y={y + 3} width="38" height="19" rx="4" />
                  <text className="diagram-label" x={465 + chain * 44} y={y + 17} textAnchor="middle">{key}</text>
                </g>
              ))}
            </g>
          );
        })}

        <rect className="diagram-box" x="585" y="106" width="190" height="104" rx="9" />
        <text className="diagram-label diagram-label-strong" x="680" y="132" textAnchor="middle">{L('冲突', 'Collision')}</text>
        <text className="diagram-note" x="680" y="157" textAnchor="middle">
          {L('不同关键字得到同一地址', 'Different keys reach the same slot')}
        </text>
        <text className="diagram-note" x="680" y="180" textAnchor="middle">
          {L('链地址：拉出链表', 'Chaining: extend a list')}
        </text>
        <text className="diagram-note" x="680" y="201" textAnchor="middle">
          {L('开放定址：按探测序列换槽', 'Open addressing: probe next slot')}
        </text>

        <rect className="diagram-band" data-testid="hashing-note-band" x="45" y="326" width="730" height="94" rx="8" />
        <text className="diagram-label" x="410" y="350" textAnchor="middle">
          α = n / m　·　{L('装填因子越高，冲突与探测越长', 'higher load factor means more collisions and longer probes')}
        </text>
        <text className="diagram-note" x="410" y="374" textAnchor="middle">
          {L('哈希查找的 O(1) 是均匀散列、低装填因子下的期望，不是最坏保证；', 'O(1) hashing is an expected cost under uniform hashing and low load;')}
        </text>
        <text className="diagram-note" x="410" y="396" textAnchor="middle">
          {L('删除开放定址元素还需要墓碑。', 'it is not a worst-case guarantee. Open-addressing deletion needs tombstones.')}
        </text>
      </svg>
    );
  }

  return (
    <svg className="concept-svg" viewBox="0 0 800 400" role="img" aria-label={aria}>
      <rect className="diagram-band" x="20" y="14" width="760" height="36" rx="8" />
      <text className="diagram-label diagram-label-strong" x="400" y="38" textAnchor="middle">
        {L('查找结构没有单一排名：先看前置条件，再看典型与最坏成本', 'No single ranking: check preconditions first, then typical and worst costs')}
      </text>

      {[
        [L('顺序查找', 'Sequential'), L('无序即可', 'any order'), L('O(n)', 'O(n)'), L('更新简单', 'easy update')],
        [L('二分查找', 'Binary'), L('全局有序', 'globally sorted'), L('O(log n)', 'O(log n)'), L('更新需搬移', 'updates shift')],
        [L('分块查找', 'Block'), L('块间有序', 'block maxima ordered'), L('≈O(√n)', '≈O(√n)'), L('只改一块', 'one block')],
        [L('二叉排序树', 'BST'), L('无', 'none'), L('平均 O(log n)', 'avg O(log n)'), L('可能退化', 'may degenerate')],
        [L('AVL', 'AVL'), L('无', 'none'), L('O(log n)', 'O(log n)'), L('旋转维护', 'rotations')],
        [L('B 树', 'B-tree'), L('阶数与平衡', 'order/balance'), L('O(log n)', 'O(log n)'), L('分裂合并', 'split/merge')],
        [L('B+ 树', 'B+ tree'), L('阶数与叶链', 'order/leaf chain'), L('O(log n)', 'O(log n)'), L('范围扫描强', 'range scans')],
        [L('哈希表', 'Hash'), L('均匀散列', 'uniform hash'), L('期望 O(1)', 'expected O(1)'), L('最坏 O(n)', 'worst O(n)')],
        [L('键树', 'Trie'), L('字符关键字', 'character keys'), L('O(L)', 'O(L)'), L('前缀共享', 'prefix sharing')],
      ].map(([name, condition, cost, note], index) => {
        const y = 66 + index * 32;
        return (
          <g key={String(name)}>
            <rect className="diagram-box" x="30" y={y} width="150" height="25" rx="4" />
            <text className="diagram-label" x="105" y={y + 17} textAnchor="middle">{name}</text>
            <rect className="diagram-box" x="195" y={y} width="210" height="25" rx="4" />
            <text className="diagram-note" x="300" y={y + 17} textAnchor="middle">{condition}</text>
            <rect className="diagram-box diagram-accent" x="420" y={y} width="150" height="25" rx="4" />
            <text className="diagram-label" x="495" y={y + 17} textAnchor="middle">{cost}</text>
            <rect className="diagram-box" x="585" y={y} width="180" height="25" rx="4" />
            <text className="diagram-note" x="675" y={y + 17} textAnchor="middle">{note}</text>
          </g>
        );
      })}

      <text className="diagram-note" x="30" y="374" textAnchor="start">
        {L('列：结构 · 前置条件 · 典型查找 · 更新/存储特点；L 为关键字长度', 'Columns: structure · precondition · typical search · update/storage; L = key length')}
      </text>
    </svg>
  );
}
