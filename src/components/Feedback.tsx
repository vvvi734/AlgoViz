import type { StatusMessage } from '../features/lab/useLabController';

export function Feedback({
  status,
  variant = 'feedback',
  testId,
}: {
  status: StatusMessage;
  variant?: 'feedback' | 'status';
  testId?: string;
}) {
  const base = variant === 'status' ? 'api-status' : 'feedback';
  return (
    <div
      className={`${base} ${status.error ? 'error' : ''} ${status.text ? '' : 'hidden'}`}
      role="status"
      aria-live="polite"
      data-testid={testId}
    >
      {status.text}
    </div>
  );
}
