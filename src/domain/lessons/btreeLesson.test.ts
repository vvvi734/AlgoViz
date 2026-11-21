import { describe, expect, it } from 'vitest';
import { btreeLesson } from './btreeLesson';
import { lessonRegistry } from './registry';
import { COURSE_GUIDES } from '../guides/courseGuides';

describe('SEARCH-04 B-tree course', () => {
  it('registers exactly one course with the real trace step ids, including deletion', () => {
    expect(lessonRegistry.byAlgorithm('btree')).toBe(btreeLesson);
    expect(lessonRegistry.byId('b-tree-search-insert-split')).toBe(btreeLesson);
    expect(btreeLesson.steps).toHaveLength(17);
    expect(btreeLesson.steps.map((step) => step.stepId)).toEqual([
      'init',
      'inspect',
      'found',
      'descend',
      'not-found',
      'duplicate',
      'split-before',
      'split-after',
      'insert',
      'locate',
      'replace',
      'borrow-left',
      'borrow-right',
      'merge',
      'root-shrink',
      'delete-leaf',
      'done',
    ]);
    for (const step of btreeLesson.steps) {
      expect(step.title.zh.length).toBeGreaterThan(0);
      expect(step.title.en.length).toBeGreaterThan(0);
      expect(step.explanation.zh.length).toBeGreaterThan(20);
      expect(step.explanation.en.length).toBeGreaterThan(20);
    }
  });

  it('keeps the order-4 policy consistent in lesson, complexity and guide', () => {
    expect(btreeLesson.complexity.time).toContain('log_m');
    expect(btreeLesson.complexity.space).toBe('O(n)');
    expect(btreeLesson.complexity.note.zh).toContain('m=4');
    expect(btreeLesson.commonMistakes.zh.length).toBe(btreeLesson.commonMistakes.en.length);

    const guide = COURSE_GUIDES.btree!;
    expect(guide.stages.map((stage) => stage.title.zh)).toEqual([
      '查找：进入当前节点',
      '比较节点内关键字',
      '命中则结束；否则按区间选孩子',
      '进入下一层，回到比较',
      '插入：只读定位并拒绝重复',
      '检查将进入的满节点',
      '分裂：中间关键字上升',
      '选择子树继续下降',
      '到达叶子插入',
      '删除：先证明关键字存在',
      '内部键用左子树最大前驱替换',
      '孩子不足时先向左右兄弟借',
      '兄弟都不够借则父键下移并合并',
      '根被抽空则唯一孩子成为新根',
      '结束：恢复全部约束',
    ]);
    expect(guide.stages[3]!.summary?.zh).toContain('回到');
    expect(guide.conditions.zh.join(' ')).toContain('m=4');
    expect(guide.conditions.zh.join(' ')).toContain('O(log_m n)');
  });
});
