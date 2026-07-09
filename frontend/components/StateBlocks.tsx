export function LoadingBlock({ label = "Загрузка данных" }: { label?: string }) {
  return <div className="empty-state">{label}...</div>;
}

export function ErrorBlock({ message }: { message: string }) {
  return <div className="empty-state">Ошибка: {message}</div>;
}

export function EmptyBlock({ label }: { label: string }) {
  return <div className="empty-state">{label}</div>;
}

