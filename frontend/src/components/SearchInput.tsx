'use client';
import { useState, useEffect } from 'react';

export function SearchInput({ value, onChange }) {
  const [term, setTerm] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => onChange(term), 300);
    return () => clearTimeout(t);
  }, [term]);
  return <input value={term} onChange={e=>setTerm(e.target.value)} placeholder="Search markets" />;
}
