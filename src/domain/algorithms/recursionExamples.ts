/**
 * RECUR-01: the two real Python recursion programs used by the canvas.
 *
 * These are executable Python sources, not storyboards. `@tracked` creates one
 * frame per real call, records the argument/return value and pushes/pops the
 * genuine call stack; every `trace()` below adds a teaching observation at the
 * moment it happens. The trace helpers are injected by the Pyodide bootstrap.
 *
 * The limit checks are repeated here on purpose. If an old JSON input or a
 * caller bypasses the React editor, execution fails with a real Python error
 * and the controller clears the previous animation; the recursion is never
 * cut short and the last frame never pretends all calls completed.
 */
export const FACTORIAL_DEFAULT_INPUT = 4;
export const FIB_DEFAULT_INPUT = 4;

export const FACTORIAL_PYTHON = `# Real recursive factorial. n! = n * (n-1)!, with 0! = 1.
MAX_N = 10

if not isinstance(input, int) or isinstance(input, bool) or input < 0:
    raise ValueError("factorial n must be a non-negative integer")
if input > MAX_N:
    raise ValueError(f"factorial n must be <= {MAX_N}; got {input}")

@tracked(call_step='call', return_step='return')
def factorial(n):
    if n <= 1:
        trace(
            stack_state(),
            f"factorial({n}) 到达终止条件：返回 1 / base case",
            line=12,
            variables={'n': n},
            lesson_step='check',
        )
        return 1
    trace(
        stack_state(),
        f"factorial({n}) 继续递归到 factorial({n - 1}) / recurse",
        line=20,
        variables={'n': n, 'next_n': n - 1},
        lesson_step='recurse',
    )
    partial = factorial(n - 1)
    result = n * partial
    trace(
        stack_state(),
        f"{n} × {partial} = {result}：子调用返回后本层才相乘 / combine",
        line=29,
        variables={'n': n, 'partial': partial, 'result': result},
        lesson_step='combine',
    )
    return result

answer = factorial(input)
trace(
    {'type': 'stack', 'values': [], 'done': True},
    f"factorial({input}) = {answer}：全部调用已返回 / done",
    line=39,
    variables={'answer': answer},
    lesson_step='done',
)
`;

export const FIB_PYTHON = `# Naive recursive Fibonacci. No cache: repeated subproblems are intentional.
MAX_N = 8

if not isinstance(input, int) or isinstance(input, bool) or input < 0:
    raise ValueError("fib n must be a non-negative integer")
if input > MAX_N:
    raise ValueError(f"fib n must be <= {MAX_N}; got {input}")

@tracked(call_step='call', return_step='return')
def fib(n):
    if n <= 1:
        trace(
            stack_state(),
            f"fib({n}) 到达终止条件：返回 {n} / base case",
            line=12,
            variables={'n': n},
            lesson_step='base',
        )
        return n
    trace(
        stack_state(),
        f"fib({n}) 展开左分支 fib({n - 1}) / expand left branch",
        line=20,
        variables={'n': n, 'left_n': n - 1},
        lesson_step='left',
    )
    left = fib(n - 1)
    trace(
        stack_state(),
        f"fib({n}) 的左分支返回 {left} / left branch returned",
        line=28,
        variables={'n': n, 'left': left},
        lesson_step='left-return',
    )
    trace(
        stack_state(),
        f"fib({n}) 展开右分支 fib({n - 2}) / expand right branch",
        line=35,
        variables={'n': n, 'left': left, 'right_n': n - 2},
        lesson_step='right',
    )
    right = fib(n - 2)
    trace(
        stack_state(),
        f"fib({n}) 的右分支返回 {right} / right branch returned",
        line=43,
        variables={'n': n, 'left': left, 'right': right},
        lesson_step='right-return',
    )
    result = left + right
    trace(
        stack_state(),
        f"合并：{left} + {right} = {result} / combine two child results",
        line=51,
        variables={'n': n, 'left': left, 'right': right, 'result': result},
        lesson_step='combine',
    )
    return result

answer = fib(input)
trace(
    {'type': 'stack', 'values': [], 'done': True},
    f"fib({input}) = {answer}：全部调用已返回 / done",
    line=61,
    variables={'answer': answer},
    lesson_step='done',
)
`;

export function recursionPythonExample(algorithmId: string): string | undefined {
  if (algorithmId === 'factorial') return FACTORIAL_PYTHON;
  if (algorithmId === 'fib') return FIB_PYTHON;
  return undefined;
}

export function recursionDefaultInput(algorithmId: string): unknown {
  if (algorithmId === 'factorial') return FACTORIAL_DEFAULT_INPUT;
  if (algorithmId === 'fib') return FIB_DEFAULT_INPUT;
  return undefined;
}
