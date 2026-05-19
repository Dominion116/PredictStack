export function Pagination({ page, onPageChange }: { page: number; onPageChange: (p: number) => void }) {
  return <button onClick={() => onPageChange(page+1)}>Next</button>;
}
