import type { Lesson } from './types';

/**
 * F2 separate-chaining course. Step ids match the real Python `lesson_step`
 * values: init, hash, collision, resolve, result, done.
 */
export const hashChainingLesson: Lesson = {
  lessonId: 'hash-chaining-basics',
  algorithmId: 'hash-chain',
  contentVersion: '1.0.0',
  title: { zh: '链地址法：同桶冲突元素挂成真实链表', en: 'Separate chaining: real linked nodes per bucket' },
  oneLiner: {
    zh: '用 h(key) = key % m 定位桶；冲突元素共享同一个桶，并用真实 next 引用串成链表。',
    en: 'Locate a bucket with h(key) = key % m; colliding entries share that bucket and are linked by real next references.',
  },
  overview: {
    zh: '散列表（哈希表）把键通过散列函数映射到有限个桶，用空间换时间。散列函数 h(key) 决定起点；表长 m 固定时，不同的键可能得到同一个桶，这就是哈希冲突。只要键的可能数量大于桶数，冲突就不可能完全避免。链地址法让每个桶保存一条链表：冲突元素不抢占别的桶，而是挂到同一条链上，节点之间使用真实 next 引用。装载因子 α = n / m 描述平均每桶长度；α 越大，链越长，查找越慢。链地址法的优点是删除直接、实现直观、对装载因子较宽容；缺点是节点额外保存 next 指针，链表分散在内存中，缓存局部性较差。平均/期望查找 O(1 + α)，在 α 有界时可视为 O(1)；但最坏情况所有键落入同一桶，退化为 O(n)。插入、查找、删除的平均代价相同，最坏也都是 O(n)。',
    en: 'A hash table maps keys through a hash function into a finite set of buckets, trading space for time. h(key) chooses the starting bucket; with a fixed table size m, different keys can land in the same bucket, which is a collision. Whenever the key universe is larger than the bucket count, collisions cannot be eliminated. Separate chaining stores one linked list per bucket: colliding entries do not steal another bucket; they join the same chain through real next references. The load factor α = n / m is the average chain length; a larger α means longer chains and slower lookup. Chaining deletes directly, is easy to reason about and tolerates a higher load factor, but every node pays a next pointer and the chains are scattered in memory, hurting locality. Average/expected lookup is O(1 + α), commonly written O(1) while α stays bounded; the worst case sends every key to one bucket and degrades to O(n). Insert, lookup and delete share the same average cost, and all three can be O(n) worst case.',
  },
  intuition: {
    zh: '把 7 个桶想成 7 个带编号的挂钩，每个挂钩下面挂着一条由节点串成的链。键 1、8、15 都算出桶 1，于是它们不冲突地“排队”挂在同一条链上：后插入的节点成为新的桶头，next 指向原来的桶头。查找时先算桶号，再沿链逐个比较键；命中就返回，走到 NULL 就失败。删除不是把整条链清空，而是只摘掉目标节点：桶头、中间、尾节点分别重连不同的指针。',
    en: 'Picture seven numbered hooks, each holding a chain of nodes. Keys 1, 8 and 15 all hash to bucket 1, so they coexist on the same chain: a newly inserted node becomes the new head and its next points at the old head. A lookup computes the bucket and walks the chain comparing keys; a match returns and NULL means failure. Deleting removes only the target node, not the whole chain: head, middle and tail each require a different relink.',
  },
  prerequisites: {
    zh: ['理解数组下标与链表 next 引用', '知道 Python 的 % 对负整数也返回非负余数', '理解键唯一策略与装载因子的含义'],
    en: ['Array indices and linked next references', 'Knowing Python % returns a nonnegative remainder even for negative keys', 'The unique-key policy and what a load factor means'],
  },
  complexity: {
    time: '平均/期望 O(1 + α)；最坏 O(n)',
    space: 'O(n + m)',
    note: {
      zh: 'n 个元素、m 个桶时，平均链长为 α = n/m。一次查找先做一次哈希（O(1)），再沿平均 α 个节点比较，所以平均/期望 O(1 + α)；α 保持有界时常写作 O(1)。最坏情况所有 n 个键落入同一桶，查找、插入前的查重和删除都要走完整条链，退化为 O(n)。空间上需要 m 个头指针和 n 个节点，即 O(n + m)。本批次不做自动扩容，因此 α 会随插入持续上升。',
      en: 'With n entries and m buckets the average chain length is α = n/m. A lookup performs one hash (O(1)) and compares about α nodes, so average/expected cost is O(1 + α), usually written O(1) while α stays bounded. In the worst case all n keys share one bucket, so lookup, duplicate checking and delete walk the entire chain and degrade to O(n). Space is m head pointers plus n nodes, O(n + m). This batch does not resize automatically, so α keeps rising as entries are inserted.',
    },
  },
  steps: [
    {
      stepId: 'init',
      title: { zh: '① 建空表：m 个桶，头指针全为 NULL', en: '① Build an empty table: m buckets with NULL heads' },
      explanation: {
        zh: '官方示例固定表长 m=7，使用 h(key)=key % 7。初始化时每个桶的 head 都是 NULL，元素数为 0，装载因子为 0。这里没有用 Python 内置 dict 代替教学结构，桶数组和节点都由本课程序自己创建。',
        en: 'The official example fixes m = 7 and uses h(key) = key % 7. At initialization every bucket head is NULL, the entry count is 0 and the load factor is 0. Python dict is never substituted for the teaching structure; the bucket array and nodes are created by this lesson program.',
      },
      tip: { zh: '记忆：空桶的头指针是 NULL，不是“空节点”。', en: 'Memory hook: an empty bucket has a NULL head, not an empty node.' },
    },
    {
      stepId: 'hash',
      title: { zh: '② 计算哈希值并定位桶', en: '② Compute the hash and locate the bucket' },
      explanation: {
        zh: '当前键 key 先计算 h(key) = key % m，得到 0..m-1 的桶号。这个结果只决定“从哪个桶开始”，不保证桶里没有别的键。Python 对负整数取模仍返回非负余数，所以负键也能得到合法桶号。',
        en: 'The current key computes h(key) = key % m, producing a bucket index 0..m-1. This only chooses where to start; it does not guarantee the bucket is free. Python modulo still returns a nonnegative remainder for negative keys, so negative keys also map to a valid bucket.',
      },
      tip: { zh: '记忆：哈希函数决定桶，不决定唯一性。', en: 'Memory hook: the hash function chooses a bucket, not uniqueness.' },
    },
    {
      stepId: 'collision',
      title: { zh: '③ 桶内已有节点：发生冲突，沿链比较', en: '③ Non-empty bucket: collision, walk the chain' },
      explanation: {
        zh: '如果目标桶已经挂着节点，就说明当前键与桶内某个键发生了哈希冲突。链地址法不换桶，而是沿真实 next 链逐个比较：键相等就命中或判定重复；键不同就继续前进；走到 NULL 仍未命中则查找失败。',
        en: 'If the target bucket already holds nodes, the current key collides with at least one key in that bucket. Chaining does not move to another bucket; it compares along the real next chain: equality means a hit or duplicate, a different key advances, and reaching NULL means failure.',
      },
      tip: { zh: '记忆：冲突只影响同一条链，不会污染其他桶。', en: 'Memory hook: a collision affects one chain, never another bucket.' },
    },
    {
      stepId: 'resolve',
      title: { zh: '④ 插入头节点或删除后重连 next', en: '④ Link a new head or relink after deletion' },
      explanation: {
        zh: '插入时创建新节点，把它的 next 指向原桶头，再让桶头指向新节点；这是真实的指针更新，不是重新画一个动画节点。删除分三种：桶头删除把桶头改成被删节点的 next；中间节点删除让前驱 next 跳过被删节点；尾节点删除把前驱 next 置为 NULL。三种情况都必须保持链表连通且无环。',
        en: 'Insertion creates a new node, points its next at the old bucket head, then makes the bucket head point at the new node; these are real pointer updates, not a regenerated animation node. Deletion has three cases: removing the head replaces the bucket head with the removed node next; removing a middle node makes the previous next skip it; removing the tail sets the previous next to NULL. All three must keep the chain connected and acyclic.',
      },
      tip: { zh: '记忆：删除只改相邻指针，不要清空整条链。', en: 'Memory hook: deletion changes adjacent pointers, never clears the whole chain.' },
    },
    {
      stepId: 'result',
      title: { zh: '⑤ 返回结果并读最终表', en: '⑤ Return the result and read the final table' },
      explanation: {
        zh: '查找命中返回真实桶号与节点；走到 NULL 则明确失败。重复键策略在本实现中规定为“键唯一”：发现相同键就返回 duplicate，拒绝插入，不覆盖旧值，元素数不变。删除也必须给出明确结果；键不存在时返回 missing，链表保持不变。最终帧只读当前真实状态：元素数等于可达节点数，装载因子 = 元素数 / 表长；它不预测扩容，也不声称哈希查找永远 O(1)。',
        en: 'A hit returns the real bucket and node; reaching NULL is an explicit miss. The duplicate policy here is unique keys: an equal key returns duplicate, the insert is rejected, the old value is never overwritten and the count stays unchanged. Deletion also reports explicitly; an absent key returns missing and the chain is untouched. The final frame reads only the current real state: the entry count equals reachable nodes and the load factor = entries / table size; it neither predicts resizing nor claims hash lookup is always O(1).',
      },
      tip: { zh: '记忆：α = n/m；平均 O(1+α)，全冲突最坏 O(n)。', en: 'Memory hook: α = n/m; average O(1+α), all-collision worst O(n).' },
    },
  ],
  commonMistakes: {
    zh: [
      '直接用 Python dict 冒充教学哈希表，跳过了桶、冲突和 next 引用。',
      '声称哈希查找永远 O(1)，忽略散列分布、装载因子和最坏 O(n)。',
      '冲突时把元素塞进“下一个空桶”，把链地址法做成了线性探测。',
      '删除桶头后忘记把桶头改成被删节点的 next，留下悬空指针。',
      '删除中间或尾节点时没有重连前驱 next，导致链表断裂或成环。',
      '重复键策略在课程、Python 和测试中不一致，或者悄悄覆盖旧值。',
    ],
    en: [
      'Substituting Python dict for the teaching table and skipping buckets, collisions and next references.',
      'Claiming hash lookup is always O(1) and ignoring distribution, load factor and the O(n) worst case.',
      'Putting a colliding entry into the next free bucket, which is linear probing rather than chaining.',
      'Removing the head without updating the bucket head to the removed node next, leaving a dangling pointer.',
      'Removing a middle or tail node without relinking the previous next, breaking or cycling the chain.',
      'Using inconsistent duplicate-key policies across the course, Python and tests, or silently overwriting old values.',
    ],
  },
};
