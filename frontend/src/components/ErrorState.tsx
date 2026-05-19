export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <button onClick={onRetry}>Retry</button>;
}
