export function LoadingBlock({ label = "Загрузка данных" }: { label?: string }) {
  return <div className="empty-state">{label}...</div>;
}

export function ErrorBlock({ message, prefix = "Ошибка" }: { message: string; prefix?: string }) {
  return (
    <div className="empty-state">
      {prefix}: {message}
    </div>
  );
}

export function EmptyBlock({ label }: { label: string }) {
  return <div className="empty-state">{label}</div>;
}
