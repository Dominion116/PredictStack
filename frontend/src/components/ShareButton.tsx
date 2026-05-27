'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  url?: string;
  text?: string;
  className?: string;
}

export function ShareButton({ url, text, className }: ShareButtonProps) {
  const { copied, copy } = useClipboard();
  const target = url ?? (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = async () => {
    if (navigator.share && text) {
      try {
        await navigator.share({ title: text, url: target });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    copy(target);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={cn('font-mono text-xs h-8 gap-2', className)}
    >
      <Share2 className="h-3.5 w-3.5" />
      {copied ? 'Copied!' : 'Share'}
    </Button>
  );
}
