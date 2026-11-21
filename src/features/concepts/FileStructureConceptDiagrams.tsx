import type { Lang } from '../../i18n/types';
import '../../styles/concepts.css';
import '../../styles/fileStructures.css';

export type FileStructureDiagramKind =
  | 'file-basics'
  | 'sequential-file'
  | 'indexed-file'
  | 'isam-vsam'
  | 'hashed-file'
  | 'multi-table-file'
  | 'inverted-file'
  | 'file-comparison';

/**
 * Static file-organization diagrams. They explain block placement and access
 * paths only; every animated lookup lives in the runnable Chapter 12 courses.
 */
export function FileStructureConceptDiagram({
  kind,
  lang,
}: {
  kind: FileStructureDiagramKind;
  lang: Lang;
}) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const title = (() => {
    switch (kind) {
      case 'file-basics':
        return L('逻辑记录 → 字段 → 文件块：三层对象不要混为一谈', 'Logical record → field → block: three layers, not one array');
      case 'sequential-file':
        return L('顺序文件：块内顺序、块间顺序与当前读取位置', 'Sequential file: in-block order, block order and current position');
      case 'indexed-file':
        return L('索引文件：索引项先定位块，再在块内确认记录', 'Indexed file: an entry locates the block, then the record is confirmed inside');
      case 'isam-vsam':
        return L('ISAM 的溢出链 与 VSAM 的索引—顺序数据分层', 'ISAM overflow chains and VSAM index—sequence-data layers');
      case 'hashed-file':
        return L('散列文件：关键字 → 桶 → 桶内/溢出链（不保持有序）', 'Hashed file: key → bucket → in-bucket/overflow chain (no key order)');
      case 'multi-table-file':
        return L('多重表：同一条记录同时挂在多条次关键字链上', 'Multilist: one record belongs to several secondary-key chains');
      case 'inverted-file':
        return L('倒排文件：关键字 → 记录 ID 列表 → 集合运算 → 原记录', 'Inverted file: term → posting list → set operation → original records');
      default:
        return L('按查询形态选择文件组织：点查、范围、多关键字各有代价', 'Choose by query shape: point, range and multi-key queries have different costs');
    }
  })();

  const arrow = (id: string) => (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" className="file-concept-arrow-head" />
      </marker>
    </defs>
  );

  if (kind === 'file-basics') {
    return (
      <svg className="concept-svg file-concept-svg" viewBox="0 0 960 520" role="img" aria-label={title}>
        {arrow('file-arrow-basics')}
        <text className="diagram-label diagram-label-strong" x="28" y="30">{title}</text>
        <text className="diagram-note" x="932" y="30" textAnchor="end">{L('教学模型：不实现操作系统文件系统', 'teaching model: not an OS file system')}</text>

        <rect className="diagram-band" x="24" y="56" width="404" height="210" rx="12" />
        <text className="diagram-label" x="44" y="82">{L('逻辑层：文件由同类记录组成', 'Logical layer: a file is a set of records')}</text>
        <rect className="diagram-cell" x="44" y="98" width="360" height="38" rx="7" />
        <text className="diagram-node-text" x="224" y="122" textAnchor="middle">{L('文件：学生记录文件', 'File: student records')}</text>
        {[0, 1, 2].map((row) => (
          <g key={row}>
            <rect className={row === 0 ? 'diagram-chip diagram-accent' : 'diagram-chip'} x="44" y={150 + row * 34} width="360" height="28" rx="5" />
            <text className="diagram-node-text" x="224" y={168 + row * 34} textAnchor="middle">
              {L(['记录 R1：101 | A | X', '记录 R2：102 | B | Y', '记录 R3：103 | C | X'][row],
                ['record R1: 101 | A | X', 'record R2: 102 | B | Y', 'record R3: 103 | C | X'][row])}
            </text>
          </g>
        ))}
        <text className="diagram-note" x="44" y="250">{L('字段：ID（主关键字） | 姓名 | 类别（次关键字）', 'fields: ID (primary key) | name | category (secondary key)')}</text>

        <path className="diagram-line" d="M432 160 C476 160, 486 160, 524 160" markerEnd="url(#file-arrow-basics)" />
        <text className="diagram-note" x="478" y="146" textAnchor="middle">{L('按块写入', 'write by block')}</text>

        <rect className="diagram-band" x="528" y="56" width="408" height="210" rx="12" />
        <text className="diagram-label" x="548" y="82">{L('物理层：外存按文件块传输', 'Physical layer: external storage moves blocks')}</text>
        {['块 B0', '块 B1', '块 B2'].map((label, index) => (
          <g key={label}>
            <rect className={index === 1 ? 'diagram-chip diagram-accent' : 'diagram-chip'} x="548" y={96 + index * 46} width="368" height="38" rx="6" />
            <text className="diagram-note" x="566" y={120 + index * 46}>{label}</text>
            <text className="diagram-node-text" x="742" y={120 + index * 46} textAnchor="middle">
              {L(['101,102', '103', '空闲空间'][index], ['101,102', '103', 'free space'][index])}
            </text>
          </g>
        ))}
        <text className="diagram-note" x="548" y="244">{L('块是读写单位；一条逻辑记录通常完整落在一块内', 'a block is the transfer unit; a logical record usually sits inside one block')}</text>

        <rect className="diagram-band" x="24" y="294" width="912" height="92" rx="12" />
        <text className="diagram-label" x="44" y="318">{L('关键字与访问路径', 'Keys and access paths')}</text>
        <rect className="diagram-chip diagram-accent" x="44" y="332" width="196" height="34" rx="6" />
        <text className="diagram-node-text" x="142" y="354" textAnchor="middle">{L('主关键字：唯一识别一条记录', 'primary key: unique record')}</text>
        <rect className="diagram-chip" x="258" y="332" width="220" height="34" rx="6" />
        <text className="diagram-node-text" x="368" y="354" textAnchor="middle">{L('次关键字：可能对应多条记录', 'secondary key: may match many')}</text>
        <rect className="diagram-cell" x="496" y="324" width="420" height="46" rx="6" />
        <text className="diagram-note" x="706" y="345" textAnchor="middle">{L('访问路径：顺序扫描 / 索引定位 / 哈希桶 / 链与倒排表', 'access path: scan / index / hash bucket / chains and postings')}</text>
        <text className="diagram-note" x="706" y="362" textAnchor="middle">{L('组织方式决定先读哪个块，而不是只决定记录放在哪里', 'organization decides which block to read first, not just placement')}</text>

        <text className="diagram-label" x="28" y="430">{L('同一条记录可以在不同组织中出现多次索引/链接，但原始记录只有一份', 'One record may have several index/link representations, but only one original record')}</text>
        <text className="diagram-note" x="28" y="454">{L('索引、倒排表、溢出链都是文件的一部分，更新时要一起维护。', 'Indexes, posting lists and overflow chains are part of the file and must be maintained together.')}</text>
      </svg>
    );
  }

  if (kind === 'sequential-file') {
    return (
      <svg className="concept-svg file-concept-svg" viewBox="0 0 960 480" role="img" aria-label={title}>
        {arrow('file-arrow-seq')}
        <text className="diagram-label diagram-label-strong" x="28" y="30">{title}</text>
        <text className="diagram-note" x="932" y="30" textAnchor="end">{L('块内/块间有序才能剪枝', 'block order enables pruning')}</text>

        <text className="diagram-label" x="28" y="62">{L('有序顺序文件（按主关键字 101…108）', 'Ordered sequential file (primary keys 101…108)')}</text>
        {[
          ['B0', '101,102,103'],
          ['B1', '104,105,106'],
          ['B2', '107,108'],
        ].map(([block, keys], index) => (
          <g key={block}>
            <rect className={index === 1 ? 'diagram-band diagram-accent' : 'diagram-band'} x={28 + index * 300} y="78" width="276" height="90" rx="10" />
            <text className="diagram-label" x={42 + index * 300} y="102">{block}</text>
            <text className="diagram-node-text" x={166 + index * 300} y="132" textAnchor="middle">{keys}</text>
            <text className="diagram-note" x={166 + index * 300} y="154" textAnchor="middle">
              {L(['上界 103', '上界 106', '上界 108'][index], ['bound 103', 'bound 106', 'bound 108'][index])}
            </text>
          </g>
        ))}
        <path className="diagram-line" d="M28 194 L316 194" markerEnd="url(#file-arrow-seq)" />
        <text className="diagram-note" x="30" y="214">{L('当前读取位置：B1 + 块内第 2 条（关键字 105）', 'current position: B1 + second record (key 105)')}</text>
        <rect className="diagram-chip diagram-accent" x="666" y="78" width="266" height="90" rx="10" />
        <text className="diagram-label" x="799" y="103" textAnchor="middle">{L('范围扫描 [104,107]', 'range scan [104,107]')}</text>
        <text className="diagram-note" x="799" y="127" textAnchor="middle">{L('定位 104 起点 → 连续读 B1、B2', 'locate 104 → read B1 then B2')}</text>
        <text className="diagram-note" x="799" y="147" textAnchor="middle">{L('不能只返回第一条命中', 'never stop at the first hit')}</text>

        <text className="diagram-label" x="28" y="258">{L('无序顺序文件（按插入顺序连续存放）', 'Unordered sequential file (contiguous in insertion order)')}</text>
        {['B0：105,101,108', 'B1：102,107,104', 'B2：103,106'].map((keys, index) => (
          <g key={keys}>
            <rect className="diagram-band" x={28 + index * 300} y="274" width="276" height="58" rx="9" />
            <text className="diagram-node-text" x={166 + index * 300} y="307" textAnchor="middle">{keys}</text>
          </g>
        ))}
        <rect className="diagram-cell" x="666" y="274" width="266" height="78" rx="9" />
        <text className="diagram-label" x="799" y="297" textAnchor="middle">{L('按关键字找 106：只能扫描', 'find 106 by key: scan required')}</text>
        <text className="diagram-note" x="799" y="319" textAnchor="middle">{L('块上界不能帮助剪枝', 'block bounds cannot prune')}</text>
        <text className="diagram-note" x="799" y="337" textAnchor="middle">{L('尾部追加便宜，但失去范围能力', 'cheap append, but no range capability')}</text>

        <rect className="diagram-band" x="28" y="380" width="904" height="72" rx="10" />
        <text className="diagram-label" x="48" y="404">{L('代价要点', 'Cost notes')}</text>
        <text className="diagram-note" x="48" y="425">{L('有序：插入可能后移/分裂块并更新边界；查找与范围扫描受益。', 'Ordered: insert may shift/split blocks and update bounds; lookup and ranges benefit.')}</text>
        <text className="diagram-note" x="48" y="443">{L('无序：追加简单；按关键字查找必须检查到命中或文件结束。', 'Unordered: append is simple; key lookup scans to a hit or EOF.')}</text>
      </svg>
    );
  }

  if (kind === 'indexed-file') {
    return (
      <svg className="concept-svg file-concept-svg" viewBox="0 0 960 540" role="img" aria-label={title}>
        {arrow('file-arrow-index')}
        <text className="diagram-label diagram-label-strong" x="28" y="30">{title}</text>
        <text className="diagram-note" x="932" y="30" textAnchor="end">{L('索引项与数据块地址必须一致', 'entries must match data-block addresses')}</text>

        <rect className="diagram-band" x="24" y="54" width="524" height="178" rx="11" />
        <text className="diagram-label" x="44" y="78">{L('稠密索引：每条记录一个索引项', 'Dense index: one entry per record')}</text>
        {[
          ['101', '→ B0'],
          ['102', '→ B0'],
          ['…', '…'],
          ['106', '→ B1'],
          ['107', '→ B2'],
        ].map(([key, target], index) => (
          <g key={`${key}-${target}`}>
            <rect className={key === '106' ? 'diagram-chip diagram-accent' : 'diagram-chip'} x={44 + index * 100} y="94" width="88" height="34" rx="6" />
            <text className="diagram-node-text" x={88 + index * 100} y="116" textAnchor="middle">{key}</text>
            <text className="diagram-note" x={88 + index * 100} y="148" textAnchor="middle">{target}</text>
          </g>
        ))}
        <text className="diagram-note" x="44" y="190">{L('索引项数量 O(n)；可直接确认记录所在块。', 'O(n) entries; directly confirms the record’s block.')}</text>
        <text className="diagram-note" x="44" y="210">{L('多级索引：对索引块再建一层索引；上层若常驻内存可减少外存索引读。', 'Multilevel index: index the index blocks; memory-resident upper levels reduce external reads.')}</text>

        <rect className="diagram-band" x="572" y="54" width="364" height="178" rx="11" />
        <text className="diagram-label" x="592" y="78">{L('稀疏索引：每块只保留首键/上界', 'Sparse index: one start key/bound per block')}</text>
        {[
          ['101', '→ B0'],
          ['104', '→ B1'],
          ['107', '→ B2'],
        ].map(([key, target], index) => (
          <g key={key}>
            <rect className={key === '104' ? 'diagram-chip diagram-accent' : 'diagram-chip'} x="592" y={94 + index * 40} width="96" height="30" rx="6" />
            <text className="diagram-node-text" x="640" y={114 + index * 40} textAnchor="middle">{key}</text>
            <text className="diagram-note" x="704" y={114 + index * 40}>{target}</text>
          </g>
        ))}
        <text className="diagram-note" x="592" y="214">{L('选“不大于目标的最后一项”，再块内扫描。', 'Choose the last entry not above the target, then scan the block.')}</text>

        <text className="diagram-label" x="28" y="268">{L('数据文件：索引项指向块，块内仍有真实记录', 'Data file: entries point to blocks that still hold real records')}</text>
        {[
          ['B0', '101 | 102 | 103'],
          ['B1', '104 | 105 | 106'],
          ['B2', '107 | 108'],
        ].map(([block, keys], index) => (
          <g key={block}>
            <rect className={index === 1 ? 'diagram-band diagram-accent' : 'diagram-band'} x={28 + index * 300} y="284" width="276" height="82" rx="9" />
            <text className="diagram-label" x={44 + index * 300} y="309">{block}</text>
            <text className="diagram-node-text" x={166 + index * 300} y="338" textAnchor="middle">{keys}</text>
            <text className="diagram-note" x={166 + index * 300} y="357" textAnchor="middle">{L('块内仍需比较关键字', 'keys still compared inside')}</text>
          </g>
        ))}
        <path className="diagram-line" d="M640 128 C640 240, 478 240, 478 282" markerEnd="url(#file-arrow-index)" />
        <text className="diagram-note" x="600" y="244">{L('稀疏索引命中 B1 → 读块 → 比较 104/105/106', 'sparse entry selects B1 → read → compare 104/105/106')}</text>

        <rect className="diagram-band" x="28" y="398" width="904" height="112" rx="10" />
        <text className="diagram-label" x="48" y="422">{L('查找路径与维护', 'Lookup path and maintenance')}</text>
        <text className="diagram-note" x="48" y="445">{L('① 检查索引项 → ② 选定数据块 → ③ 读块并块内比较 → ④ 命中/失败。', '① probe entries → ② select a block → ③ read and compare → ④ hit/miss.')}</text>
        <text className="diagram-note" x="48" y="465">{L('插入/删除：稠密索引增删记录项；稀疏索引更新块首键或边界；块分裂会改变索引结构。', 'Insert/delete: dense changes record entries; sparse updates start keys or bounds; splits change the index.')}</text>
        <text className="diagram-note" x="48" y="485">{L('本课程模拟一级索引；多级索引只作结构说明，不声称已有独立播放器。', 'The course models a one-level index; multilevel indexing is explained structurally, not claimed as another player.')}</text>
      </svg>
    );
  }

  if (kind === 'isam-vsam') {
    return (
      <svg className="concept-svg file-concept-svg" viewBox="0 0 960 600" role="img" aria-label={title}>
        {arrow('file-arrow-isam')}
        <text className="diagram-label diagram-label-strong" x="28" y="28">{title}</text>
        <text className="diagram-note" x="932" y="28" textAnchor="end">{L('相对静态 vs B+ 树式动态索引', 'relatively static vs B+ tree-style index')}</text>

        <rect className="diagram-band" x="24" y="48" width="912" height="238" rx="12" />
        <text className="diagram-label" x="44" y="72">{L('ISAM：索引上界 → 有序主块 → 专属溢出链 → 定期重组', 'ISAM: index bounds → ordered main blocks → private overflow chains → reorganize')}</text>
        <rect className="diagram-cell" x="44" y="86" width="238" height="72" rx="8" />
        <text className="diagram-label" x="163" y="110" textAnchor="middle">{L('索引层（稀疏上界）', 'Index layer (sparse bounds)')}</text>
        <text className="diagram-note" x="163" y="132" textAnchor="middle">{L('B0: 103   B1: 106', 'B0: 103   B1: 106')}</text>
        <text className="diagram-note" x="163" y="150" textAnchor="middle">{L('B2: 108（最后一块）', 'B2: 108 (last block)')}</text>
        {[
          ['主块 B0', '101,102,103'],
          ['主块 B1', '104,105,106'],
          ['主块 B2', '107,108'],
        ].map(([label, records], index) => (
          <g key={label}>
            <rect className={index === 1 ? 'diagram-chip diagram-accent' : 'diagram-chip'} x="314" y={86 + index * 54} width="244" height="42" rx="7" />
            <text className="diagram-label" x="328" y={111 + index * 54}>{label}</text>
            <text className="diagram-node-text" x="486" y={111 + index * 54} textAnchor="middle">{records}</text>
          </g>
        ))}
        <path className="diagram-line" d="M282 166 C296 166, 298 166, 312 166" markerEnd="url(#file-arrow-isam)" />
        <text className="diagram-note" x="640" y="106">{L('插入 109 到 B2：主块满', 'insert 109 into B2: block full')}</text>
        <rect className="diagram-chip diagram-accent" x="640" y="118" width="124" height="40" rx="6" />
        <text className="diagram-node-text" x="702" y="143" textAnchor="middle">O0：109</text>
        <path className="diagram-line" d="M558 219 L638 138" markerEnd="url(#file-arrow-isam)" />
        <text className="diagram-note" x="640" y="178">{L('溢出记录仍属于 B2', 'overflow still belongs to B2')}</text>
        <text className="diagram-note" x="640" y="198">{L('查找：索引选块 → 扫主块 → 沿链继续', 'lookup: select block → scan → follow chain')}</text>
        <text className="diagram-note" x="640" y="218">{L('链过长 → 重组，把溢出记录回填主区', 'long chain → reorganize overflow back into main area')}</text>
        <text className="diagram-note" x="640" y="238">{L('索引相对静态：没有 B+ 树自动分裂/平衡', 'relatively static: no B+ tree splits/balancing')}</text>
        <text className="diagram-note" x="44" y="268">{L('主区内部有序；溢出链可能破坏块间顺序，因此 ISAM 适合相对静态文件。', 'Main blocks are ordered; overflow can disrupt block order, so ISAM suits relatively static files.')}</text>

        <rect className="diagram-band" x="24" y="300" width="912" height="248" rx="12" />
        <text className="diagram-label" x="44" y="324">{L('VSAM（教材模型）：索引区域定位顺序数据区域，支持连续范围读取', 'VSAM (textbook model): index region locates sequence data for contiguous ranges')}</text>
        <rect className="diagram-band diagram-accent" x="44" y="340" width="380" height="148" rx="10" />
        <text className="diagram-label" x="234" y="364" textAnchor="middle">{L('索引区域（多层索引）', 'Index region (multilevel index)')}</text>
        <rect className="diagram-cell" x="200" y="378" width="68" height="28" rx="5" />
        <text className="diagram-node-text" x="234" y="397" textAnchor="middle">104</text>
        <rect className="diagram-cell" x="98" y="422" width="68" height="28" rx="5" />
        <text className="diagram-node-text" x="132" y="441" textAnchor="middle">101</text>
        <rect className="diagram-cell" x="232" y="422" width="68" height="28" rx="5" />
        <text className="diagram-node-text" x="266" y="441" textAnchor="middle">106</text>
        <rect className="diagram-cell" x="338" y="422" width="68" height="28" rx="5" />
        <text className="diagram-node-text" x="372" y="441" textAnchor="middle">108</text>
        <path className="diagram-line" d="M222 406 L140 420" markerEnd="url(#file-arrow-isam)" />
        <path className="diagram-line" d="M246 406 L262 420" markerEnd="url(#file-arrow-isam)" />
        <path className="diagram-line" d="M256 406 L368 420" markerEnd="url(#file-arrow-isam)" />
        <text className="diagram-note" x="234" y="470" textAnchor="middle">{L('与 B+ 树相近：多层索引、叶子层记录访问、范围扫描', 'B+ tree-like: levels, leaf access, range scans')}</text>
        <text className="diagram-note" x="234" y="486" textAnchor="middle">{L('但 VSAM 是文件组织，不等于“现代 B+ 树”的同义词', 'but VSAM is a file organization, not a synonym for a modern B+ tree')}</text>

        <path className="diagram-line" d="M426 414 C462 414, 462 414, 496 414" markerEnd="url(#file-arrow-isam)" />
        <rect className="diagram-band" x="500" y="340" width="412" height="148" rx="10" />
        <text className="diagram-label" x="520" y="364">{L('顺序数据区域（按关键字顺序）', 'Sequence data region (key order)')}</text>
        {[
          '101 | 102 | 103 | 104',
          '105 | 106 | 107 | 108',
        ].map((records, index) => (
          <g key={records}>
            <rect className="diagram-chip" x="520" y={378 + index * 38} width="368" height="28" rx="5" />
            <text className="diagram-node-text" x="704" y={397 + index * 38} textAnchor="middle">{records}</text>
          </g>
        ))}
        <path className="diagram-line" d="M566 414 L590 414" markerEnd="url(#file-arrow-isam)" />
        <text className="diagram-note" x="520" y="458">{L('范围 [104,107]：索引定位 104 → 顺序读到 107', 'range [104,107]: locate 104 → read sequentially to 107')}</text>
        <text className="diagram-note" x="520" y="476">{L('历史实现的控制区间/区域不在此完整复刻', 'historical control intervals/areas are not fully reproduced')}</text>
      </svg>
    );
  }

  if (kind === 'hashed-file') {
    return (
      <svg className="concept-svg file-concept-svg" viewBox="0 0 960 520" role="img" aria-label={title}>
        {arrow('file-arrow-hash')}
        <text className="diagram-label diagram-label-strong" x="28" y="30">{title}</text>
        <text className="diagram-note" x="932" y="30" textAnchor="end">{L('桶/块 ≠ 内存哈希槽', 'bucket/block ≠ memory hash slot')}</text>

        <rect className="diagram-band" x="24" y="56" width="270" height="182" rx="11" />
        <text className="diagram-label" x="44" y="80">{L('关键字输入', 'Key input')}</text>
        {['101', '102', '103', '104', '105'].map((key, index) => (
          <g key={key}>
            <rect className={index === 3 ? 'diagram-chip diagram-accent' : 'diagram-chip'} x={44 + (index % 3) * 70} y={96 + Math.floor(index / 3) * 46} width="58" height="32" rx="5" />
            <text className="diagram-node-text" x={73 + (index % 3) * 70} y={117 + Math.floor(index / 3) * 46} textAnchor="middle">{key}</text>
          </g>
        ))}
        <text className="diagram-note" x="44" y="212">{L('哈希函数把关键字映射到桶号', 'a hash function maps keys to bucket numbers')}</text>

        <rect className="diagram-band diagram-accent" x="330" y="56" width="240" height="182" rx="11" />
        <text className="diagram-label" x="450" y="82" textAnchor="middle">{L('h(k) = k mod 3', 'h(k) = k mod 3')}</text>
        <text className="diagram-node-text" x="450" y="132" textAnchor="middle">101 → B2</text>
        <text className="diagram-node-text" x="450" y="162" textAnchor="middle">102 → B0</text>
        <text className="diagram-node-text" x="450" y="192" textAnchor="middle">105 → B0</text>
        <text className="diagram-note" x="450" y="219" textAnchor="middle">{L('不同关键字可落到同一桶', 'different keys may share a bucket')}</text>

        <path className="diagram-line" d="M574 148 C606 148, 606 148, 636 148" markerEnd="url(#file-arrow-hash)" />
        <text className="diagram-note" x="606" y="134" textAnchor="middle">{L('直接定位桶', 'direct bucket')}</text>

        <rect className="diagram-band" x="640" y="56" width="296" height="182" rx="11" />
        <text className="diagram-label" x="660" y="80">{L('主桶（每桶可含多个块）', 'Primary buckets (several blocks per bucket)')}</text>
        {[
          ['B0', '102 | 105'],
          ['B1', '104 | 107'],
          ['B2', '101 | 103'],
        ].map(([bucket, records], index) => (
          <g key={bucket}>
            <rect className={bucket === 'B0' ? 'diagram-chip diagram-accent' : 'diagram-chip'} x="660" y={94 + index * 44} width="256" height="34" rx="6" />
            <text className="diagram-label" x="676" y={116 + index * 44}>{bucket}</text>
            <text className="diagram-node-text" x="820" y={116 + index * 44} textAnchor="middle">{records}</text>
          </g>
        ))}
        <text className="diagram-note" x="660" y="224">{L('桶满后：额外记录进入溢出区', 'bucket full: extra records enter overflow')}</text>

        <rect className="diagram-band" x="24" y="270" width="912" height="102" rx="11" />
        <text className="diagram-label" x="44" y="294">{L('冲突与溢出链', 'Collision and overflow chain')}</text>
        <rect className="diagram-chip diagram-accent" x="44" y="306" width="132" height="38" rx="6" />
        <text className="diagram-node-text" x="110" y="330" textAnchor="middle">{L('B0 主桶', 'B0 primary')}</text>
        <path className="diagram-line" d="M180 325 L226 325" markerEnd="url(#file-arrow-hash)" />
        <rect className="diagram-chip" x="230" y="306" width="132" height="38" rx="6" />
        <text className="diagram-node-text" x="296" y="330" textAnchor="middle">{L('溢出块 O0', 'overflow O0')}</text>
        <path className="diagram-line" d="M364 325 L410 325" markerEnd="url(#file-arrow-hash)" />
        <rect className="diagram-chip" x="414" y="306" width="132" height="38" rx="6" />
        <text className="diagram-node-text" x="480" y="330" textAnchor="middle">{L('溢出块 O1', 'overflow O1')}</text>
        <text className="diagram-note" x="572" y="316">{L('查找 105：计算桶 → 读主桶 → 必要时沿链', 'find 105: hash → read primary → follow chain if needed')}</text>
        <text className="diagram-note" x="572" y="336">{L('链长 e 时，至少 e 次额外块访问', 'with chain length e, at least e extra block reads')}</text>
        <text className="diagram-note" x="572" y="356">{L('装填因子高 → 溢出链长 → 点查退化', 'high load factor → long chains → degraded lookup')}</text>

        <rect className="diagram-band" x="24" y="396" width="912" height="94" rx="10" />
        <text className="diagram-label" x="44" y="420">{L('为什么不适合有序范围查询', 'Why ordered range queries are unsupported')}</text>
        <text className="diagram-note" x="44" y="443">{L('h(k) 不保证相邻关键字进入相邻桶；范围 [lo, hi] 无法从某个桶开始连续读完。', 'h(k) does not keep adjacent keys in adjacent buckets; a range cannot start at one bucket and read contiguously.')}</text>
        <text className="diagram-note" x="44" y="463">{L('可选方案：扫描全部桶，或另建有序索引；本课程不实现完整搜索系统。', 'Options: scan every bucket or add an ordered index; this course implements no full search system.')}</text>
      </svg>
    );
  }

  if (kind === 'multi-table-file') {
    return (
      <svg className="concept-svg file-concept-svg" viewBox="0 0 960 520" role="img" aria-label={title}>
        {arrow('file-arrow-multi')}
        <text className="diagram-label diagram-label-strong" x="28" y="30">{title}</text>
        <text className="diagram-note" x="932" y="30" textAnchor="end">{L('链指针属于记录，不是普通单链表', 'links live in records, not an ordinary list')}</text>

        <rect className="diagram-band" x="24" y="54" width="424" height="208" rx="11" />
        <text className="diagram-label" x="44" y="78">{L('记录节点：每条记录携带多个链指针', 'Record nodes: each record carries several links')}</text>
        {[
          ['R1', '101 | A | X | 东', '类别X·next→R3 | 地区东·next→R2'],
          ['R2', '102 | B | Y | 东', '类别Y·next→∅ | 地区东·next→∅'],
          ['R3', '103 | C | X | 西', '类别X·next→∅ | 地区西·next→∅'],
        ].map(([id, record, links], index) => (
          <g key={id}>
            <rect className={index === 0 ? 'diagram-chip diagram-accent' : 'diagram-chip'} x="44" y={96 + index * 54} width="384" height="42" rx="7" />
            <text className="diagram-label" x="60" y={121 + index * 54}>{id}</text>
            <text className="diagram-node-text" x="230" y={121 + index * 54} textAnchor="middle">{record}</text>
            <text className="diagram-note" x="412" y={121 + index * 54} textAnchor="end">{links}</text>
          </g>
        ))}
        <text className="diagram-note" x="44" y="248">{L('记录 R1 同时属于“类别 X”链和“地区 东”链。', 'R1 belongs to both category-X and region-East chains.')}</text>

        <rect className="diagram-band" x="476" y="54" width="460" height="208" rx="11" />
        <text className="diagram-label" x="496" y="78">{L('链头入口：每个不同字段值一个入口', 'Chain heads: one entry per distinct field value')}</text>
        {[
          ['类别 X', 'R1 → R3'],
          ['类别 Y', 'R2'],
          ['地区 东', 'R1 → R2'],
          ['地区 西', 'R3'],
        ].map(([key, chain], index) => (
          <g key={key}>
            <rect className="diagram-chip" x="496" y={92 + index * 38} width="92" height="28" rx="5" />
            <text className="diagram-node-text" x="542" y={111 + index * 38} textAnchor="middle">{key}</text>
            <text className="diagram-note" x="604" y={111 + index * 38}>{chain}</text>
          </g>
        ))}
        <text className="diagram-note" x="496" y="250">{L('按类别 X 查询：沿 X 链读 R1、R3；若要地区东，再检查成员。', 'Query category X: walk X chain R1, R3; for region East, test membership.')}</text>

        <path className="diagram-line" d="M144 136 L144 178" markerEnd="url(#file-arrow-multi)" />
        <text className="diagram-note" x="158" y="164">{L('类别 X 链', 'category X chain')}</text>
        <path className="diagram-line" d="M258 136 L258 312" markerEnd="url(#file-arrow-multi)" />
        <text className="diagram-note" x="272" y="300">{L('地区东链', 'region East chain')}</text>

        <rect className="diagram-band" x="24" y="284" width="428" height="92" rx="10" />
        <text className="diagram-label" x="44" y="308">{L('查询：单条件遍历', 'Query: single-condition traversal')}</text>
        <text className="diagram-note" x="44" y="331">{L('取链头 → 沿 next 读记录 → 直到链尾；结果按链序出现。', 'Take the head → follow next → until null; results appear in chain order.')}</text>
        <text className="diagram-note" x="44" y="351">{L('多个条件时，需要在链上过滤，或沿另一条链求交。', 'With several conditions, filter along one chain or intersect with another.')}</text>

        <rect className="diagram-band" x="476" y="284" width="460" height="92" rx="10" />
        <text className="diagram-label" x="496" y="308">{L('维护：一条记录属于多条链', 'Maintenance: one record, several chains')}</text>
        <text className="diagram-note" x="496" y="331">{L('插入：接到所有相关链；删除：从每条链摘除，不能只断一条。', 'Insert into every related chain; delete from every chain, not just one.')}</text>
        <text className="diagram-note" x="496" y="351">{L('链头数量取决于不同字段值数，不取决于记录数。', 'Head count depends on distinct values, not record count.')}</text>

        <text className="diagram-label" x="28" y="412">{L('与倒排文件的选择', 'Choice against an inverted file')}</text>
        <text className="diagram-note" x="28" y="436">{L('多重表：记录携带指针，按单关键字遍历自然；更新分散。倒排：记录 ID 集中，多关键字集合运算方便；更新多个表。', 'Multilist: pointers in records, natural single-key traversal; distributed updates. Inverted: centralized ids, easy set operations; update several lists.')}</text>
        <text className="diagram-note" x="28" y="458">{L('两者都不是普通链表或邻接表：这里表达的是记录对关键字值的成员关系。', 'Neither is an ordinary list or adjacency list: these links express record membership in key values.')}</text>
      </svg>
    );
  }

  if (kind === 'inverted-file') {
    return (
      <svg className="concept-svg file-concept-svg" viewBox="0 0 960 580" role="img" aria-label={title}>
        {arrow('file-arrow-inv')}
        <text className="diagram-label diagram-label-strong" x="28" y="30">{title}</text>
        <text className="diagram-note" x="932" y="30" textAnchor="end">{L('关键字已分好词；结果回到原记录', 'pre-segmented terms; results map back to records')}</text>

        <rect className="diagram-band" x="24" y="54" width="300" height="206" rx="11" />
        <text className="diagram-label" x="44" y="78">{L('原记录与关键字集合', 'Original records and term sets')}</text>
        {[
          ['R1', '数据结构, 算法'],
          ['R2', '算法, 排序'],
          ['R3', '数据结构, 排序'],
          ['R4', '索引, 算法'],
        ].map(([id, terms], index) => (
          <g key={id}>
            <rect className="diagram-chip" x="44" y={92 + index * 38} width="260" height="30" rx="5" />
            <text className="diagram-label" x="60" y={112 + index * 38}>{id}</text>
            <text className="diagram-node-text" x="260" y={112 + index * 38} textAnchor="end">{terms}</text>
          </g>
        ))}
        <text className="diagram-note" x="44" y="250">{L('构建：逐记录扫描，把记录 ID 追加到每个词的倒排表。', 'Build: scan records and append the record id to each term’s list.')}</text>

        <path className="diagram-line" d="M328 158 C352 158, 352 158, 376 158" markerEnd="url(#file-arrow-inv)" />
        <text className="diagram-note" x="352" y="144" textAnchor="middle">{L('建表', 'build')}</text>

        <rect className="diagram-band diagram-accent" x="380" y="54" width="338" height="206" rx="11" />
        <text className="diagram-label" x="400" y="78">{L('倒排表：关键字 → 记录 ID', 'Posting lists: term → record ids')}</text>
        {[
          ['数据结构', 'R1, R3'],
          ['算法', 'R1, R2, R4'],
          ['排序', 'R2, R3'],
          ['索引', 'R4'],
        ].map(([term, postings], index) => (
          <g key={term}>
            <rect className={term === '算法' || term === '排序' ? 'diagram-chip diagram-accent' : 'diagram-chip'} x="400" y={92 + index * 38} width="298" height="30" rx="5" />
            <text className="diagram-label" x="416" y={112 + index * 38}>{term}</text>
            <text className="diagram-node-text" x="682" y={112 + index * 38} textAnchor="end">{postings}</text>
          </g>
        ))}
        <text className="diagram-note" x="400" y="250">{L('一个关键字可对应多个记录；缺失关键字得到空表。', 'One term may have many records; a missing term has an empty list.')}</text>

        <rect className="diagram-band" x="734" y="54" width="202" height="206" rx="11" />
        <text className="diagram-label" x="754" y="78">{L('查询集合运算', 'Query set operations')}</text>
        <rect className="diagram-cell" x="754" y="92" width="162" height="44" rx="6" />
        <text className="diagram-label" x="835" y="111" textAnchor="middle">{L('AND：交集', 'AND: intersection')}</text>
        <text className="diagram-note" x="835" y="128" textAnchor="middle">{L('算法 ∩ 排序 = R2', '算法 ∩ 排序 = R2')}</text>
        <rect className="diagram-cell" x="754" y="146" width="162" height="44" rx="6" />
        <text className="diagram-label" x="835" y="165" textAnchor="middle">{L('OR：并集', 'OR: union')}</text>
        <text className="diagram-note" x="835" y="182" textAnchor="middle">{L('去重后 R1,R2,R3,R4', 'dedupe → R1,R2,R3,R4')}</text>
        <text className="diagram-note" x="754" y="218">{L('结果按原记录顺序过滤。', 'Filter results in original record order.')}</text>
        <text className="diagram-note" x="754" y="238">{L('本课程不做中文分词。', 'No Chinese tokenizer here.')}</text>

        <path className="diagram-line" d="M548 264 L548 300" markerEnd="url(#file-arrow-inv)" />
        <text className="diagram-note" x="562" y="286">{L('记录 ID 回到原记录', 'ids map back to records')}</text>

        <rect className="diagram-band" x="24" y="306" width="912" height="102" rx="10" />
        <text className="diagram-label" x="44" y="330">{L('交集与并集的真实规则', 'Real rules for intersection and union')}</text>
        <text className="diagram-note" x="44" y="353">{L('AND：第一张表不是最终答案，必须与后续表继续求交；任一张为空则结果为空。', 'AND: the first list is not final; intersect with later lists; any empty list empties the result.')}</text>
        <text className="diagram-note" x="44" y="373">{L('OR：所有表求并后去重；同一条记录不能返回两次。', 'OR: union all lists and deduplicate; one record is never returned twice.')}</text>
        <text className="diagram-note" x="44" y="393">{L('缺失词：AND 结果为 ∅；OR 不增加记录。', 'Missing term: AND yields ∅; OR adds nothing.')}</text>

        <rect className="diagram-band" x="24" y="426" width="912" height="126" rx="10" />
        <text className="diagram-label" x="44" y="450">{L('维护与代价', 'Maintenance and cost')}</text>
        <text className="diagram-note" x="44" y="473">{L('插入记录：追加到该记录所有关键字对应的倒排表；删除：从所有相关表摘除。', 'Insert: append to every term list of the record; delete: remove from every related list.')}</text>
        <text className="diagram-note" x="44" y="493">{L('空间：倒排表保存记录 ID；关键字多、记录共享多时表会变长。', 'Space: posting lists store ids; many terms and shared records lengthen tables.')}</text>
        <text className="diagram-note" x="44" y="513">{L('与多重表区别：倒排集中存 ID，多重表把链指针分散在记录中。', 'Versus a multilist: inverted lists centralize ids; a multilist distributes pointers in records.')}</text>
        <text className="diagram-note" x="44" y="535">{L('本课程不实现全文搜索、排名、分词或数据库 SQL。', 'This course implements no full-text search, ranking, tokenizer or SQL.')}</text>
      </svg>
    );
  }

  return (
    <svg className="concept-svg file-concept-svg" viewBox="0 0 960 580" role="img" aria-label={title}>
      {arrow('file-arrow-compare')}
      <text className="diagram-label diagram-label-strong" x="28" y="30">{title}</text>
      <text className="diagram-note" x="932" y="30" textAnchor="end">{L('先确定查询形态，再谈 O(·) 与块计数', 'identify query shape before quoting O(·) or block counts')}</text>

      <rect className="diagram-band" x="24" y="54" width="286" height="256" rx="11" />
      <text className="diagram-label" x="44" y="78">{L('查询形态 → 主要候选', 'Query shape → main candidates')}</text>
      {[
        ['主键点查', '散列 / 索引 / B+ 树索引'],
        ['有序范围', '有序顺序 / 索引 / ISAM / VSAM'],
        ['多关键字', '多重表 / 倒排'],
        ['批量顺序', '顺序文件 / 顺序数据区'],
      ].map(([shape, candidates], index) => (
        <g key={shape}>
          <rect className={index === 2 ? 'diagram-chip diagram-accent' : 'diagram-chip'} x="44" y={92 + index * 48} width="246" height="38" rx="6" />
          <text className="diagram-label" x="58" y={115 + index * 48}>{shape}</text>
          <text className="diagram-note" x="276" y={115 + index * 48} textAnchor="end">{candidates}</text>
        </g>
      ))}
      <text className="diagram-note" x="44" y="292">{L('没有单一冠军：同一点查，散列可能少读索引块，但范围查询要另建结构。', 'No single winner: hashing may save index blocks for a point query but needs another structure for ranges.')}</text>

      <rect className="diagram-band" x="334" y="54" width="594" height="256" rx="11" />
      <text className="diagram-label" x="354" y="78">{L('比较必须带的前提', 'Assumptions the comparison must state')}</text>
      {[
        ['块大小 B', '一条记录多大、每块几条；扫描按块计数。'],
        ['索引高度 h', '上层是否常驻内存；点查读 h 个索引块 + 1 个数据块。'],
        ['溢出/装填', 'ISAM 溢出链长度、散列装填因子决定实际路径。'],
        ['缓存', '缓存命中改变真实 I/O，模拟计数不冒充磁盘测量。'],
      ].map(([head, detail], index) => (
        <g key={head}>
          <text className="diagram-label" x={354 + (index % 2) * 286} y={104 + Math.floor(index / 2) * 74}>{head}</text>
          <text className="diagram-note" x={354 + (index % 2) * 286} y={124 + Math.floor(index / 2) * 74}>{detail}</text>
        </g>
      ))}
      <rect className="diagram-cell" x="354" y="226" width="544" height="62" rx="7" />
      <text className="diagram-note" x="626" y="249" textAnchor="middle">{L('示例：索引点查 ≈ h 个索引块 + 1 个数据块；散列点查 ≈ 1 个主桶块 + e 个溢出块。', 'Example: indexed ≈ h index blocks + 1 data block; hashed ≈ 1 primary bucket + e overflow blocks.')}</text>
      <text className="diagram-note" x="626" y="270" textAnchor="middle">{L('这里的 h、e 是教学假设，不代表任意真实磁盘。', 'h and e are teaching assumptions, not any real disk.')}</text>

      <text className="diagram-label" x="28" y="342">{L('七种组织的能力对照（详细条件见下表）', 'Capability map of seven organizations (conditions in the table)')}</text>
      {[
        ['顺序', '范围✓', '多键✗', '更新：移动/分裂'],
        ['索引', '点查✓', '范围△', '更新：索引项'],
        ['ISAM', '点查✓', '范围△', '更新：溢出/重组'],
        ['VSAM', '范围✓', '多键✗', '更新：索引/数据'],
        ['散列', '点查✓', '范围✗', '更新：桶/溢出'],
        ['多重表', '多键✓', '范围✗', '更新：多链'],
        ['倒排', '多键✓', '范围△', '更新：多表'],
      ].map(([name, point, multi, update], index) => (
        <g key={name}>
          <rect className={index === 6 ? 'diagram-chip diagram-accent' : 'diagram-chip'} x={28 + (index % 4) * 232} y={358 + Math.floor(index / 4) * 74} width="216" height="60" rx="7" />
          <text className="diagram-label" x={44 + (index % 4) * 232} y={380 + Math.floor(index / 4) * 74}>{name}</text>
          <text className="diagram-note" x={44 + (index % 4) * 232} y={398 + Math.floor(index / 4) * 74}>{point} · {multi}</text>
          <text className="diagram-note" x={44 + (index % 4) * 232} y={414 + Math.floor(index / 4) * 74}>{update}</text>
        </g>
      ))}
      <text className="diagram-note" x="28" y="520">{L('✓ 表示组织本身通常支持；△ 表示需要额外有序结构或代价前提；✗ 表示不适合。', '✓ usually supported; △ needs an extra ordered structure or assumptions; ✗ unsuitable.')}</text>
      <text className="diagram-note" x="28" y="542">{L('倒排的范围△：可按记录顺序过滤，但要先有排序/额外索引才能高效按关键字区间返回。', 'Inverted range △: filter in record order, but efficient key-range return needs ordering or another index.')}</text>
    </svg>
  );
}
