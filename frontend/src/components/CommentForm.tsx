'use client';

import { useState } from 'react';

const MAX_CHARS = 500;

interface Props {
  authorAddress: string;
  parentId?: string | null;
  onSubmit: (body: string, parentId?: string | null) => Promise<unknown>;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({ authorAddress, parentId, onSubmit, onCancel, placeholder }: Props) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const remaining = MAX_CHARS - body.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      await onSubmit(body.trim(), parentId ?? null);
      setBody('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        rows={3}
        maxLength={MAX_CHARS}
        placeholder={placeholder ?? 'Share your analysis or prediction…'}
        value={body}
        onChange={e => setBody(e.target.value)}
        disabled={busy}
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${remaining < 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {remaining} characters remaining
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              className="px-3 py-1 text-xs border rounded text-muted-foreground hover:bg-muted"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!body.trim() || busy || remaining < 0}
            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded disabled:opacity-50"
          >
            {busy ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  );
}
