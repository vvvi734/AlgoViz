// CODE-DOC-04-BATCH-06 reviewed bilingual teaching annotations.
// Entries are merged after the reviewed batches so earlier anchors stay active.
export const BATCH_06_ANNOTATIONS: Record<
  string,
  readonly { en: string; zh: string }[]
> = {
  "bubble_sort.c": [
    {
      "en": "end is the last index of the unsorted prefix; the pass fills that slot, so the next pass can stop one position earlier.",
      "zh": "end 是未排序前缀的最后一个下标；本趟会把该位置填好，因此下一趟可以少比较一对。"
    },
    {
      "en": "swapped is reset per pass: early exit is evidence about this pass, not a stale flag from an earlier one.",
      "zh": "swapped 每趟都重置：提前退出依据的是本趟是否发生交换，而不是上一趟遗留的标志。"
    },
    {
      "en": "The inner bound is end, not count: the pair (end, end+1) is outside this pass, and comparing past it would mix the sorted suffix into the unsorted scan.",
      "zh": "内层上界是 end 而不是 count：本趟不处理 (end, end+1) 这一对，越过它比较会把已排序后缀混进未排序扫描。"
    },
    {
      "en": "Only strictly inverted neighbours are exchanged; equal keys never swap, which is exactly why this implementation is stable.",
      "zh": "只有严格逆序的相邻元素才交换；相等键不交换，这正是该实现稳定的原因。"
    },
    {
      "en": "A pass without a swap means every adjacent pair in the remaining prefix is ordered; by transitivity the whole prefix is sorted, so stopping loses no work.",
      "zh": "一整趟没有交换说明剩余前缀的每一对相邻元素都有序；由传递性可知整个前缀已经有序，停止不会漏排。"
    },
    {
      "en": "This demo intentionally mixes inversions; the separate count is the array length because a pointer parameter would otherwise lose sizeof information.",
      "zh": "这个示例故意制造了逆序；count 单独传入是因为数组退化为指针后无法再用 sizeof 求长度。"
    }
  ],
  "bubble_sort.cpp": [
    {
      "en": "Fewer than two elements already satisfy the postcondition; the guard also prevents size_t end-- from wrapping below zero.",
      "zh": "少于两个元素已经满足后置条件；这个守卫同时避免 size_t 的 end 自减后回绕。"
    },
    {
      "en": "end is one past the last index of the active prefix; comparing index-1 with index covers every adjacent pair and leaves the fixed tail alone.",
      "zh": "end 是活动前缀末尾的后一位；比较 index-1 与 index 覆盖所有相邻对，同时不碰已经固定的尾部。"
    },
    {
      "en": "The flag is per pass; reusing a previous pass's true value would suppress the early-exit proof.",
      "zh": "标志按趟重置；沿用上一趟的 true 会破坏提前退出的证明。"
    },
    {
      "en": "Starting at 1 lets index-1 denote the left neighbour without a separate lower-bound variable; index < end excludes the fixed suffix.",
      "zh": "从 1 开始可以用 index-1 表示左邻居，不需要额外的下界变量；index < end 排除了已固定的后缀。"
    },
    {
      "en": "Swapping adjacent inverted keys moves the maximum right; strict > is the stability decision because equal keys are left in place.",
      "zh": "交换相邻逆序键把最大值向右推；严格 > 是稳定性决策，因为相等键保持原位。"
    },
    {
      "en": "No swap means no inversion remains in the active prefix; the next pass would repeat the same comparisons with the same result.",
      "zh": "没有交换意味着活动前缀中不再有逆序；下一趟只会重复相同比较并得到相同结果。"
    }
  ],
  "bubble_sort.py": [
    {
      "en": "end tracks the last unsorted slot; it shrinks only after a pass that actually swapped something.",
      "zh": "end 记录最后一个未排序位置；只有本趟发生过交换它才会缩小。"
    },
    {
      "en": "When end reaches 0 only one element remains, so the loop can stop without a self-comparison.",
      "zh": "end 到 0 时只剩一个元素，循环可以停止，不需要自我比较。"
    },
    {
      "en": "Python's boolean is local to this pass; it must start false before the inner scan.",
      "zh": "Python 的布尔量属于本趟；内层扫描前必须重置为 False。"
    },
    {
      "en": "range(end) visits 0..end-1, so values[index+1] is always a valid neighbour and the fixed tail is never touched.",
      "zh": "range(end) 访问 0..end-1，因此 values[index+1] 总是有效邻居，已固定尾部不会被触碰。"
    },
    {
      "en": "The flag records that at least one inversion was removed; equal keys never enter this branch because the comparison is >.",
      "zh": "标志记录本趟至少消除了一次逆序；由于比较是 >，相等键不会进入这个分支。"
    },
    {
      "en": "The early exit is valid only because a full pass compared every adjacent pair still in the prefix.",
      "zh": "提前退出之所以成立，是因为完整一趟已经比较了前缀中所有仍然存在的相邻对。"
    }
  ],
  "indexed_file.c": [
    {
      "en": "Insertion sort is chosen because its shift condition uses strict >; equal keys therefore keep their input order and the later block split is deterministic.",
      "zh": "这里用插入排序，因为移位条件是严格 >；相等键保持输入次序，后续切块结果因此确定。"
    },
    {
      "en": "The last block may be shorter than BLOCK_CAPACITY; BuildBlocks copies only the remaining records instead of padding fake entries.",
      "zh": "最后一块可能不足 BLOCK_CAPACITY；BuildBlocks 只复制剩余记录，不填充虚假条目。"
    },
    {
      "en": "A sparse entry is the block's own maximum, not the next block's minimum; using the next block's first key would send equal boundary keys to the wrong block.",
      "zh": "稀疏索引项是本块自己的最大键，不是下一块的最小键；用下一块首键会把边界相等键导向错误块。"
    },
    {
      "en": "Starting at entry 0 guarantees a valid block even when the target is below the smallest key; that case still costs one block read.",
      "zh": "从索引项 0 开始，即使目标小于最小键也有合法块可读；这种失败情况仍然计一次块读取。"
    },
    {
      "en": "An exact index hit can stop probing immediately because the selected entry already names the correct block.",
      "zh": "索引项精确命中即可停止探测，因为选中的条目已经指向正确块。"
    },
    {
      "en": "The first greater bound ends the probe; all later bounds are even larger, so the previous entry is the last one not greater than target.",
      "zh": "遇到第一个更大的上界就结束探测；后面的上界只会更大，因此前一项就是最后一个不大于目标的条目。"
    },
    {
      "en": "Exactly one data block is read whether the subsequent in-block comparison hits or misses; record comparisons are not counted as block I/O.",
      "zh": "无论块内比较最终命中还是失败，都只读一个数据块；块内记录比较不计作块 I/O。"
    },
    {
      "en": "The returned number is the record's position under the fixed block layout, not a byte offset or a real disk address.",
      "zh": "返回的是固定块布局下的记录位置，不是字节偏移，也不是真实磁盘地址。"
    }
  ],
  "indexed_file.cpp": [
    {
      "en": "stable_sort is required here: the block layout must not depend on incidental ordering of equal keys.",
      "zh": "这里必须用 stable_sort：块布局不能依赖相等键的偶然次序。"
    },
    {
      "en": "end is clamped to the vector size, so the final block is naturally partial and no sentinel record is invented.",
      "zh": "end 被限制在 vector 长度内，最后一块因此自然不满，也不会产生哨兵记录。"
    },
    {
      "en": "The sparse key is the block's last record; the entry stores the block number, which is the only address the probe needs.",
      "zh": "稀疏键取该块最后一条记录；条目保存块号，这是探测唯一需要的地址。"
    },
    {
      "en": "chosen starts at the first entry so index[chosen] is always valid, including targets below the minimum and above the maximum.",
      "zh": "chosen 从第一个条目开始，因此 index[chosen] 始终有效，包括目标低于最小值或高于最大值的情况。"
    },
    {
      "en": "The block read is charged before the in-block scan; a miss is measured with the same one-block cost as a hit.",
      "zh": "块读取在块内扫描之前计费；失败与命中使用相同的一块成本。"
    },
    {
      "en": "The demo hardcodes 3 here instead of using the capacity argument; changing BuildBlocks' capacity without updating this line would return wrong positions.",
      "zh": "示例在这里硬编码 3，而没有使用 capacity 参数；若改变 BuildBlocks 的容量却不改这一行，返回位置会出错。"
    }
  ],
  "indexed_file.py": [
    {
      "en": "List slicing already truncates at the end, so the final block is partial without an explicit min() or padding step.",
      "zh": "列表切片会在末尾自动截断，最后一块自然不满，不需要显式 min() 或填充。"
    },
    {
      "en": "The sparse entry uses the block's last key as an inclusive upper bound and records the block index for the later probe.",
      "zh": "稀疏条目用块内最后键作为包含上界，并保存块下标供后续探测。"
    },
    {
      "en": "chosen is pre-seeded so a target below every bound still selects block 0 and the lookup has a defined one-block cost.",
      "zh": "chosen 预先设为 0，目标小于所有上界时仍选择块 0，查找因此有确定的一块成本。"
    },
    {
      "en": "An exact hit ends the probe immediately; there is no reason to inspect larger upper bounds after the owning block is known.",
      "zh": "精确命中立即结束探测；已知所属块后没有理由继续查看更大的上界。"
    },
    {
      "en": "The counter records block reads, not Python comparisons; in-block record checks do not add to it.",
      "zh": "计数器记录块读取，不记录 Python 比较；块内记录检查不会增加它。"
    },
    {
      "en": "The capacity 3 is hardcoded in the returned position; this matches the demo's build_blocks(records, 3) call but is not parameterized.",
      "zh": "返回位置中硬编码了容量 3；它与示例的 build_blocks(records, 3) 一致，但没有参数化。"
    }
  ],
  "inverted_index.c": [
    {
      "en": "A term owns exactly one posting list; the scan returns the existing table instead of creating a duplicate for the same string.",
      "zh": "一个关键字只对应一张倒排表；扫描返回已有表，而不是为同一字符串创建重复表。"
    },
    {
      "en": "A new table is appended without checking MAX_TERMS; the demo stays within 16 distinct terms, but the API has no capacity failure path.",
      "zh": "新表追加前没有检查 MAX_TERMS；示例的关键字数在 16 以内，但接口没有容量失败路径。"
    },
    {
      "en": "The posting stores the integer record position, so the same record can be found without comparing external ID strings.",
      "zh": "倒排项保存整数记录下标，因此无需比较外部 ID 字符串就能定位同一记录。"
    },
    {
      "en": "NULL means the term was never seen; an existing table with postingCount 0 would be a different state even though neither contains records.",
      "zh": "NULL 表示该关键字从未出现；已存在但 postingCount 为 0 的表是另一种状态，尽管两者都没有记录。"
    },
    {
      "en": "Contains compares record indices, not IDs; this is why the query can be evaluated by walking the original record array.",
      "zh": "Contains 比较记录下标而不是 ID；正因如此，查询可以直接遍历原记录数组。"
    },
    {
      "en": "The identity value differs by mode: AND starts true because an empty conjunction holds, OR starts false because an empty disjunction does not.",
      "zh": "单位元随模式不同：AND 从 true 开始，因为空合取为真；OR 从 false 开始，因为空析取为假。"
    },
    {
      "en": "Walking records rather than postings makes output follow storage order, and each record is tested once so duplicates cannot appear.",
      "zh": "遍历记录而不是倒排项使输出遵循存储顺序，并且每条记录只判断一次，因此不会出现重复。"
    },
    {
      "en": "A missing term yields present=0, so AND fails that record; OR can still succeed through another present term.",
      "zh": "缺失关键字使 present=0，因此 AND 会让该记录失败；OR 仍可能由另一个存在的关键字命中。"
    }
  ],
  "inverted_index.cpp": [
    {
      "en": "The map creates a posting vector on first insertion; the posting stores the string ID, so membership is checked by string equality.",
      "zh": "map 在首次插入时创建倒排 vector；倒排项保存字符串 ID，因此成员判断用字符串相等。"
    },
    {
      "en": "The query scans the original record vector, which fixes output order and guarantees at most one append per record.",
      "zh": "查询扫描原记录 vector，这固定输出顺序，并保证每条记录至多追加一次。"
    },
    {
      "en": "The initial value is the identity for the chosen connective; negating it would make empty queries or missing terms behave differently.",
      "zh": "初值是所选连接词的单位元；取反会改变空查询或缺失关键字的语义。"
    },
    {
      "en": "A missing term is represented by end(), and the following condition treats it as an empty posting list.",
      "zh": "缺失关键字由 end() 表示，后续条件把它当作空倒排表。"
    },
    {
      "en": "The ternary keeps one loop for both modes; each term updates the accumulator with the connective selected by useAnd.",
      "zh": "三元表达式让两种模式共用同一循环；每个关键字用 useAnd 选定的连接词更新累加值。"
    }
  ],
  "inverted_index.py": [
    {
      "en": "setdefault creates the posting list on first sight and appends the string record ID; no separate term table is needed.",
      "zh": "setdefault 在首次出现时创建倒排表并追加字符串记录 ID；不需要单独的关键字表。"
    },
    {
      "en": "all() implements AND over every query term; a missing term contributes an empty list, so that record cannot match.",
      "zh": "all() 对每个查询关键字实现 AND；缺失关键字贡献空列表，因此该记录不能命中。"
    },
    {
      "en": "any() implements OR; a missing term is empty but another term can still make the record match.",
      "zh": "any() 实现 OR；缺失关键字为空，但另一个关键字仍可能让该记录命中。"
    },
    {
      "en": "The outer loop is over records, not postings, so results follow storage order and each record is emitted at most once.",
      "zh": "外层循环遍历记录而不是倒排项，因此结果遵循存储顺序，每条记录至多输出一次。"
    },
    {
      "en": "The demo prints a missing-term query so the contract is observable: AND with an unseen term must be empty, while OR may still return matches.",
      "zh": "示例专门打印缺失关键字查询，使契约可观察：与未见关键字做 AND 必须为空，而 OR 仍可能返回命中。"
    }
  ],
  "isam_file.c": [
    {
      "en": "Only strictly larger keys shift right; an equal key stays before the new record, so insertion is stable within a main block.",
      "zh": "只有严格更大的键右移；相等键停在新记录之前，因此主块内插入是稳定的。"
    },
    {
      "en": "The main block's last key is only a starting maximum; the true maximum may live in this block's overflow chain.",
      "zh": "主块末键只是最大值的起点；真实最大值可能位于该块的溢出链中。"
    },
    {
      "en": "The first bound at least target owns the record because bounds are ascending maxima and equal keys belong to the earlier block.",
      "zh": "第一个上界不小于目标的块拥有该记录，因为上界按升序排列，相等键归入更靠前的块。"
    },
    {
      "en": "A target above every bound still maps to the last block; this keeps the index valid and makes the miss a normal block probe rather than an out-of-range access.",
      "zh": "目标高于所有上界时仍映射到最后一块；这保证下标有效，使失败成为正常块探测而不是越界访问。"
    },
    {
      "en": "Every bound is rebuilt after a mutation because an inserted overflow record can raise a block's maximum even when its main area did not change.",
      "zh": "每次修改后重建全部上界，因为新增溢出记录可能抬高某块最大值，即使该块主区没有变化。"
    },
    {
      "en": "The selected main block is read once before any record comparison; a main-area hit and a later overflow miss share this cost.",
      "zh": "选中主块在任何记录比较前先计一次读取；主区命中和之后溢出失败都包含这项成本。"
    },
    {
      "en": "Overflow nodes are charged only after the main block misses; a main-area hit never pays for the private chain.",
      "zh": "只有主块未命中后才计溢出结点读取；主区命中不会支付专属链成本。"
    },
    {
      "en": "No MAX_OVERFLOW guard is checked before this new node is created; exceeding the static array would write out of bounds.",
      "zh": "创建新结点前没有检查 MAX_OVERFLOW；超过静态数组容量会越界写入。"
    }
  ],
  "isam_file.cpp": [
    {
      "en": "The main block's back() is the starting point, but overflow records are scanned because they can be the true maximum.",
      "zh": "主块 back() 只是起点；仍要扫描溢出记录，因为它们可能是真实最大值。"
    },
    {
      "en": "Bounds are derived data: clearing and rebuilding prevents a stale upper bound from surviving an overflow append.",
      "zh": "上界是派生数据：清空后重建，避免溢出追加后残留过期上界。"
    },
    {
      "en": "Out-of-range targets fall back to the last block; this is a defined probe location, not a claim that the record exists.",
      "zh": "超出范围的目标回退到最后一块；这是确定的探测位置，不代表记录一定存在。"
    },
    {
      "en": "lower_bound inserts before existing equal keys, so a later equal-key record precedes an earlier one; unlike the C version, this insert is not stable.",
      "zh": "lower_bound 会把新记录插到已有相等键之前，因此后插入的相等键反而更靠前；与 C 版不同，这个插入不稳定。"
    },
    {
      "en": "A full main block creates its own overflow head; records never spill into another block's chain, which preserves the index mapping.",
      "zh": "主块满时创建自己的溢出头；记录不会流入其他块的链，从而保持索引映射关系。"
    },
    {
      "en": "The main-block read is counted before scanning, so a subsequent overflow lookup still includes the initial main access.",
      "zh": "主块读取在扫描前计数，因此后续溢出查找仍包含最初的主区访问。"
    },
    {
      "en": "The position uses the runtime capacity, so unlike file-index this version remains correct if the block capacity changes.",
      "zh": "位置计算使用运行时 capacity，因此与 file-index 不同，块容量改变时仍然正确。"
    }
  ],
  "isam_file.py": [
    {
      "en": "The list comprehension rebuilds one bound per block; there is no incremental update path that could miss an overflow change.",
      "zh": "列表推导为每块重建一个上界；不存在可能漏掉溢出变化的增量更新路径。"
    },
    {
      "en": "The overflow walk follows next until -1; the chain is private to this main block, so records from other blocks are never examined.",
      "zh": "溢出遍历沿 next 走到 -1；链属于该主块私有，因此不会检查其他块的记录。"
    },
    {
      "en": "If no bound covers the target, the last block is still returned; this is a deterministic miss path, not a wraparound.",
      "zh": "如果没有上界覆盖目标，仍返回最后一块；这是确定的失败路径，不是回绕。"
    },
    {
      "en": "The record is appended first and the whole block is sorted afterward; Python's stable sort leaves equal keys in their existing relative order.",
      "zh": "先追加记录再整块排序；Python 的稳定排序会让相等键保持已有相对次序。"
    },
    {
      "en": "A new overflow node is created lazily only when the current tail is full; the private chain grows without a global preallocation.",
      "zh": "只有当前尾结点满时才惰性创建新溢出结点；专属链按需增长，没有全局预分配。"
    },
    {
      "en": "A main-block access is charged before the record loop; overflow reads are a separate counter charged only after a main miss.",
      "zh": "主块访问在记录循环前计费；溢出读取是独立计数器，只在主块未命中后计费。"
    }
  ],
  "max_heap.c": [
    {
      "en": "The 0-based parent formula works for every child index; using i/2 would be the 1-based rule and place the parent one level too high.",
      "zh": "0 基父结点公式适用于所有孩子下标；写成 i/2 是 1 基规则，会把父结点抬高一层。"
    },
    {
      "en": "Once the parent is at least the child, every ancestor was already >= that parent, so the whole path is valid without further checks.",
      "zh": "父结点不小于孩子时，所有祖先原本就不小于该父结点，因此整条路径已经合法，无需继续检查。"
    },
    {
      "en": "The left-child formula is the inverse of the parent formula; right is left+1 and may not exist.",
      "zh": "左孩子公式是父公式的逆运算；右孩子是 left+1，可能不存在。"
    },
    {
      "en": "The right-child check is guarded separately because a node can have a left child without a right child.",
      "zh": "右孩子检查单独加守卫，因为结点可能有左孩子却没有右孩子。"
    },
    {
      "en": "No child is greater than the current parent, so the max-heap property holds at this position and sifting can stop.",
      "zh": "没有孩子大于当前父结点，说明该位置满足最大堆性质，下沉可以停止。"
    },
    {
      "en": "The array is fixed-size, so a full heap reports failure instead of growing; C++ and Python versions use dynamic storage.",
      "zh": "数组容量固定，堆满时返回失败而不是扩容；C++ 与 Python 版使用动态存储。"
    },
    {
      "en": "The new value is written at the old size, then size grows; sifting uses the new last index, not the old slot.",
      "zh": "新值写在旧 size 位置，随后 size 增长；上浮使用新的末尾下标，而不是旧槽位。"
    },
    {
      "en": "Decrementing first removes the old root from the logical heap; the subsequent move overwrites slot 0 with the former last value.",
      "zh": "先自减把旧堆顶移出逻辑堆；随后用原末尾值覆盖槽位 0。"
    },
    {
      "en": "The last element is the only one that can be moved without breaking the complete-tree shape; sift_down then repairs order.",
      "zh": "末尾元素是唯一能在不破坏完全树形状的前提下移到根的元素；随后由下沉修复堆序。"
    }
  ],
  "max_heap.cpp": [
    {
      "en": "push_back grows the vector as needed, so this version has no fixed-capacity failure path; the heap order is restored afterward.",
      "zh": "push_back 会按需扩容，因此该版本没有固定容量失败路径；之后恢复堆序。"
    },
    {
      "en": "The maximum is copied before the last element overwrites the root; returning after the move would lose the extracted value.",
      "zh": "最大值在末尾元素覆盖根之前复制；移动后再返回会丢失被取出的值。"
    },
    {
      "en": "Moving the last element to the root preserves completeness; popping it afterward would leave a hole.",
      "zh": "把末尾元素移到根保持完全树形状；先弹出末尾会留下空洞。"
    },
    {
      "en": "The loop condition index > 0 is the only root guard; the parent formula is never evaluated for the root.",
      "zh": "循环条件 index > 0 是唯一的根守卫；根结点永远不会计算父公式。"
    },
    {
      "en": "size_t arithmetic is safe here because index > 0; a signed index would also work but is not needed for this upward walk.",
      "zh": "因为 index > 0，这里的 size_t 运算安全；有符号下标也可行，但上浮不需要。"
    },
    {
      "en": "right is computed even when it is out of range; every use is guarded by right < items_.size().",
      "zh": "即使 right 越界也会先计算；每次使用都由 right < items_.size() 守卫。"
    },
    {
      "en": "The parent already dominates both existing children, so the local heap property is restored and the loop can return.",
      "zh": "父结点已经压过两个存在的孩子，局部堆序恢复，循环可以返回。"
    },
    {
      "en": "Following the swapped child continues the repair down the only path that could still violate the heap property.",
      "zh": "跟随被交换的孩子继续向下修复，这是唯一仍可能违反堆序的路径。"
    }
  ],
  "max_heap.py": [
    {
      "en": "Python lists grow dynamically, so push has no capacity failure; the only work after append is restoring the parent chain.",
      "zh": "Python 列表动态扩容，push 没有容量失败；追加后唯一工作是修复父链。"
    },
    {
      "en": "The new element is at len-1 after append; passing len instead would index past the list.",
      "zh": "追加后新元素位于 len-1；传 len 会越过列表末尾。"
    },
    {
      "en": "pop removes and returns the last element; when only one element existed, last is also the old root and no root rewrite is needed.",
      "zh": "pop 删除并返回末尾元素；原来只有一个元素时，last 同时也是旧根，无需重写根。"
    },
    {
      "en": "After popping the last element the list can be empty; assigning to index 0 then would raise IndexError.",
      "zh": "弹出末尾后列表可能为空；此时写 index 0 会触发 IndexError。"
    },
    {
      "en": "Floor division is required for a 0-based heap; true division would produce a float and break indexing.",
      "zh": "0 基堆必须用整除；真除法会产生浮点数并破坏下标。"
    },
    {
      "en": "The >= test allows equal parent and child keys; swapping equals would add work without improving heap order.",
      "zh": ">= 允许父子键相等；交换相等键只会增加工作，不会改善堆序。"
    },
    {
      "en": "The right child may not exist; both child comparisons below are individually guarded by list bounds.",
      "zh": "右孩子可能不存在；下面两个子结点比较都分别受列表边界守卫。"
    },
    {
      "en": "If neither existing child is larger, the local heap property is restored and no further descent is needed.",
      "zh": "如果两个存在的孩子都不更大，局部堆序已经恢复，不需要继续下滤。"
    }
  ],
  "merge_sort.c": [
    {
      "en": "The main loop runs only while both runs have records; once one side ends, the remaining tail needs no comparisons.",
      "zh": "主循环只在两段都还有记录时运行；一旦一侧耗尽，剩余尾部不再需要比较。"
    },
    {
      "en": "The <= tie-break takes the left run first; taking the right on equality would reverse equal records and destroy stability.",
      "zh": "<= 的平局规则先取左段；相等时取右段会颠倒相等记录并破坏稳定性。"
    },
    {
      "en": "The left tail is already sorted and every value in it is <= the exhausted right side's remaining values, so it can be copied directly.",
      "zh": "左段尾部本身有序，且其中每个值都不大于右段剩余值，因此可以直接复制。"
    },
    {
      "en": "The merged result is copied back only after the whole range is in buffer; writing back early could overwrite an unread source element.",
      "zh": "只有整个区间都进入 buffer 后才拷回；提前写回可能覆盖尚未读取的源元素。"
    },
    {
      "en": "The midpoint formula avoids low+high overflow and keeps the split strictly smaller than the parent range.",
      "zh": "中点公式避免 low+high 溢出，并保证分割后的区间严格小于父区间。"
    },
    {
      "en": "A zero- or one-element range is already sorted; without this base case the recursion would never reach a merge.",
      "zh": "零元素或单元素区间已经有序；没有基例递归永远到不了合并步骤。"
    },
    {
      "en": "One buffer is allocated for the whole sort, not per merge; recursive calls share it because their ranges are disjoint.",
      "zh": "整个排序只分配一个 buffer，而不是每次合并都分配；递归区间互不相交，因此可以共享。"
    },
    {
      "en": "Allocation failure returns without sorting; the caller cannot distinguish this from success because the API has no status result.",
      "zh": "分配失败会直接返回且不排序；由于接口没有状态返回值，调用方无法区分失败与成功。"
    }
  ],
  "merge_sort.cpp": [
    {
      "en": "The three indices are independent: i/j read the two runs, and k writes the merged position; mixing them would lose an unread element.",
      "zh": "三个下标彼此独立：i/j 读取两段，k 写入合并位置；混用会丢失未读元素。"
    },
    {
      "en": "Ties take the left run; this is the only place stability is decided during a merge.",
      "zh": "相等时取左段；这是合并过程中唯一决定稳定性的地方。"
    },
    {
      "en": "Only one of the two tail loops can execute after the main loop; keeping both makes the code correct for either exhausted side.",
      "zh": "主循环结束后两个尾部循环至多执行一个；同时保留两者才能处理任意一侧先耗尽。"
    },
    {
      "en": "Buffer positions mirror the original indices, so copying back is a straight range copy, not a second merge.",
      "zh": "buffer 下标与原数组一一对应，因此拷回是直接区间复制，不是第二次合并。"
    },
    {
      "en": "This split is inclusive on both halves; the next calls use middle and middle+1 so no element is duplicated or skipped.",
      "zh": "这个划分对两半都取闭区间；后续调用使用 middle 与 middle+1，保证不重复、不遗漏。"
    },
    {
      "en": "The base case stops at zero or one element, where a merge would be a no-op.",
      "zh": "基例在零或一个元素时停止，此时合并没有意义。"
    },
    {
      "en": "The vector buffer is allocated once and reused by every merge; its size equals the full array, so no subrange needs a separate allocation.",
      "zh": "vector buffer 只分配一次并被每次合并复用；长度等于整个数组，子区间无需再分配。"
    }
  ],
  "merge_sort.py": [
    {
      "en": "The tuple assignment seeds both read cursors and the write cursor at once; k stays aligned with the original range.",
      "zh": "元组赋值一次初始化两个读游标和写游标；k 始终与原区间下标对齐。"
    },
    {
      "en": "The main loop stops as soon as one run is exhausted; the remaining run is already ordered and can be appended without comparison.",
      "zh": "主循环在一段耗尽时立即停止；剩余一段已经有序，无需比较即可追加。"
    },
    {
      "en": "The left-first tie rule preserves the relative order of equal records, which is the stability guarantee.",
      "zh": "左段优先的平局规则保留相等记录的相对次序，这就是稳定性保证。"
    },
    {
      "en": "This tail loop is mutually exclusive with the right tail loop; both are written so the code does not depend on which side ends first.",
      "zh": "这个尾部循环与右段尾部循环互斥；两者都写出来，代码不依赖哪一侧先耗尽。"
    },
    {
      "en": "The copy-back range is inclusive on both ends, matching the closed interval used by the recursive calls.",
      "zh": "拷回范围两端都包含，与递归调用使用的闭区间一致。"
    },
    {
      "en": "Floor division keeps the left half no larger than the right, so the recursion always shrinks and terminates.",
      "zh": "向下取整使左半不大于右半，递归规模始终缩小并终止。"
    },
    {
      "en": "A single list of full length is allocated before recursion; zero is only an initial placeholder, never a sentinel for missing data.",
      "zh": "递归前分配一个与数组等长的列表；0 只是初始占位，不是缺失数据的哨兵。"
    }
  ],
  "multiway_merge.c": [
    {
      "en": "capacity is the per-run FIFO capacity, not the global record capacity; freeSlots bounds how much one refill may add.",
      "zh": "capacity 是每段 FIFO 的容量，不是全局记录容量；freeSlots 限制一次补充能加入多少。"
    },
    {
      "en": "cursor counts records already moved into the buffer; remaining is the unread tail that refill is allowed to consume.",
      "zh": "cursor 统计已经移入缓冲区的记录数；remaining 是允许补充读取的未读尾部。"
    },
    {
      "en": "The buffer stores record indices, not record copies; the actual Record stays in the run and is read through this index.",
      "zh": "缓冲区保存记录下标而不是记录副本；真实 Record 仍留在该段，通过下标读取。"
    },
    {
      "en": "A refill counts as one simulated block read only when take > 0; an exhausted run must not inflate the counter.",
      "zh": "只有 take > 0 时补充才算一次模拟读块；耗尽的段不能虚增计数。"
    },
    {
      "en": "Flushing resets the logical length but does not erase the array; the next block overwrites the prefix from index 0.",
      "zh": "写出后只重置逻辑长度，不清空数组；下一块从下标 0 开始覆盖前缀。"
    },
    {
      "en": "An empty buffer contributes no candidate; skipping it is different from treating its missing head as value 0.",
      "zh": "空缓冲区没有候选；跳过它不同于把缺失队首当作值 0。"
    },
    {
      "en": "Removing the winner shifts the FIFO tail left; this keeps the next record at buffer[0] and preserves arrival order.",
      "zh": "取走赢家后把 FIFO 尾部左移；这保证下一条记录位于 buffer[0]，并保持到达次序。"
    },
    {
      "en": "A block is written exactly when the shared output buffer reaches capacity; flushing earlier would create smaller artificial blocks.",
      "zh": "共享输出缓冲区恰好达到容量时才写块；提前写出会制造更小的人为块。"
    },
    {
      "en": "The final flush is outside the loop because the last block is usually partial; dropping it would lose records.",
      "zh": "最后一次写出在循环之外，因为最后一块通常不满；丢掉它会丢失记录。"
    }
  ],
  "multiway_merge.cpp": [
    {
      "en": "The vector buffer length is the current fill level; capacity is the per-run limit, not the total number of records.",
      "zh": "vector 缓冲区长度就是当前填充量；capacity 是每段上限，不是记录总数。"
    },
    {
      "en": "A refill takes the smallest of block size, free space and unread records; the max(0, ...) prevents a negative loop bound.",
      "zh": "一次补充取块大小、空闲空间、未读记录三者的最小值；max(0,...) 防止出现负的循环上界。"
    },
    {
      "en": "Only the cursor is buffered; the record remains in the run vector, so refill does not duplicate payload data.",
      "zh": "只把游标放进缓冲区；记录仍留在该段 vector 中，补充不会复制负载数据。"
    },
    {
      "en": "An empty FIFO cannot nominate a candidate; the run stays in the array but contributes nothing until refilled.",
      "zh": "空 FIFO 不能提名候选；该段仍在数组中，但在补充前不贡献任何候选。"
    },
    {
      "en": "Erasing the front preserves FIFO order; the next record becomes front without any index arithmetic.",
      "zh": "删除队首保持 FIFO 次序；下一条记录自然成为队首，不需要下标运算。"
    },
    {
      "en": "The shared output buffer is flushed only at capacity; a partial block is handled after all runs are exhausted.",
      "zh": "共享输出缓冲区只在达到容量时写出；不满块在所有段耗尽后统一处理。"
    },
    {
      "en": "The trailing partial buffer is still a block; omitting this flush would silently drop the last records.",
      "zh": "末尾不满缓冲区仍是一个块；省略这次写出会静默丢掉最后几条记录。"
    }
  ],
  "multiway_merge.py": [
    {
      "en": "The refill count is capped by the block size, the FIFO's free space, and the unread tail; any smaller bound must win.",
      "zh": "补充数量受块大小、FIFO 空闲空间、未读尾部共同限制；任一更小的上界都必须生效。"
    },
    {
      "en": "The buffer stores integer positions, so extending with a range is equivalent to pushing cursor, cursor+1, ... without copies.",
      "zh": "缓冲区保存整数位置，因此用 range 扩展等价于依次压入 cursor、cursor+1…，且不复制记录。"
    },
    {
      "en": "The candidate list is rebuilt each iteration from nonempty FIFOs; a stale winner from a previous iteration cannot survive.",
      "zh": "候选列表每轮都从非空 FIFO 重建；上一轮的旧赢家不可能残留。"
    },
    {
      "en": "pop(0) removes the FIFO head; using pop() would remove the tail and break the arrival order.",
      "zh": "pop(0) 删除 FIFO 队首；用 pop() 会删除队尾并破坏到达次序。"
    },
    {
      "en": "The output block is emitted at exactly capacity; the buffer is cleared after extending written, not before.",
      "zh": "输出块恰好在容量处写出；先扩展 written 再清空缓冲区，顺序不能反。"
    },
    {
      "en": "A nonempty trailing buffer is one final partial block and must be counted as a write.",
      "zh": "非空末尾缓冲区是一个最终不满块，必须计为一次写出。"
    },
    {
      "en": "The total-count assertion catches lost records; it is a teaching invariant check, not a performance optimization.",
      "zh": "总数断言用于捕获记录丢失；这是教学不变量检查，不是性能优化。"
    }
  ],
  "optimal_merge_tree.c": [
    {
      "en": "A full k-ary tree needs (leaves-1) divisible by k-1; the outer modulo turns a zero deficit into zero virtual leaves instead of k-1.",
      "zh": "满 k 叉树要求 (叶数-1) 能被 k-1 整除；外层取模把零缺口保持为零，而不是补成 k-1 个虚拟叶。"
    },
    {
      "en": "Virtual leaves carry zero weight because they add no records to merge; only their structural slot matters.",
      "zh": "虚拟叶权重为 0，因为它们不增加待归并记录；只有结构槽位有意义。"
    },
    {
      "en": "The kind tag keeps virtual leaves distinguishable from real zero-length runs and from internal nodes.",
      "zh": "kind 标记让虚拟叶区别于真实零长度段，也区别于内部结点。"
    },
    {
      "en": "With virtual padding the forest size should always support a k-way combine; falling below k means the shape invariant was already broken.",
      "zh": "有了虚拟填充，森林规模应始终支持 k 路合并；少于 k 个根说明形状不变量已经被破坏。"
    },
    {
      "en": "The forest is tiny, so selection sort is acceptable; a priority queue would change the code but not the greedy result.",
      "zh": "森林很小，选择排序可以接受；换成优先队列会改变代码，但不会改变贪心结果。"
    },
    {
      "en": "The parent weight is built as the sum of exactly k selected children; it is not copied from any single root.",
      "zh": "父权重由恰好 k 个被选孩子的权重累加；它不是从任何单个根复制来的。"
    },
    {
      "en": "Every internal node's weight is paid once in the merge schedule, so total cost is their sum, not the final root weight.",
      "zh": "每个内部结点的权重在归并计划中支付一次，因此总代价是它们之和，而不是最终根权重。"
    },
    {
      "en": "The new parent replaces the k consumed roots; keeping the old roots would let their records be merged twice.",
      "zh": "新父结点替换被消费的 k 个根；保留旧根会让它们的记录被重复归并。"
    },
    {
      "en": "The loop ends with exactly one root; a forest of one means the whole schedule is represented by that tree.",
      "zh": "循环结束时恰好一个根；森林只剩一个根表示整个计划已由这棵树表示。"
    }
  ],
  "optimal_merge_tree.cpp": [
    {
      "en": "The deficit formula is the C version translated to counts; it pads only the shape, never the total record weight.",
      "zh": "缺口公式与 C 版按计数表达一致；它只补形状，不改变记录总权重。"
    },
    {
      "en": "A virtual node has kind VIRTUAL_LEAF and default weight 0; no real input ever enters this branch.",
      "zh": "虚拟结点标记为 VIRTUAL_LEAF 且权重默认 0；真实输入不会进入这个分支。"
    },
    {
      "en": "stable_sort keeps the comparator's tie order deterministic; the comparator itself already uses weight, kind and id.",
      "zh": "stable_sort 让比较器的平局次序确定；比较器本身已经使用权重、类型和编号。"
    },
    {
      "en": "The parent is accumulated from exactly k selected roots; a missing child would silently change the merge cost.",
      "zh": "父权重由恰好 k 个被选根累加；少一个孩子会悄悄改变归并代价。"
    },
    {
      "en": "Cost is accumulated per internal node, not reconstructed from the root afterward; the root only equals a subset of this sum.",
      "zh": "代价按内部结点逐个累加，而不是事后从根反推；根权重只等于该总和的一部分。"
    },
    {
      "en": "Exactly the first k roots were consumed by this combine; erasing fewer would leave stale roots in the forest.",
      "zh": "本次合并恰好消费前 k 个根；少删会留下过期根。"
    },
    {
      "en": "The parent index is the vector position after push_back; computing it before the push would point to the wrong node.",
      "zh": "父下标是 push_back 之后的 vector 位置；在 push 之前计算会指向错误结点。"
    }
  ],
  "optimal_merge_tree.py": [
    {
      "en": "The padding count is zero when the real leaves already form a full tree; otherwise it is the smallest positive deficit.",
      "zh": "真实叶已能构成满树时填充数为 0；否则取最小的正缺口。"
    },
    {
      "en": "Virtual leaves contribute no key weight; their only role is to occupy the shape slots needed for full branching.",
      "zh": "虚拟叶不贡献关键字权重；唯一作用是占据满分支所需的结构槽位。"
    },
    {
      "en": "Sorting the forest by (weight, real-before-virtual, id) is the greedy selection; a different tie order can change the tree shape but not the optimal cost for valid weights.",
      "zh": "按 (权重、真实优先、编号) 排序森林就是贪心选择；不同平局次序可能改变树形，但在合法权重下不改变最优代价。"
    },
    {
      "en": "Exactly k roots are combined; selecting fewer would produce an internal node with an invalid arity.",
      "zh": "恰好选择 k 个根合并；少于 k 个会产生非法元数的内部结点。"
    },
    {
      "en": "Each internal node adds its own weight to the total; summing root weights would miss the costs paid at lower levels.",
      "zh": "每个内部结点把自己的权重加入总代价；只加根权重会漏掉更低层支付的代价。"
    },
    {
      "en": "The new parent replaces the consumed prefix; keeping the selected roots would duplicate their records in later merges.",
      "zh": "新父结点替换被消费的前缀；保留被选根会让记录在后续归并中重复。"
    },
    {
      "en": "Termination requires one root; the forest size shrinks by k-1 each combine, which is exactly the divisibility invariant.",
      "zh": "终止时要求一个根；每次合并森林规模减少 k-1，这正是整除不变量的来源。"
    }
  ],
  "quick_sort.c": [
    {
      "en": "Choosing the last element makes the pivot value stable during the scan; a sorted input would repeatedly choose the largest and degrade to O(n^2).",
      "zh": "选择末尾元素让扫描期间基准值保持稳定；已排序输入会反复选到最大值，从而退化为 O(n^2)。"
    },
    {
      "en": "boundary is the last index of the <= pivot region and starts before low, so the region is empty before the first comparison.",
      "zh": "boundary 是 <= pivot 区域的最后下标，初值在 low 之前，表示第一次比较前该区域为空。"
    },
    {
      "en": "The scan stops before high because values[high] is the pivot itself; including it would compare the pivot with itself and disturb the final swap.",
      "zh": "扫描在 high 前停止，因为 values[high] 就是基准；把它纳入会做无意义的自比较并干扰最终交换。"
    },
    {
      "en": "<= sends equal keys left; this keeps duplicate-heavy input from producing an empty left side, but it also makes the partition unstable.",
      "zh": "<= 把相等键送到左侧；这避免大量重复键时左区为空，但也使划分不稳定。"
    },
    {
      "en": "boundary grows only when a qualifying element is found; the element at the new boundary is swapped into the processed region.",
      "zh": "只有找到符合条件的元素时 boundary 才增长；新边界处的元素被换入已处理区域。"
    },
    {
      "en": "The final swap puts the pivot immediately after the <= region; boundary+1 is its final position, so later recursion must exclude it.",
      "zh": "最终交换把基准放到 <= 区域之后；boundary+1 就是它的最终位置，后续递归必须排除它。"
    },
    {
      "en": "An empty or one-element range is already sorted; this base case also prevents infinite recursion on equal bounds.",
      "zh": "空区间或单元素区间已经有序；这个基例也防止相同边界造成无限递归。"
    },
    {
      "en": "The two recursive ranges are disjoint and exclude pivot; passing pivot itself would recreate the same partition forever.",
      "zh": "两个递归区间互不相交且都排除 pivot；把 pivot 本身传进去会不断重建同一个划分。"
    }
  ],
  "quick_sort.cpp": [
    {
      "en": "The pivot is copied by value before any swap, so later element moves cannot change the comparison target.",
      "zh": "基准在交换前按值复制，后续元素移动不会改变比较目标。"
    },
    {
      "en": "boundary is a signed index because low can be 0; low-1 must remain a sentinel rather than wrap to a huge size_t.",
      "zh": "boundary 使用有符号下标，因为 low 可能为 0；low-1 必须保持哨兵值，不能回绕成巨大的 size_t。"
    },
    {
      "en": "The loop visits every non-pivot element exactly once; the final pivot swap happens after the scan, not inside it.",
      "zh": "循环恰好访问每个非基准元素一次；基准的最终交换发生在扫描之后，而不是循环内。"
    },
    {
      "en": "The <= decision is the partition contract; changing it to < would leave equal keys on the right and alter duplicate behavior.",
      "zh": "<= 是划分契约；改成 < 会把相等键留在右侧，并改变重复键的行为。"
    },
    {
      "en": "boundary advances before the swap, so it always marks the last accepted element after the exchange.",
      "zh": "boundary 先自增再交换，因此交换后它始终标记最后一个被接受的元素。"
    },
    {
      "en": "The pivot moves to boundary+1 only after all smaller-or-equal keys are on its left; that slot is final, not provisional.",
      "zh": "所有小于等于基准的键就位后，基准才移到 boundary+1；该位置是最终位置，不是暂存位置。"
    },
    {
      "en": "The base case covers both empty and single-element ranges; no partition is attempted when there is nothing to split.",
      "zh": "基例同时覆盖空区间和单元素区间；没有可分割内容时不再调用划分。"
    },
    {
      "en": "Recursing on middle+1 and middle-1 keeps the pivot out of both subproblems, which guarantees progress.",
      "zh": "对 middle+1 和 middle-1 递归都把基准排除在两个子问题之外，从而保证规模缩小。"
    }
  ],
  "quick_sort.py": [
    {
      "en": "The pivot is a local copy; reassigning values during partitioning cannot silently change the comparison threshold.",
      "zh": "基准是局部副本；划分期间重新赋值 values 不会悄悄改变比较阈值。"
    },
    {
      "en": "boundary is the exclusive end of the accepted region; starting at low-1 makes the first accepted element land at low.",
      "zh": "boundary 是已接受区域的末端前一位；从 low-1 开始，第一个被接受的元素正好落在 low。"
    },
    {
      "en": "Python's range excludes high, matching the pivot exclusion exactly and avoiding an off-by-one scan.",
      "zh": "Python 的 range 排除 high，正好与排除基准的约定一致，避免差一错误。"
    },
    {
      "en": "Equal keys go left by design; this stabilizes duplicate-heavy partitions but does not make the overall sort stable.",
      "zh": "相等键按设计进入左侧；这让重复键划分更均衡，但不会让整体排序稳定。"
    },
    {
      "en": "The boundary moves only after a qualifying element is seen; its value is the count of accepted elements minus one.",
      "zh": "只有看到符合条件的元素后 boundary 才移动；它的值等于已接受元素数减一。"
    },
    {
      "en": "The tuple assignment swaps pivot and boundary+1 atomically in Python; the pivot is now at its final index.",
      "zh": "元组赋值在 Python 中原子地交换基准与 boundary+1；此时基准位于最终下标。"
    },
    {
      "en": "The empty/single-element guard prevents a recursive call that could not shrink the interval.",
      "zh": "空区间/单元素守卫阻止无法缩小规模的递归调用。"
    },
    {
      "en": "The right recursive call starts after the pivot; including middle would reuse the same pivot and never terminate.",
      "zh": "右递归从基准之后开始；包含 middle 会重复使用同一基准并永不终止。"
    }
  ],
  "selection_sort.c": [
    {
      "en": "start+1 < count stops before the final single-element suffix; that last element is already in place and needs no self-swap.",
      "zh": "start+1 < count 在最后一个单元素后缀前停止；最后一个元素已经就位，不需要自我交换。"
    },
    {
      "en": "The candidate starts as the first unsorted element; if the scan finds nothing smaller, no swap is needed.",
      "zh": "候选先设为未排序区首元素；如果扫描没有找到更小值，就不需要交换。"
    },
    {
      "en": "The scan begins after start because comparing the candidate with itself cannot change the minimum.",
      "zh": "扫描从 start+1 开始，因为候选与自身比较不可能改变最小值。"
    },
    {
      "en": "Strict < keeps the first occurrence on equal keys during the scan, but the final swap can still move an equal key across another.",
      "zh": "扫描时严格 < 会保留相等键的首次出现；但最终交换仍可能让相等键互相越过。"
    },
    {
      "en": "One swap per pass keeps writes low; skipping a self-swap is an optimization, not the reason the algorithm is correct.",
      "zh": "每趟只交换一次减少写操作；跳过自我交换只是优化，并不是算法正确性的依据。"
    },
    {
      "en": "The input contains several inversions so every pass can be observed changing the sorted prefix.",
      "zh": "输入包含多处逆序，便于观察每趟如何扩展已排序前缀。"
    }
  ],
  "selection_sort.cpp": [
    {
      "en": "The loop leaves the final element untouched; it is already the largest remaining value once the prefix is complete.",
      "zh": "循环不处理最后一个元素；当前缀完成时它已经是剩余元素中的最大值。"
    },
    {
      "en": "minimum stores an index, not a value; the scan can therefore swap the original record after it finishes.",
      "zh": "minimum 保存下标而不是值；扫描结束后仍能交换原始记录。"
    },
    {
      "en": "The scan covers only the unsorted suffix; the prefix is already globally ordered and must not re-enter the minimum search.",
      "zh": "扫描只覆盖未排序后缀；前缀已经全局有序，不能再次参与最小值搜索。"
    },
    {
      "en": "This comparison chooses the smallest key, but the eventual exchange is what makes the sort unstable for equal keys.",
      "zh": "这个比较选出最小键；真正让相等键失去稳定次序的是随后的交换。"
    },
    {
      "en": "The guard avoids swapping an element with itself; it does not prevent a different equal-key record from crossing.",
      "zh": "该守卫避免元素与自身交换；它不能阻止另一个相等键记录被换到前面。"
    },
    {
      "en": "The vector version uses the same exchange semantics as C; only bounds and storage ownership differ.",
      "zh": "vector 版本与 C 版使用相同的交换语义；区别只在边界表示和存储所有权。"
    }
  ],
  "selection_sort.py": [
    {
      "en": "range(len(values)-1) excludes the last slot, which is filled by elimination rather than by another scan.",
      "zh": "range(len(values)-1) 排除最后一个位置；它由排除法自然就位，不需要再扫描。"
    },
    {
      "en": "minimum is an index so the tuple swap can move the original object, not just a copied integer.",
      "zh": "minimum 是下标，元组交换才能移动原始对象，而不是只交换一个整数副本。"
    },
    {
      "en": "The inner range starts after the candidate; the current minimum is already represented by start.",
      "zh": "内层范围从候选之后开始；当前最小值已经由 start 代表。"
    },
    {
      "en": "Equal keys do not replace the candidate here, but the later tuple assignment can still reorder them.",
      "zh": "相等键在这里不会替换候选；但后面的元组赋值仍可能改变它们的次序。"
    },
    {
      "en": "Skipping a no-op swap keeps the trace readable; correctness comes from the prefix invariant, not from this guard.",
      "zh": "跳过无效交换让轨迹更清晰；正确性来自前缀不变量，而不是这个守卫。"
    },
    {
      "en": "The demo values are selected to show the minimum moving into the prefix on each pass.",
      "zh": "示例值用于展示每一趟最小值如何进入已排序前缀。"
    }
  ],
  "tournament_sort.c": [
    {
      "en": "An absent or inactive left child is not a candidate; the right child can win by default, but only if it is also active.",
      "zh": "左孩子不存在或已失效时不能参赛；右孩子可以默认胜出，但也必须仍是 active。"
    },
    {
      "en": "The primary key decides first; originalIndex is consulted only when the values tie, so ordinary comparisons stay cheap.",
      "zh": "先按主关键字决定；只有关键字相等时才查看 originalIndex，普通比较因此保持简单。"
    },
    {
      "en": "The smaller original index wins a tie; this is the stability rule and also gives the animation a deterministic label order.",
      "zh": "相等时原始下标较小者胜出；这既是稳定性规则，也让动画标签次序确定。"
    },
    {
      "en": "The leaf layer must be a power of two so every internal node has two children; extra leaf slots become inactive sentinels.",
      "zh": "叶层必须是 2 的幂，保证每个内部结点都有两个孩子；多出的叶槽位变成失效哨兵。"
    },
    {
      "en": "Every tree slot is cleared before leaves are filled; otherwise an old winner could survive in a padding subtree.",
      "zh": "填叶前先清空整棵树；否则旧的赢家可能残留在填充子树中。"
    },
    {
      "en": "Leaves map input positions directly; slots beyond n are marked -1 rather than mapped to a fake record 0.",
      "zh": "叶结点直接映射输入位置；超过 n 的槽位标记为 -1，而不是映射到虚构的记录 0。"
    },
    {
      "en": "Building from the last internal node down to 1 guarantees both children already hold winners before their parent is computed.",
      "zh": "从最后一个内部结点倒序建到 1，保证计算父结点前两个孩子已经有赢家。"
    },
    {
      "en": "Deactivation happens before any ancestor recomputation; the Better calls then ignore the removed record even if its leaf slot remains.",
      "zh": "失效标记在任何祖先重算之前完成；之后的 Better 会忽略被删除记录，即使它的叶槽位还在。"
    },
    {
      "en": "The walk starts at the parent of the winner's leaf, not at the leaf: the leaf itself is already represented by active[].",
      "zh": "遍历从赢家叶结点之父开始，而不是从叶开始：叶状态已经由 active[] 表示。"
    },
    {
      "en": "Only the ancestor chain changes; the sibling subtree's winner is still valid and is intentionally reused.",
      "zh": "只有祖先链会变化；兄弟子树的赢家仍然有效，因此被有意复用。"
    }
  ],
  "tournament_sort.cpp": [
    {
      "en": "The active array is the source of truth after removal; a stored leaf index alone is not proof that the record still participates.",
      "zh": "删除后 active 数组才是事实来源；仅有一个叶下标不能证明该记录仍参赛。"
    },
    {
      "en": "Value comparison is the hot path; equality falls through to the stable identity comparison below.",
      "zh": "值比较是主路径；相等时才进入下面的稳定身份比较。"
    },
    {
      "en": "Ties are broken by input position, so equal keys keep their original relative order after extraction.",
      "zh": "平局按输入位置裁决，相等关键字在取出后保持原始相对次序。"
    },
    {
      "en": "Padding leaves deliberately become -1; mapping them to record 0 would make a real record appear twice.",
      "zh": "填充叶被刻意设成 -1；映射到记录 0 会让真实记录重复出现。"
    },
    {
      "en": "Bottom-up construction is a postorder over the complete tree; a parent is never read before its children are ready.",
      "zh": "自底向上构造相当于对完全树做后序处理；父结点不会在孩子就绪前被读取。"
    },
    {
      "en": "The winner is removed logically, not erased from the vector; tree slots and record indices stay stable.",
      "zh": "赢家是逻辑删除而不是从 vector 中抹掉；树槽位和记录下标因此保持稳定。"
    },
    {
      "en": "The parent formula mirrors the leaf layout; using winner directly would be wrong when winner is not the leaf slot.",
      "zh": "父结点公式与叶布局对应；直接把 winner 当下标在非叶槽位时会算错。"
    },
    {
      "en": "Each division moves one level toward the root, so the total repair is O(log n) rather than a full rebuild.",
      "zh": "每次除以 2 上移一层，因此总修复代价是 O(log n)，而不是整树重建。"
    }
  ],
  "tournament_sort.py": [
    {
      "en": "None and inactive are different reasons for absence but both mean the left child cannot win.",
      "zh": "None 与 inactive 是两种不同的缺失原因，但都表示左孩子不能胜出。"
    },
    {
      "en": "Only unequal values reach this branch; equality is handled by the identity tie-break below.",
      "zh": "只有值不相等才进入该分支；相等情况交给下面的身份平局规则。"
    },
    {
      "en": "The original index is carried through the tournament unchanged, which is what lets equal values remain distinguishable and stable.",
      "zh": "原始下标在整场锦标赛中保持不变，这正是相等值仍可区分并保持稳定的原因。"
    },
    {
      "en": "Leaves use record indices for real inputs and None for padding; a numeric 0 would be a valid record and therefore ambiguous.",
      "zh": "叶结点对真实输入保存记录下标，对填充位保存 None；数字 0 会是合法记录，因而有歧义。"
    },
    {
      "en": "The reverse range stops at 1 because index 0 is unused; root 1 is the last node computed.",
      "zh": "倒序范围停在 1，因为下标 0 不使用；根结点 1 是最后被计算的结点。"
    },
    {
      "en": "The record is deactivated before recomputation so every ancestor sees the new state on its first visit.",
      "zh": "记录在重算前失效，祖先第一次访问时就能看到新状态。"
    },
    {
      "en": "Floor division maps a leaf slot to its parent; the floor is exact because leaf_count is a power of two.",
      "zh": "向下取整把叶槽位映射到父结点；叶容量是 2 的幂，因此整除是精确的。"
    },
    {
      "en": "Recomputing both child references is necessary even though only one side changed: Better needs both current candidates.",
      "zh": "即使只有一侧变化，也必须重新读取两个孩子引用：Better 需要两个当前候选。"
    }
  ]
};
