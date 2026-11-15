import { useState } from 'react';
import { askAi } from '../../runtime/ai/client';
import type { GeneratedAlgorithm } from '../../runtime/ai/client';
import { pickLocalAlgorithm } from './localDemo';
import { Feedback } from '../../components/Feedback';
import type { StatusMessage } from '../lab/useLabController';
import { useI18n } from '../../i18n/I18nProvider';

export function CustomImportView({
  apiUrl,
  onImport,
  onLocalDemo,
  onGoToLab,
}: {
  apiUrl: string;
  onImport: (generated: GeneratedAlgorithm) => void;
  onLocalDemo: (algorithmId: string) => void;
  onGoToLab: () => void;
}) {
  const { t, b, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusMessage>({ text: '', error: false });

  const generate = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setStatus({ text: b('请先描述一个算法。', 'Describe an algorithm first.'), error: true });
      return;
    }
    setStatus({ text: t('generating'), error: false });
    try {
      const reply = await askAi({
        url: apiUrl,
        action: 'generate_algorithm',
        language: lang,
        payload: {
          query: trimmed,
          protocol: 'Return JSON {title:string,code:string,input:any,type:string}. Code is JavaScript function body using variables input and trace(state,message). Each snapshot state must have type in array|stack|queue|linked|graph|tree; array/stack/queue/linked states include values array. Limit steps to 500. No imports, network calls, or external dependencies.',
        },
      });
      if (reply.kind !== 'generated') throw new Error('Invalid generation response');
      onImport(reply.algorithm);
      setStatus({ text: t('generated'), error: false });
      onGoToLab();
    } catch (error) {
      setStatus({
        text: `${b('请先部署 /api/ai，然后重试。', 'Deploy /api/ai and try again.')}\n${t('failed')}: ${(error as Error).message}`,
        error: true,
      });
    }
  };

  const localDemo = () => {
    onLocalDemo(pickLocalAlgorithm(query));
    onGoToLab();
  };

  return (
    <div className="custom-view" data-testid="custom-view">
      <section className="panel pad">
        <div className="eyebrow">AI → TRACE → VISUAL</div>
        <h2>{t('customTitle')}</h2>
        <p className="muted">{t('customIntro')}</p>
        <label htmlFor="custom-ask" className="smalltext">{t('describeAlgo')}</label>
        <textarea
          id="custom-ask"
          className="prompt"
          style={{ minHeight: 150 }}
          placeholder={t('customPlaceholder')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="inputline">
          <button className="btn primary" onClick={() => void generate()}>{t('generate')}</button>
          <button className="btn" onClick={localDemo}>{t('localDemo')}</button>
        </div>
        <Feedback status={status} />
      </section>
      <section className="panel pad">
        <h2>{t('integration')}</h2>
        <div className="info"><h3>{t('howItWorks')}</h3><p>{t('howDetail')}</p></div>
        <div className="info"><h3>{t('apiSecurity')}</h3><p>{t('apiSecurityDetail')}</p></div>
        <div className="info"><h3>{t('grading')}</h3><p>{t('gradingDetail')}</p></div>
      </section>
    </div>
  );
}
