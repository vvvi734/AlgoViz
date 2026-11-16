import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { AiMentor } from './AiMentor';
import { I18nProvider } from '../../i18n/I18nProvider';
import type { Lesson } from '../../domain/lessons/types';
import type { TraceEvent } from '../../domain/trace/schema';

const lesson: Lesson = {
  lessonId: 'bubble-sort-basics',
  algorithmId: 'bubble-sort',
  contentVersion: '1',
  title: { zh: '冒泡排序', en: 'Bubble sort' },
  oneLiner: { zh: '一句话', en: 'One line' },
  overview: { zh: '概览', en: 'Overview' },
  intuition: { zh: '思路', en: 'Idea' },
  prerequisites: { zh: [], en: [] },
  complexity: { time: 'O(n²)', space: 'O(1)', note: { zh: '备注', en: 'Note' } },
  steps: [
    {
      stepId: 'compare',
      title: { zh: '比较相邻元素', en: 'Compare neighbours' },
      explanation: { zh: '比较左右两个元素。', en: 'Compare the two elements.' },
    },
  ],
  commonMistakes: { zh: [], en: [] },
};

function event(step = 2): TraceEvent {
  return {
    schemaVersion: 1,
    step,
    eventType: 'compare',
    visualType: 'array',
    state: { type: 'array', items: [5, 2, 8, 1, 6, 3] },
    message: 'comparing arr[1]=2 with arr[2]=8',
    sourceLocation: { line: 4 },
    variables: [
      { name: 'i', type: 'int', value: 0 },
      { name: 'j', type: 'int', value: 1 },
      { name: 'arr', type: 'list', value: [5, 2, 8, 1, 6, 3] },
    ],
    callStack: [{ name: 'bubble_sort', depth: 0, line: 3, status: 'running' }],
    lessonStepId: 'compare',
  };
}

const providersBody = {
  ok: true,
  gatewayVersion: '0.7.0-phase6a',
  providers: [
    {
      id: 'ollama',
      label: 'Ollama (local)',
      configured: true,
      reachable: false,
      models: [],
      defaultModel: null,
      detail: 'not running',
      mock: false,
    },
    {
      id: 'mock',
      label: 'Mock (test only)',
      configured: true,
      reachable: true,
      models: ['mock-tutor', 'mock-leak'],
      defaultModel: 'mock-tutor',
      mock: true,
    },
  ],
};

function replyBody(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    reply: {
      level: 2,
      explanation: '当前这一步在比较 arr[1] 与 arr[2]。',
      guidingQuestion: '你预计下一步哪个变量会变？',
      observedFacts: ['真实帧 3/6：comparing arr[1]=2 with arr[2]=8', 'i = 0', 'arr = [5,2,8,1,6,3]'],
      possibleIssues: [],
      suggestedNextAction: '点下一帧继续观察。',
      answerDisclosure: 'none',
    },
    meta: {
      requestId: 'req-1',
      provider: 'mock',
      model: 'mock-tutor',
      level: 2,
      stepIndex: 2,
      totalEvents: 6,
      traceStale: false,
      sourceIncluded: false,
      latencyMs: 42,
      guardrails: [],
      mock: true,
    },
    disclaimer: '模型解释不是执行结果。',
    ...overrides,
  };
}

