import { useState } from 'react';
import { askAi, type AiReply } from '../../runtime/ai/client';
import type { StatusMessage } from './useLabController';
import { Feedback } from '../../components/Feedback';
import { useI18n } from '../../i18n/I18nProvider';

export function AiMentor({
  apiUrl,
  algorithmName,
  currentFrameMessage,
  code,
}: {
  apiUrl: string;
  algorithmName: string;
  currentFrameMessage: string | undefined;
  code: string;
}) {
  const { t, b, lang } = useI18n();
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<StatusMessage>({ text: '', error: false });

  const localHint = () => b(
    `观察当前步骤：${currentFrameMessage || '先运行算法'}。你能说出循环不变量是什么？如果输入为空或存在重复值会怎样？`,
    `Look at the current step: ${currentFrameMessage || 'run the algorithm first'}. What invariant is maintained? What happens for empty or duplicate inputs?`,
  );

  const ask = async () => {
    setStatus({ text: b('请求中……', 'Requesting…'), error: false });
    try {
      const reply: AiReply = await askAi({
        url: apiUrl,
        action: 'tutor',
        language: lang,
        payload: {
          algorithm: algorithmName,
          question,
          currentStepMessage: currentFrameMessage ?? null,
          code: code.slice(0, 8000),
          instruction: 'Provide leading questions and progressive hints; do not immediately reveal full solutions.',
        },
      });
      if (reply.kind === 'text') setStatus({ text: `${reply.reply}\n\n${t('answerWarn')}`, error: false });
    } catch (error) {
      setStatus({
        text: `${t('aiUnavailable')}\n${localHint()}\n\n${t('failed')}: ${(error as Error).message}`,
        error: true,
      });
    }
  };

  return (
    <section className="panel pad">
      <div className="sectionhead"><h2>{t('aiMentor')}</h2><span className="tag">SOCRATIC</span></div>
      <p className="muted smalltext">{t('mentorDesc')}</p>
      <textarea
        className="prompt"
        placeholder={t('mentorPlaceholder')}
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        aria-label="Question for AI coach"
      />
      <button className="btn" onClick={() => void ask()}>{t('askAi')}</button>
      <Feedback status={status} />
    </section>
  );
}
