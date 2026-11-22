import { describe, expect, it } from 'vitest';
import { REFERENCE_ANNOTATIONS } from './annotations';
import { localizeReferenceSource, stripReferenceComments } from './localization';
import { loadReferenceCode, type ReferenceLanguage } from './registry';

interface Target {
  algorithmId: string;
  algorithmName: string;
  fileName: string;
  language: ReferenceLanguage;
  anchors: string[];
}

const targets: Target[] = [
  {
    algorithmId: 'static-linked-list',
    algorithmName: '静态链表',
    fileName: 'static_linked_list.c',
    language: 'c',
    anchors: [
      "cur is an array index, not a machine address: the array fixes every node's physical location, so changing a logical successor only rewrites this index and never moves data.",
      'Read the borrowed cell\'s free successor before overwriting its cur: this assignment is what actually removes new_index from the free chain and keeps the rest reachable.',
    ],
  },
  {
    algorithmId: 'static-linked-list',
    algorithmName: '静态链表',
    fileName: 'static_linked_list.cpp',
    language: 'cpp',
    anchors: [
      'cur is an array index, and kNull=-1 is deliberately outside 0..kCapacity-1. That makes a real first cell (index 0) different from the end marker.',
      'The free chain uses the same cur field as the live chain. Advancing freeHead_ to the borrowed cell\'s successor is the actual removal from the free list.',
    ],
  },
  {
    algorithmId: 'static-linked-list',
    algorithmName: '静态链表',
    fileName: 'static_linked_list.py',
    language: 'python',
    anchors: [
      '`None` is the null cursor, never index 0. Every live cursor is an integer in 0..capacity-1, so a physical slot and a logical position stay independent.',
      'Read the next free index before writing `cur[fresh]`; this assignment removes `fresh` from the free chain while preserving the rest of the free suffix.',
    ],
  },
  {
    algorithmId: 'polynomial-add',
    algorithmName: '一元多项式相加',
    fileName: 'polynomial_add.c',
    language: 'c',
    anchors: [
      'The exponent is the ordering key. A descending chain lets the merge choose the next output term from only the two heads, without random access or a coefficient array.',
      'Equal exponents are the only merge case. A zero sum creates no node, but both cursors still advance because both input terms have been consumed.',
    ],
  },
  {
    algorithmId: 'polynomial-add',
    algorithmName: '一元多项式相加',
    fileName: 'polynomial_add.cpp',
    language: 'cpp',
    anchors: [
      '`unique_ptr` owns each node, while `tail_` is a non-owning cursor. Updating `tail_` after linking keeps appends O(1) and avoids a second owning pointer.',
      'Left has the larger exponent and must be emitted first in descending order. Right stays put so it can be compared with the next left term.',
    ],
  },
  {
    algorithmId: 'polynomial-add',
    algorithmName: '一元多项式相加',
    fileName: 'polynomial_add.py',
    language: 'python',
    anchors: [
      'The node constructor rejects zero coefficients and negative exponents immediately, so every chain built from these nodes already satisfies the sparse-term invariant.',
      'Only equal exponents combine. A zero total is omitted, but both cursors advance because both input terms have already been consumed.',
    ],
  },
  {
    algorithmId: 'infix-to-postfix',
    algorithmName: '中缀转后缀',
    fileName: 'infix_to_postfix.c',
    language: 'c',
    anchors: [
      'Read the whole digit run before emitting it. Splitting 12 into 1 and 2 would change the value and make later postfix evaluation wrong.',
      'Push the incoming operator only after the while has emitted every greater-or-equal top; pushing first would reverse its operands.',
    ],
  },
  {
    algorithmId: 'infix-to-postfix',
    algorithmName: '中缀转后缀',
    fileName: 'infix_to_postfix.cpp',
    language: 'cpp',
    anchors: [
      'Consume the entire digit run before appending the token. The token boundary is not known until a non-digit appears.',
      'Push the current operator only after the while has emitted every top with greater-or-equal precedence; this is the left-associative ordering.',
    ],
  },
  {
    algorithmId: 'infix-to-postfix',
    algorithmName: '中缀转后缀',
    fileName: 'infix_to_postfix.py',
    language: 'python',
    anchors: [
      'The left-parenthesis test short-circuits the precedence test; `>=` is required for left associativity, so 8-3-2 emits the first minus first.',
      'Only digits, the four binary operators and parentheses are accepted. A unary minus, exponentiation or variable is rejected instead of assigned a guessed precedence.',
    ],
  },
  {
    algorithmId: 'postfix-eval',
    algorithmName: '后缀表达式求值',
    fileName: 'postfix_eval.c',
    language: 'c',
    anchors: [
      'top is an index, so top < 1 means fewer than two operands. Check before popping; otherwise the second read would use a negative index.',
      'The two popped operands are replaced by one result. Each binary operator therefore reduces stack height by exactly one.',
    ],
  },
  {
    algorithmId: 'postfix-eval',
    algorithmName: '后缀表达式求值',
    fileName: 'postfix_eval.cpp',
    language: 'cpp',
    anchors: [
      'Two operands are required before an operator can run. Checking size avoids back() on an empty vector.',
      'Division by zero is detected before the division expression runs; return an EvalError rather than relying on undefined behavior.',
    ],
  },
  {
    algorithmId: 'postfix-eval',
    algorithmName: '后缀表达式求值',
    fileName: 'postfix_eval.py',
    language: 'python',
    anchors: [
      'A binary operator needs two operands. Check length before pop so an empty or one-item stack raises PostfixError instead of IndexError.',
      'No remaining value means operands were missing; the input never formed one complete expression.',
    ],
  },
  {
    algorithmId: 'bf',
    algorithmName: 'BF 字符串匹配',
    fileName: 'bf.c',
    language: 'c',
    anchors: [
      'Reset j for every candidate. BF keeps no prefix state, so characters already compared under one alignment may be compared again under the next; that is the source of its O(nm) worst case.',
      'The candidate bound s <= n-m makes every s+j a valid text index, so the loop can run to m without a separate bounds check inside.',
    ],
  },
  {
    algorithmId: 'bf',
    algorithmName: 'BF 字符串匹配',
    fileName: 'bf.cpp',
    language: 'cpp',
    anchors: [
      'j restarts at 0 for each start because BF intentionally keeps no matched-prefix state. Previously compared characters may be compared again, giving O(nm) worst-case time.',
      'candidate_count is computed only after the n < m guard, so it is at least one and the unsigned loop has a safe stop.',
    ],
  },
  {
    algorithmId: 'bf',
    algorithmName: 'BF 字符串匹配',
    fileName: 'bf.py',
    language: 'python',
    anchors: [
      'j is reset for every start because BF does not reuse a matched prefix. The same text character can be compared in several alignments, which is why the worst case is O(nm).',
      'The n < m case has already returned, so candidate_count is at least one and range(candidate_count) always has a valid first start.',
    ],
  },
  {
    algorithmId: 'sparse-transpose',
    algorithmName: '稀疏矩阵转置',
    fileName: 'sparse_transpose.c',
    language: 'c',
    anchors: [
      'Scan the source in its existing row-major order. Within one source column, entries appear in increasing source row, which becomes increasing destination column; direct placement therefore produces row-major output.',
      'Advance the cursor after the write. The current triple occupies q; the next triple from the same column must go to q+1, otherwise entries would overwrite each other.',
    ],
  },
  {
    algorithmId: 'sparse-transpose',
    algorithmName: '稀疏矩阵转置',
    fileName: 'sparse_transpose.cpp',
    language: 'cpp',
    anchors: [
      "The source is scanned in its stored row-major order. Within one source column, source rows increase, and after the coordinate swap those become increasing result columns, so each column's block is filled in order.",
      'Increment only after writing. The current item owns q, and the next item from this column must use q+1 or it would overwrite the just-written triple.',
    ],
  },
  {
    algorithmId: 'sparse-transpose',
    algorithmName: '稀疏矩阵转置',
    fileName: 'sparse_transpose.py',
    language: 'python',
    anchors: [
      'Preallocate one destination slot per source triple. Placement writes by random index through cpot, so the list must already have all slots; each slot is then overwritten exactly once.',
      "Move this column's cursor forward only after filling q. The next entry from the same column must land at q+1, so writing and advancing cannot be swapped.",
    ],
  },
  {
    algorithmId: 'gl-depth',
    algorithmName: '广义表深度',
    fileName: 'gl_depth.c',
    language: 'c',
    anchors: [
      'An empty list is a real node representing (), so it counts as one layer. Only a null pointer means no table at all; that case was handled before this check.',
      "Adding one counts the current list's parentheses layer. Taking the maximum rather than the sum is what makes this a depth, not a count of elements.",
    ],
  },
  {
    algorithmId: 'gl-depth',
    algorithmName: '广义表深度',
    fileName: 'gl_depth.cpp',
    language: 'cpp',
    anchors: [
      'A real empty list has no children but still represents one pair of parentheses, so it returns 1; null is only a defensive no-node value.',
      'The +1 accounts for the current list layer; the maximum, not a sum, ensures several sibling branches do not inflate the depth.',
    ],
  },
  {
    algorithmId: 'gl-depth',
    algorithmName: '广义表深度',
    fileName: 'gl_depth.py',
    language: 'python',
    anchors: [
      'A list node with head None is the real empty list (), which still counts as one layer. A missing node is different and was handled by the None check above.',
      'The current list adds one bracket layer; the maximum child depth is used, so sibling alternatives do not add extra levels.',
    ],
  },
  {
    algorithmId: 'gl-copy',
    algorithmName: '广义表复制',
    fileName: 'gl_copy.c',
    language: 'c',
    anchors: [
      "Allocate the copy's parent before descending. Returning src or reusing a child would alias source and copy, so later mutation in one tree would silently change the other.",
      'Attach the copied child at the current slot, then move tail to the child\'s next field. Linking before advancing is what preserves sibling order.',
    ],
  },
  {
    algorithmId: 'gl-copy',
    algorithmName: '广义表复制',
    fileName: 'gl_copy.cpp',
    language: 'cpp',
    anchors: [
      'The new parent must exist before its children are copied. Sharing a source child would make the two trees alias, so a later edit in one would appear in the other.',
      "Write the copied child into the current slot, then advance tail to that child's next field. Reversing the two steps would lose the insertion point.",
    ],
  },
  {
    algorithmId: 'gl-copy',
    algorithmName: '广义表复制',
    fileName: 'gl_copy.py',
    language: 'python',
    anchors: [
      'A fresh node copies the tag and atom value but not head or next. Those links are rebuilt separately, which is what makes this a deep copy rather than an alias.',
      'The first copied child must initialize head; only later children use next. Checking head here is what distinguishes the two cases without a dummy node.',
    ],
  },
  {
    algorithmId: 'threaded-inorder',
    algorithmName: '中序线索二叉树',
    fileName: 'threaded_inorder.c',
    language: 'c',
    anchors: [
      'A missing real left child is exactly the slot that can store the predecessor. prev is NULL only for the first in-order node, and that NULL is itself the correct no-predecessor thread.',
      'Advance prev only after both links are handled. The next node must see this node as its predecessor, while this node\'s successor may be written when the next node is visited.',
    ],
  },
  {
    algorithmId: 'threaded-inorder',
    algorithmName: '中序线索二叉树',
    fileName: 'threaded_inorder.cpp',
    language: 'cpp',
    anchors: [
      'unique_ptr owns only real children; thread targets are non-owning raw pointers. Keeping them separate prevents ownership cycles and accidental deletion of a threaded target.',
      'Move prev after both connections. The next visit must use this node as its predecessor, and this node\'s successor link may be filled when the next node is processed.',
    ],
  },
  {
    algorithmId: 'threaded-inorder',
    algorithmName: '中序线索二叉树',
    fileName: 'threaded_inorder.py',
    language: 'python',
    anchors: [
      'A missing real left child is the slot that stores the predecessor. For the first in-order node PRE is None, which is the correct no-predecessor thread.',
      'Advance PRE after both links. The next node must treat this node as its predecessor, while this node\'s own successor may be linked during the next visit.',
    ],
  },
  {
    algorithmId: 'block-search',
    algorithmName: '分块查找',
    fileName: 'block_search.c',
    language: 'c',
    anchors: [
      'The first block whose maximum reaches target is the only possible block: earlier maxima are too small, and later blocks all start above this maximum.',
      'Inside a block the values are not promised sorted, so only a linear equality scan is valid. A binary search here would assume an ordering the index never guarantees.',
    ],
  },
  {
    algorithmId: 'block-search',
    algorithmName: '分块查找',
    fileName: 'block_search.cpp',
    language: 'cpp',
    anchors: [
      'Earlier blocks have smaller maxima, so this first satisfying block is the only one that can contain target; all later blocks lie strictly above the previous maximum.',
      'The block is scanned linearly because its internal order is not part of the index contract. Only equality can guide this stage; binary search would require sorted data.',
    ],
  },
  {
    algorithmId: 'block-search',
    algorithmName: '分块查找',
    fileName: 'block_search.py',
    language: 'python',
    anchors: [
      'The first block whose maximum is at least target is the only possible block: earlier maxima are too small, and later blocks all start above this maximum.',
      'The selected block is scanned linearly because the index never promises sorted values inside a block. Only equality is a valid test here.',
    ],
  },
];