function renderMentor(props: Partial<React.ComponentProps<typeof AiMentor>> = {}) {
  return render(
    <I18nProvider>
      <AiMentor
        algorithmId="bubble-sort"
        algorithmName="Bubble sort"
        lesson={lesson}
        event={event()}
        events={[event(0), event(1), event(2), event(3), event(4), event(5)]}
        stepIndex={2}
        traceStale={false}
        code="def bubble_sort(arr): ..."
        {...props}
      />
    </I18nProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AiMentor', () => {
  it('shows provider/model/connection state and sends the real frame', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/providers')) {
        return new Response(JSON.stringify(providersBody), { status: 200 });
      }
      return new Response(JSON.stringify(replyBody()), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderMentor();
    await waitFor(() => expect(screen.getByTestId('mentor-status').textContent).toContain('AI 网关已连接'));
    expect((screen.getByTestId('mentor-provider') as HTMLSelectElement).value).toBe('mock');
    expect(screen.getByTestId('mentor-context').textContent).toContain('3/6');

    fireEvent.click(screen.getByTestId('mentor-explain-step'));
    await waitFor(() => expect(screen.getByTestId('mentor-answer-body-0')).toBeTruthy());

    expect(screen.getByTestId('mentor-answer-body-0').textContent).toContain('i = 0');
    expect(screen.getByTestId('mentor-answer-0').textContent).toContain('帧 3/6');

    const mentorCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/mentor'));
    expect(mentorCall).toBeTruthy();
    const body = JSON.parse(String(mentorCall?.[1]?.body)) as {
      context: { stepIndex: number; event: { step: number }; focus: string };
      provider: string;
    };
    expect(body.context.stepIndex).toBe(2);
    expect(body.context.event.step).toBe(2);
    expect((body as unknown as { focus: string }).focus).toBe('step');
    expect(body.context).toHaveProperty('event');
    expect(body.provider).toBe('mock');
  });

  it('does not present an in-flight answer as the answer for a new step', async () => {
    let resolveMentor: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/api/providers')) {
        return new Response(JSON.stringify(providersBody), { status: 200 });
      }
      return new Promise<Response>((resolve) => {
        resolveMentor = resolve;
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const view = renderMentor();
    await waitFor(() => expect(screen.getByTestId('mentor-status').textContent).toContain('AI 网关已连接'));
    fireEvent.click(screen.getByTestId('mentor-explain-step'));
    expect(screen.getByTestId('mentor-answer-0').textContent).toContain('等待模型回复');

    view.rerender(
      <I18nProvider>
        <AiMentor
          algorithmId="bubble-sort"
          algorithmName="Bubble sort"
          lesson={lesson}
          event={event(4)}
          events={[event(0), event(1), event(2), event(3), event(4), event(5)]}
          stepIndex={4}
          traceStale={false}
          code="def bubble_sort(arr): ..."
        />
      </I18nProvider>,
    );

    resolveMentor?.(new Response(JSON.stringify(replyBody()), { status: 200 }));
    await waitFor(() => expect(screen.queryByTestId('mentor-answer-body-0')).toBeNull());
    expect(screen.getByTestId('mentor-context').textContent).toContain('5/6');
  });

  it('falls back to a clearly labelled local hint when the Gateway is offline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    renderMentor();
    await waitFor(() => expect(screen.getByTestId('mentor-status').textContent).toContain('AI 未连接'));
    expect(screen.getByTestId('mentor-local-hint').textContent).toContain('本地教学提示（非 AI）');
    expect(screen.queryByTestId('mentor-send')).toBeNull();
  });

  it('requires an explicit confirmation before a Level 5 request is sent', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      if (String(input).endsWith('/api/providers')) {
        return new Response(JSON.stringify(providersBody), { status: 200 });
      }
      return new Response(JSON.stringify(replyBody({ reply: { ...replyBody().reply, level: 5 } })), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderMentor();
    await waitFor(() => expect(screen.getByTestId('mentor-status').textContent).toContain('AI 网关已连接'));
    fireEvent.change(screen.getByTestId('mentor-level'), { target: { value: '5' } });
    expect(screen.getByTestId('mentor-level5-warning')).toBeTruthy();
    expect((screen.getByTestId('mentor-send') as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByTestId('mentor-level5-ack'));
    expect((screen.getByTestId('mentor-send') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByTestId('mentor-send'));

    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/api/mentor'))).toBe(true));
    const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/mentor'));
    const body = JSON.parse(String(call?.[1]?.body)) as { level: number; confirmFullSolution?: boolean };
    expect(body.level).toBe(5);
    expect(body.confirmFullSolution).toBe(true);
  });

  it('marks a request as cancelled when the user presses Stop', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/api/providers')) {
        return new Response(JSON.stringify(providersBody), { status: 200 });
      }
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderMentor();
    await waitFor(() => expect(screen.getByTestId('mentor-status').textContent).toContain('AI 网关已连接'));
    fireEvent.click(screen.getByTestId('mentor-explain-step'));
    await waitFor(() => expect((screen.getByTestId('mentor-stop') as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByTestId('mentor-stop'));

    await waitFor(() => expect(screen.getByTestId('mentor-answer-0').textContent).toContain('请求已中止'));
    expect(screen.queryByTestId('mentor-answer-body-0')).toBeNull();
  });
});
