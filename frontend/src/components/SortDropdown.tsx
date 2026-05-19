'use client';
export function SortDropdown({ sort, onChange }: { sort: string; onChange: (v: string) => void }) {
  return (
    <select value={sort} onChange={e => onChange(e.target.value)}>
      <option value="newest">Newest</option>
      <option value="ending">Ending Soon</option>
      <option value="volume">Volume</option>
    </select>
  );
}