function codeOnly(source: string, language: ReferenceLanguage): string {
  return stripReferenceComments(source, language)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .join('\n');
}

function localize(source: string, target: Target, lang: 'zh' | 'en'): string {
  return localizeReferenceSource(source, {
    algorithmId: target.algorithmId,
    algorithmName: target.algorithmName,
    language: target.language,
    implementation: 'principle',
    fileName: target.fileName,
    lang,
  });
}

describe('CODE-DOC-04-BATCH-02 teaching annotations', () => {
  for (const target of targets) {
    it(`renders and preserves ${target.fileName} in both languages`, async () => {
      const source = await loadReferenceCode(target.algorithmId, target.language);
      expect(source, target.fileName).not.toBeNull();
      const annotations = REFERENCE_ANNOTATIONS[target.fileName] ?? [];
      expect(annotations.length, target.fileName).toBeGreaterThanOrEqual(6);

      for (const annotation of annotations) {
        expect(source!, `${target.fileName} stale anchor: ${annotation.en}`).toContain(
          annotation.en,
        );
      }

      const zh = localize(source!, target, 'zh');
      const en = localize(source!, target, 'en');
      for (const anchor of target.anchors) {
        const annotation = annotations.find((item) => item.en === anchor);
        expect(annotation, `${target.fileName} missing annotation: ${anchor}`).toBeDefined();
        expect(annotation!.zh, `${target.fileName} missing Chinese: ${anchor}`).toMatch(
          /[\u3400-\u9fff]/,
        );
        expect(zh, `${target.fileName}/zh: ${anchor}`).toContain(annotation!.zh);
        expect(zh, `${target.fileName}/zh still English: ${anchor}`).not.toContain(anchor);
        expect(en, `${target.fileName}/en: ${anchor}`).toContain(anchor);
      }

      expect(en, target.fileName).not.toMatch(/[\u3400-\u9fff]/);
      expect(codeOnly(zh, target.language), `${target.fileName}/zh`).toBe(
        codeOnly(source!, target.language),
      );
      expect(codeOnly(en, target.language), `${target.fileName}/en`).toBe(
        codeOnly(source!, target.language),
      );
    });
  }

  it('has no template-only 作用/Purpose function headers in the 30 reviewed sources', async () => {
    for (const target of targets) {
      const source = await loadReferenceCode(target.algorithmId, target.language);
      expect(source, target.fileName).not.toBeNull();
      expect(source!, `${target.fileName} template label`).not.toContain('作用：');
      expect(source!, `${target.fileName} English Purpose label`).not.toMatch(/\/\/ Purpose:/);
      expect(source!, `${target.fileName} Python Purpose label`).not.toMatch(/# Purpose:/);
    }
  });
});
