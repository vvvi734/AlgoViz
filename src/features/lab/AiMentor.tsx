import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { buildMentorContext, describeMentorContext } from '../../domain/mentor/context';
import type { Lesson } from '../../domain/lessons/types';
import type { TraceEvent } from '../../domain/trace/schema';
import { askMentor, fetchMentorProviders, MentorClientError, newMentorRequestId, type MentorFocus } from '../../runtime/ai/mentorClient';
import type { MentorLevel, MentorReply, ProvidersResponse } from '../../domain/mentor/schema';

interface MentorAnswer {
  id: string;
  requestId: string;
  algorithmId: string;
  algorithmName: string;
  stepIndex: number;
  totalEvents: number;
  traceStale: boolean;
  provider: string;
  model: string;
  level: MentorLevel;
  focus: MentorFocus;
  question: string;
  createdAt: number;
  status: 'pending' | 'done' | 'error' | 'cancelled';
  reply?: MentorReply;
  error?: string;
  latencyMs?: number;
  guardrails?: string[];
  mock?: boolean;
}

interface Props {
  algorithmId: string;
  algorithmName: string;
  lesson?: Lesson;
  event?: TraceEvent;
  events: TraceEvent[];
  stepIndex: number;
  traceStale: boolean;
  code: string;
}

const FOCUS_DEFAULT_QUESTION: Record<MentorFocus, { zh: string; en: string }> = {
  step: { zh: '请解释当前这一步发生了什么，以及为什么。', en: 'Explain what happens in this step and why.' },
  variables: { zh: '请解释当前变量的值为什么是这样。', en: 'Explain why the current variables have these values.' },
  callstack: { zh: '请解释当前调用栈中每一帧的关系。', en: 'Explain how the frames in the current call stack relate.' },
  custom: { zh: '', en: '' },
};

function providerLabel(id: string, t: (key: string) => string): string {
  if (id === 'ollama') return t('aiProviderLocal');
  if (id === 'openai') return t('aiProviderCloud');
  if (id === 'mock') return t('aiProviderMock');
  return id;
}

function errorMessage(error: unknown, t: (key: string) => string, b: (zh: string, en: string) => string): string {
  const code = error instanceof MentorClientError ? error.code : 'unknown';
  const map: Record<string, string> = {
    'gateway-unreachable': t('aiErrGatewayOffline'),
    'provider-unreachable': t('aiErrUnreachable'),
    'provider-auth': t('aiErrorAuth'),
    'provider-timeout': t('aiErrorTimeout'),
    'provider-rate-limit': t('aiErrorRate'),
    'provider-model-not-found': t('aiErrorModel'),
    'invalid-model-response': t('aiErrInvalidModel'),
    'invalid-gateway-response': t('aiErrInvalidGateway'),
    'rate-limited': t('aiErrorRate'),
    'request-too-large': t('aiErrTooLarge'),
    'level5-confirmation-required': t('aiLevel5Warning'),
    aborted: b('请求已中止。', 'Request cancelled.'),
  };
  const text = map[code] ?? (error instanceof Error ? error.message : t('failed'));
  const hint = error instanceof MentorClientError && error.hint ? `\n${error.hint}` : '';
  return `${text}${hint}`;
}

