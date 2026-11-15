import { describe, expect, it } from 'vitest';
import { pickLocalAlgorithm } from './localDemo';

describe('local demo keyword routing', () => {
  it.each([
    ['binary search', 'binary'],
    ['二分查找', 'binary'],
    ['BFS 广度优先', 'bfs'],
    ['队列遍历', 'bfs'],
    ['queue demo', 'bubble'],
    ['dfs 深度', 'dfs'],
    ['栈 stack', 'stack'],
    ['快排 quicksort', 'quick'],
    ['anything else', 'bubble'],
    ['', 'bubble'],
  ])('maps %j to %s', (query, expected) => {
    expect(pickLocalAlgorithm(query)).toBe(expected);
  });
});
