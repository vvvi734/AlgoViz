/**
 * Deterministic provider used by Playwright and by humans who want to see the UI
 * without a model. It is only registered when `ALGOLENS_AI_MOCK=1`, and every
 * response says it is a mock: nothing here can be mistaken for a real model.
 */
import type { AIProvider, GenerateInput, GenerateResult, ProviderStatus } from './types';

const FULL_SOLUTION = [
  '```python',
  'def bubble_sort(arr):',
  '    n = len(arr)',
  '    for i in range(n - 1):',
  '        for j in range(n - 1 - i):',
  '            if arr[j] > arr[j + 1]:',
  '                arr[j], arr[j + 1] = arr[j + 1], arr[j]',
  '    return arr',
  '```',
].join('\n');

export class MockProvider implements AIProvider {
  readonly id = 'mock' as const;
  readonly label = 'Mock (test only)';
  readonly mock = true;
  readonly defaultModel = 'mock-tutor';

  async status(): Promise<ProviderStatus> {
    return {
      configured: true,
      reachable: true,
      models: ['mock-tutor', 'mock-leak'],
      defaultModel: 'mock-tutor',
      detail: 'Deterministic fixture; does not call any model.',
    };
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const { meta, model } = input;
    const zh = meta.locale === 'zh';
    const variables = meta.variables.slice(0, 4).map((variable) => {
      const rendered = typeof variable.value === 'string' ? variable.value : JSON.stringify(variable.value);
      return `${variable.name} = ${rendered ?? String(variable.value)} (${variable.type})`;
    });
    const stack = meta.callStackNames.slice(0, 3);

    const facts = [
      zh
        ? `真实帧 ${meta.stepIndex + 1}/${meta.totalEvents}：${meta.eventMessage}`
        : `Real frame ${meta.stepIndex + 1}/${meta.totalEvents}: ${meta.eventMessage}`,
      ...variables,
      ...(stack.length
        ? [zh ? `调用栈：${stack.join(' → ')}` : `Call stack: ${stack.join(' → ')}`]
        : []),
    ].slice(0, 6);

    const explanation =
      model === 'mock-leak'
        ? `${zh ? '这是一段用于验证防剧透的完整解法。' : 'A full solution used to verify leakage protection.'}\n${FULL_SOLUTION}`
        : zh
          ? `MOCK 第 ${input.meta.level} 级：当前第 ${meta.stepIndex + 1} 帧（${meta.eventMessage}）。观察变量如何随这一步变化，而不是只看最终结果。`
          : `MOCK level ${input.meta.level}: frame ${meta.stepIndex + 1} (${meta.eventMessage}). Watch how the variables change for this step rather than the final result.`;

    const issues = meta.traceStale
      ? [zh ? '编辑器里的代码已经修改，当前帧来自上一次运行的源码快照。' : 'The editor was edited; this frame belongs to the previous run snapshot.']
      : [];

    const reply = {
      level: meta.level,
      explanation,
      guidingQuestion: zh
        ? '在进入下一步之前，你预计哪个变量的值会改变？为什么？'
        : 'Before the next step, which variable do you expect to change, and why?',
      observedFacts: facts,
      possibleIssues: issues,
      suggestedNextAction: zh
        ? '点“下一帧”看变化，再说明你观察到的规律。'
        : 'Step to the next frame and describe the pattern you observe.',
      answerDisclosure: meta.level >= 5 ? 'full' : meta.level >= 3 ? 'partial' : 'none',
    };

    // A small delay makes loading/cancel states visible in E2E without slowing tests.
    await new Promise((resolve) => setTimeout(resolve, 25));
    return { text: JSON.stringify(reply), model };
  }
}
