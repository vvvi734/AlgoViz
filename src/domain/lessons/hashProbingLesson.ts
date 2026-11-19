import type { Lesson } from './types';

/**
 * F2 linear-probing course. Step ids match the real Python `lesson_step`
 * values: init, hash, probe, collision, resolve, result, done.
 */
export const hashProbingLesson: Lesson = {
  lessonId: 'hash-probing-basics',
  algorithmId: 'hash-probe',
  contentVersion: '1.0.0',
  title: { zh: '线性探测：连续槽位、回绕与删除墓碑', en: 'Linear probing: contiguous slots, wraparound and tombstones' },
  oneLiner: {
    zh: '冲突后按 (h(key) + i) % m 顺序找下一个槽；删除留下 DELETED，查找遇到 EMPTY 才失败。',
    en: 'On a collision, probe (h(key) + i) % m in order; delete leaves DELETED, and a lookup fails only at EMPTY.',
  },
  overview: {
    zh: '散列表用散列函数把键映射到有限槽位，冲突不可避免。线性探测法不使用链表，而是把所有元素放在一个连续数组里：先算 h(key) = key % m，如果槽已被别的键占用，就依次检查 (h(key)+1) % m、(h(key)+2) % m，直到找到空位或命中；索引超过 m-1 会回绕到 0。因为槽位连续，线性探测的缓存局部性好、不需要 next 指针；但它会产生聚集（clustering）：一段连续被占用的槽会让后续冲突元素排更长的队，平均探测长度随装载因子上升而变差。装载因子 α = n / m；平均/期望查找约为 O(1 + 1/(1-α))（在 α 未接近 1 时可视作 O(1)），最坏仍为 O(n)。删除是线性探测最容易被做错的地方：不能把槽直接写回 EMPTY，否则同一条冲突链后面的元素会被“截断”，查找提前失败。本实现使用三态槽位：EMPTY（从未使用）、OCCUPIED（当前存放元素）、DELETED（已删除墓碑）。查找遇到 DELETED 必须继续，只有 EMPTY 才能证明键不存在；插入可以复用 DELETED，但必须继续扫描完整探测链以查重。表满（m 个槽全 OCCUPIED 且无墓碑）时插入明确失败，不能无限循环。',
    en: 'A hash table maps keys through a hash function into a finite set of slots, and collisions are unavoidable. Linear probing keeps every entry in one contiguous array instead of linked chains: compute h(key) = key % m, and if that slot is occupied by another key, inspect (h(key)+1) % m, (h(key)+2) % m, and so on until an empty slot or a match appears. Contiguous slots give good cache locality and avoid next pointers, but they create clustering: a run of occupied slots makes later collisions queue even longer, so the average probe length worsens as the load factor rises. The load factor is α = n / m; average/expected lookup is about O(1 + 1/(1-α)) (commonly treated as O(1) while α is not near 1), while the worst case remains O(n). Deletion is the classic trap: a slot cannot simply return to EMPTY or later entries on the same collision path would be cut off and lookups would fail early. This implementation uses three states: EMPTY (never used), OCCUPIED (currently holds an entry) and DELETED (a tombstone after removal). A lookup must continue past DELETED and may fail only at EMPTY; an insert may reuse DELETED but must still scan the full probe path to check for duplicates. When all m slots are OCCUPIED and no tombstone exists, insertion fails explicitly instead of looping forever.',
  },
  intuition: {
    zh: '把 7 个槽想成一条环形的连续停车位。键 1、8、15 的起点都是槽 1：1 停在 1；8 发现 1 被占，就依次看 2、3，停在第一个空位；15 再往后找。走到 7 号位之后不是停下，而是回绕到 0 号位。查找也必须沿同样的顺序走：遇到别的键继续，遇到 DELETED 继续，只有遇到 EMPTY 才能确定“这里之后不可能有该键”。删除不能把车位直接擦成“从未使用”，而要放一个 DELETED 墓碑，告诉后来的查找“这里曾经有车，请继续往后找”。',
    en: 'Picture seven contiguous parking spaces arranged in a ring. Keys 1, 8 and 15 all start at slot 1: 1 parks there; 8 finds it occupied and checks 2, 3, taking the first free slot; 15 continues farther. After slot 6 the probe wraps to slot 0 rather than stopping. A lookup follows the same order: skip other keys, continue past DELETED, and only EMPTY proves the key cannot be farther along. Deletion cannot erase a space back to never-used; it leaves a DELETED tombstone telling later lookups to keep going.',
  },
  prerequisites: {
    zh: ['理解数组下标、环形回绕与取模', '区分“从未使用”和“曾经使用后删除”', '理解装载因子 α = n/m 与表满条件'],
    en: ['Array indices, circular wraparound and modulo', 'Distinguishing never-used from used-then-deleted', 'The load factor α = n/m and the meaning of a full table'],
  },
  complexity: {
    time: '平均/期望 O(1)；最坏 O(n)',
    space: 'O(m)',
    note: {
      zh: '线性探测只用一个长度 m 的数组，不需要 next 指针。装载因子 α = n/m 越接近 1，连续占用段越长，平均探测次数迅速上升；α 较小时平均/期望可视为 O(1)，但这不是无条件保证。最坏情况仍可能检查全部 m 个槽，即 O(m) = O(n)。本批次固定表长、不做扩容，因此插入越多，聚集越明显。',
      en: 'Linear probing uses one array of length m and no next pointers. As the load factor α = n/m approaches 1, occupied runs get longer and the average probe count rises quickly; while α is small the average/expected cost can be treated as O(1), but that is not an unconditional guarantee. The worst case may inspect all m slots, O(m) = O(n). This batch fixes the table size and does not resize, so clustering grows as more entries are inserted.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 建空表：m 个槽全部 EMPTY', en: '① Build an empty table: all m slots EMPTY' },
      explanation: {
        zh: '官方示例固定 m=7，所有槽初始为 EMPTY。EMPTY 表示这个位置从未被使用；它与后来删除产生的 DELETED 语义不同。元素数为 0，装载因子为 0。',
        en: 'The official example fixes m = 7 and starts every slot as EMPTY. EMPTY means the position has never been used; it is semantically different from a DELETED tombstone produced by a removal. The entry count and load factor are both 0.',
      },
      tip: { zh: '记忆：EMPTY 是“从未使用”，DELETED 是“用过又删除”。', en: 'Memory hook: EMPTY means never used; DELETED means used and then removed.' },
    },
    {
      stepId: 'hash',
      title: { zh: '② 计算初始槽位', en: '② Compute the initial slot' },
      explanation: {
        zh: '当前键先算 h(key) = key % m，得到探测起点。哈希值只决定从哪个槽开始，不能保证该槽为空。负整数键在 Python 中取模仍得到非负余数，所以负键也落在合法槽位。',
        en: 'The current key computes h(key) = key % m to choose the probe start. The hash value only chooses where to begin and cannot guarantee the slot is free. Python modulo keeps negative keys nonnegative, so they also land in a valid slot.',
      },
      tip: { zh: '记忆：哈希只定起点，冲突才需要探测。', en: 'Memory hook: the hash only fixes the start; probing handles collisions.' },
    },
    {
      stepId: 'probe',
      title: { zh: '③ 检查槽位、处理冲突与聚集', en: '③ Inspect slots, handle collisions and clustering' },
      explanation: {
        zh: '当前槽可能是 EMPTY、OCCUPIED 或 DELETED。EMPTY 表示查找可以在这里停止；DELETED 只是墓碑，必须继续；OCCUPIED 且键不同才是冲突，要继续；OCCUPIED 且键相等就命中。冲突时线性探测只能顺序检查下一槽，不能跳到别的哈希位置；连续占用段会把后续元素排到更远处，这叫聚集，装载因子越高越明显。下一槽由 (h(key)+i) % m 真实计算，超过 m-1 会回绕到 0。',
        en: 'The current slot may be EMPTY, OCCUPIED or DELETED. EMPTY lets a lookup stop; DELETED is only a tombstone and must be skipped; OCCUPIED with a different key is a collision and probing continues; OCCUPIED with an equal key is a hit. On a collision, linear probing may only inspect the next slot, not jump to a different hash location; a run of occupied slots pushes later entries farther away, which is clustering, and higher load factors make it worse. The next slot is really computed as (h(key)+i) % m and wraps to 0 after m-1.',
      },
      tip: { zh: '记忆：DELETED 不是 EMPTY；线性探测只走下一格，冲突会形成聚集。', en: 'Memory hook: DELETED is not EMPTY; linear probing moves one slot at a time, so collisions cluster.' },
    },
    {
      stepId: 'resolve',
      title: { zh: '④ 写入空位/复用墓碑，或删除留下 DELETED', en: '④ Write into a free slot or tombstone, or delete to DELETED' },
      explanation: {
        zh: '插入前必须扫描完整条探测链：既要查重，也要记住第一个 DELETED。若发现相同键，按“键唯一”策略拒绝插入；否则优先复用第一个 DELETED，没有墓碑才写入 EMPTY。删除命中后把槽改成 DELETED，绝不能写回 EMPTY；否则同一条冲突链后面的键会被截断。',
        en: 'Before insertion the entire probe path is scanned both to detect a duplicate and to remember the first DELETED. An equal key is rejected under the unique-key policy; otherwise the first DELETED is reused, and only when no tombstone exists does the entry go into EMPTY. A successful delete changes the slot to DELETED, never back to EMPTY, or later keys on the same collision path would be cut off.',
      },
      tip: { zh: '记忆：插入可复用墓碑，删除必须留下墓碑。', en: 'Memory hook: insertion may reuse a tombstone; deletion must leave one.' },
    },
    {
      stepId: 'result',
      title: { zh: '⑤ 返回结果并读最终表', en: '⑤ Return the result and read the final table' },
      explanation: {
        zh: '查找命中返回真实槽位；只有遇到 EMPTY 才返回失败。重复键返回 duplicate，不覆盖旧值。删除不存在的键返回 missing，槽位不变。若连续 m 个槽全为 OCCUPIED 且没有 DELETED，返回 full；循环必须有界，不能无限探测。最终帧只统计 OCCUPIED：DELETED 不算元素，但仍占槽、仍影响探测长度；装载因子 = 元素数 / m。',
        en: 'A hit returns the real slot; a miss is returned only after an EMPTY slot is reached. A duplicate returns explicitly and never overwrites the old value. Deleting an absent key returns missing and leaves every slot unchanged. If all m slots are OCCUPIED with no DELETED tombstone, the result is full; the loop must be bounded and never probe forever. The final frame counts only OCCUPIED slots: DELETED is not an entry, but it still occupies a slot and still affects probe length; the load factor = entries / m.',
      },
      tip: { zh: '记忆：平均 O(1) 依赖装载因子；DELETED 不计元素但仍占槽。', en: 'Memory hook: average O(1) depends on the load factor; DELETED is not an entry but still occupies a slot.' },
    },
  ],
  commonMistakes: {
    zh: [
      '用 Python dict 或“重新散列所有元素”代替教学用的三态槽位数组。',
      '删除时直接把槽写成 EMPTY，导致同一条冲突链后面的键查不到。',
      '查找遇到 DELETED 就停止并返回失败，把墓碑误当空槽。',
      '插入只扫描到第一个空位就写入，没有继续查重，造成重复键。',
      '探测忘记 (h(key)+i) % m 的回绕，越界访问或提前结束。',
      '表满时没有边界，继续无限探测；或者把仍有 DELETED 的表误判为“无空位”。',
      '笼统声称哈希查找总是 O(1)，忽略聚集、装载因子和最坏 O(n)。',
    ],
    en: [
      'Using Python dict or rehashing every entry instead of the teaching tri-state slot array.',
      'Writing EMPTY back on delete, which hides later keys on the same collision path.',
      'Stopping at DELETED and returning failure, mistaking a tombstone for an empty slot.',
      'Writing at the first free slot without scanning the rest of the path for duplicates.',
      'Forgetting the (h(key)+i) % m wraparound, causing out-of-range access or an early stop.',
      'Probing forever when full, or declaring a table with DELETED tombstones to have no writable slot.',
      'Claiming hash lookup is always O(1) and ignoring clustering, load factor and the O(n) worst case.',
    ],
  },
};
