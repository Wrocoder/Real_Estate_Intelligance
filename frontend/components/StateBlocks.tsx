import { RefreshCw } from "lucide-react";

export function LoadingBlock({
  label = "Przygotowujemy dane",
  steps,
}: {
  label?: string;
  steps?: readonly string[];
}) {
  return (
    <div className="empty-state state-block" role="status" aria-live="polite">
      <strong>{label}</strong>
      {steps && steps.length > 0 ? (
        <ul>
          {steps.slice(0, 5).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ErrorBlock({
  message,
  prefix = "Błąd",
  onRetry,
  retryLabel = "Spróbuj ponownie",
}: {
  message: string;
  prefix?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="empty-state state-block error" role="alert">
      <strong>{prefix}</strong>
      <span>{message}</span>
      {onRetry ? (
        <div className="state-block-actions">
          <button className="button" type="button" onClick={onRetry}>
            <RefreshCw size={15} /> {retryLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function EmptyBlock({ label }: { label: string }) {
  return <div className="empty-state state-block">{label}</div>;
}
