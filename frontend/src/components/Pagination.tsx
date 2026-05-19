export function Pagination({ page, onPageChange }) {
  return <button onClick={() => onPageChange(page+1)}>Next</button>;
}
