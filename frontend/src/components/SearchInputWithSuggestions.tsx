'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { suggestMarkets, SearchSuggestion } from '@/api/search';
import { useDebounce } from '@/hooks/use-debounce';

interface Props {
  className?: string;
  placeholder?: string;
}

export function SearchInputWithSuggestions({ className = '', placeholder = 'Search markets…' }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 250);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    suggestMarkets(debouncedQuery)
      .then(data => { setSuggestions(data.suggestions); setOpen(data.suggestions.length > 0); })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  }

  function handleSelect(suggestion: SearchSuggestion) {
    setOpen(false);
    setQuery('');
    router.push(`/market/${suggestion.id}`);
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={e => { setQuery(e.target.value); if (e.target.value.length >= 2) setOpen(true); }}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-background shadow-lg z-50 overflow-hidden">
          {suggestions.map(s => (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors truncate"
            >
              {s.question}
            </button>
          ))}
          <button
            onClick={handleSubmit as any}
            className="w-full text-left px-4 py-2.5 text-xs text-primary border-t border-border hover:bg-muted transition-colors"
          >
            See all results for &ldquo;{query}&rdquo; →
          </button>
        </div>
      )}
    </div>
  );
}
