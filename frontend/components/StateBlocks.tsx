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

export function ErrorBlock({ message, prefix = "Błąd" }: { message: string; prefix?: string }) {
  return (
    <div className="empty-state state-block error" role="alert">
      <strong>{prefix}</strong>
      <span>{message}</span>
    </div>
  );
}

export function EmptyBlock({ label }: { label: string }) {
  return <div className="empty-state state-block">{label}</div>;
}
