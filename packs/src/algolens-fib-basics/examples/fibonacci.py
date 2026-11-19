# AlgoViz teaching example — Fibonacci recursion (pack algolens-fib-basics).
# `input` is the JSON from the Input panel, e.g. {"n": 5}, or the catalog's plain number 4.
raw = input
n = int(raw['n'] if isinstance(raw, dict) else raw)

trace({'type': 'array', 'values': [n], 'focus': [0]},
      f'读取 n = {n} / read n = {n}',
      line=3, variables={'n': n}, lesson_step='init')


def fib(k):
    trace({'type': 'array', 'values': [n], 'focus': [0]},
          f'判断 fib({k}) 是否到达递归基 / test the base case of fib({k})',
          line=7, variables={'n': n, 'k': k}, lesson_step='compare')
    if k <= 1:
        return k

    trace({'type': 'array', 'values': [n], 'focus': [0]},
          f'展开 fib({k - 1}) 与 fib({k - 2}) / expand both sub-calls',
          line=11, variables={'n': n, 'k': k}, lesson_step='recurse')
    left = fib(k - 1)
    right = fib(k - 2)
    result = left + right
    trace({'type': 'array', 'values': [n], 'focus': [0]},
          f'合并 fib({k - 1}) + fib({k - 2}) = {result} / combine the results',
          line=14, variables={'n': n, 'k': k, 'left': left, 'right': right},
          lesson_step='combine')
    return result


result = fib(n)
trace({'type': 'array', 'values': [n], 'focus': [0], 'done': True},
      f'fib({n}) = {result} / final result',
      line=20, variables={'n': n, 'result': result}, lesson_step='done')
