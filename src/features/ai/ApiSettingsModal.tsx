import { useState } from 'react';
import { validateHttpUrl } from '../../runtime/native/client';
import { useI18n } from '../../i18n/I18nProvider';

export function ApiSettingsModal({
  apiUrl,
  onSave,
  onClose,
}: {
  apiUrl: string;
  onSave: (url: string) => void;
  onClose: () => void;
}) {
  const { t, b } = useI18n();
  const [value, setValue] = useState(apiUrl);
  const [error, setError] = useState('');

  const save = () => {
    const trimmed = value.trim();
    try {
      validateHttpUrl(trimmed, window.location.href);
      onSave(trimmed);
      onClose();
    } catch {
      setError(b('请输入有效的 HTTP(S) 地址', 'Enter a valid HTTP(S) URL'));
    }
  };

  return (
    <div
      className="modal"
      data-testid="api-modal"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="panel pad modal-card">
        <div className="sectionhead">
          <h2>{t('apiConfig')}</h2>
          <button className="btn small" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="muted">{t('apiExplainer')}</p>
        <label className="smalltext" htmlFor="api-url">{t('endpoint')}</label>
        <input
          id="api-url"
          className="nameinput"
          placeholder="/api/ai"
          value={value}
          onChange={(event) => { setValue(event.target.value); setError(''); }}
        />
        {error && <p className="smalltext" style={{ color: 'var(--red)' }}>{error}</p>}
        <p className="smalltext muted">{t('apiContract')}</p>
        <button className="btn primary" onClick={save}>{t('save')}</button>
      </div>
    </div>
  );
}