export function AiMentor({ algorithmId, algorithmName, lesson, event, events, stepIndex, traceStale, code }: Props) {
  const { t, b, lang } = useI18n();
  const [providers, setProviders] = useState<ProvidersResponse | null>(null);
  const [gatewayState, setGatewayState] = useState<'loading' | 'online' | 'offline'>('loading');
  const [gatewayError, setGatewayError] = useState('');
  const [showGatewayDetails, setShowGatewayDetails] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [model, setModel] = useState('');
  const [level, setLevel] = useState<MentorLevel>(1);
  const [level5Ack, setLevel5Ack] = useState(false);
  const [question, setQuestion] = useState('');
  const [includeSource, setIncludeSource] = useState(false);
  const [answers, setAnswers] = useState<MentorAnswer[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const active = useRef<{ id: string; controller: AbortController } | null>(null);
  const mounted = useRef(true);

  const selectedProvider = useMemo(
    () => providers?.providers.find((provider) => provider.id === providerId) ?? null,
    [providers, providerId],
  );
  const providerReady = Boolean(selectedProvider && selectedProvider.configured);

  const refreshProviders = useCallback(async (signal?: AbortSignal) => {
    setGatewayState('loading');
    try {
      const result = await fetchMentorProviders(signal);
      setProviders(result);
      setGatewayState('online');
      setGatewayError('');
      const preferred =
        result.providers.find((provider) => provider.id === 'ollama' && provider.reachable) ??
        result.providers.find((provider) => provider.id === 'openai' && provider.configured) ??
        result.providers.find((provider) => provider.mock && provider.configured) ??
        result.providers[0];
      if (preferred) {
        setProviderId((current) =>
          current && result.providers.some((provider) => provider.id === current) ? current : preferred.id,
        );
        setModel((current) => current || preferred.defaultModel || preferred.models[0] || '');
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      setGatewayState('offline');
      setProviders(null);
      setGatewayError(errorMessage(error, t, b));
    }
  }, [b, t]);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void refreshProviders(controller.signal);
    return () => {
      mounted.current = false;
      controller.abort();
      active.current?.controller.abort();
    };
  }, [refreshProviders]);

  useEffect(() => {
    setModel(selectedProvider?.defaultModel ?? selectedProvider?.models[0] ?? '');
  }, [selectedProvider]);

  const markCancelled = useCallback((id: string | undefined) => {
    if (!id) return;
    setAnswers((current) =>
      current.map((answer) => (answer.id === id && answer.status === 'pending' ? { ...answer, status: 'cancelled' } : answer)),
    );
    setPending(null);
  }, []);

  const abortActive = useCallback(
    (reason: string) => {
      if (active.current) {
        active.current.controller.abort();
        markCancelled(active.current.id);
        active.current = null;
        setPending(null);
      }
      if (reason === 'clear') setAnswers([]);
    },
    [markCancelled],
  );

  // A new frame or algorithm invalidates in-flight answers: an answer about
  // frame 3 must never appear as the answer for frame 7.
  useEffect(() => {
    if (active.current) {
      active.current.controller.abort();
      markCancelled(active.current.id);
      active.current = null;
    }
    setPending(null);
    setAnswers([]);
    setLevel(1);
    setLevel5Ack(false);
    setQuestion('');
  }, [algorithmId, stepIndex, markCancelled]);

  const execute = useCallback(
    async (args: { level: MentorLevel; focus: MentorFocus; question: string; confirmFullSolution: boolean }) => {
      if (!event) {
        setGatewayError(b('请先运行算法，AI 才能解释真实执行帧。', 'Run the algorithm first so AI has a real frame to explain.'));
        return;
      }
      if (!selectedProvider || !providerReady) return;
      if (args.level === 5 && !args.confirmFullSolution) return;

      abortActive('replace');
      const id = `answer-${newMentorRequestId()}`;
      const requestId = newMentorRequestId();
      const controller = new AbortController();
      active.current = { id, controller };
      setPending(id);

      const context = buildMentorContext({
        algorithmId,
        lesson,
        event,
        totalEvents: events.length,
        locale: lang,
        traceStale,
        source: includeSource ? code : null,
      });

      const answer: MentorAnswer = {
        id,
        requestId,
        algorithmId,
        algorithmName,
        stepIndex: event.step,
        totalEvents: events.length,
        traceStale,
        provider: selectedProvider.id,
        model,
        level: args.level,
        focus: args.focus,
        question: args.question,
        createdAt: Date.now(),
        status: 'pending',
      };
      setAnswers((current) => [...current, answer]);

      try {
        const envelope = await askMentor(
          {
            provider: selectedProvider.id,
            model,
            level: args.level,
            locale: lang,
            focus: args.focus,
            context,
            requestId,
            ...(args.question.trim() ? { question: args.question.trim() } : {}),
            ...(args.confirmFullSolution ? { confirmFullSolution: true } : {}),
          },
          controller.signal,
        );
        if (!mounted.current) return;
        setAnswers((current) =>
          current.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  status: 'done',
                  reply: envelope.reply,
                  latencyMs: envelope.meta.latencyMs,
                  guardrails: envelope.meta.guardrails,
                  mock: envelope.meta.mock,
                }
              : entry,
          ),
        );
      } catch (error) {
        if (!mounted.current) return;
        const aborted = (error as Error).name === 'AbortError' || (error instanceof MentorClientError && error.code === 'aborted');
        setAnswers((current) =>
          current.map((entry) =>
            entry.id === id
              ? { ...entry, status: aborted ? 'cancelled' : 'error', error: aborted ? undefined : errorMessage(error, t, b) }
              : entry,
          ),
        );
        if (error instanceof MentorClientError && error.code === 'gateway-unreachable') {
          setGatewayState('offline');
          setGatewayError(errorMessage(error, t, b));
        }
        if (error instanceof MentorClientError && (error.code === 'provider-auth' || error.code === 'provider-unreachable')) {
          void refreshProviders();
        }
      } finally {
        if (active.current?.id === id) {
          active.current = null;
          setPending(null);
        }
      }
    },
    [abortActive, algorithmId, b, code, event, events.length, includeSource, lang, lesson, model, providerReady, refreshProviders, selectedProvider, t, traceStale],
  );

  const send = (focus: MentorFocus, questionText: string, selectedLevel: MentorLevel) => {
    if (selectedLevel === 5 && !level5Ack) return;
    void execute({
      level: selectedLevel,
      focus,
      question: questionText,
      confirmFullSolution: selectedLevel === 5 && level5Ack,
    });
  };

  const preset = (focus: MentorFocus) => {
    const text = question.trim() || FOCUS_DEFAULT_QUESTION[focus][lang];
    setQuestion(text);
    send(focus, text, level);
  };

  const nextLevel = () => {
    const next = Math.min(level + 1, 5) as MentorLevel;
    setLevel(next);
    if (next === 5 && !level5Ack) return; // the confirm panel appears instead
    const text = question.trim() || FOCUS_DEFAULT_QUESTION.step[lang];
    setQuestion(text);
    send('step', text, next);
  };

  const localHint = b(
    `本地教学提示（非 AI）：当前真实帧 ${event ? `${event.step + 1}/${events.length}` : '尚不可用'}` +
      `${event ? `，${event.message || '无步骤说明'}` : '。先运行算法'}。` +
      `${event?.variables?.length ? `观察变量：${event.variables.map((item) => `${item.name}=${JSON.stringify(item.value)}`).join('，')}。` : ''}` +
      '你能预测下一步哪个值会改变吗？为什么？',
    `Local teaching hint (not AI): frame ${event ? `${event.step + 1}/${events.length}` : 'not available yet'}` +
      `${event ? ` — ${event.message || 'no step description'}` : '. Run the algorithm first'}. ` +
      `${event?.variables?.length ? `Variables: ${event.variables.map((item) => `${item.name}=${JSON.stringify(item.value)}`).join(', ')}. ` : ''}` +
      'Which value do you predict will change next, and why?',
  );

  return (
    <section className="panel pad mentor" data-testid="mentor-panel">
      <div className="sectionhead">
        <h2>{t('aiMentor')}</h2>
        <span className={`tag ${gatewayState === 'offline' ? 'tag-warn' : ''}`} data-testid="mentor-status">
          {gatewayState === 'loading'
            ? t('aiConnecting')
            : gatewayState === 'online'
              ? t('aiGatewayOnline')
              : t('aiGatewayOffline')}
        </span>
      </div>
      <p className="muted smalltext">{t('mentorDesc')}</p>

      {gatewayState !== 'online' && (
        <div className={`mentor-offline ${gatewayState === 'offline' ? 'is-error' : ''}`}>
          <p>{gatewayState === 'loading' ? t('aiConnecting') : t('aiOfflineHelp')}</p>
          {gatewayError && (
            <p className="mentor-error-line">
              <span className="mentor-error">{t('aiServiceUnavailable')}</span>
              <button
                type="button"
                className="linkbtn"
                aria-expanded={showGatewayDetails}
                data-testid="mentor-error-details"
                onClick={() => setShowGatewayDetails((value) => !value)}
              >
                {showGatewayDetails ? t('aiHideDetails') : t('aiShowDetails')}
              </button>
            </p>
          )}
          {showGatewayDetails && gatewayError && (
            <pre className="mentor-error-details" data-testid="mentor-error-detail-body">{gatewayError}</pre>
          )}
          <p className="mentor-localhint" data-testid="mentor-local-hint">
            {localHint}
          </p>
          <button type="button" className="btn btn-ghost" onClick={() => void refreshProviders()}>
            {t('aiRetry')}
          </button>
        </div>
      )}

      {gatewayState === 'online' && (
        <>
          <div className="mentor-row">
            <label className="mentor-field">
              <span>{t('aiProvider')}</span>
              <select
                value={providerId}
                data-testid="mentor-provider"
                onChange={(change) => setProviderId(change.target.value)}
              >
                {(providers?.providers ?? []).map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {providerLabel(provider.id, t)}
                    {provider.mock ? ` · ${t('aiMockBadge')}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="mentor-field">
              <span>{t('aiModel')}</span>
              <select value={model} data-testid="mentor-model" onChange={(change) => setModel(change.target.value)}>
                {(selectedProvider?.models.length ? selectedProvider.models : model ? [model] : []).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedProvider && (
            <p className="mentor-provider-status smalltext" data-testid="mentor-provider-status">
              <span className={`dot ${selectedProvider.reachable ? 'ok' : selectedProvider.configured ? 'idle' : 'bad'}`} />
              {selectedProvider.reachable
                ? b('已连接', 'Connected')
                : selectedProvider.configured
                  ? b('已配置（提问时才会真正连接）', 'Configured (connectivity is proven on send)')
                  : b('未配置', 'Not configured')}
              {selectedProvider.detail ? ` · ${selectedProvider.detail}` : ''}
              {selectedProvider.mock ? ` · ${t('aiMockBadge')}` : ''}
            </p>
          )}

          {!event && <p className="smalltext mentor-note">{t('aiNeedRun')}</p>}
          {event && (
            <div className="mentor-context smalltext" data-testid="mentor-context">
              <span>
                {algorithmName} · {b('真实帧', 'frame')} {event.step + 1}/{events.length}
              </span>
              {event.variables?.length ? <span>{event.variables.map((item) => item.name).join(', ')}</span> : null}
              {event.callStack?.length ? <span>{event.callStack.map((frame) => frame.name).join(' → ')}</span> : null}
            </div>
          )}

          {traceStale && <p className="mentor-warn smalltext">{t('aiStaleNote')}</p>}

          <div className="mentor-presets">
            <button type="button" className="btn btn-ghost" disabled={!event} data-testid="mentor-explain-step" onClick={() => preset('step')}>
              {t('aiExplainStep')}
            </button>
            <button type="button" className="btn btn-ghost" disabled={!event} data-testid="mentor-explain-vars" onClick={() => preset('variables')}>
              {t('aiExplainVariables')}
            </button>
            <button type="button" className="btn btn-ghost" disabled={!event} data-testid="mentor-explain-stack" onClick={() => preset('callstack')}>
              {t('aiExplainCallStack')}
            </button>
            <button type="button" className="btn btn-ghost" disabled={!event} data-testid="mentor-next-level" onClick={nextLevel}>
              {t('aiNextHint')}
            </button>
          </div>

          <label className="mentor-field mentor-level">
            <span>{t('aiLevel')}</span>
            <select
              value={level}
              data-testid="mentor-level"
              onChange={(change) => {
                setLevel(Number(change.target.value) as MentorLevel);
                setLevel5Ack(false);
              }}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {t(`level${value}`)}
                </option>
              ))}
            </select>
          </label>

          {level === 5 && (
            <div className="mentor-level5" data-testid="mentor-level5-warning">
              <p>{t('aiLevel5Warning')}</p>
              <label className="mentor-check">
                <input
                  type="checkbox"
                  checked={level5Ack}
                  data-testid="mentor-level5-ack"
                  onChange={(change) => setLevel5Ack(change.target.checked)}
                />
                <span>{t('aiLevel5Confirm')}</span>
              </label>
            </div>
          )}

          {selectedProvider?.id === 'openai' && (
            <p className="mentor-warn smalltext" data-testid="mentor-cloud-privacy">
              {t('aiCloudPrivacy')}
            </p>
          )}

          <textarea
            className="prompt"
            value={question}
            placeholder={t('mentorPlaceholder')}
            aria-label={t('aiQuestionLabel')}
            data-testid="mentor-question"
            onChange={(change) => setQuestion(change.target.value)}
          />
          <div className="mentor-context smalltext">
            {event
              ? describeMentorContext(
                  buildMentorContext({
                    algorithmId,
                    lesson,
                    event,
                    totalEvents: events.length,
                    locale: lang,
                    traceStale,
                    source: includeSource ? code : null,
                  }),
                  lang,
                ).join(' · ')
              : t('aiNeedRun')}
          </div>

          <label className="mentor-check smalltext">
            <input
              type="checkbox"
              checked={includeSource}
              data-testid="mentor-include-source"
              onChange={(change) => setIncludeSource(change.target.checked)}
            />
            <span>{t('aiSourceInclude')}</span>
          </label>
          {includeSource && <p className="mentor-warn smalltext">{t('aiSourceWarning')}</p>}

          <div className="mentor-actions">
            <button
              type="button"
              className="btn"
              data-testid="mentor-send"
              disabled={!event || !providerReady || (level === 5 && !level5Ack)}
              onClick={() => {
                const text = question.trim() || FOCUS_DEFAULT_QUESTION.custom[lang];
                send('custom', text, level);
              }}
            >
              {pending ? t('aiGenerating') : t('aiSend')}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              data-testid="mentor-stop"
              disabled={!pending}
              onClick={() => abortActive('stop')}
            >
              {t('aiStop')}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              data-testid="mentor-clear"
              disabled={answers.length === 0 && !pending}
              onClick={() => abortActive('clear')}
            >
              {t('aiClear')}
            </button>
          </div>

          {!providerReady && (
            <>
              <p className="mentor-warn smalltext">{t('aiProviderNotReady')}</p>
              <p className="mentor-localhint smalltext" data-testid="mentor-local-hint">
                {localHint}
              </p>
            </>
          )}

          <div className="mentor-answers" data-testid="mentor-answers">
            {answers.length === 0 && <p className="muted smalltext">{t('aiEmpty')}</p>}
            {answers.map((answer, index) => {
              const isCurrent = answer.stepIndex === stepIndex && answer.algorithmId === algorithmId;
              return (
                <article
                  key={answer.id}
                  className={`mentor-answer ${answer.status}`}
                  data-testid={`mentor-answer-${index}`}
                >
                  <header className="mentor-answer-head">
                    <span className="tag">
                      {answer.algorithmName} · {b('帧', 'frame')} {answer.stepIndex + 1}/{answer.totalEvents}
                    </span>
                    <span className="tag">L{answer.level}</span>
                    {answer.mock && <span className="tag tag-warn">{t('aiMockBadge')}</span>}
                    {!isCurrent && <span className="tag tag-warn">{t('aiOldAnswer')}</span>}
                    {answer.reply && <span className="tag">{t(`disclosure.${answer.reply.answerDisclosure}`)}</span>}
                  </header>
                  {answer.status === 'pending' && <p className="muted">{t('aiWaiting')}</p>}
                  {answer.status === 'cancelled' && <p className="muted">{t('aiCancelled')}</p>}
                  {answer.status === 'cancelled' && !isCurrent && <p className="smalltext">{t('aiOldAnswer')}</p>}
                  {answer.status === 'error' && <p className="mentor-error">{answer.error}</p>}
                  {answer.reply && (
                    <div className="mentor-answer-body" data-testid={`mentor-answer-body-${index}`}>
                      <p className="mentor-explanation">{answer.reply.explanation}</p>
                      {answer.reply.guidingQuestion && (
                        <p className="mentor-question-line">
                          <strong>{t('aiGuidingQuestion')}:</strong> {answer.reply.guidingQuestion}
                        </p>
                      )}
                      {answer.reply.observedFacts.length > 0 && (
                        <div>
                          <h3 className="mentor-subhead">{t('aiObservedFacts')}</h3>
                          <ul>
                            {answer.reply.observedFacts.map((fact) => (
                              <li key={fact}>{fact}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {answer.reply.possibleIssues.length > 0 && (
                        <div>
                          <h3 className="mentor-subhead">{t('aiPossibleIssues')}</h3>
                          <ul>
                            {answer.reply.possibleIssues.map((issue) => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="smalltext">
                        <strong>{t('aiNextAction')}:</strong> {answer.reply.suggestedNextAction}
                      </p>
                      <p className="mentor-meta smalltext">
                        {providerLabel(answer.provider, t)} · {answer.model} · {answer.latencyMs ?? '—'} ms
                        {answer.guardrails?.includes('code-redacted') ? ` · ${t('aiRedacted')}` : ''}
                      </p>
                      {answer.traceStale && <p className="mentor-warn smalltext">{t('aiStaleNote')}</p>}
                      <p className="muted smalltext">{t('aiDisclaimer')}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
