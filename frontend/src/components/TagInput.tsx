'use client';

import { useState, KeyboardEvent } from 'react';
import { TagBadge } from './TagBadge';

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TagInput({ tags, onChange, placeholder = 'Add a tag…', disabled }: Props) {
  const [input, setInput] = useState('');

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!tag || tag.length > MAX_TAG_LENGTH) return;
    if (tags.includes(tag) || tags.length >= MAX_TAGS) return;
    onChange([...tags, tag]);
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-md border border-border bg-background focus-within:ring-1 focus-within:ring-ring">
        {tags.map(tag => (
          <TagBadge key={tag} tag={tag} onRemove={() => removeTag(tag)} />
        ))}
        {tags.length < MAX_TAGS && (
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addTag(input)}
            placeholder={tags.length === 0 ? placeholder : ''}
            disabled={disabled}
            className="flex-1 min-w-[80px] text-xs bg-transparent outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Press Enter or comma to add. {MAX_TAGS - tags.length} tag{MAX_TAGS - tags.length !== 1 ? 's' : ''} remaining.
      </p>
    </div>
  );
}
