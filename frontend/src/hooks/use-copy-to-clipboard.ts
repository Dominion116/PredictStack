'use client';

import { useState } from 'react';

/**
 * Hook to copy text to clipboard with feedback.
 * @returns { copy, copied } — copy(text) function and copied boolean flag
 */
export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return { copy, copied };
}
